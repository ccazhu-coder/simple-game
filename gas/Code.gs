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

var USER_HEADERS    = ['email','name','password','role','token','created','vip_plan','vip_expires','last_vip_reminder_stage','last_vip_reminder_at'];
var SESSION_HEADERS = ['timestamp','email','mode','total','correct','accuracy'];

/* ── 一次性初始化（手動執行一次即可）────────────────────── */
function setup() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  function ensureSheet(name, headers) {
    var sh = ss.getSheetByName(name);
    if (!sh) { sh = ss.insertSheet(name); }
    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
    } else {
      /* Add any missing columns to existing sheets */
      var lastCol = sh.getLastColumn();
      var existing = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      headers.forEach(function(h) {
        if (existing.indexOf(h) === -1) {
          sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
        }
      });
    }
    return sh;
  }

  ensureSheet(SHEET.USERS,    USER_HEADERS);
  ensureSheet(SHEET.SESSIONS, SESSION_HEADERS);
  Logger.log('Setup complete. Run this after any USER_HEADERS change.');
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
      case 'changePassword':     return respond(doChangePassword(p));
      case 'getMe':              return respond(doGetMe(p));
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

/* ── VIP Helpers (server-side, mirrors frontend VipUtils) ── */
function _isVipActive(user) {
  var plan = String(user.vip_plan || '').trim();
  if (plan === '' || plan === '0') return false;
  var exp = String(user.vip_expires || '').trim();
  if (exp === '') return true;              /* no expiry → perpetual VIP */
  var t = new Date(exp).getTime();
  if (isNaN(t)) return true;
  return Date.now() <= t;
}

function _getVipStatus(user) {
  var plan = String(user.vip_plan || '').trim();
  if (plan === '' || plan === '0') return 'free';
  var exp = String(user.vip_expires || '').trim();
  if (exp === '') return 'active';          /* no expiry → perpetual VIP */
  var t = new Date(exp).getTime();
  if (isNaN(t)) return 'active';
  var now = Date.now();
  if (now > t) return 'expired';
  if (Math.ceil((t - now) / 86400000) <= 7) return 'expiring';
  return 'active';
}

function _getVipDaysLeft(user) {
  if (!user.vip_expires) return null;
  var t = new Date(user.vip_expires).getTime();
  if (isNaN(t)) return null;
  var diff = t - Date.now();
  return diff < 0 ? 0 : Math.ceil(diff / 86400000);
}

function _getVipReminderStage(user) {
  if (!user.vip_expires) return null;
  var t = new Date(user.vip_expires).getTime();
  if (isNaN(t)) return null;
  var d = Math.ceil((t - Date.now()) / 86400000);
  if (d < 0)  return 'expired';
  if (d <= 1) return '1day';
  if (d <= 3) return '3days';
  if (d <= 7) return '7days';
  return null;
}

/* Builds the standard user response object */
function _buildUserResponse(user) {
  var vipActive = _isVipActive(user);
  var vipStatus = _getVipStatus(user);
  return {
    email:             user.email,
    name:              user.name,
    role:              user.role,
    vip_plan:          user.vip_plan    || '',
    vip_expires:       user.vip_expires || '',
    isVipActive:       vipActive,
    vipStatus:         vipStatus,
    vipDaysLeft:       _getVipDaysLeft(user),
    vipReminderStage:  _getVipReminderStage(user)
  };
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

  var newUser = { email: email, name: name, role: 'free', vip_plan: '', vip_expires: '' };
  return { ok: true, token: token, user: _buildUserResponse(newUser) };
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

  /* 自動檢查 VIP 是否過期（以 vip_expires 為準，不只看 role） */
  if (!_isVipActive(user) && user.role === 'vip') {
    user.role = 'free';
    setRowByIndex(sheet, user._row, user, USER_HEADERS);
  }

  return {
    ok:    true,
    token: user.token,
    user:  _buildUserResponse(user)
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
        subject: '【就服乙級學科 AI 教練】密碼重設通知',
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
          '— 就服乙級學科 AI 教練 系統通知'
        ].join('\n')
      });
    } catch(mailErr) {
      /* MailApp 可能因配額不足失敗，仍回傳成功避免洩漏是否存在 */
    }
  }

  /* 無論帳號存不存在都回相同訊息，避免 email 列舉攻擊 */
  return { ok: true, message: '若此 Email 已註冊，重設信已寄出，請檢查信箱（含垃圾信件匣）。' };
}

/* ── Change Password ─────────────────────────────────────── */
function doChangePassword(p) {
  var token     = (p.token     || '').trim();
  var currentPw = (p.currentPassword || '');
  var newPw     = (p.newPassword     || '');

  if (!token)
    return { ok: false, message: '請先登入後再操作' };
  if (!newPw || newPw.length < 6)
    return { ok: false, message: '新密碼至少需 6 碼' };

  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  var user  = users.find(function(u){ return u.token === token; });

  if (!user)
    return { ok: false, message: '登入已過期，請重新登入' };

  if (user.password !== hashPw(currentPw))
    return { ok: false, message: '目前密碼錯誤' };

  if (hashPw(newPw) === user.password)
    return { ok: false, message: '新密碼不可與目前密碼相同' };

  /* Update password and invalidate old token */
  user.password = hashPw(newPw);
  user.token    = genToken();
  setRowByIndex(sheet, user._row, user, USER_HEADERS);

  return { ok: true, message: '密碼修改成功' };
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

/* ── Get Me（用 token 刷新目前使用者資料）────────────────── */
function doGetMe(p) {
  var token = (p.token || '').trim();
  if (!token) return { ok: false, message: '未登入' };

  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  var user  = users.find(function(u){ return u.token === token; });
  if (!user) return { ok: false, message: '登入已過期，請重新登入' };

  /* Auto-expire check on getMe too */
  if (!_isVipActive(user) && user.role === 'vip') {
    user.role = 'free';
    setRowByIndex(sheet, user._row, user, USER_HEADERS);
  }

  return { ok: true, user: _buildUserResponse(user) };
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

/* ── Daily VIP Reminder（定時觸發，每天 09:00 執行）────── */
function sendVipReminders() {
  var sheet = getSheet(SHEET.USERS);
  var users = sheetToObjects(sheet);
  var now   = new Date();

  var SUBJECTS = {
    '7days': '【就服乙級學科 AI 教練】VIP 將於 7 天內到期',
    '3days': '【就服乙級學科 AI 教練】VIP 將於 3 天內到期',
    '1day':  '【就服乙級學科 AI 教練】VIP 將於 1 天內到期',
    'expired':'【就服乙級學科 AI 教練】VIP 會員已到期'
  };
  var BODIES = {
    '7days':  '提醒您，VIP 會員資格將於 7 天內到期，為避免學習中斷，建議提前完成續費。\n\n續費網址：https://ccazhu-coder.github.io/simple-game/pricing.html',
    '3days':  '提醒您，VIP 會員資格即將到期，若需繼續使用完整題庫、模擬考與分析功能，請儘早續費。\n\n續費網址：https://ccazhu-coder.github.io/simple-game/pricing.html',
    '1day':   '您的 VIP 會員資格將於 1 天內到期，為避免功能中斷，請立即續費。\n\n續費網址：https://ccazhu-coder.github.io/simple-game/pricing.html',
    'expired':'您的 VIP 會員資格已到期，目前已恢復為免費會員。若需繼續使用 VIP 功能，請重新開通。\n\n開通網址：https://ccazhu-coder.github.io/simple-game/pricing.html'
  };

  users.forEach(function(user) {
    if (!user.email || !user.vip_plan) return;

    var stage = _getVipReminderStage(user);
    if (!stage) return;

    /* Skip if already sent the same stage today */
    if (user.last_vip_reminder_stage === stage) return;

    /* Auto-expire: downgrade role if needed */
    if (stage === 'expired' && user.role === 'vip') {
      user.role = 'free';
    }

    try {
      MailApp.sendEmail({
        to: user.email,
        subject: SUBJECTS[stage],
        body: BODIES[stage] + '\n\n— 就服乙級學科 AI 教練 系統通知'
      });
      user.last_vip_reminder_stage = stage;
      user.last_vip_reminder_at    = now.toISOString();
      setRowByIndex(sheet, user._row, user, USER_HEADERS);
      Logger.log('VIP reminder sent: ' + user.email + ' stage=' + stage);
    } catch(e) {
      Logger.log('Failed to send reminder to ' + user.email + ': ' + e.message);
    }
  });
}

/* ── Create / recreate daily trigger at 09:00 ───────────── */
function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendVipReminders') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('sendVipReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log('Daily VIP reminder trigger created (09:00 every day).');
}
