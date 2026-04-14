# 就業服務乙級 AI 闖關學習系統 - 前端版

## 🚀 功能特性

- **題目自動派發**：後端 API 自動派題，0 延遲開始答題
- **AI 教練解析**：即時提供考點、記憶口訣、陷阱提示
- **複選題強化**：針對失分題型的專項訓練
- **錯題追蹤**：自動記錄和複習錯題
- **學習分析**：進度追蹤和效率分析

## 📁 技術棧

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **後端**：Google Apps Script
- **部署**：GitHub Pages

## 🔗 API 端點

後端 API: `https://script.google.com/macros/s/AKfycbxPmwrWrAf7qkEHfxg4BBOtzJPkFBQFtd8ZB7lVSSWuECrduMPwZJ4RXCtzu-vTZilN9Q/exec`

### 支持操作

- `getNextQuestion` - 自動派題
- `submitAnswer` - 提交答案並獲取 AI 詳解
- `getWrongQuestions` - 獲取錯題本
- `getUserProfile` - 獲取用戶進度

## 🎯 頁面結構

- `index.html` - 首頁
- `quiz.html` - 快速練習（後端派題）
- `test-api.html` - API 測試控制台

## 📝 使用流程

1. 訪問 https://ccazhu-coder.github.io/simple-game/
2. 點擊「立即開始體驗」進入 quiz.html
3. 系統自動從後端加載題目
4. 作答後查看 AI 詳解
5. 支持即時反饋和學習記錄

---

© 2024 就業服務乙級 AI 闖關學習系統
