# 📥 安裝指南

本指南將幫助您在不同的操作系統上安裝和運行簡單遊戲。

## 操作系統選擇

- [🪟 Windows](#windows)
- [🍎 macOS](#macos)
- [🐧 Linux](#linux)

---

## Windows

### 方法 1：使用 Python 和 pip（推薦）

#### 步驟 1：安裝 Python

1. 訪問 [python.org/downloads](https://www.python.org/downloads/)
2. 下載 **Python 3.8 或更新版本**
3. 運行安裝程序
4. ⚠️ **重要**：勾選「Add Python to PATH」
5. 點擊「Install Now」

#### 驗證安裝
打開 PowerShell，運行：
```powershell
python --version
```
應該看到類似 `Python 3.x.x` 的輸出

#### 步驟 2：克隆或下載遊戲

使用 PowerShell 或 CMD：
```powershell
git clone https://github.com/ccazhu-coder/simple-game.git
cd simple-game
```

或直接下載 ZIP：
1. 訪問 https://github.com/ccazhu-coder/simple-game
2. 點擊「Code」→「Download ZIP」
3. 解壓文件

#### 步驟 3：安裝依賴
```powershell
pip install -r requirements.txt
```

#### 步驟 4：運行遊戲
```powershell
python main.py
```

### 方法 2：使用可執行檔（最簡單）

如果不想安裝 Python，可以下載編譯好的 `.exe` 文件：

1. 訪問 [Releases](https://github.com/ccazhu-coder/simple-game/releases)
2. 下載 `.exe` 文件
3. 直接運行 

---

## macOS

### 前置檢查

檢查 Python 是否已安裝：
```bash
python3 --version
```

### 安裝步驟

#### 步驟 1：安裝 Homebrew（如果未安裝）
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 步驟 2：安裝 Python
```bash
brew install python3
```

#### 步驟 3：克隆遊戲
```bash
git clone https://github.com/ccazhu-coder/simple-game.git
cd simple-game
```

#### 步驟 4：安裝依賴
```bash
pip3 install -r requirements.txt
```

#### 步驟 5：運行遊戲
```bash
python3 main.py
```

---

## Linux

### Ubuntu/Debian

#### 步驟 1：安裝 Python 和依賴
```bash
sudo apt update
sudo apt install python3 python3-pip git
```

#### 步驟 2：克隆遊戲
```bash
git clone https://github.com/ccazhu-coder/simple-game.git
cd simple-game
```

#### 步驟 3：安裝依賴
```bash
pip3 install -r requirements.txt
```

#### 步驟 4：運行遊戲
```bash
python3 main.py
```

### Fedora

#### 步驟 1：安裝 Python 和依賴
```bash
sudo dnf install python3 python3-pip git
```

#### 步驟 2-4：與 Ubuntu 相同

---

## 🔧 故障排除

### 問題：「找不到 python 命令」

**解決方案：**
- Windows：重新安裝 Python 時勾選「Add Python to PATH」
- Mac/Linux：使用 `python3` 而不是 `python`

### 問題：「ModuleNotFoundError: No module named 'pygame'」

**解決方案：**
```bash
pip install --upgrade pygame
# 或
python -m pip install pygame
```

### 問題：「Permission denied（權限被拒絕）」

**解決方案（macOS/Linux）：**
```bash
sudo chown -R $USER:$USER .
chmod +x main.py
```

### 問題：遊戲窗口無法打開

**解決方案：**
1. 確保顯卡驅動程序已更新
2. 嘗試在終端中運行並查看錯誤消息
3. 在 [Issues](https://github.com/ccazhu-coder/simple-game/issues) 提交問題

---

## ✅ 驗證安裝

運行以下命令驗證所有依賴都已正確安裝：

```bash
# 檢查 Python 版本
python --version

# 檢查 Pygame 是否已安裝
python -c "import pygame; print(f'Pygame {pygame.__version__} is installed!')"

# 檢查遊戲文件
ls -la  # 或 dir（在 Windows 中）
```

---

## 🚀 首次運行

第一次運行遊戲時，Pygame 可能需要初始化，這可能需要幾秒鐘。

如果看到遊戲窗口，恭喜！安裝成功 🎉

---

## 📞 需要幫助？

- 查看 [README](README.md) 中的「常見問題」
- 訪問 [GitHub Issues](https://github.com/ccazhu-coder/simple-game/issues)
- 查看 [Pygame 官方文檔](https://www.pygame.org/docs/)

---

**最後更新：2026年4月14日**
