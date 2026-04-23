/* ============================================================
   member-center.js — Member dashboard: profile, stats, history
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  var user = Store.get(APP_CONFIG.KEYS.USER);
  if (!user) { Store.set('_after_login', location.href); location.href = 'login.html'; return; }

  /* ── Profile header ─────────────────────────────────────── */
  var initial  = (user.name || user.email || '?')[0].toUpperCase();
  var vipSt    = VipUtils.getStatus(user);
  var isVip    = (vipSt === 'active' || vipSt === 'expiring');
  var badgeCls = isVip ? 'badge-vip' : (vipSt === 'expired' ? 'badge-red' : 'badge-gray');
  var badgeTxt = isVip
    ? ('⭐ VIP 會員' + (vipSt === 'expiring' ? '（即將到期）' : ''))
    : (vipSt === 'expired' ? '🔴 VIP 已到期' : '免費會員');
  var el = document.getElementById('mc-profile');
  if (el) {
    el.innerHTML =
      '<div class="member-avatar">' + initial + '</div>' +
      '<h2 style="color:#fff;margin-bottom:6px">' + (user.name || user.email) + '</h2>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
        '<span class="badge ' + badgeCls + '">' + badgeTxt + '</span>' +
        '<span style="color:#94A3B8;font-size:13px">' + (user.email||'') + '</span>' +
      '</div>';
  }

  /* ── Quick-action 6th card (VIP-aware) ──────────────────── */
  var elVipCard = document.getElementById('mc-vip-quick-card');
  if (elVipCard) {
    if (isVip) {
      var cardLabel = vipSt === 'expiring' ? 'VIP 即將到期' : 'VIP 使用中';
      var cardDesc  = vipSt === 'expiring' ? '查看方案狀態' : '您已解鎖完整功能';
      elVipCard.innerHTML =
        '<a href="pricing.html" class="card card-hover" style="display:block;text-decoration:none;background:var(--vip-light);border-color:var(--vip)">' +
          '<div style="font-size:28px;margin-bottom:10px">⭐</div>' +
          '<div style="font-weight:900;font-size:15px;margin-bottom:4px">' + cardLabel + '</div>' +
          '<div style="font-size:13px;color:var(--muted)">' + cardDesc + '</div>' +
        '</a>';
    } else {
      elVipCard.innerHTML =
        '<a href="pricing.html" class="card card-hover" style="display:block;text-decoration:none;background:var(--vip-light);border-color:var(--vip)">' +
          '<div style="font-size:28px;margin-bottom:10px">⭐</div>' +
          '<div style="font-weight:900;font-size:15px;margin-bottom:4px">升級 VIP</div>' +
          '<div style="font-size:13px;color:var(--muted)">解鎖全部功能</div>' +
        '</a>';
    }
  }

  /* ── Study stats ─────────────────────────────────────────── */
  var stats = Store.get(APP_CONFIG.KEYS.STUDY_STATS, { totalSessions:0, totalQuestions:0, totalCorrect:0, sessions:[] });
  var overallAcc = stats.totalQuestions > 0 ? Math.round(stats.totalCorrect / stats.totalQuestions * 100) : 0;
  var wrongCount = (Store.get(APP_CONFIG.KEYS.WRONG_LIST, [])).length;

  var elStats = document.getElementById('mc-stats');
  if (elStats) {
    elStats.innerHTML =
      '<div class="grid-4" style="gap:16px">' +
        _statBox('📝', stats.totalSessions, '練習場次') +
        _statBox('📊', stats.totalQuestions, '作答題數') +
        _statBox('🎯', overallAcc + '%', '整體正確率') +
        _statBox('❌', wrongCount, '錯題本題數') +
      '</div>';
  }

  /* ── Recent sessions ─────────────────────────────────────── */
  var elHistory = document.getElementById('mc-history');
  if (elHistory) {
    var sessions = stats.sessions || [];
    if (sessions.length === 0) {
      elHistory.innerHTML = '<p style="text-align:center;padding:32px 0">尚無練習紀錄，<a href="quiz.html" style="color:var(--primary)">立即開始練習</a></p>';
    } else {
      elHistory.innerHTML = '<table style="width:100%;border-collapse:collapse">' +
        '<thead><tr style="background:var(--bg-2)">' +
          '<th style="padding:11px 16px;text-align:left;font-size:13px">時間</th>' +
          '<th style="padding:11px 16px;text-align:center;font-size:13px">模式</th>' +
          '<th style="padding:11px 16px;text-align:center;font-size:13px">題數</th>' +
          '<th style="padding:11px 16px;text-align:center;font-size:13px">正確率</th>' +
        '</tr></thead><tbody>' +
        sessions.slice(0,20).map(function(s) {
          var modeLabel = { quick:'快速練習', multi:'複選強化', mock:'模擬考', wrong:'錯題複習' }[s.mode] || s.mode;
          var cls = App.scoreClass(s.accuracy);
          return '<tr style="border-bottom:1px solid var(--border-light)">' +
            '<td style="padding:11px 16px;font-size:13px;color:var(--muted)">' + App.formatDate(s.timestamp) + '</td>' +
            '<td style="padding:11px 16px;text-align:center"><span class="badge badge-gray">' + modeLabel + '</span></td>' +
            '<td style="padding:11px 16px;text-align:center;font-weight:700">' + s.total + '</td>' +
            '<td style="padding:11px 16px;text-align:center"><span class="badge ' + cls + '">' + s.accuracy + '%</span></td>' +
            '</tr>';
        }).join('') +
        '</tbody></table>';
    }
  }

  /* ── VIP info ─────────────────────────────────────────────── */
  var elVip = document.getElementById('mc-vip');
  if (elVip) {
    var planNames   = { monthly:'月費方案', quarterly:'季費方案', yearly:'年費方案' };
    var planLabel   = planNames[user.vip_plan] || (user.vip_plan ? 'VIP 方案（' + user.vip_plan + '）' : 'VIP 方案');
    var expiry      = VipUtils.formatExpiry(user);
    var daysLeft    = VipUtils.getDaysLeft(user);
    var reminder    = VipUtils.getReminderText(user);
    var reminderStage = VipUtils.getReminderStage(user);

    if (vipSt === 'expired') {
      elVip.innerHTML =
        '<div class="notice-box danger mb-16">⚠️ ' + reminder + '</div>' +
        '<div style="background:var(--bg-2);border-radius:12px;padding:16px 20px;margin-bottom:16px">' +
          '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">上次 VIP 方案</div>' +
          '<div style="font-weight:700;margin-bottom:4px">' + planLabel + '</div>' +
          '<div style="font-size:13px;color:var(--danger-dark)">到期日：' + expiry + '</div>' +
        '</div>' +
        '<a href="pricing.html" class="btn btn-vip btn-block">重新開通 VIP</a>';

    } else if (isVip) {
      var reminderBox = reminder
        ? '<div class="notice-box ' + (reminderStage === '1day' ? 'danger' : 'warning') + ' mb-16">⚠️ ' + reminder + '</div>'
        : '';
      var daysColor = (daysLeft !== null && daysLeft <= 7) ? 'var(--danger-dark)' : 'var(--success-dark)';
      elVip.innerHTML =
        reminderBox +
        '<div class="notice-box success mb-16">' +
          '⭐ 您已是 VIP 會員，享有完整功能：題庫全開、複選強化、模擬考、完整錯題本與學習分析。' +
        '</div>' +
        '<div class="grid-3 gap-12 mb-16" style="font-size:13px">' +
          _infoBox('方案', planLabel) +
          _infoBox('到期日', expiry) +
          _infoBox('剩餘天數', (daysLeft !== null ? daysLeft + ' 天' : '—'), daysColor) +
        '</div>' +
        '<div class="flex gap-12 flex-wrap">' +
          '<a href="quiz.html"            class="btn btn-primary">開始練習</a>' +
          '<a href="multi-select.html"    class="btn btn-secondary">複選強化</a>' +
          '<a href="mock-exam.html"       class="btn btn-secondary">模擬考</a>' +
          '<a href="wrong-questions.html" class="btn btn-secondary">錯題本</a>' +
          '<a href="pricing.html"         class="btn btn-vip">我要續費</a>' +
        '</div>';

    } else {
      elVip.innerHTML =
        '<div class="vip-banner">' +
          '<div class="vip-banner-text"><div class="title">升級 VIP，解鎖完整備考功能</div>' +
          '<div class="desc">複選題強化、模擬考、完整錯題本、學習分析</div></div>' +
          '<a href="pricing.html" class="btn btn-dark" style="white-space:nowrap">查看 VIP 方案</a>' +
        '</div>' +
        '<div class="grid-2 gap-16">' +
          _lockCard('✅✅', '複選題強化', '針對最容易失分的題型') +
          _lockCard('📝', '正式模擬考', '80題・120分鐘・完整驗收') +
          _lockCard('📚', '完整錯題本', '追蹤所有錯題與解析') +
          _lockCard('📊', '學習分析', '弱點報告與進度追蹤') +
        '</div>';
    }
  }

  /* ── Tab switching ────────────────────────────────────────── */
  window.MCTab = {
    show: function(tabName) {
      document.querySelectorAll('.member-tab').forEach(function(t){ t.classList.remove('active'); });
      document.querySelectorAll('.member-tab-content').forEach(function(t){ t.classList.remove('active'); });
      var tab     = document.querySelector('.member-tab[data-tab="'+tabName+'"]');
      var content = document.getElementById('mc-tab-'+tabName);
      if (tab)     tab.classList.add('active');
      if (content) content.classList.add('active');
    }
  };

  /* ── Password change ─────────────────────────────────────── */
  window.MCPw = {
    submit: function() {
      var user  = Store.get(APP_CONFIG.KEYS.USER);
      var errEl = document.getElementById('pw-error');
      var sucEl = document.getElementById('pw-success');
      var btn   = document.getElementById('pw-submit-btn');

      function showErr(msg) {
        errEl.textContent   = msg;
        errEl.style.display = 'block';
        sucEl.style.display = 'none';
      }
      errEl.style.display = 'none';
      sucEl.style.display = 'none';

      if (!user || !user.token) { showErr('請先登入後再操作'); return; }

      var cur = document.getElementById('pw-current').value;
      var nw  = document.getElementById('pw-new').value;
      var cnf = document.getElementById('pw-confirm').value;

      if (!cur.trim())   { showErr('請輸入目前密碼'); return; }
      if (!nw.trim())    { showErr('請輸入新密碼'); return; }
      if (nw.length < 6) { showErr('新密碼至少需 6 碼'); return; }
      if (nw === cur)    { showErr('新密碼不可與目前密碼相同'); return; }
      if (!cnf.trim())   { showErr('請輸入確認新密碼'); return; }
      if (nw !== cnf)    { showErr('兩次輸入的新密碼不一致'); return; }

      btn.disabled    = true;
      btn.textContent = '修改中…';

      Api.get('changePassword', {
        token:           user.token,
        currentPassword: cur,
        newPassword:     nw
      }).then(function(r) {
        if (r.ok) {
          sucEl.textContent   = '密碼修改成功！即將登出，請以新密碼重新登入…';
          sucEl.style.display = 'block';
          document.getElementById('pw-current').value = '';
          document.getElementById('pw-new').value     = '';
          document.getElementById('pw-confirm').value = '';
          btn.textContent = '修改成功';
          Auth.clearUserData();
          setTimeout(function() { location.href = 'login.html'; }, 2200);
        } else {
          showErr(r.message || '修改失敗，請稍後再試');
          btn.disabled    = false;
          btn.textContent = '確認修改密碼';
        }
      }).catch(function() {
        showErr('網路錯誤，請檢查連線後重試');
        btn.disabled    = false;
        btn.textContent = '確認修改密碼';
      });
    },

    reset: function() {
      document.getElementById('pw-current').value = '';
      document.getElementById('pw-new').value     = '';
      document.getElementById('pw-confirm').value = '';
      document.getElementById('pw-error').style.display   = 'none';
      document.getElementById('pw-success').style.display = 'none';
    }
  };
});

function _statBox(icon, value, label) {
  return '<div class="card-sm" style="text-align:center;background:#fff">' +
    '<div style="font-size:24px;margin-bottom:6px">' + icon + '</div>' +
    '<div style="font-size:26px;font-weight:900;letter-spacing:-.02em">' + value + '</div>' +
    '<div style="font-size:12px;color:var(--muted);font-weight:700;margin-top:3px">' + label + '</div>' +
    '</div>';
}

function _infoBox(label, value, valColor) {
  return '<div style="background:var(--bg-2);border-radius:8px;padding:12px;text-align:center">' +
    '<div style="color:var(--muted);font-size:12px;margin-bottom:4px">' + label + '</div>' +
    '<div style="font-weight:700' + (valColor ? ';color:' + valColor : '') + '">' + value + '</div>' +
    '</div>';
}

function _lockCard(icon, title, desc) {
  return '<div class="card-sm" style="opacity:.7;position:relative">' +
    '<div style="font-size:20px;margin-bottom:8px">' + icon + ' 🔒</div>' +
    '<div style="font-weight:900;font-size:15px;margin-bottom:4px">' + title + '</div>' +
    '<div style="font-size:13px;color:var(--muted)">' + desc + '</div>' +
    '</div>';
}