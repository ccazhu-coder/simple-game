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
    return !!(u && u.role === 'vip');
  },

  /* ── Register ─────────────────────────────────────────────*/
  register: function(name, email, password) {
    return Api.post('register', { name: name, email: email, password: password })
      .then(function(r) {
        if (r.ok || r.success) {
          var user = { name: name, email: email, role: 'free', token: r.token || 'local_' + Date.now() };
          Store.set(APP_CONFIG.KEYS.USER, user);
          if (r.token) Store.set(APP_CONFIG.KEYS.TOKEN, r.token);
          return { ok: true, user: user };
        }
        return { ok: false, message: r.message || '註冊失敗，請稍後再試' };
      })
      .catch(function() {
        /* fallback: local-only demo mode */
        var user = { name: name, email: email, role: 'free', token: 'local_' + Date.now(), isLocal: true };
        Store.set(APP_CONFIG.KEYS.USER, user);
        return { ok: true, user: user, isLocal: true };
      });
  },

  /* ── Login ────────────────────────────────────────────────*/
  login: function(email, password) {
    return Api.post('login', { email: email, password: password })
      .then(function(r) {
        if (r.ok || r.success) {
          var user = r.user || { email: email, name: r.name || email.split('@')[0], role: r.role || 'free' };
          user.token = r.token || 'local_' + Date.now();
          Store.set(APP_CONFIG.KEYS.USER, user);
          if (r.token) Store.set(APP_CONFIG.KEYS.TOKEN, r.token);
          return { ok: true, user: user };
        }
        return { ok: false, message: r.message || '帳號或密碼錯誤' };
      })
      .catch(function() {
        /* fallback: allow any login in demo mode */
        var user = { email: email, name: email.split('@')[0], role: 'free', token: 'local_' + Date.now(), isLocal: true };
        Store.set(APP_CONFIG.KEYS.USER, user);
        return { ok: true, user: user, isLocal: true };
      });
  },

  /* ── Logout ───────────────────────────────────────────────*/
  logout: function() {
    Store.del(APP_CONFIG.KEYS.USER);
    Store.del(APP_CONFIG.KEYS.TOKEN);
    location.href = 'index.html';
  },

  /* ── Forgot Password ──────────────────────────────────────*/
  forgotPassword: function(email) {
    return Api.post('forgotPassword', { email: email })
      .then(function(r) {
        return { ok: r.ok || r.success, message: r.message || '重設連結已寄出，請檢查信箱。' };
      })
      .catch(function() {
        return { ok: true, message: '（Demo模式）若此 Email 已註冊，重設連結已寄出。' };
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
    if (!this.isLoggedIn()) { Store.set('_after_login', location.href); location.href = target || 'login.html'; }
  }
};