/* ============================================================
   member-center.js — Member dashboard: profile, stats, history
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  var user = Store.get(APP_CONFIG.KEYS.USER);
  if (!user) { Store.set('_after_login', location.href); location.href = 'login.html'; return; }

  /* ── Profile header ─────────────────────────────────────── */
  var initial = (user.name || user.email || '?')[0].toUpperCase();
  var _vp = String(user.vip_plan || '').trim();
  var isVip = user.role === 'vip' || (_vp !== '' && _vp !== '0');
  var el = document.getElementById('mc-profile');
  if (el) {
    el.innerHTML =
      '<div class="member-avatar">' + initial + '</div>' +
      '<h2 style="color:#fff;margin-bottom:6px">' + (user.name || user.email) + '</h2>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
        '<span class="badge ' + (isVip?'badge-vip':'badge-gray') + '">' + (isVip?'⭐ VIP 會員':'免費會員') + '</span>' +
        '<span style="color:#94A3B8;font-size:13px">' + (user.email||'') + '</span>' +
      '</div>';
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
    if (isVip) {
      var planNames = { monthly:'月費方案', quarterly:'季費方案', yearly:'年費方案' };
      var planLabel = planNames[user.vip_plan] || (user.vip_plan ? 'VIP 方案（' + user.vip_plan + '）' : 'VIP 方案');
      var expiresStr = '';
      if (user.vip_expires) {
        var expDate = new Date(user.vip_expires);
        if (!isNaN(expDate)) {
          expiresStr = '（有效期限至 ' + expDate.getFullYear() + '/' +
            String(expDate.getMonth()+1).padStart(2,'0') + '/' +
            String(expDate.getDate()).padStart(2,'0') + '）';
        }
      }
      elVip.innerHTML =
        '<div class="notice-box success">' +
          '⭐ 您已是 VIP 會員【' + planLabel + '】' + expiresStr + '，享有完整功能：題庫全開、複選強化、模擬考、完整錯題本與學習分析。' +
        '</div>' +
        '<div class="flex gap-12 flex-wrap mt-16">' +
          '<a href="quiz.html"            class="btn btn-primary">開始練習</a>' +
          '<a href="multi-select.html"    class="btn btn-secondary">複選強化</a>' +
          '<a href="mock-exam.html"       class="btn btn-secondary">模擬考</a>' +
          '<a href="wrong-questions.html" class="btn btn-secondary">錯題本</a>' +
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
});

function _statBox(icon, value, label) {
  return '<div class="card-sm" style="text-align:center;background:#fff">' +
    '<div style="font-size:24px;margin-bottom:6px">' + icon + '</div>' +
    '<div style="font-size:26px;font-weight:900;letter-spacing:-.02em">' + value + '</div>' +
    '<div style="font-size:12px;color:var(--muted);font-weight:700;margin-top:3px">' + label + '</div>' +
    '</div>';
}

function _lockCard(icon, title, desc) {
  return '<div class="card-sm" style="opacity:.7;position:relative">' +
    '<div style="font-size:20px;margin-bottom:8px">' + icon + ' 🔒</div>' +
    '<div style="font-weight:900;font-size:15px;margin-bottom:4px">' + title + '</div>' +
    '<div style="font-size:13px;color:var(--muted)">' + desc + '</div>' +
    '</div>';
}