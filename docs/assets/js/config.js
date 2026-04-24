/* ============================================================
   就業服務乙級 AI 闖關學習系統 — Global Configuration
   ============================================================ */
window.APP_CONFIG = {

  // ── API ───────────────────────────────────────────────────
  API_URL: 'https://script.google.com/macros/s/AKfycbwNDPLzxpOPIZyO864iYZ1u61C1hV07GvqgUIBbjeWXbluMbOASJcnrnrN6sG_LmIH7/exec',

  // ── Contact ───────────────────────────────────────────────
  VIP_LINE_URL:   'https://lin.ee/qZt97JY',
  SUPPORT_EMAIL:  'pucezhang@gmail.com',

  // ── localStorage keys ─────────────────────────────────────
  KEYS: {
    TOKEN:          'es_game_token',
    USER:           'es_game_user',
    QUIZ_SESSION:   'es_quiz_session',
    QUIZ_RESULT:    'es_quiz_result',
    WRONG_LIST:     'es_wrong_questions',
    STUDY_STATS:    'es_study_stats',
    MOCK_RESULT:    'es_mock_result',
  },

  // ── Free-tier limits ──────────────────────────────────────
  FREE: {
    MAX_QUESTIONS:    10,    // questions per quick session
    MAX_WRONG_VIEW:   20,    // wrong questions viewable
    MOCK_EXAM:        false,
    MULTI_SELECT:     false, // free users see 5 questions as preview
    MULTI_FREE_COUNT: 5,
    FULL_WRONG_BOOK:  false,
  },

  // ── Mock Exam ─────────────────────────────────────────────
  // 官方考制：單選60題×1分 + 複選20題×2分 = 100分，滿60分及格
  // 共同科目（職業安全衛生/工作倫理/環境保護/節能減碳）各佔單選4題＝共16題
  MOCK: {
    SINGLE_COUNT:    60,
    MULTI_COUNT:     20,
    TOTAL:           80,
    SINGLE_POINTS:   1,    // 單選每題配分
    MULTI_POINTS:    2,    // 複選每題配分（全對才得分，答錯不扣分）
    MAX_POINTS:      100,  // 60×1 + 20×2
    PASS_POINTS:     60,   // 及格分數（絕對分，非百分比）
    COMMON_CATS:     ['職業安全衛生', '工作倫理與職業道德', '環境保護', '節能減碳'],
    COMMON_PER_CAT:  4,    // 每個共同科目抽 4 題，共 16 題
    TIME_MIN:        120,  // 考試時間（分鐘）
    PASS_PCT:        60,   // 保留：向下相容顯示用
  },

  // ── Scoring (quick/multi sessions) ───────────────────────
  PASS_SCORE: 60,  // % pass threshold for quick/multi sessions

  // ── Site pages ────────────────────────────────────────────
  PAGES: {
    HOME:           'index.html',
    LOGIN:          'login.html',
    REGISTER:       'register.html',
    FORGOT:         'forgot-password.html',
    MEMBER:         'member-center.html',
    QUIZ:           'quiz.html',
    RESULT:         'result.html',
    WRONG:          'wrong-questions.html',
    MULTI:          'multi-select.html',
    MOCK:           'mock-exam.html',
    PRICING:        'pricing.html',
    TEST_API:       'test-api.html',
  }
};
