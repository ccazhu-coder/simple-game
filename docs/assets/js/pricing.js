/* ============================================================
   pricing.js — VIP pricing page logic & CTA
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  var user    = Store.get(APP_CONFIG.KEYS.USER);
  var vipSt   = VipUtils.getStatus(user);
  var isVip   = (vipSt === 'active' || vipSt === 'expiring');
  var daysLeft = VipUtils.getDaysLeft(user);
  var expiry   = VipUtils.formatExpiry(user);
  var reminder = VipUtils.getReminderText(user);
  var reminderStage = VipUtils.getReminderStage(user);

  /* ── Dynamic CTA based on auth + VIP state ───────────────── */
  var el = document.getElementById('pricing-cta-primary');
  if (el) {
    if (isVip) {
      var reminderBanner = reminder
        ? '<div class="notice-box ' + (reminderStage === '1day' ? 'danger' : 'warning') + ' mb-16">⚠️ ' + reminder + '</div>'
        : '';
      el.innerHTML =
        reminderBanner +
        '<div class="notice-box success mb-12" style="font-size:15px">✅ VIP 使用中 — 享有全部功能！</div>' +
        '<div style="font-size:13px;color:var(--muted);margin-bottom:16px">' +
          '到期日：<strong>' + expiry + '</strong>　剩餘 <strong style="color:' + (daysLeft<=7?'var(--danger-dark)':'inherit') + '">' + (daysLeft !== null ? daysLeft : '—') + ' 天</strong>' +
        '</div>' +
        '<div class="flex gap-12 flex-wrap">' +
          '<a href="quiz.html" class="btn btn-primary btn-lg">開始練習</a>' +
          '<a href="member-center.html" class="btn btn-secondary btn-lg">會員中心</a>' +
          '<a href="' + APP_CONFIG.VIP_LINE_URL + '" target="_blank" class="btn btn-vip btn-lg">我要續費 VIP</a>' +
        '</div>';
    } else if (vipSt === 'expired') {
      el.innerHTML =
        '<div class="notice-box danger mb-16">⚠️ ' + reminder + '</div>' +
        '<a href="' + APP_CONFIG.VIP_LINE_URL + '" target="_blank" class="btn btn-vip btn-xl btn-block mb-12">' +
          '💬 立即續費 VIP（LINE 客服）</a>' +
        '<a href="mailto:' + APP_CONFIG.SUPPORT_EMAIL + '" class="btn btn-secondary btn-lg btn-block">' +
          '📧 Email 詢問續費方案</a>';
    } else if (user) {
      el.innerHTML =
        '<a href="' + APP_CONFIG.VIP_LINE_URL + '" target="_blank" class="btn btn-vip btn-xl btn-block mb-12">' +
          '💬 聯絡 LINE 客服開通 VIP</a>' +
        '<a href="mailto:' + APP_CONFIG.SUPPORT_EMAIL + '" class="btn btn-secondary btn-lg btn-block">' +
          '📧 Email 開通詢問</a>';
    } else {
      el.innerHTML =
        '<a href="register.html" class="btn btn-primary btn-xl btn-block mb-12">免費註冊，立即體驗</a>' +
        '<a href="' + APP_CONFIG.VIP_LINE_URL + '" target="_blank" class="btn btn-vip btn-lg btn-block mb-12">' +
          '💬 聯絡 LINE 直接開通 VIP</a>' +
        '<a href="mailto:' + APP_CONFIG.SUPPORT_EMAIL + '" class="btn btn-secondary btn-lg btn-block">' +
          '📧 Email 詢問方案</a>';
    }
  }

  /* ── FAQ accordion ────────────────────────────────────────── */
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var ans    = q.nextElementSibling;
      var isOpen = ans.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-a').forEach(function(a){ a.classList.remove('open'); });
      document.querySelectorAll('.faq-q').forEach(function(fq){ fq.classList.remove('open'); });
      if (!isOpen) { ans.classList.add('open'); q.classList.add('open'); }
    });
  });

  /* ── LINE CTA ────────────────────────────────────────────── */
  window.openLine = function() { window.open(APP_CONFIG.VIP_LINE_URL, '_blank'); };
});