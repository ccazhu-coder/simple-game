# 🎮 簡單遊戲 - Simple Game

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![Pygame](https://img.shields.io/badge/pygame-2.5.2-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)

一個用 Python 和 Pygame 製作的簡單遊戲示例。這是一個教育性質的項目，展示了如何使用 Pygame 創建互動遊戲。

[🌐 在線演示文檔](https://ccazhu-coder.github.io/simple-game/) | [📥 下載代碼](https://github.com/ccazhu-coder/simple-game/archive/refs/heads/master.zip)

## ✨ 遊戲特色

- 🎮 **簡單易玩** - 只需使用方向鍵控制
- 🎯 **上癮玩法** - 躲避敵人，分數逐漸增加
- 🚀 **快速開始** - 5 分鐘內安裝並開玩
- 📚 **初學者友好** - 代碼結構清晰，適合學習

## 🎮 遊戲说明

### 玩法
- **玩家**：綠色方塊（由您控制）
- **敵人**：紅色方塊（從天而降）
- **目標**：躲避敵人，避免碰撞

### 控制方式
| 鍵盤 | 操作 |
|------|------|
| ⬅️ 左箭頭 | 向左移動 |
| ➡️ 右箭頭 | 向右移動 |

### 計分系統
- 每成功躲避一個敵人 = **+10 分**
- 目標：獲得最高分數！

## 🚀 快速開始

### 前置需求
- ✅ Python 3.8 或更新版本
- ✅ pip（Python 包管理器）
- ✅ 約 100MB 空間

### 安裝步驟

#### 1️⃣ 克隆或下載項目
```bash
# 使用 Git 克隆
git clone https://github.com/ccazhu-coder/simple-game.git
cd simple-game

# 或直接下載 ZIP 文件
# https://github.com/ccazhu-coder/simple-game/archive/refs/heads/master.zip
```

#### 2️⃣ 安裝依賴
```bash
pip install -r requirements.txt
```

#### 3️⃣ 運行遊戲
```bash
python main.py
```

就這樣！遊戲窗口應該立即打開 🎉

## 📦 項目結構

```
simple-game/
├── main.py                  # 主遊戲文件（核心遊戲邏輯）
├── requirements.txt         # Python 依賴列表
├── README.md               # 本文件
├── .gitignore              # Git 忽略配置
├── docs/
│   └── index.html          # GitHub Pages 展示頁面
└── LICENSE                 # MIT 許可證
```

## 💻 系統要求

| 系統 | 支援情況 |
|------|--------|
| Windows | ✅ 完全支援 |
| macOS | ✅ 完全支援 |
| Linux | ✅ 完全支援 |

## 🛠️ 技術棧

- **語言**：Python 3.8+
- **遊戲引擎**：Pygame 2.5.2
- **開發環境**：任何文本編輯器或 IDE

## 📚 學習資源

- [Pygame 官方文檔](https://www.pygame.org/docs/)
- [Python 初學者指南](https://www.python.org/about/gettingstarted/)
- [遊戲開發基礎](https://en.wikipedia.org/wiki/Game_development)

## 🐛 常見問題

### Q: 遊戲無法啟動？
**A:** 確保已安裝 Python 和 Pygame。運行 `python main.py` 前先確認：
```bash
python --version
python -c "import pygame; print(pygame.__version__)"
```

### Q: 如何修改敵人速度？
**A:** 在 `main.py` 中找到 `self.speed = random.randint(2, 6)` 並修改數字。

### Q: 可以修改遊戲分辨率嗎？
**A:** 可以！在 `main.py` 開頭找到 `SCREEN_WIDTH` 和 `SCREEN_HEIGHT` 並修改。

## 🤝 貢獻指南

歡迎提交 Issues 和 Pull Requests！

### 貢獻方式：
1. Fork 本項目
2. 建立新分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 許可證

本項目採用 **MIT License** - 查看 [LICENSE](LICENSE) 文件了解詳情

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:
```

## 👨‍💻 開發者

- **小白開發團隊** - 初學者遊戲開發

## 🙏 致謝

- 感謝 [Pygame 社區](https://www.pygame.org/) 提供優秀的遊戲開發框架
- 感謝所有貢獻者和用戶的支持

## 📞 聯絡方式

- 📧 Email: game@example.com
- 🐙 GitHub: [@ccazhu-coder](https://github.com/ccazhu-coder)
- 💬 問題反饋：[Issues](https://github.com/ccazhu-coder/simple-game/issues)

---

**⭐ 如果喜歡這個項目，請給我們一顆星！**

最後更新：2026年4月14日
