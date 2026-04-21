# 就業服務乙級 AI 闖關學習系統

純靜態前端 × Google Apps Script 後端 × GitHub Pages 部署

---

## 頁面總覽

| 頁面 | 路徑 | 說明 |
|------|------|------|
| 首頁 | `index.html` | 產品介紹・功能對比・CTA |
| 快速練習 | `quiz.html` | 單/複選練習，含 AI 解析、錯題自動記錄 |
| 複選題強化 | `multi-select.html` | 只練複選題，免費前 5 題後需 VIP |
| 模擬考 | `mock-exam.html` | 80 題・120 分鐘・倒數計時（VIP） |
| 成績分析 | `result.html` | 正確率、類別統計、逐題詳解 |
| 錯題本 | `wrong-questions.html` | 篩選、複習、重做錯題 |
| 會員中心 | `member-center.html` | 學習統計、練習紀錄、方案狀態 |
| VIP 方案 | `pricing.html` | 定價頁、功能對比、開通流程 |
| 登入 | `login.html` | Email + 密碼登入 |
| 註冊 | `register.html` | 免費帳號建立 |
| 忘記密碼 | `forgot-password.html` | 重設連結寄送 |
| API 測試 | `test-api.html` | 工程調試：GET/POST/LocalStorage 檢查 |

---

## 技術架構

- **前端**：HTML5 + CSS3 + Vanilla JS（無任何框架）
- **後端**：Google Apps Script（GAS）
- **部署**：GitHub Pages（`docs/` 資料夾）
- **狀態管理**：localStorage（題目 Session、用戶、錯題本、學習統計）

---

## JavaScript 模組

| 檔案 | 說明 |
|------|------|
| `config.js` | API URL、localStorage key、免費/VIP 限制常數 |
| `app.js` | Api / Store / Toast / Modal / Loading / Nav / Footer / App |
| `auth.js` | 登入、註冊、登出、忘記密碼、redirectIf 系列 |
| `quiz-engine.js` | 題目狀態機：init / select / submit / renderOptions / renderAnalysis / finishSession |
| `result.js` | 讀取 QUIZ_RESULT，渲染分數卡、類別統計、逐題詳解 |
| `wrong-questions.js` | 錯題本讀取、篩選、移除、retryWrong |
| `mock-exam.js` | 模擬考引擎：載題、計時、作答地圖、交卷計算 |
| `member-center.js` | 會員資訊、學習統計、練習紀錄表格、VIP 狀態 |
| `pricing.js` | 動態 CTA（依登入狀態）、FAQ accordion |

---

## 後端 API

**Endpoint**
```
https://script.google.com/macros/s/AKfycbxPmwrWrAf7qkEHfxg4BBOtzJPkFBQFtd8ZB7lVSSWuECrduMPwZJ4RXCtzu-vTZilN9Q/exec
```

**GET actions**

| action | 說明 | 參數 |
|--------|------|------|
| `getQuestions` | 取得快速練習題目 | `token?` |
| `getMultiSelect` | 取得複選題題目 | `token?` |
| `getMockQuestions` | 取得模擬考題目（VIP） | `token` |
| `getWrongQuestions` | 取得雲端錯題（VIP） | `token` |
| `getUser` | 取得用戶資料 | `token` |
| `ping` | 連線測試 | — |

**POST actions**

| action | 說明 | Payload |
|--------|------|---------|
| `register` | 註冊 | `name, email, password` |
| `login` | 登入 | `email, password` |
| `forgotPassword` | 忘記密碼 | `email` |
| `submitSession` | 提交答題紀錄 | `token, answers[]` |

**題目格式（API 回傳）**

```json
{
  "id": "Q001",
  "type": "單選",
  "category": "就業服務法",
  "question": "題目內容",
  "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...",
  "answer": "A",
  "keypoint": "核心解析",
  "memory": "記憶口訣",
  "trap": "陷阱提示",
  "lawReference": "法規依據"
}
```

> 所有 API 失敗時系統自動切換為 Demo 模式，使用本地資料繼續運行。

---

## 會員層級

| 層級 | 條件 | 限制 |
|------|------|------|
| Visitor | 未登入 | 快速練習（10 題/次）、AI 解析、成績頁 |
| Free | 已註冊 | + 錯題本（最多 20 題）、複選題預覽（5 題） |
| VIP | 付費開通 | 完整題庫、複選強化、模擬考、無限錯題本 |

VIP 開通：LINE 客服 `https://lin.ee/qZt97JY` 或 Email `pucezhang@gmail.com`

---

## LocalStorage Keys

| Key（`es_` prefix） | 用途 |
|---------------------|------|
| `es_game_user` | 用戶物件（name, email, role, token） |
| `es_game_token` | API token |
| `es_quiz_session` | 題目 Session 快取（1 小時 TTL） |
| `es_quiz_result` | 最近一次練習結果 |
| `es_wrong_questions` | 錯題本（最多 500 筆） |
| `es_study_stats` | 累計學習統計（最近 50 場） |
| `es_mock_result` | 最近一次模擬考結果 |

---

## 本地開發

```bash
# 任意 HTTP server 皆可，例如：
npx serve docs
# 或
python -m http.server 8080 --directory docs
```

開啟 `http://localhost:8080`，工程測試用 `test-api.html` 可直接驗證所有 API 端點。

---

© 2026 就業服務乙級 AI 闖關學習系統
