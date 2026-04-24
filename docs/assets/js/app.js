/* ============================================================
   app.js — Shared utilities: Header/Footer injection,
            API wrapper, Toast, Modal, Loading, Storage
   ============================================================ */

/* ── API Wrapper ─────────────────────────────────────────────*/
window.Api = {
  get: function(action, params) {
    params = params || {};
    var qs = new URLSearchParams(Object.assign({ action: action }, params)).toString();
    return fetch(APP_CONFIG.API_URL + '?' + qs)
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
  },
  post: function(action, payload) {
    payload = payload || {};
    /* submitSession 有大量答題陣列，用 no-cors POST fire-and-forget */
    if (action === 'submitSession') {
      fetch(APP_CONFIG.API_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(Object.assign({ action: action }, payload))
      }).catch(function(){});
      return Promise.resolve({ ok: true });
    }
    /* 其他 action（register/login/forgotPassword）改用 GET + URL params
       避免 GAS 302 redirect 的 CORS 問題導致 fetch 永久 pending */
    return this.get(action, payload);
  }
};

/* ── Storage Helper ──────────────────────────────────────────*/
window.Store = {
  get: function(key, fallback) {
    if (fallback === undefined) fallback = null;
    try { var v = JSON.parse(localStorage.getItem(key)); return (v !== null && v !== undefined) ? v : fallback; }
    catch(e) { return fallback; }
  },
  set: function(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  del: function(key) { localStorage.removeItem(key); },
  append: function(key, item, maxLen) {
    maxLen = maxLen || 500;
    var list = this.get(key, []);
    list.unshift(item);
    if (list.length > maxLen) list.length = maxLen;
    this.set(key, list);
  }
};

/* ── Toast ───────────────────────────────────────────────────*/
window.Toast = {
  _c: null,
  _ensure: function() {
    if (!this._c) {
      this._c = document.getElementById('toast-container');
      if (!this._c) {
        this._c = document.createElement('div');
        this._c.id = 'toast-container';
        document.body.appendChild(this._c);
      }
    }
  },
  show: function(msg, type, duration) {
    type = type || 'info'; duration = duration || 3500;
    this._ensure();
    var icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = '<span class="toast-icon">' + (icons[type]||'ℹ️') + '</span>' +
      '<span class="toast-msg">' + msg + '</span>' +
      '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
    this._c.appendChild(el);
    setTimeout(function(){ if(el.parentElement) el.remove(); }, duration);
  },
  success: function(m,d){ this.show(m,'success',d); },
  error:   function(m,d){ this.show(m,'error',d); },
  info:    function(m,d){ this.show(m,'info',d); },
  warning: function(m,d){ this.show(m,'warning',d); }
};

/* ── Modal ───────────────────────────────────────────────────*/
window.Modal = {
  confirm: function(opts) {
    opts = opts || {};
    var t=opts.title||'確認', b=opts.body||'', ok=opts.okText||'確定',
        oc=opts.okClass||'btn-danger', ca=opts.cancelText||'取消';
    return new Promise(function(resolve) {
      var ov = document.createElement('div');
      ov.className = 'modal-overlay';
      ov.innerHTML = '<div class="modal"><div class="modal-title">'+t+'</div>' +
        '<div class="modal-body">'+b+'</div><div class="modal-actions">' +
        '<button class="btn btn-secondary" id="_mc">'+ca+'</button>' +
        '<button class="btn '+oc+'" id="_mo">'+ok+'</button></div></div>';
      document.body.appendChild(ov);
      ov.querySelector('#_mo').onclick = function(){ ov.remove(); resolve(true);  };
      ov.querySelector('#_mc').onclick = function(){ ov.remove(); resolve(false); };
    });
  },
  alert: function(opts) {
    opts = opts || {};
    var t=opts.title||'提示', b=opts.body||'', ok=opts.okText||'確定';
    return new Promise(function(resolve) {
      var ov = document.createElement('div');
      ov.className = 'modal-overlay';
      ov.innerHTML = '<div class="modal"><div class="modal-title">'+t+'</div>' +
        '<div class="modal-body">'+b+'</div><div class="modal-actions">' +
        '<button class="btn btn-primary" id="_ma">'+ok+'</button></div></div>';
      document.body.appendChild(ov);
      ov.querySelector('#_ma').onclick = function(){ ov.remove(); resolve(); };
    });
  }
};

/* ── Loading Overlay ─────────────────────────────────────────*/
window.Loading = {
  _el: null,
  _ensure: function() {
    if (!this._el) {
      this._el = document.getElementById('loading-overlay');
      if (!this._el) {
        this._el = document.createElement('div');
        this._el.id = 'loading-overlay';
        this._el.innerHTML = '<div class="spinner"></div><div class="loading-text">載入中…</div>';
        document.body.appendChild(this._el);
      }
    }
  },
  show: function(text) {
    this._ensure();
    this._el.querySelector('.loading-text').textContent = text || '載入中…';
    this._el.classList.add('active');
  },
  hide: function() { this._ensure(); this._el.classList.remove('active'); }
};

/* ── VIP Utilities (canonical — used by every page) ─────────*/
window.VipUtils = {
  /* VIP if vip_plan has a value; only non-VIP when vip_expires IS set and has passed */
  isVipActive: function(u) {
    if (!u) return false;
    var plan = String(u.vip_plan || '').trim();
    if (plan === '' || plan === '0') return false;
    var exp = String(u.vip_expires || '').trim();
    if (exp === '') return true;             /* no expiry → perpetual VIP */
    var t = new Date(exp).getTime();
    if (isNaN(t)) return true;              /* unparseable date → treat as perpetual */
    return Date.now() <= t;
  },
  /* 'free' | 'active' | 'expiring' (<=7d) | 'expired' */
  getStatus: function(u) {
    if (!u) return 'free';
    var plan = String(u.vip_plan || '').trim();
    if (plan === '' || plan === '0') return 'free';
    var exp = String(u.vip_expires || '').trim();
    if (exp === '') return 'active';         /* no expiry → perpetual VIP */
    var t = new Date(exp).getTime();
    if (isNaN(t)) return 'active';
    var now = Date.now();
    if (now > t) return 'expired';
    if (Math.ceil((t - now) / 86400000) <= 7) return 'expiring';
    return 'active';
  },
  /* days remaining; 0 if today/past; null if no expiry */
  getDaysLeft: function(u) {
    if (!u || !u.vip_expires) return null;
    var t = new Date(u.vip_expires).getTime();
    if (isNaN(t)) return null;
    var diff = t - Date.now();
    return diff < 0 ? 0 : Math.ceil(diff / 86400000);
  },
  /* '7days' | '3days' | '1day' | 'expired' | null */
  getReminderStage: function(u) {
    if (!u || !u.vip_expires) return null;
    var t = new Date(u.vip_expires).getTime();
    if (isNaN(t)) return null;
    var d = Math.ceil((t - Date.now()) / 86400000);
    if (d < 0)  return 'expired';
    if (d <= 1) return '1day';
    if (d <= 3) return '3days';
    if (d <= 7) return '7days';
    return null;
  },
  getReminderText: function(u) {
    var map = {
      '7days':   '提醒您，VIP 會員資格將於 7 天內到期，為避免學習中斷，建議提前完成續費。',
      '3days':   '提醒您，VIP 會員資格即將到期，若需繼續使用完整題庫、模擬考與分析功能，請儘早續費。',
      '1day':    '您的 VIP 會員資格將於 1 天內到期，為避免功能中斷，請立即續費。',
      'expired': '您的 VIP 會員資格已到期，目前已恢復為免費會員。若需繼續使用 VIP 功能，請重新開通。'
    };
    return map[this.getReminderStage(u)] || null;
  },
  formatExpiry: function(u) {
    if (!u || !u.vip_expires) return '—';
    var d = new Date(u.vip_expires);
    if (isNaN(d.getTime())) return '—';
    return d.getFullYear() + '/' +
      String(d.getMonth()+1).padStart(2,'0') + '/' +
      String(d.getDate()).padStart(2,'0');
  }
};

/* ── Nav / Footer builders ───────────────────────────────────*/
var _NAV = [
  { href:'index.html',           label:'首頁' },
  { href:'quiz.html',            label:'快速練習' },
  { href:'multi-select.html',    label:'複選強化' },
  { href:'wrong-questions.html', label:'錯題本' },
  { href:'mock-exam.html',       label:'模擬考' },
  { href:'pricing.html',         label:'VIP 方案', cls:'vip-link' }
];

function _navHTML(user) {
  var cur = location.pathname.split('/').pop() || 'index.html';
  var links = _NAV.map(function(l){
    return '<a href="'+l.href+'" class="nav-link'+(l.cls?' '+l.cls:'')+(cur===l.href?' active':'')+'">'+ l.label +'</a>';
  }).join('');
  var mob = _NAV.map(function(l){
    return '<a href="'+l.href+'" class="nav-drawer-link">'+l.label+'</a>';
  }).join('');
  var ad, am;
  if (user) {
    var vip = VipUtils.isVipActive(user);
    ad = '<span class="badge '+(vip?'badge-vip':'badge-gray')+'">'+(vip?'⭐ VIP':'免費版')+'</span>' +
      '<a href="member-center.html" class="btn btn-secondary btn-sm">會員中心</a>' +
      '<button class="btn btn-sm" style="color:var(--muted)" onclick="Auth.logout()">登出</button>';
    am = '<div class="nav-drawer-divider"></div>' +
      '<a href="member-center.html" class="nav-drawer-link">👤 會員中心（'+(user.name||user.email)+'）</a>' +
      '<a href="#" class="nav-drawer-link" onclick="Auth.logout();return false">🚪 登出</a>';
  } else {
    ad = '<a href="login.html" class="btn btn-secondary btn-sm">登入</a>' +
      '<a href="register.html" class="btn btn-primary btn-sm">免費註冊</a>';
    am = '<div class="nav-drawer-divider"></div>' +
      '<a href="login.html" class="nav-drawer-link">登入</a>' +
      '<a href="register.html" class="nav-drawer-link">免費註冊</a>' +
      '<div class="nav-drawer-divider"></div>' +
      '<a href="pricing.html" class="nav-drawer-link" style="color:var(--vip-dark);font-weight:900">⭐ 升級 VIP 方案</a>';
  }
  return '<nav class="nav" id="main-nav"><div class="container nav-inner">' +
    '<a href="index.html" class="nav-brand"><div class="nav-brand-badge">就</div>' +
    '<span>就服乙級學科 <span style="color:var(--primary)">AI 教練</span></span></a>' +
    '<div class="nav-links">'+links+'</div>' +
    '<div class="nav-actions">'+ad+'</div>' +
    '<div class="nav-hamburger" id="nav-hamburger" onclick="App.toggleDrawer()">' +
    '<span></span><span></span><span></span></div>' +
    '</div></nav>' +
    '<div class="nav-drawer" id="nav-drawer" onclick="App.closeDrawer(event)">' +
    '<div class="nav-drawer-inner">'+mob+am+'</div></div>';
}

function _footerHTML() {
  return '<footer class="footer"><div class="container">' +
    '<div class="footer-grid">' +
      '<div>' +
        '<div class="footer-brand-logo"><img src="assets/img/logo-zhiji-zhitu.jpg" alt="知己知途" class="footer-logo-img"></div>' +
        '<div class="footer-brand-name">就服乙級學科 AI 教練</div>' +
        '<div class="footer-brand-desc">不只是刷題網站，而是一套可練習、可解析、可追蹤、可升級的就業服務乙級 AI 備考系統。幫助你從刷題進化成真正會解題。</div></div>' +
      '<div><div class="footer-heading">功能</div>' +
        '<a href="quiz.html" class="footer-link">快速練習</a>' +
        '<a href="multi-select.html" class="footer-link">複選題強化</a>' +
        '<a href="wrong-questions.html" class="footer-link">錯題本</a>' +
        '<a href="mock-exam.html" class="footer-link">模擬考</a></div>' +
      '<div><div class="footer-heading">帳號</div>' +
        '<a href="login.html" class="footer-link">登入</a>' +
        '<a href="register.html" class="footer-link">免費註冊</a>' +
        '<a href="member-center.html" class="footer-link">會員中心</a>' +
        '<a href="pricing.html" class="footer-link">VIP 方案</a></div>' +
      '<div><div class="footer-heading">聯絡</div>' +
        '<a href="'+APP_CONFIG.VIP_LINE_URL+'" target="_blank" class="footer-link">💬 LINE 客服</a>' +
        '<a href="mailto:'+APP_CONFIG.SUPPORT_EMAIL+'" class="footer-link">📧 Email</a>' +
        '<a href="pricing.html" class="footer-link">開通 VIP</a>' +
        '<a href="test-api.html" class="footer-link" style="color:#475569">工程測試</a></div>' +
    '</div>' +
    '<div class="footer-divider"></div>' +
    '<div class="footer-bottom">' +
      '<div class="footer-copy">© 2026 就業服務乙級 AI 闖關學習系統。All rights reserved.</div>' +
      '<div class="footer-copy">以 AI 教練模式幫助更有效率地備考</div>' +
    '</div></div></footer>';
}

/* ── App Object ──────────────────────────────────────────────*/
window.App = {
  init: function() {
    var user = Store.get(APP_CONFIG.KEYS.USER);
    var hdr = document.getElementById('app-header');
    if (hdr) hdr.outerHTML = _navHTML(user);
    var ftr = document.getElementById('app-footer');
    if (ftr) ftr.outerHTML = _footerHTML();
    if (!document.getElementById('toast-container')) {
      var tc = document.createElement('div'); tc.id='toast-container'; document.body.appendChild(tc);
    }
    if (!document.getElementById('loading-overlay')) {
      var lo = document.createElement('div'); lo.id='loading-overlay';
      lo.innerHTML='<div class="spinner"></div><div class="loading-text">載入中…</div>';
      document.body.appendChild(lo);
    }
  },
  toggleDrawer: function() {
    var d = document.getElementById('nav-drawer');
    if (d) d.classList.toggle('open');
  },
  closeDrawer: function(e) {
    if (e.target === e.currentTarget) {
      var d = document.getElementById('nav-drawer');
      if (d) d.classList.remove('open');
    }
  },
  requireVip: function(redirectBack) {
    var user = Store.get(APP_CONFIG.KEYS.USER);
    if (!user) {
      if (redirectBack) Store.set('_after_login', location.href);
      location.href = 'login.html'; return false;
    }
    if (!VipUtils.isVipActive(user)) {
      var _st = VipUtils.getStatus(user);
      Modal.confirm({
        title:  _st === 'expired' ? '⭐ VIP 已到期' : '⭐ 此功能需要 VIP 會員',
        body:   _st === 'expired'
                  ? '您的 VIP 已到期，請續費後即可繼續使用此功能。'
                  : '升級 VIP 即可解鎖複選題強化、模擬考、完整錯題本與學習分析。',
        okText: _st === 'expired' ? '立即續費 VIP' : '立即升級 VIP',
        okClass:'btn-vip', cancelText:'稍後再說'
      }).then(function(ok){ if(ok) location.href='pricing.html'; });
      return false;
    }
    return true;
  },
  requireLogin: function() {
    var user = Store.get(APP_CONFIG.KEYS.USER);
    if (!user) { Store.set('_after_login', location.href); location.href='login.html'; return false; }
    return true;
  },
  param: function(name) { return new URLSearchParams(location.search).get(name); },
  formatDate: function(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.getFullYear()+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+
      String(d.getDate()).padStart(2,'0')+' '+
      String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  },
  scoreClass: function(pct) { return pct>=80?'badge-green':pct>=60?'badge-orange':'badge-red'; }
};

document.addEventListener('DOMContentLoaded', function(){ App.init(); });
