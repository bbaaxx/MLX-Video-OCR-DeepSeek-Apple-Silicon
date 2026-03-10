# SPDX-License-Identifier: AGPL-3.0-or-later
<!-- This document is part of MLX DeepSeek-OCR and is licensed under AGPL-3.0. See LICENSE in project root. -->

# 🚀 MLX DeepSeek-OCR 启动指南

## 快速启动步骤

### 方法 1: 直接启动（如果已安装依赖）

```bash
# 1. 进入项目目录
cd <your-project-directory>

# 2. 启动应用
python3 app.py
```

### 方法 2: 使用虚拟环境（推荐）

```bash
# 1. 进入项目目录
cd <your-project-directory>

# 2. 安装 uv（如果还没有）
curl -LsSf https://astral.sh/uv/install.sh | sh
# 或使用 Homebrew: brew install uv

# 3. 创建虚拟环境（如果还没有）
uv venv

# 4. 激活虚拟环境
source .venv/bin/activate

# 5. 安装依赖
uv pip install -r requirements.txt

# 6. 启动应用
python3 app.py
```

## 📋 详细步骤

### 步骤 1: 检查 Python 版本

```bash
python3 --version
# 需要 Python 3.11 或更高版本
```

### 步骤 2: 检查依赖是否安装

```bash
cd <your-project-directory>
python3 -c "import flask; import mlx_vlm; from PIL import Image; import cv2" && echo "依赖已安装" || echo "缺少依赖"
```

如果没有安装，执行：
```bash
# 确保已激活虚拟环境
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt
```

### 步骤 3: 启动应用

```bash
python3 app.py
```

您应该看到：
```
Starting MLX DeepSeek-OCR Web Application...
Note: Model will be loaded on first OCR request
💡 使用 POST /api/unload-model 可以手动释放模型内存
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
```

### 步骤 4: 打开浏览器

访问：**http://localhost:5000**

## 🔧 常见问题

### Q1: 端口 5000 被占用

**解决方案：**
```bash
# 检查端口占用
lsof -i :5000

# 或者修改端口（编辑 app.py 最后一行）
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Q2: 缺少依赖包

**解决方案：**
```bash
# 确保已激活虚拟环境
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt
```

### Q3: Python 版本不对

**解决方案：**
```bash
# 检查版本
python3 --version

# 如果版本太低，需要升级 Python
# macOS 可以使用 Homebrew
brew install python@3.11
```

### Q4: 权限问题

**解决方案：**
```bash
# 确保有执行权限
chmod +x app.py

# 或者使用 python3 直接运行
python3 app.py
```

### Q5: 出现 "ValueError: [metal_kernel] Only supports the GPU" 错误

**解决方案：**
这是因为 MLX 的某些操作需要 GPU 支持。我们已经更新了代码以自動檢測並使用 GPU。
如果仍然遇到問題，請確保您的終端機環境允許訪問 GPU。

### Q6: 上傳大文件失敗 (HTTP 413)

**解决方案：**
我們已經將上傳限制增加到 **512MB**，以支援影片和高解析度圖片。
如果遇到此問題，請確保您已重啟應用程式以應用新的設定。

## 🛑 停止应用

在运行应用的终端按：**`Ctrl + C`**

应用会自动清理资源并退出。

## 📊 启动后检查

### 1. 检查服务是否运行

```bash
curl http://localhost:5000/api/status
```

应该返回：
```json
{
  "model_loaded": false,
  "ready": false
}
```

### 2. 检查前端页面

浏览器访问：http://localhost:5000

应该看到上传界面。

## 💡 提示

1. **首次使用**：第一次上传图片时会自动下载模型（~800MB），需要等待 5-15 分钟
2. **模型位置**：模型会下载到 `~/.cache/huggingface/hub/`
3. **内存占用**：模型加载后占用约 2-3GB 内存
4. **处理速度**：首次加载模型后，后续处理会很快

## 🎯 快速测试

启动后，可以测试 API：

```bash
# 检查状态
curl http://localhost:5000/api/status

# 手动加载模型
curl -X POST http://localhost:5000/api/load-model

# 手动释放模型
curl -X POST http://localhost:5000/api/unload-model
```

## 📝 启动脚本（可选）

创建 `start.sh`：

```bash
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate 2>/dev/null || true
python3 app.py
```

使用：
```bash
chmod +x start.sh
./start.sh
```

