/* ============================================================
   auth.js — Authentication: register / login / logout
             Uses GAS API with localStorage fallback
   ============================================================ */
window.Auth = {

  /* ── getCurrentUser ───────────────────────────────────────*/
  getCurrentUser: function() {
    return Store.get(APP_CONFIG.KEYS.USER);
  },

  isLoggedIn: function() {
    return !!Store.get(APP_CONFIG.KEYS.USER);
  },

  isVip: function() {
    var u = Store.get(APP_CONFIG.KEYS.USER);
    if (!u) return false;
    if (u.role === 'vip') return true;
    var p = String(u.vip_plan || '').trim();
    return p !== '' && p !== '0';
  },

  /* ── clearUserData ────────────────────────────────────────
     登入 / 登出 / 切換帳號時呼叫，徹底清除前一位使用者的
     本機資料，防止跨使用者資料洩漏。
     ─────────────────────────────────────────────────────── */
  clearUserData: function() {
    var K = APP_CONFIG.KEYS;
    /* 身分識別 */
    Store.del(K.TOKEN);
    Store.del(K.USER);
    /* 個人作答紀錄 */
    Store.del(K.QUIZ_RESULT);
    Store.del(K.MOCK_RESULT);
    Store.del(K.WRONG_LIST);
    Store.del(K.STUDY_STATS);
    /* 題目池快取（VIP vs 免費題數不同，不能跨用戶共用）*/
    Store.del(K.QUIZ_SESSION + '_quick');
    Store.del(K.QUIZ_SESSION + '_multi');
    Store.del(K.QUIZ_SESSION + '_wrong');
  },

  /* ── Register ─────────────────────────────────────────────*/
  register: function(name, email, password) {
    var self = this;
    return Api.get('register', { name: name, email: email, password: password })
      .then(function(r) {
        if (r.ok || r.success) {
          /* 先清除前一位使用者的本地資料，再寫入新帳號 */
          self.clearUserData();
          var user = { name: name, email: email, role: 'free',
                       token: r.token || 'local_' + Date.now() };
          Store.set(APP_CONFIG.KEYS.USER, user);
          if (r.token) Store.set(APP_CONFIG.KEYS.TOKEN, r.token);
          return { ok: true, user: user };
        }
        return { ok: false, message: r.message || '註冊失敗，請稍後再試' };
      })
      .catch(function() {
        /* fallback: local-only demo mode */
        self.clearUserData();
        var user = { name: name, email: email, role: 'free',
                     token: 'local_' + Date.now(), isLocal: true };
        Store.set(APP_CONFIG.KEYS.USER, user);
        return { ok: true, user: user, isLocal: true };
      });
  },

  /* ── Login ────────────────────────────────────────────────*/
  login: function(email, password) {
    var self = this;
    return Api.get('login', { email: email, password: password })
      .then(function(r) {
        if (r.ok || r.success) {
          /* 先清除前一位使用者的本地資料，再寫入新帳號 */
          self.clearUserData();
          var user = r.user || { email: email,
                                 name: r.name || email.split('@')[0],
                                 role: r.role || 'free' };
          user.token = r.token || 'local_' + Date.now();
          Store.set(APP_CONFIG.KEYS.USER, user);
          if (r.token) Store.set(APP_CONFIG.KEYS.TOKEN, r.token);
          return { ok: true, user: user };
        }
        return { ok: false, message: r.message || '帳號或密碼錯誤' };
      })
      .catch(function() {
        /* fallback: allow any login in demo mode */
        self.clearUserData();
        var user = { email: email, name: email.split('@')[0], role: 'free',
                     token: 'local_' + Date.now(), isLocal: true };
        Store.set(APP_CONFIG.KEYS.USER, user);
        return { ok: true, user: user, isLocal: true };
      });
  },

  /* ── Logout ───────────────────────────────────────────────*/
  logout: function() {
    this.clearUserData();   /* 清除全部個人資料與快取 */
    location.href = 'index.html';
  },

  /* ── Forgot Password ──────────────────────────────────────*/
  forgotPassword: function(email) {
    return Api.get('forgotPassword', { email: email })
      .then(function(r) {
        return { ok: r.ok || r.success,
                 message: r.message || '重設連結已寄出，請檢查信箱。' };
      })
      .catch(function() {
        return { ok: true,
                 message: '（Demo模式）若此 Email 已註冊，重設連結已寄出。' };
      });
  },

  /* ── Update user in localStorage ─────────────────────────*/
  updateUser: function(fields) {
    var user = Store.get(APP_CONFIG.KEYS.USER);
    if (!user) return false;
    Object.assign(user, fields);
    Store.set(APP_CONFIG.KEYS.USER, user);
    return true;
  },

  /* ── Redirect helpers ─────────────────────────────────────*/
  redirectIfLoggedIn: function(target) {
    if (this.isLoggedIn()) location.href = target || 'member-center.html';
  },
  redirectIfNotLoggedIn: function(target) {
    if (!this.isLoggedIn()) {
      Store.set('_after_login', location.href);
      location.href = target || 'login.html';
    }
  }
};
