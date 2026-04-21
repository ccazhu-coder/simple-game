/* ============================================================
   result.js — Read quizResult from localStorage, render page
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  var stats = Store.get(APP_CONFIG.KEYS.QUIZ_RESULT);

  if (!stats || !stats.details) {
    var elMain = document.getElementById('result-main');
    if (elMain) {
      elMain.style.display = 'block';
      elMain.innerHTML =
        '<div class="card text-center" style="padding:60px">' +
        '<div style="font-size:48px;margin-bottom:16px">📭</div>' +
        '<h2>找不到成績資料</h2>' +
        '<p>請先完成一次練習。</p>' +
        '<div style="margin-top:24px">' +
        '<a href="quiz.html" class="btn btn-primary">開始快速練習</a></div></div>';
      /* hide direct children */
      ['result-score-card','result-vip-banner','result-cta'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      /* hide wrapper cards for nested elements */
      ['result-category','result-details'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.style.display = 'none';
      });
    }
    return;
  }

  /* ── Score card ─────────────────────────────────────────── */
  var isMock    = stats.mode === 'mock';
  var pct       = stats.accuracy || 0;
  var passed    = isMock ? (stats.passed || stats.totalScore >= APP_CONFIG.MOCK.PASS_POINTS)
                         : (pct >= APP_CONFIG.PASS_SCORE);
  var scoreClass= passed ? 'pass' : 'fail';
  var modeLabel = { quick:'快速練習', multi:'複選強化', mock:'模擬考', wrong:'錯題複習' }[stats.mode] || '練習';

  /* 分數顯示：模擬考用百分制分數，其他模式用正確率百分比 */
  var scoreDisplay = isMock
    ? (stats.totalScore + '<span style="font-size:0.45em;font-weight:500;opacity:0.7"> / ' + (stats.maxScore || 100) + '</span>')
    : (pct + '%');

  /* 達標標籤 */
  var passLabel = isMock
    ? (passed ? '✅ 通過（' + APP_CONFIG.MOCK.PASS_POINTS + ' 分及格）'
              : '❌ 未通過（' + APP_CONFIG.MOCK.PASS_POINTS + ' 分及格）')
    : (passed ? '✅ 達標' : '❌ 未達標');

  /* 結果說明文字 */
  var resultLabel = isMock
    ? (passed ? '🎉 恭喜通過！成績 ' + stats.totalScore + ' 分'
              : '再接再厲！差 ' + (APP_CONFIG.MOCK.PASS_POINTS - stats.totalScore) + ' 分及格')
    : (passed ? '恭喜通過！繼續保持' : '還需加油，再接再厲');

  /* 統計列：模擬考顯示單選/複選分項，其他顯示答對/答錯/總題 */
  var statsRow = isMock
    ? '<div class="result-stat"><div class="result-stat-val" style="color:#86EFAC">' + (stats.singleCorrect || 0) + '<small style="font-size:0.6em">/' + APP_CONFIG.MOCK.SINGLE_COUNT + '</small></div><div class="result-stat-lbl">單選答對</div></div>' +
      '<div class="result-stat"><div class="result-stat-val" style="color:#60A5FA">' + (stats.multiCorrect  || 0) + '<small style="font-size:0.6em">/' + APP_CONFIG.MOCK.MULTI_COUNT + '</small></div><div class="result-stat-lbl">複選全對</div></div>' +
      '<div class="result-stat"><div class="result-stat-val">' + (stats.totalScore || 0) + '</div><div class="result-stat-lbl">總得分</div></div>'
    : '<div class="result-stat"><div class="result-stat-val" style="color:#86EFAC">' + stats.correctCount + '</div><div class="result-stat-lbl">答對題數</div></div>' +
      '<div class="result-stat"><div class="result-stat-val" style="color:#FCA5A5">' + stats.wrongCount   + '</div><div class="result-stat-lbl">答錯題數</div></div>' +
      '<div class="result-stat"><div class="result-stat-val">'                        + stats.total        + '</div><div class="result-stat-lbl">總題數</div></div>';

  document.getElementById('result-score-card').innerHTML =
    '<div style="margin-bottom:8px">' +
      '<span class="badge badge-gray">' + modeLabel + '</span>' +
      '<span class="badge ' + (passed?'badge-green':'badge-red') + '" style="margin-left:8px">' + passLabel + '</span>' +
    '</div>' +
    '<div class="result-score ' + scoreClass + '">' + scoreDisplay + '</div>' +
    '<div class="result-label ' + scoreClass + '">' + resultLabel + '</div>' +
    '<div class="result-stats">' + statsRow + '</div>';

  /* ── Category stats ─────────────────────────────────────── */
  var catHTML = '';
  if (stats.categoryStats) {
    Object.keys(stats.categoryStats).forEach(function(cat) {
      var cs = stats.categoryStats[cat];
      var cp = cs.total > 0 ? Math.round((cs.correct / cs.total) * 100) : 0;
      var barColor = cp >= 80 ? 'var(--success)' : cp >= 60 ? 'var(--warning)' : 'var(--danger)';
      catHTML += '<div class="cat-bar">' +
        '<div class="cat-bar-header"><span>' + cat + '</span><span>' + cs.correct + '/' + cs.total + '（' + cp + '%）</span></div>' +
        '<div class="cat-bar-wrap"><div class="cat-bar-fill" style="width:' + cp + '%;background:' + barColor + '"></div></div>' +
        '</div>';
    });
  }
  document.getElementById('result-category').innerHTML = catHTML || '<p>無類別資料</p>';

  /* ── Detail items ───────────────────────────────────────── */
  var detailHTML = '';
  (stats.details || []).forEach(function(d, i) {
    var cls      = d.isCorrect ? 'correct' : (d.selectedAnswer ? 'wrong' : 'skipped');
    var icon     = d.isCorrect ? '✅' : (d.selectedAnswer ? '❌' : '⬜');
    var typeBadge = d.type === 'multiple'
      ? '<span class="badge badge-orange" style="font-size:10px">複選</span>'
      : '<span class="badge badge-blue"   style="font-size:10px">單選</span>';
    var answerInfo = d.isCorrect
      ? '<span style="color:var(--success-dark);font-weight:700;font-size:13px">✓ 答對</span>'
      : '<span style="color:var(--danger-dark);font-weight:700;font-size:13px">✗ 你選：' + (d.selectedAnswer||'未作答') + '　正解：' + (d.correctAnswer||'—') + '</span>';

    var analysis = '';
    if (d.analysis) {
      if (d.analysis.keypoint) analysis += '<div><b>解析：</b>' + d.analysis.keypoint + '</div>';
      if (d.analysis.memory)   analysis += '<div style="margin-top:6px"><b>口訣：</b>' + d.analysis.memory + '</div>';
      if (d.analysis.trap)     analysis += '<div style="margin-top:6px"><b>陷阱：</b>' + d.analysis.trap + '</div>';
    }

    detailHTML +=
      '<div class="result-detail-item ' + cls + '">' +
        '<div class="result-detail-toggle" onclick="ResultPage.toggleDetail(this)">' +
          '<span>' + icon + ' Q' + (i+1) + '. ' + typeBadge + ' ' + d.title + '</span>' +
          '<span style="font-size:12px;white-space:nowrap">' + answerInfo + ' <span style="color:var(--muted)">▼</span></span>' +
        '</div>' +
        '<div class="result-detail-analysis">' + (analysis || '（無解析）') + '</div>' +
      '</div>';
  });
  document.getElementById('result-details').innerHTML = detailHTML;

  /* ── CTA section ────────────────────────────────────────── */
  var hasWrong = stats.wrongCount > 0;
  document.getElementById('result-cta').innerHTML =
    '<div class="result-cta-grid">' +
      '<div class="result-cta-card" onclick="location.href=\'quiz.html\'">' +
        '<div class="result-cta-icon">🔄</div>' +
        '<div class="result-cta-title">再練一次</div>' +
        '<div class="result-cta-desc">趁現在，把觀念補齊。記憶在出錯後最容易鞏固。</div>' +
        '<button class="btn btn-primary btn-block btn-sm">再練一次</button>' +
      '</div>' +
      (hasWrong
        ? '<div class="result-cta-card" onclick="location.href=\'wrong-questions.html\'">' +
          '<div class="result-cta-icon">📚</div>' +
          '<div class="result-cta-title">複習錯題本</div>' +
          '<div class="result-cta-desc">錯題不重練，分數不會自己變高。' + stats.wrongCount + ' 題等你複習。</div>' +
          '<button class="btn btn-danger btn-block btn-sm">進入錯題本</button></div>'
        : '<div class="result-cta-card" onclick="location.href=\'multi-select.html\'">' +
          '<div class="result-cta-icon">✅✅</div>' +
          '<div class="result-cta-title">複選題強化</div>' +
          '<div class="result-cta-desc">複選題最容易失分，立即進入強化模式。</div>' +
          '<button class="btn btn-secondary btn-block btn-sm">開始複選強化</button></div>') +
      '<div class="result-cta-card" onclick="location.href=\'mock-exam.html\'">' +
        '<div class="result-cta-icon">📝</div>' +
        '<div class="result-cta-title">正式模擬考</div>' +
        '<div class="result-cta-desc">80 題、120 分鐘，驗收真實實力。通關標準 60 分。</div>' +
        '<button class="btn btn-dark btn-block btn-sm">進入模擬考</button>' +
      '</div>' +
      '<div class="result-cta-card" style="background:var(--vip-light);border-color:var(--vip)" onclick="location.href=\'pricing.html\'">' +
        '<div class="result-cta-icon">⭐</div>' +
        '<div class="result-cta-title">升級 VIP</div>' +
        '<div class="result-cta-desc">升級 VIP，開啟完整備考模式：完整題庫、複選強化、模擬考、學習分析。</div>' +
        '<button class="btn btn-vip btn-block btn-sm">立即升級 VIP</button>' +
      '</div>' +
    '</div>';
});

window.ResultPage = {};