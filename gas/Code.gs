/* ============================================================
   就業服務乙級 AI 闖關系統 — Google Apps Script Backend
   版本：1.0

   Spreadsheet 結構：
     Sheet "Users"    → email | name | password | role | token | created | vip_plan | vip_expires
     Sheet "Sessions" → timestamp | email | mode | total | correct | accuracy

   部署方式：
     1. 新建 Google Spreadsheet，複製其 ID（網址列 /d/後的那段）
     2. 在 Spreadsheet → Extensions → Apps Script 貼入此程式碼
     3. 執行一次 setup() 初始化表頭
     4. Deploy → New Deployment → Web App：
          Execute as: Me
          Who has access: Anyone
     5. 複製 Web App URL 貼回 docs/assets/js/config.js 的 API_URL
   ============================================================ */

var SPREADSHEET_ID = '1YWNFjYvNt3-ce1WGyQ75hJS4h_lNYg2Ft-YM8Qn9Qgs';

var SHEET = { USERS: 'Users', SESSIONS: 'Sessions' };

var USER_HEADERS    = ['email','name','password','role','token','created','vip_plan','vip_expires'];
var SESSION_HEADERS = ['timestamp','email','mode','total','correct','accuracy'];

/* ── 一次性初始化（手動執行一次即可）────────────────────── */
function setup() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  function ensureSheet(name, headers) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(headers);
    return sh;
  }

  ensureSheet(SHEET.USERS,    USER_HEADERS);
  ensureSheet(SHEET.SESSIONS, SESSION_HEADERS);
  Logger.log('Setup complete.');
}

/* ── Entry Points ────────────────────────────────────────── */
function doGet(e) {
  return handle(e.parameter);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    return handle(body);
  } catch(err) {
    return respond({ ok: false, message: '無效請求格式' });
  }
}

function handle(p) {
  var action = p.action || '';
  try {
    switch (action) {
      case 'ping':               return respond({ ok: true, message: 'pong', ts: Date.now() });
      case 'register':           return respond(doRegister(p));
      case 'login':              return respond(doLogin(p));
      case 'forgotPassword':     return respond(doForgotPassword(p));
      case 'submitSession':      return respond(doSubmitSession(p));
      case 'getQuestions':
      case 'getMultiSelect':
      case 'getMockQuestions':
      case 'getWrongQuestions':
        /* 前端本地題庫已完整，API 僅做 fallback 確認 */
        return respond({ ok: true, questions: [] });
      default:
        return respond({ ok: false, message: '不明 action: ' + action });
    }
  } catch(err) {
    return respond({ ok: false, message: err.message || '伺服器錯誤' });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Spreadsheet Helpers ─────────────────────────────────── */
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i] === '' ? null : row[i]; });
    obj._row = data.indexOf(row) + 1; // 1-indexed actual sheet row
    return obj;
  });
}

function setRowByIndex(sheet, rowNum, obj, headers) {
  // rowNum is 1-indexed sheet row (row 1 = header, data starts at 2)
  var vals = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.getRange(rowNum, 1, 1, vals.length).setValues([vals]);
}

/* ── Crypto Helpers ──────────────────────────────────────── */
function hashPw(pw) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw + 'es_salt_2024');
  return bytes.map(function(b){ return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function genToken() {
  return Utilities.getUuid().replace(/-/g,'');
}

/* ── Register ────────────────────────────────────────────── */
function doRegister(p) {
  var email = (p.email || '').trim().toLowerCase();
  var name  = (p.name  || '').trim();
  var pw    = (p.password || '');

  if (!email || !pw)    return { ok: false, message: '請填寫 Email 與密碼' };
  if (pw.length < 6)    return { ok: false, message: '密碼至少 6 位' };
  if (!email.includes('@')) return { ok: false, message: 'Email 格式不正確' };
  if (!name) name = email.split('@')[0];

  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  if (users.find(function(u){ return u.email === email; })) {
    return { ok: false, message: '此 Email 已被使用，請直接登入' };
  }

  var token = genToken();
  sheet.appendRow([
    email, name, hashPw(pw), 'free', token,
    new Date().toISOString(), '', ''
  ]);

  return { ok: true, token: token, user: { email: email, name: name, role: 'free' } };
}

/* ── Login ───────────────────────────────────────────────── */
function doLogin(p) {
  var email = (p.email || '').trim().toLowerCase();
  var pw    = (p.password || '');

  if (!email || !pw) return { ok: false, message: '請填寫 Email 與密碼' };

  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  var user  = users.find(function(u){ return u.email === email; });

  if (!user || user.password !== hashPw(pw)) {
    return { ok: false, message: '帳號或密碼錯誤' };
  }

  /* 自動檢查 VIP 是否過期 */
  var role = user.role;
  if (role === 'vip' && user.vip_expires) {
    var expires = new Date(user.vip_expires);
    if (!isNaN(expires) && expires < new Date()) {
      role = 'free';
      user.role = 'free';
      setRowByIndex(sheet, user._row, user, USER_HEADERS);
    }
  }

  return {
    ok: true,
    token: user.token,
    user: { email: user.email, name: user.name, role: role,
            vip_plan: user.vip_plan || '', vip_expires: user.vip_expires || '' }
  };
}

/* ── Forgot Password ─────────────────────────────────────── */
function doForgotPassword(p) {
  var email = (p.email || '').trim().toLowerCase();
  if (!email) return { ok: false, message: '請填寫 Email' };

  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  var user  = users.find(function(u){ return u.email === email; });

  if (user) {
    var tempPw = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    user.password = hashPw(tempPw);
    setRowByIndex(sheet, user._row, user, USER_HEADERS);

    try {
      MailApp.sendEmail({
        to: email,
        subject: '【就服乙級 AI 教練】密碼重設通知',
        body: [
          '您好，',
          '',
          '您申請了密碼重設。您的臨時密碼如下：',
          '',
          '  臨時密碼：' + tempPw,
          '',
          '請以此臨時密碼登入後，立即前往會員中心修改密碼。',
          '（此臨時密碼僅限一次使用概念，請盡快更改）',
          '',
          '如非您本人操作，請忽略此信，您的帳號仍然安全。',
          '',
          '— 就服乙級 AI 教練 系統通知'
        ].join('\n')
      });
    } catch(mailErr) {
      /* MailApp 可能因配額不足失敗，仍回傳成功避免洩漏是否存在 */
    }
  }

  /* 無論帳號存不存在都回相同訊息，避免 email 列舉攻擊 */
  return { ok: true, message: '若此 Email 已註冊，重設信已寄出，請檢查信箱（含垃圾信件匣）。' };
}

/* ── Submit Session ──────────────────────────────────────── */
function doSubmitSession(p) {
  var token   = p.token   || '';
  var answers = p.answers || [];
  var mode    = p.mode    || 'quick';

  if (!token) return { ok: false, message: '未登入' };

  /* 用 token 查找使用者 */
  var uSheet = getSheet(SHEET.USERS);
  var users  = sheetToObjects(uSheet);
  var user   = users.find(function(u){ return u.token === token; });
  if (!user) return { ok: false, message: '無效 token，請重新登入' };

  var total   = answers.length;
  var correct = answers.filter(function(a){ return a.isCorrect; }).length;
  var acc     = total > 0 ? Math.round(correct / total * 100) : 0;

  getSheet(SHEET.SESSIONS).appendRow([
    new Date().toISOString(),
    user.email,
    mode,
    total,
    correct,
    acc
  ]);

  return { ok: true };
}

/* ── Admin: Upgrade VIP（手動在 GAS 執行，不暴露為 API）── */
function adminUpgradeVip(email, plan, months) {
  /* plan: 'monthly' | 'quarterly'
     months: 1 | 3 | 6
     在 GAS 編輯器手動呼叫：adminUpgradeVip('user@example.com', 'quarterly', 3) */
  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  var user  = users.find(function(u){ return u.email === email.toLowerCase(); });
  if (!user) { Logger.log('User not found: ' + email); return; }

  var now     = new Date();
  var expires = new Date(now);
  expires.setMonth(expires.getMonth() + months);

  user.role        = 'vip';
  user.vip_plan    = plan;
  user.vip_expires = expires.toISOString();
  setRowByIndex(sheet, user._row, user, USER_HEADERS);

  Logger.log('VIP upgraded: ' + email + ' → ' + plan + ' until ' + expires.toISOString());
}
