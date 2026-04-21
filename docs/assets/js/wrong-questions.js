/* ============================================================
   wrong-questions.js — Wrong question book management
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  var allWrong = Store.get(APP_CONFIG.KEYS.WRONG_LIST, []);
  var filtered = allWrong.slice();
  var activeCategory = 'all';
  var activeType     = 'all';

  /* ── Build category filters ─────────────────────────────── */
  var categories = ['all'];
  allWrong.forEach(function(w) {
    if (categories.indexOf(w.category) === -1) categories.push(w.category);
  });

  var catBar = document.getElementById('wq-cat-filter');
  if (catBar) {
    catBar.innerHTML = categories.map(function(c) {
      var label = c === 'all' ? '全部類別' : c;
      return '<button class="filter-chip' + (c==='all'?' active':'') + '" data-cat="' + c + '" onclick="WQ.filterCat(this,\'' + c + '\')">' + label + '</button>';
    }).join('');
  }

  /* ── Stats ──────────────────────────────────────────────── */
  function _updateStats() {
    var el = document.getElementById('wq-stats');
    if (el) {
      el.innerHTML =
        '<span class="badge badge-red">錯題 ' + filtered.length + ' 題</span>' +
        '<span class="badge badge-gray" style="margin-left:8px">累計 ' + allWrong.length + ' 題</span>';
    }
  }

  /* ── Render list ────────────────────────────────────────── */
  function _render() {
    _updateStats();
    var el = document.getElementById('wq-list');
    if (!el) return;
    if (filtered.length === 0) {
      el.innerHTML = '<div class="card text-center" style="padding:48px">' +
        '<div style="font-size:48px;margin-bottom:14px">🎉</div>' +
        '<h3>太棒了！沒有錯題</h3>' +
        '<p>目前篩選條件下沒有錯題，繼續保持！</p>' +
        '<div style="margin-top:20px"><a href="quiz.html" class="btn btn-primary">繼續練習</a></div>' +
        '</div>';
      return;
    }

    el.innerHTML = filtered.map(function(w, i) {
      var typeBadge = w.type === 'multiple'
        ? '<span class="badge badge-orange">複選</span>'
        : '<span class="badge badge-blue">單選</span>';
      var analysis = '';
      if (w.analysis) {
        if (w.analysis.keypoint) analysis += '<div class="wq-analysis-label">核心解析</div><div>' + w.analysis.keypoint + '</div>';
        if (w.analysis.memory)   analysis += '<div class="wq-analysis-label" style="margin-top:8px">記憶口訣</div><div>' + w.analysis.memory + '</div>';
        if (w.analysis.trap)     analysis += '<div class="wq-analysis-label" style="margin-top:8px">陷阱提示</div><div>' + w.analysis.trap + '</div>';
      }
      var optHTML = '';
      if (w.options && w.options.length) {
        optHTML = '<div style="margin:10px 0;display:flex;flex-direction:column;gap:6px">' +
          w.options.map(function(o) {
            var isCorrect = w.correctAnswer && w.correctAnswer.indexOf(o.key) !== -1;
            var isYours   = w.yourAnswer   && w.yourAnswer.indexOf(o.key) !== -1;
            var style = isCorrect ? 'color:var(--success-dark);font-weight:900' : (isYours ? 'color:var(--danger-dark)' : 'color:var(--muted)');
            return '<div style="font-size:13px;' + style + '">' + (isCorrect?'✓ ':'  ') + o.key + '. ' + o.text + '</div>';
          }).join('') +
          '</div>';
      }
      return '<div class="wq-item">' +
        '<div class="wq-header">' +
          '<div class="wq-question">' + typeBadge + ' ' + w.title + '</div>' +
          '<button class="btn btn-sm btn-danger" onclick="WQ.remove(' + i + ')">移除</button>' +
        '</div>' +
        optHTML +
        '<div class="wq-answers">' +
          '<span class="wq-your">你選：' + (w.yourAnswer||'未作答') + '</span>' +
          '<span class="wq-correct">正解：' + (w.correctAnswer||'—') + '</span>' +
          '<span class="badge badge-gray">' + w.category + '</span>' +
        '</div>' +
        (analysis ? '<div class="wq-analysis">' + analysis + '</div>' : '') +
        '</div>';
    }).join('');
  }

  /* ── Public ─────────────────────────────────────────────── */
  window.WQ = {
    filterCat: function(btn, cat) {
      activeCategory = cat;
      document.querySelectorAll('#wq-cat-filter .filter-chip').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      _applyFilter();
    },
    filterType: function(btn, type) {
      activeType = type;
      document.querySelectorAll('#wq-type-filter .filter-chip').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      _applyFilter();
    },
    remove: function(idx) {
      Modal.confirm({ title:'移除錯題', body:'確定要從錯題本移除這題嗎？', okText:'移除', okClass:'btn-danger' })
        .then(function(ok) {
          if (!ok) return;
          var item = filtered[idx];
          var allIdx = allWrong.indexOf(item);
          filtered.splice(idx, 1);
          if (allIdx !== -1) allWrong.splice(allIdx, 1);
          Store.set(APP_CONFIG.KEYS.WRONG_LIST, allWrong);
          _applyFilter();
        });
    },
    clearAll: function() {
      Modal.confirm({
        title:'清空錯題本',
        body:'確定要清空所有錯題嗎？此操作無法復原。',
        okText:'清空', okClass:'btn-danger'
      }).then(function(ok) {
        if (!ok) return;
        allWrong = []; filtered = [];
        Store.del(APP_CONFIG.KEYS.WRONG_LIST);
        _render();
        Toast.success('錯題本已清空');
      });
    },
    retryWrong: function() {
      if (filtered.length === 0) { Toast.info('沒有錯題可練習'); return; }
      /* Save filtered as a custom session */
      Store.set(APP_CONFIG.KEYS.QUIZ_SESSION + '_wrong', {
        questions: filtered.map(function(w) {
          return {
            id: w.id, type: w.type === 'multiple' ? 'multiple' : 'single',
            category: w.category, title: w.title, options: w.options,
            correctAnswer: w.correctAnswer, analysis: w.analysis
          };
        }),
        timestamp: Date.now()
      });
      location.href = 'quiz.html?mode=wrong';
    }
  };

  function _applyFilter() {
    filtered = allWrong.filter(function(w) {
      var matchCat  = activeCategory === 'all' || w.category === activeCategory;
      var matchType = activeType === 'all' || w.type === activeType;
      return matchCat && matchType;
    });
    _render();
  }

  _render();
});