/* ============================================================
   quiz-engine.js — Full quiz state machine
   Supports: single/multi-select, prev/next, submit, analysis,
             wrong-question tracking, result storage
   ============================================================ */

window.QuizEngine = (function() {

  /* ── State ─────────────────────────────────────────────── */
  var state = {
    questions:    [],   // normalised question objects
    currentIndex: 0,
    answers:      {},   // { id: [key, ...] }
    submitted:    {},   // { id: true }
    results:      {},   // { id: { isCorrect, correctAnswer } }
    sessionId:    null,
    mode:         'quick',  // 'quick' | 'multi' | 'mock' | 'wrong'
    startTime:    null,
    optCache:     {}    // { id: htmlString } pre-rendered options
  };

  /* ── Fisher-Yates shuffle ──────────────────────────────── */
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ── Normalise raw API question → internal format ──────── */
  function _map(q) {
    return {
      id:            q.id || ('Q' + Math.random().toString(36).substring(2,8)),
      type:          (q.type === '單選' || q.type === 'single') ? 'single' : 'multiple',
      category:      q.category || '一般',
      title:         q.question || q.title || '',
      options:       [
        { key:'A', text: q.optionA || '' },
        { key:'B', text: q.optionB || '' },
        { key:'C', text: q.optionC || '' },
        { key:'D', text: q.optionD || '' }
      ].filter(function(o){ return o.text.trim() !== ''; }),
      correctAnswer: q.answer || q.correctAnswer || null,
      analysis: {
        keypoint:     q.keypoint     || q.analysis_keypoint  || '',
        memory:       q.memory       || q.analysis_memory    || '',
        trap:         q.trap         || q.analysis_trap      || '',
        lawReference: q.lawReference || q.analysis_law       || ''
      }
    };
  }

  /* ── Background API refresh (fire-and-forget, updates cache for next session) ── */
  function _bgRefresh(action, params, cacheKey) {
    Api.get(action, params)
      .then(function(r) {
        var list = r.questions || r.data || [];
        if ((r.ok || r.success) && list.length > 0) {
          Store.set(cacheKey, { questions: _shuffle(list).map(_map), timestamp: Date.now() });
        }
      }).catch(function() {});
  }

  /* ── Save to cache ─────────────────────────────────────── */
  function _saveCache(key) {
    Store.set(key, { questions: state.questions, timestamp: Date.now() });
  }

  /* ── Local questions fallback (QUESTIONS_DB when API unavailable) ─── */
  function _localQuestions(mode) {
    var db = window.QUESTIONS_DB;
    if (!db || db.length === 0) return [];

    var user = Store.get(APP_CONFIG.KEYS.USER);
    var isVip = user && user.role === 'vip';

    if (mode === 'multi') {
      var multiPool = db.filter(function(q){ return q.type === '複選'; });
      var count = isVip ? multiPool.length : APP_CONFIG.FREE.MULTI_FREE_COUNT;
      return _shuffle(multiPool).slice(0, count).map(_map);
    }

    if (mode === 'wrong') {
      var wq = Store.get(APP_CONFIG.KEYS.WRONG_LIST, []);
      if (wq.length > 0) return wq.slice(0, 50);
      /* fall through to quick if no saved wrong questions */
    }

    /* quick (default) */
    var singlePool = db.filter(function(q){ return q.type === '單選'; });
    var limit = isVip ? 80 : APP_CONFIG.FREE.MAX_QUESTIONS;
    return _shuffle(singlePool).slice(0, limit).map(_map);
  }

  /* ── Public API ────────────────────────────────────────── */
  var Engine = {

    /* Init: mode = 'quick' | 'multi' | 'wrong'
       永遠先用本地資料（cache 或 QUESTIONS_DB）立刻回傳，API 只做背景更新。 */
    init: function(mode) {
      state.mode         = mode || 'quick';
      state.currentIndex = 0;
      state.answers      = {};
      state.submitted    = {};
      state.results      = {};
      state.optCache     = {};
      state.startTime    = Date.now();

      var cacheKey  = APP_CONFIG.KEYS.QUIZ_SESSION + '_' + state.mode;
      var apiAction = { quick:'getQuestions', multi:'getMultiSelect', wrong:'getWrongQuestions' }[state.mode] || 'getQuestions';
      var user      = Store.get(APP_CONFIG.KEYS.USER);
      var params    = user ? { token: user.token || '' } : {};

      /* ① cache 存在 → 立刻使用（不檢查 TTL），逾期才背景刷新 */
      var cached = Store.get(cacheKey);
      if (cached && Array.isArray(cached.questions) && cached.questions.length > 0) {
        state.questions = cached.questions;
        if (!cached.timestamp || cached.timestamp < Date.now() - 3600000) {
          _bgRefresh(apiAction, params, cacheKey);
        }
        return Promise.resolve(true);
      }

      /* ② 無 cache → 立刻用本地題庫，背景更新 cache 供下次使用 */
      var localQs = _localQuestions(state.mode);
      if (localQs.length > 0) {
        state.questions = localQs;
        Store.set(cacheKey, { questions: localQs, timestamp: 0 }); // timestamp=0 觸發下次背景刷新
        _bgRefresh(apiAction, params, cacheKey);
        return Promise.resolve(true);
      }

      /* ③ 極端 fallback（QUESTIONS_DB 未載入）：才等 API */
      return Api.get(apiAction, params)
        .then(function(r) {
          var list = r.questions || r.data || [];
          if ((r.ok || r.success) && list.length > 0) {
            state.questions = _shuffle(list).map(_map);
            var u = Store.get(APP_CONFIG.KEYS.USER);
            if (!(u && u.role === 'vip') && state.mode === 'quick' &&
                state.questions.length > APP_CONFIG.FREE.MAX_QUESTIONS) {
              state.questions = state.questions.slice(0, APP_CONFIG.FREE.MAX_QUESTIONS);
            }
            _saveCache(cacheKey);
            return true;
          }
          return false;
        })
        .catch(function() { return false; });
    },

    /* Getters */
    getQuestion:        function(i) { return state.questions[i] || null; },
    getCurrentQuestion: function()  { return state.questions[state.currentIndex] || null; },
    getTotalCount:      function()  { return state.questions.length; },
    getCurrentIndex:    function()  { return state.currentIndex; },
    isFirstQuestion:    function()  { return state.currentIndex === 0; },
    isLastQuestion:     function()  { return state.currentIndex === state.questions.length - 1; },
    isSubmitted:        function(i) {
      var q = state.questions[i !== undefined ? i : state.currentIndex];
      return q ? !!state.submitted[q.id] : false;
    },
    getSubmittedCount:  function() { return Object.keys(state.submitted).length; },

    /* Select / toggle answer */
    selectAnswer: function(key) {
      var q = this.getCurrentQuestion();
      if (!q || state.submitted[q.id]) return;
      if (q.type === 'single') {
        state.answers[q.id] = [key];
      } else {
        var cur = state.answers[q.id] || [];
        var idx = cur.indexOf(key);
        if (idx === -1) { cur.push(key); }
        else            { cur.splice(idx, 1); }
        state.answers[q.id] = cur;
      }
      /* re-render option highlight */
      var opts = document.querySelectorAll('.option[data-key]');
      var ans = state.answers[q.id] || [];
      opts.forEach(function(el) {
        el.classList.toggle('selected', ans.indexOf(el.dataset.key) !== -1);
      });
    },

    getAnswer: function(i) {
      var q = state.questions[i !== undefined ? i : state.currentIndex];
      return q ? (state.answers[q.id] || []) : [];
    },

    /* Submit current question */
    submitCurrent: function() {
      var q = this.getCurrentQuestion();
      if (!q) return null;
      if (state.submitted[q.id]) return state.results[q.id];

      var selected = state.answers[q.id] || [];
      if (selected.length === 0) return null; // nothing selected

      state.submitted[q.id] = true;

      var isCorrect = false;
      if (q.correctAnswer) {
        var correct = q.correctAnswer.split ? q.correctAnswer.split('') : [q.correctAnswer];
        correct = correct.filter(function(c){ return c.trim() !== ''; });
        var sel = selected.slice().sort();
        var cor = correct.slice().sort();
        isCorrect = sel.join('') === cor.join('');
      }

      state.results[q.id] = { isCorrect: isCorrect, correctAnswer: q.correctAnswer, selected: selected };

      /* Save to wrong-questions if wrong */
      if (!isCorrect && q.correctAnswer) {
        var wq = Store.get(APP_CONFIG.KEYS.WRONG_LIST, []);
        var exists = wq.findIndex(function(w){ return w.id === q.id; }) !== -1;
        if (!exists) {
          wq.unshift({
            id: q.id, type: q.type, category: q.category,
            title: q.title, options: q.options,
            correctAnswer: q.correctAnswer,
            yourAnswer: selected.join(''),
            analysis: q.analysis,
            timestamp: Date.now()
          });
          var wqUser = Store.get(APP_CONFIG.KEYS.USER);
          var wqIsVip = wqUser && wqUser.role === 'vip';
          var wqMax = wqIsVip ? 500 : APP_CONFIG.FREE.MAX_WRONG_VIEW;
          if (wq.length > wqMax) wq.length = wqMax;
          Store.set(APP_CONFIG.KEYS.WRONG_LIST, wq);
        }
      }

      return state.results[q.id];
    },

    /* Navigate */
    movePrev: function() {
      if (state.currentIndex > 0) { state.currentIndex--; return true; }
      return false;
    },
    moveNext: function() {
      if (state.currentIndex < state.questions.length - 1) { state.currentIndex++; return true; }
      return false;
    },

    /* Render options HTML for question at index */
    renderOptions: function(i) {
      var q = state.questions[i !== undefined ? i : state.currentIndex];
      if (!q) return '';
      var ans       = state.answers[q.id]   || [];
      var submitted = !!state.submitted[q.id];
      var correct   = q.correctAnswer ? q.correctAnswer.split('') : [];

      return q.options.map(function(opt) {
        var cls = 'option';
        var isCorrectOpt = correct.indexOf(opt.key) !== -1;
        var isSelected   = ans.indexOf(opt.key) !== -1;
        if (submitted) {
          cls += ' disabled';
          if (isCorrectOpt)               cls += ' correct';
          else if (isSelected)            cls += ' wrong';
        } else {
          if (isSelected)                 cls += ' selected';
        }
        var suffix = '';
        if (submitted) {
          if (isCorrectOpt)               suffix = '<span class="option-suffix">✓</span>';
          else if (isSelected)            suffix = '<span class="option-suffix">✗</span>';
        }
        return '<div class="' + cls + '" data-key="' + opt.key + '" ' +
          'onclick="QuizEngine.selectAnswer(\'' + opt.key + '\')">' +
          '<div class="option-key">' + opt.key + '</div>' +
          '<div class="option-text">' + opt.text + '</div>' +
          suffix +
          '</div>';
      }).join('');
    },

    /* Render analysis HTML after submit */
    renderAnalysis: function() {
      var q = this.getCurrentQuestion();
      if (!q || !state.submitted[q.id]) return '';
      var r = state.results[q.id];
      var isCorrect = r && r.isCorrect;
      var resultCls = isCorrect ? 'correct' : 'wrong';
      var resultIcon = isCorrect ? '✅' : '❌';
      var resultText = isCorrect ? '答對了！' : '答錯了';

      var answerRow = '';
      if (q.correctAnswer) {
        answerRow = '<div class="analysis-correct-ans">' +
          '✓ 正確答案：' + q.correctAnswer + '</div>';
      }

      var blocks = '';
      if (q.analysis.keypoint) {
        blocks += '<div class="analysis-block">' +
          '<div class="analysis-label">🎯 核心解析</div>' +
          '<div class="analysis-text">' + q.analysis.keypoint + '</div></div>';
      }
      if (q.analysis.memory) {
        blocks += '<div class="analysis-block">' +
          '<div class="analysis-label">💡 記憶口訣</div>' +
          '<div class="analysis-text">' + q.analysis.memory + '</div></div>';
      }
      if (q.analysis.trap) {
        blocks += '<div class="analysis-block">' +
          '<div class="analysis-label">⚠️ 陷阱提示</div>' +
          '<div class="analysis-text">' + q.analysis.trap + '</div></div>';
      }
      if (q.analysis.lawReference) {
        blocks += '<div class="analysis-block">' +
          '<div class="analysis-label">📋 法規依據</div>' +
          '<div class="analysis-text">' + q.analysis.lawReference + '</div></div>';
      }

      return '<div class="analysis-section">' +
        '<div class="analysis-result ' + resultCls + '">' + resultIcon + ' ' + resultText + '</div>' +
        answerRow +
        '<div class="analysis-h3">AI 教練解析</div>' +
        (blocks || '<div class="analysis-block"><div class="analysis-text">（本題暫無解析）</div></div>') +
        '</div>';
    },

    /* Pre-render next question options into cache */
    prerender: function(startIdx, count) {
      count = count || 2;
      for (var i = startIdx; i < Math.min(startIdx + count, state.questions.length); i++) {
        this.renderOptions(i); // just call, cache not needed here since state changes
      }
    },

    /* Compute & save final stats */
    finishSession: function() {
      var correctCount = 0;
      var categoryStats = {};
      var details = [];
      var total = state.questions.length;

      state.questions.forEach(function(q) {
        var ans = state.answers[q.id] || [];
        var r   = state.results[q.id];
        var isCorrect = r ? r.isCorrect : false;

        if (!categoryStats[q.category]) {
          categoryStats[q.category] = { correct: 0, total: 0 };
        }
        categoryStats[q.category].total++;
        if (isCorrect) { correctCount++; categoryStats[q.category].correct++; }

        details.push({
          questionId:    q.id,
          title:         q.title,
          type:          q.type,
          category:      q.category,
          options:       q.options,
          selectedAnswer: ans.join(''),
          correctAnswer: q.correctAnswer,
          isCorrect:     isCorrect,
          analysis:      q.analysis
        });
      });

      var stats = {
        correctCount: correctCount,
        wrongCount:   total - correctCount,
        total:        total,
        accuracy:     total > 0 ? Math.round((correctCount / total) * 100) : 0,
        categoryStats: categoryStats,
        details:       details,
        mode:          state.mode,
        timestamp:     Date.now(),
        duration:      state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0
      };

      Store.set(APP_CONFIG.KEYS.QUIZ_RESULT, stats);

      /* background sync */
      var user = Store.get(APP_CONFIG.KEYS.USER);
      if (user) {
        Api.post('submitSession', {
          token: user.token || '',
          answers: details.map(function(d){
            return { questionId: d.questionId, selectedAnswer: d.selectedAnswer, isCorrect: d.isCorrect };
          })
        }).catch(function(){});
      }

      return stats;
    },

    /* Study stats update */
    updateStudyStats: function(stats) {
      var s = Store.get(APP_CONFIG.KEYS.STUDY_STATS, { totalSessions:0, totalQuestions:0, totalCorrect:0, sessions:[] });
      s.totalSessions++;
      s.totalQuestions += stats.total;
      s.totalCorrect   += stats.correctCount;
      s.sessions.unshift({ timestamp: stats.timestamp, accuracy: stats.accuracy, total: stats.total, mode: stats.mode });
      if (s.sessions.length > 50) s.sessions.length = 50;
      Store.set(APP_CONFIG.KEYS.STUDY_STATS, s);
    }
  };

  return Engine;
})();
