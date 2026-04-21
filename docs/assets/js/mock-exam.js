/* ============================================================
   mock-exam.js — 官方制模擬考引擎
   ─ 單選60題（×1分）+ 複選20題（×2分）= 滿分100分，60分及格
   ─ 共同科目（職安/工倫/環保/節碳）各抽4題，共16題置於單選中
   ─ 複選全對得分，答錯不扣分
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  /* ── Gate: login required ───────────────────────────────── */
  var user = Store.get(APP_CONFIG.KEYS.USER);
  if (!user) { Store.set('_after_login', location.href); location.href = 'login.html'; return; }

  /* ── Constants ──────────────────────────────────────────── */
  var MOCK = APP_CONFIG.MOCK;

  /* ── State ──────────────────────────────────────────────── */
  var examState = {
    questions:     [],
    currentIndex:  0,
    answers:       {},   // { id: [key,...] }
    timeLeft:      MOCK.TIME_MIN * 60,
    timerInterval: null,
    started:       false,
    finished:      false
  };

  /* ── DOM refs ───────────────────────────────────────────── */
  var elStart       = document.getElementById('exam-start-screen');
  var elExam        = document.getElementById('exam-screen');
  var elFinish      = document.getElementById('exam-finish-screen');
  var elTimer       = document.getElementById('exam-timer');
  var elProgress    = document.getElementById('exam-progress');
  var elProgressBar = document.getElementById('exam-progress-bar');
  var elQuestionNo  = document.getElementById('exam-question-no');
  var elTypeBadge   = document.getElementById('exam-type-badge');
  var elCatBadge    = document.getElementById('exam-cat-badge');
  var elTitle       = document.getElementById('exam-title');
  var elOptions     = document.getElementById('exam-options');
  var elMultiHint   = document.getElementById('exam-multi-hint');
  var elPrevBtn     = document.getElementById('exam-prev');
  var elNextBtn     = document.getElementById('exam-next');
  var elAnswerMap   = document.getElementById('exam-answer-map');

  /* ── Helpers ────────────────────────────────────────────── */
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function _mapQ(q) {
    var isSingle = (q.type === '單選' || q.type === 'single');
    return {
      id:            q.id || ('M' + Math.random().toString(36).substring(2, 8)),
      type:          isSingle ? 'single' : 'multiple',
      category:      q.category || '一般',
      title:         q.question || q.title || '',
      options: [
        { key: 'A', text: q.optionA || '' },
        { key: 'B', text: q.optionB || '' },
        { key: 'C', text: q.optionC || '' },
        { key: 'D', text: q.optionD || '' }
      ].filter(function(o) { return o.text.trim() !== ''; }),
      correctAnswer: q.answer || q.correctAnswer || null,
      points:        isSingle ? MOCK.SINGLE_POINTS : MOCK.MULTI_POINTS,
      analysis: {
        keypoint:     q.keypoint     || '',
        memory:       q.memory       || '',
        trap:         q.trap         || '',
        lawReference: q.lawReference || ''
      }
    };
  }

  /* ── Build questions from local QUESTIONS_DB ─────────────── */
  /* 官方抽題規則：
     單選 60 題 = 共同科目 4 科 × 4 題（16 題）+ 就業服務乙級 44 題
     複選 20 題 = 全從複選題庫隨機抽取
     單選題全體隨機排列後置於前 60 題，複選置於後 20 題            */
  function _buildFromDB() {
    var db = window.QUESTIONS_DB;
    if (!db || !db.length) return null;

    var commonCats = MOCK.COMMON_CATS;
    var perCat     = MOCK.COMMON_PER_CAT;  // 4

    /* 1. 共同科目單選（每科 4 題） */
    var commonSingles = [];
    commonCats.forEach(function(cat) {
      var pool = db.filter(function(q) {
        return q.type === '單選' && q.category === cat;
      });
      commonSingles = commonSingles.concat(_shuffle(pool).slice(0, perCat));
    });

    /* 2. 就業服務乙級專業單選（非共同科目） */
    var profNeeded = MOCK.SINGLE_COUNT - commonSingles.length;  // 44
    var profPool   = db.filter(function(q) {
      return q.type === '單選' && commonCats.indexOf(q.category) === -1;
    });
    var profSingles = _shuffle(profPool).slice(0, profNeeded);

    /* 3. 合併單選並隨機排列 */
    var allSingles = _shuffle(commonSingles.concat(profSingles));

    /* 4. 複選 20 題 */
    var multiPool = db.filter(function(q) { return q.type === '複選'; });
    var multis    = _shuffle(multiPool).slice(0, MOCK.MULTI_COUNT);

    /* 5. 回傳：單選 → 複選（前60後20） */
    return allSingles.concat(multis).map(_mapQ);
  }

  /* ── Timer ──────────────────────────────────────────────── */
  function _startTimer() {
    examState.timerInterval = setInterval(function() {
      examState.timeLeft--;
      _renderTimer();
      if (examState.timeLeft <= 0) _forceSubmit();
    }, 1000);
  }

  function _renderTimer() {
    var t = examState.timeLeft;
    var m = Math.floor(t / 60), s = t % 60;
    var txt = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (elTimer) {
      elTimer.textContent = '⏱ ' + txt;
      elTimer.className = 'exam-timer' +
        (t <= 300 && t > 60 ? ' warn'   : '') +
        (t <= 60            ? ' danger' : '');
    }
  }

  /* ── Render current question ────────────────────────────── */
  function _renderQuestion() {
    var q   = examState.questions[examState.currentIndex];
    var idx = examState.currentIndex;
    var tot = examState.questions.length;
    var ans = examState.answers[q.id] || [];

    if (elProgress)    elProgress.textContent    = (idx + 1) + ' / ' + tot;
    if (elProgressBar) elProgressBar.style.width = ((idx + 1) / tot * 100) + '%';
    if (elQuestionNo)  elQuestionNo.textContent  = 'Q' + (idx + 1);

    if (elTypeBadge) {
      var isMulti = q.type === 'multiple';
      elTypeBadge.textContent = isMulti
        ? ('複選題（' + q.points + '分，需全對）')
        : ('單選題（' + q.points + '分）');
      elTypeBadge.className = 'badge ' + (isMulti ? 'badge-orange' : 'badge-blue');
    }
    if (elCatBadge) elCatBadge.textContent = q.category;
    if (elTitle)    elTitle.textContent    = q.title;

    /* 複選提示 */
    if (elMultiHint) elMultiHint.style.display = q.type === 'multiple' ? 'block' : 'none';

    if (elOptions) {
      elOptions.innerHTML = q.options.map(function(opt) {
        var sel = ans.indexOf(opt.key) !== -1;
        return '<div class="option' + (sel ? ' selected' : '') + '" data-key="' + opt.key +
          '" onclick="MockExam.select(\'' + opt.key + '\')">' +
          '<div class="option-key">' + opt.key + '</div>' +
          '<div class="option-text">' + opt.text + '</div>' +
          '</div>';
      }).join('');
    }

    if (elPrevBtn) elPrevBtn.disabled   = idx === 0;
    if (elNextBtn) elNextBtn.textContent = idx === tot - 1 ? '交卷' : '下一題 ›';
    _renderAnswerMap();
  }

  /* ── Answer map（單選藍色框、複選橘色框） ──────────────── */
  function _renderAnswerMap() {
    if (!elAnswerMap) return;
    elAnswerMap.innerHTML = examState.questions.map(function(q, i) {
      var answered = (examState.answers[q.id] || []).length > 0;
      var isCur    = i === examState.currentIndex;
      var isMulti  = q.type === 'multiple';
      var bg, color, border;
      if (isCur) {
        bg = 'var(--primary)'; color = '#fff'; border = 'none';
      } else if (answered) {
        bg = isMulti ? 'var(--warning-light, #FEF3C7)' : 'var(--primary-light)';
        color = isMulti ? 'var(--warning-dark, #92400E)' : 'var(--primary)';
        border = isMulti ? '2px solid var(--warning, #F59E0B)' : '2px solid var(--primary)';
      } else {
        bg = 'var(--bg-2)'; color = 'var(--muted)'; border = 'none';
      }
      return '<button onclick="MockExam.goto(' + i + ')" title="' +
        (isMulti ? '複選' : '單選') + ' Q' + (i + 1) + '" style="' +
        'background:' + bg + ';color:' + color + ';border:' + border + ';' +
        'width:36px;height:36px;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer">' +
        (i + 1) + '</button>';
    }).join('');
  }

  /* ── Submit & scoring ───────────────────────────────────── */
  function _forceSubmit() {
    clearInterval(examState.timerInterval);
    examState.finished = true;
    _computeResult();
  }

  function _computeResult() {
    var totalScore   = 0;
    var singleCorrect = 0, multiCorrect = 0;
    var details = [], catStats = {};

    examState.questions.forEach(function(q) {
      var ans = examState.answers[q.id] || [];
      var isCorrect = false;

      if (q.correctAnswer && ans.length > 0) {
        var cor = q.correctAnswer.split('').filter(function(c) { return c.trim() !== ''; }).sort();
        var sel = ans.slice().sort();
        isCorrect = sel.join('') === cor.join('');
      }

      var pts    = q.points || (q.type === 'multiple' ? MOCK.MULTI_POINTS : MOCK.SINGLE_POINTS);
      var earned = isCorrect ? pts : 0;
      totalScore += earned;

      if (isCorrect) {
        if (q.type === 'multiple') multiCorrect++;
        else                       singleCorrect++;
      }

      if (!catStats[q.category]) {
        catStats[q.category] = { correct: 0, total: 0, score: 0, maxScore: 0 };
      }
      catStats[q.category].total++;
      catStats[q.category].maxScore += pts;
      if (isCorrect) {
        catStats[q.category].correct++;
        catStats[q.category].score  += earned;
      }

      details.push({
        questionId:     q.id,
        title:          q.title,
        type:           q.type,
        category:       q.category,
        options:        q.options,
        selectedAnswer: ans.join(''),
        correctAnswer:  q.correctAnswer,
        isCorrect:      isCorrect,
        points:         pts,
        earnedPoints:   earned,
        analysis:       q.analysis
      });

      /* 錯題本 */
      if (!isCorrect && q.correctAnswer) {
        var wq = Store.get(APP_CONFIG.KEYS.WRONG_LIST, []);
        if (!wq.find(function(w) { return w.id === q.id; })) {
          wq.unshift({
            id: q.id, type: q.type, category: q.category, title: q.title,
            options: q.options, correctAnswer: q.correctAnswer,
            yourAnswer: ans.join(''), analysis: q.analysis, timestamp: Date.now()
          });
          if (wq.length > 500) wq.length = 500;
          Store.set(APP_CONFIG.KEYS.WRONG_LIST, wq);
        }
      }
    });

    var total  = examState.questions.length;
    var passed = totalScore >= MOCK.PASS_POINTS;

    var stats = {
      totalScore:    totalScore,
      maxScore:      MOCK.MAX_POINTS,
      correctCount:  singleCorrect + multiCorrect,
      singleCorrect: singleCorrect,
      multiCorrect:  multiCorrect,
      wrongCount:    total - singleCorrect - multiCorrect,
      total:         total,
      passed:        passed,
      accuracy:      Math.round(totalScore / MOCK.MAX_POINTS * 100),
      categoryStats: catStats,
      details:       details,
      mode:          'mock',
      timestamp:     Date.now(),
      duration:      examState.started ? Math.round((Date.now() - examState._startTime) / 1000) : 0
    };

    Store.set(APP_CONFIG.KEYS.MOCK_RESULT,  stats);
    Store.set(APP_CONFIG.KEYS.QUIZ_RESULT,  stats);

    /* 累計學習統計 */
    var ss = Store.get(APP_CONFIG.KEYS.STUDY_STATS,
      { totalSessions: 0, totalQuestions: 0, totalCorrect: 0, sessions: [] });
    ss.totalSessions++;
    ss.totalQuestions += stats.total;
    ss.totalCorrect   += stats.correctCount;
    ss.sessions.unshift({
      timestamp: stats.timestamp, accuracy: stats.accuracy,
      total: stats.total, mode: stats.mode, totalScore: stats.totalScore
    });
    if (ss.sessions.length > 50) ss.sessions.length = 50;
    Store.set(APP_CONFIG.KEYS.STUDY_STATS, ss);

    if (elStart)  elStart.style.display  = 'none';
    if (elExam)   elExam.style.display   = 'none';
    if (elFinish) { elFinish.style.display = 'block'; _renderFinish(stats); }
  }

  /* ── Result page ─────────────────────────────────────────── */
  function _renderFinish(stats) {
    var passed = stats.passed;
    var el = document.getElementById('exam-finish-content');
    if (!el) return;

    /* 各類別成績列表 */
    var catRows = Object.keys(stats.categoryStats).map(function(c) {
      var cs = stats.categoryStats[c];
      var cp = Math.round(cs.correct / cs.total * 100);
      var isCommon = MOCK.COMMON_CATS.indexOf(c) !== -1;
      return '<div class="stat-row">' +
        '<span>' + (isCommon ? '🔷 ' : '') + c + '</span>' +
        '<span class="stat-val">' + cs.correct + '/' + cs.total +
        '（' + cp + '%）<small style="color:var(--muted)"> +' + cs.score + '/' + cs.maxScore + '分</small></span>' +
        '</div>';
    }).join('');

    el.innerHTML =
      '<div class="result-score-card">' +
        '<div class="result-score ' + (passed ? 'pass' : 'fail') + '">' +
          stats.totalScore +
          '<span style="font-size:0.45em;font-weight:500;opacity:0.7"> / ' + stats.maxScore + '</span>' +
        '</div>' +
        '<div class="result-label ' + (passed ? 'pass' : 'fail') + '">' +
          (passed ? '🎉 恭喜通過！成績 ' + stats.totalScore + ' 分（及格 ' + MOCK.PASS_POINTS + ' 分）'
                  : '再接再厲！成績 ' + stats.totalScore + ' 分，差 ' + (MOCK.PASS_POINTS - stats.totalScore) + ' 分及格') +
        '</div>' +
        '<div class="result-stats">' +
          '<div class="result-stat">' +
            '<div class="result-stat-val" style="color:#86EFAC">' + stats.singleCorrect + '<small>/' + MOCK.SINGLE_COUNT + '</small></div>' +
            '<div class="result-stat-lbl">單選答對</div>' +
          '</div>' +
          '<div class="result-stat">' +
            '<div class="result-stat-val" style="color:#60A5FA">' + stats.multiCorrect + '<small>/' + MOCK.MULTI_COUNT + '</small></div>' +
            '<div class="result-stat-lbl">複選全對</div>' +
          '</div>' +
          '<div class="result-stat">' +
            '<div class="result-stat-val">' + stats.totalScore + '</div>' +
            '<div class="result-stat-lbl">總得分</div>' +
          '</div>' +
        '</div>' +
        '<div style="color:var(--muted);font-size:12px;margin-top:10px;line-height:1.8">' +
          '單選 × ' + MOCK.SINGLE_POINTS + ' 分｜複選全對 × ' + MOCK.MULTI_POINTS + ' 分，答錯不扣分｜' +
          '及格分數：' + MOCK.PASS_POINTS + ' / ' + MOCK.MAX_POINTS + ' 分' +
        '</div>' +
      '</div>' +
      '<div class="card mt-24">' +
        '<div class="side-title">各類別成績 <small style="color:var(--muted)">（🔷 共同科目）</small></div>' +
        catRows +
      '</div>' +
      '<div class="flex gap-12 flex-wrap mt-24">' +
        '<a href="result.html" class="btn btn-primary">查看詳細解析</a>' +
        '<a href="wrong-questions.html" class="btn btn-danger">進入錯題本</a>' +
        '<a href="mock-exam.html" class="btn btn-secondary">重新模擬考</a>' +
      '</div>';
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.MockExam = {

    start: function() {
      if (!App.requireVip(true)) return;

      /* 立刻從本地題庫依官方規則抽題 — 0 延遲，不等 API */
      var built = _buildFromDB();
      if (!built || !built.length) {
        Toast.warning('題庫載入失敗，請重新整理頁面');
        return;
      }

      examState.questions    = built;
      examState.started      = true;
      examState._startTime   = Date.now();
      examState.answers      = {};
      examState.currentIndex = 0;
      examState.timeLeft     = MOCK.TIME_MIN * 60;
      examState.finished     = false;

      if (elStart) elStart.style.display = 'none';
      if (elExam)  elExam.style.display  = 'block';
      _renderQuestion();
      _startTimer();

      /* 背景靜默通知後端（記錄用，不阻塞作答） */
      Api.get('getMockQuestions', { token: user.token || '' }).catch(function() {});
    },

    select: function(key) {
      if (examState.finished) return;
      var q = examState.questions[examState.currentIndex];
      if (!q) return;
      if (q.type === 'single') {
        examState.answers[q.id] = [key];
      } else {
        var cur = examState.answers[q.id] || [];
        var i   = cur.indexOf(key);
        if (i === -1) cur.push(key); else cur.splice(i, 1);
        examState.answers[q.id] = cur;
      }
      _renderQuestion();
    },

    prev: function() {
      if (examState.currentIndex > 0) {
        examState.currentIndex--;
        _renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    next: function() {
      var last = examState.currentIndex === examState.questions.length - 1;
      if (last) {
        var unanswered = examState.questions.filter(function(q) {
          return !(examState.answers[q.id] || []).length;
        }).length;
        var bodyMsg = unanswered > 0
          ? '尚有 <strong>' + unanswered + ' 題</strong> 未作答，確定交卷嗎？'
          : '確定要交卷嗎？交卷後無法修改答案。';
        Modal.confirm({
          title:      '確認交卷',
          body:       bodyMsg,
          okText:     '確認交卷',
          okClass:    'btn-primary',
          cancelText: '繼續作答'
        }).then(function(ok) { if (ok) _forceSubmit(); });
      } else {
        examState.currentIndex++;
        _renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    goto: function(i) {
      examState.currentIndex = i;
      _renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    forceSubmit: function() { _forceSubmit(); }
  };

  /* ── Initial render ─────────────────────────────────────── */
  if (elStart) elStart.style.display = 'block';
  if (elExam)  elExam.style.display  = 'none';
});
