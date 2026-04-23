/* ============================================================
   pricing.js — VIP pricing page logic & CTA
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  var user  = Store.get(APP_CONFIG.KEYS.USER);
  var isVip = (function(u) {
    if (!u) return false;
    if (u.role === 'vip') return true;
    var p = String(u.vip_plan || '').trim();
    return p !== '' && p !== '0';
  })(user);

  /* ── Dynamic CTA based on auth state ─────────────────────── */
  var el = document.getElementById('pricing-cta-primary');
  if (el) {
    if (isVip) {
      el.innerHTML = '<div class="notice-box success" style="font-size:15px">✅ 您已是 VIP 會員，享有全部功能！</div>' +
        '<div class="flex gap-12 flex-wrap mt-16">' +
        '<a href="quiz.html" class="btn btn-primary btn-lg">開始練習</a>' +
        '<a href="member-center.html" class="btn btn-secondary btn-lg">會員中心</a></div>';
    } else if (user) {
      el.innerHTML = '<a href="' + APP_CONFIG.VIP_LINE_URL + '" target="_blank" class="btn btn-vip btn-xl btn-block mb-12">' +
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