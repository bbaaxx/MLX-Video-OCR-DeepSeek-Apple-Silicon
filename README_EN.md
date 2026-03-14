# MLX DeepSeek-OCR

<div align="center">

**🎯 One-Click Mac Deploy | 📹 Video/PDF/Image Triple OCR | 🖥️ Full GUI Interface**

**🚀 Full-Featured OCR Solution Optimized for Apple Silicon**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![MLX](https://img.shields.io/badge/MLX-0.20.0+-orange.svg)](https://github.com/ml-explore/mlx)
[![DeepSeek-OCR](https://img.shields.io/badge/Model-DeepSeek--OCR-purple.svg)](https://huggingface.co/mlx-community/DeepSeek-OCR-8bit)
[![One-Click Deploy](https://img.shields.io/badge/Deploy-One--Click-success.svg)](https://github.com/matica0902/MLX-Video-OCR-DeepSeek-Apple-Silicon#-quick-start)

### ✨ Key Features

🍎 **Mac One-Click Deploy** • 📹 **Video Frame OCR** • 📄 **PDF Batch Processing** • 🖼️ **Image Intelligent Recognition**  
🎨 **Image Preprocessing** • 🖥️ **Modern GUI** • 🔒 **Fully Local** • ⚡ **Metal GPU Acceleration**

*Zero Config • Privacy Protection • Out of the Box*

[Quick Start](#-quick-start) • [Features](#-features) • [Architecture](#-system-architecture) • [Documentation](#-documentation)

</div>

---

## ✨ Features

### 🎯 **Triple OCR Processing**

#### **📹 Video OCR (Exclusive Feature)**
- **Smart Frame Extraction**: Automatically extracts key frames from videos
- **Supported Formats**: MP4, AVI, MOV, MKV, WebM
- **Batch Processing**: Process all frames at once
- **Seamless Integration**: Frames go directly to OCR pipeline

#### **📄 PDF OCR (Batch Processing)**
- **Dual Modes**: Batch Processing / Single Page Selection
- **Real-time Preview**: Thumbnail browsing, page selection
- **Smart Controls**: Pause, Resume, Stop
- **Large File Support**: Automatic batch processing

#### **🖼️ Image OCR (Intelligent Recognition)**
- **Multi-Scene Support**: Documents, Tables, Handwriting, Street Signs, Photos
- **Preprocessing Features**: Background Removal, Enhancement, Shadow Removal, Rotation
- **Output Formats**: Markdown, LaTeX, Plain Text

---

### 🎯 **Core OCR Capabilities**

#### **Multi-Scene Intelligent Recognition**
- **📄 Document Processing**: Academic Papers, Business Documents, General Content, Tables, Handwritten Text, Complex Layouts
- **🌆 Scene Recognition**: Street Signs, Photo Text, Product Labels, Captcha
- **🎚️ 5-Level Precision Control**: Tiny → Small → Medium → Large → Gundam
  - Dynamic Image Resizing (512px - 1280px)
  - Smart Token Allocation (256 - 8192 tokens)

#### **Professional Output Formats**
- ✅ **Markdown** Format Conversion (Structure Preserved)
- ✅ **LaTeX** Math Formula Extraction
- ✅ **Tables** Markdown Formatting
- ✅ **Traditional Chinese** Priority Processing

### 📑 **PDF Batch Processing**

#### **Dual Processing Modes**
- **Batch Mode**: Auto-process entire PDF (1/3/5/10/custom pages)
- **Single Page Mode**: Precisely select specific pages

#### **Smart Features**
- 🖼️ **Real-time Thumbnail Preview** (Zoomable, Selectable)
- ⏸️ **Batch Control**: Pause/Resume/Stop
- 📊 **Progress Tracking**: Real-time status display
- 💾 **Result Management**: Per-page download, batch export

### 🎨 **Image Preprocessing**

#### **4 Preset Modes**
1. **Scan Optimization**: Auto-rotate + Enhance + Shadow Removal + Binarization
2. **Photo Optimization**: Auto-rotate + Enhance + Shadow Removal
3. **Blur Enhancement**: Contrast Enhancement + Sharpening
4. **Background Removal**: Intelligent Background Removal

#### **Batch Processing Capabilities**
- 📤 **Multi-Image Upload**: Drag-drop or select multiple images
- 🔄 **Batch Preprocessing**: One-click process all images
- 📥 **Batch Download**: ZIP package download
- 🔗 **Seamless Integration**: Direct send to OCR processing

### 🎬 **Video Frame Extraction**

#### **Smart Frame Extraction**
- 🎞️ **Supported Formats**: MP4, AVI, MOV, MKV, WebM
- ⚡ **Fast Extraction**: Auto uniform sampling of key frames
- 🖼️ **Preview Management**: Grid display, batch download
- 🔄 **OCR Integration**: Frames can be directly processed with OCR

---

## 🏗️ System Architecture

### **Tech Stack**

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer (UI)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tailwind CSS + Vanilla JS (3033 lines)          │  │
│  │  • Responsive Design • Drag-Drop Upload          │  │
│  │  • Real-time Preview • Progress Tracking         │  │
│  │  • Batch Control • Result Management              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────┐
│                 Backend Layer (Flask API)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Flask 3.0 + Python 3.11+ (1770 lines)            │  │
│  │  • 18 REST API Endpoints                         │  │
│  │  • Multi-process OCR Processing                  │  │
│  │  • Task Status Management                         │  │
│  │  • File Streaming                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               AI Inference Layer (MLX Framework)         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MLX 0.20+ • mlx-vlm 0.3.5                        │  │
│  │  • Metal GPU Acceleration                         │  │
│  │  • DeepSeek-OCR-8bit Model                       │  │
│  │  • Auto Model Download & Cache                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Image Processing Layer (OpenCV + PIL)       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OpenCV 4.10+ • Pillow 10.3+ • PyMuPDF           │  │
│  │  • PDF Rendering • Video Decoding • Image        │  │
│  │  • Auto-rotate • Shadow Removal • BG Removal     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **API Architecture**

#### **Core Endpoints**
```
GET  /                          # Main Page
GET  /api/status               # System Status
GET  /api/health               # Health Check

POST /api/ocr                  # Single Image OCR
POST /api/pdf/init             # PDF Initialization
POST /api/pdf/extract-pages    # PDF Page Extraction
POST /api/pdf/process-batch    # PDF Batch Processing
POST /api/pdf/preview-page     # PDF Page Preview
POST /api/pdf/cancel           # Cancel Processing

POST /api/preprocess/upload    # Image Upload
POST /api/preprocess/process   # Image Preprocessing
POST /api/preprocess/download  # Download Results
POST /api/preprocess/to-ocr    # Send to OCR

POST /api/video/upload         # Video Upload
POST /api/video/extract        # Frame Extraction
POST /api/video/download       # Download Frames
POST /api/video/process-batch  # Batch OCR

GET  /api/files/<path>         # File Service
```

### **Data Flow**

```
User Upload
    ↓
┌──────────────┐
│ File Verify  │ → Format Check (PNG/JPG/PDF/MP4...)
│ Size Limit   │ → Max 512MB
└──────────────┘
    ↓
┌──────────────┐
│ Preprocess   │ → Image Enhancement, Shadow Removal, Rotation
│ (Optional)   │ → Video Frame Extraction
└──────────────┘
    ↓
┌──────────────┐
│ Task Create  │ → UUID Generation
│ Status Init  │ → pending → processing → completed
└──────────────┘
    ↓
┌──────────────┐
│ MLX Inference│ → Multi-process Processing
│ GPU Accel   │ → Metal Optimization
└──────────────┘
    ↓
┌──────────────┐
│ Result Proc │ → Markdown Formatting
│ Cleanup     │ → Auto temp file cleanup
└──────────────┘
    ↓
Return Result (JSON)
```

---

## 🎨 UI Design Highlights

### **Modern Interface**

#### **🎯 Three Main Feature Tabs**
```
┌─────────────────────────────────────────────────┐
│  📄 OCR识别  │  🎨 照片预处理  │  🎬 视频截图  │
└─────────────────────────────────────────────────┘
```

#### **🎨 Design Highlights**

1. **Gradient Purple Theme**
   - Primary: `#8b5cf6` → `#a78bfa`
   - Shadow: `rgba(139, 92, 246, 0.4)`
   - Consistent Visual Language

2. **Drag-Drop Upload Area**
   - Dashed Border Design
   - Hover Animation
   - Highlight on Drag

3. **Smart Config Panel**
   - Dynamic Show/Hide
   - Slider Precision Control
   - Real-time Config Preview

4. **Progress Tracking**
   - Spinning Animation
   - Percentage Progress Bar
   - Status Text

5. **Result Display**
   - Markdown Rendering
   - One-click Copy
   - Batch Download

### **Responsive Design**

```css
/* Desktop (1024px+) */
- Three Column Layout
- Side Thumbnail Preview
- Full Feature Panel

/* Tablet (768px - 1024px) */
- Two Column Layout
- Collapsible Thumbnails
- Simplified Control Panel

/* Mobile (< 768px) */
- Single Column Layout
- Full Screen Preview
- Bottom Action Bar
```

### **Interactive Experience**

- ✨ **Smooth Transitions**: All state changes 0.3s animation
- 🎯 **Visual Feedback**: Hover, Active, Selected states
- ⚡ **Instant Response**: No page refresh updates
- 🔔 **Friendly Notifications**: Error, Success, Warning messages

---

## 🚀 Quick Start

### **System Requirements**

| Item | Requirement |
|------|-------------|
| **OS** | macOS 13.0+ |
| **Hardware** | Apple Silicon (M1/M2/M3/M4) |
| **Python** | 3.11+ |
| **Memory** | 16GB+ (Recommended) |
| **Disk Space** | 5GB+ (Including Models) |

### **🍎 Mac One-Click Deploy**

**Just 3 commands, 60 seconds to deploy!**

```bash
# 1. Choose install directory
cd ~/Downloads          # or cd ~ or cd ~/Documents

# 2. Clone project
git clone https://github.com/matica0902/MLX-Video-OCR-DeepSeek-Apple-Silicon.git
cd MLX-Video-OCR-DeepSeek-Apple-Silicon

# 3. One-click start (auto setup everything)
./start.sh
```

**🎉 That's it!** The script handles everything automatically!

> **Note**: The start script requires `uv` to be installed first. If not installed, the script will prompt you to install:
> ```bash
> curl -LsSf https://astral.sh/uv/install.sh | sh
> # or use Homebrew
> brew install uv
> ```

**start.sh will automatically:**
- ✅ Check Python version
- ✅ Check if uv is installed (prompt install method if not)
- ✅ Create virtual environment (using uv)
- ✅ Install all dependencies (using uv)
- ✅ Find available port (5000-5010)
- ✅ Clean zombie processes
- ✅ Start application

### **First Use**

1. **Access App**: http://localhost:5000
2. **First OCR**: Auto-download model (~800MB, takes 5-15 minutes)
3. **Model Location**: `~/hf_cache/hub/models--mlx-community--DeepSeek-OCR-8bit/`
4. **Subsequent Use**: Model cached, ready to use

### **Manual Install**

```bash
# 1. Go to project directory
cd ~/MLX-Video-OCR-DeepSeek-Apple-Silicon

# 2. Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh
# or use Homebrew: brew install uv

# 3. Create virtual environment
uv venv
source .venv/bin/activate

# 4. Install dependencies
uv pip install -r requirements.txt

# 5. Start application
python3 app.py
```

---

## 📚 Documentation

See `docs/` directory for detailed documentation:

### **Quick Guides**
- [Quick Start](docs/快速启动.md) - Simplest startup method
- [Detailed Start Guide](docs/START_GUIDE.md) - Includes troubleshooting

### **Complete Documentation**
- [Complete Running Guide](docs/MLX%20DeepSeek-OCR%20本地运行指南) - Features & advanced usage

---

## 🔒 Privacy & Security

### **Fully Local Operation**
- ✅ All processing done locally
- ✅ No data upload to cloud
- ✅ No network connection required (after model download)
- ✅ Auto temp file cleanup

### **Data Processing**
- Uploaded files: Stored in system temp directory
- Processing results: Only kept in browser session
- Auto cleanup: Delete temp files after processing

---

## ⚡ Performance Optimization

### **Metal GPU Acceleration**
```python
# Auto-detect and use Metal GPU
if mx.metal.is_available():
    # Use GPU acceleration (default)
    print("🔧 Metal GPU Enabled")
else:
    # Fallback to CPU
    mx.set_default_device(mx.cpu)
```

### **Multi-Process Processing**
- PDF Batch: Parallel page processing
- Image Preprocessing: Batch process multiple images
- Video Frames: Async frame extraction

### **Memory Management**
- Lazy Load: Load model on first request
- Manual Unload: `POST /api/unload-model`
- Auto Cleanup: Release resources after processing

---

## 🛠️ Development Info

### **Project Structure**

```
MLX-VIDEO-OCR/
├── mlx_video_ocr/       # Main Package
│   ├── __init__.py     # Package init
│   ├── app.py          # Flask App (74 lines)
│   ├── config.py       # Configuration
│   ├── preprocessing.py # Image preprocessing
│   ├── shared_state.py # Shared state
│   ├── routes/         # API Routes
│   │   ├── __init__.py
│   │   ├── ocr.py      # OCR endpoints (116 lines)
│   │   ├── pdf.py      # PDF endpoints (589 lines)
│   │   ├── preprocessing.py # Preprocess endpoints (243 lines)
│   │   └── video.py    # Video endpoints (180 lines)
│   ├── engines/        # MLX engines
│   └── utils/          # Utilities
├── static/
│   └── app.js         # Frontend Logic (3207 lines)
├── templates/
│   └── index.html     # Main Page (859 lines)
├── run.py             # Entry point
├── start.sh           # Startup Script
├── pyproject.toml     # Project config
└── requirements.txt  # Python Dependencies
```

### **Core Dependencies**

```python
Flask==3.0.0              # Web Framework
mlx-vlm>=0.4.0           # MLX Vision Language Model
mlx>=0.20.0              # Apple MLX Framework
Pillow>=10.3.0           # Image Processing
opencv-python>=4.10.0    # Computer Vision
PyMuPDF                  # PDF Processing
Werkzeug==3.0.1          # WSGI Tools
```

### **Code Statistics**

| File | Lines | Description |
|------|-------|-------------|
| `mlx_video_ocr/app.py` | 74 | Flask App Setup |
| `mlx_video_ocr/routes/*.py` | 1,136 | API Routes |
| `static/app.js` | 3,207 | Frontend Logic, UI Interaction |
| `templates/index.html` | 859 | HTML Structure, Styles |
| **Total** | **5,276** | Complete Feature Implementation |

---

## 📖 Usage Examples

### **1. Basic OCR**
```bash
# Upload Image → Select Mode → Click "Start Recognition"
# Result auto-displays, can copy or download
```

### **2. PDF Batch Processing**
```bash
# Upload PDF → Select Batch Mode → Set Pages Per Batch
# Auto Process → View Progress → Download Results
```

### **3. Image Preprocessing**
```bash
# Switch to "Image Preprocessing" tab
# Upload Image → Select Preset Mode → Process
# Download Result or Send Directly to OCR
```

### **4. Video Frame Extraction**
```bash
# Switch to "Video Frames" tab
# Upload Video → Set Frame Count → Extract
# Preview Frames → Download or Batch OCR
```

---

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- 📖 [Full License Terms](LICENSE)
- 🔗 [AGPL-3.0 Official Info](https://www.gnu.org/licenses/agpl-3.0.en.html)

**SPDX-License-Identifier**: AGPL-3.0-or-later

### **Brief Summary**

✅ **You Can:**
- Freely use, modify, distribute this software
- Use for commercial purposes

⚠️ **You Must:**
- Keep original license and copyright notices
- Open source your modifications (same license)
- Provide source code if offering as network service

---

## 🙏 Acknowledgments

- **[MLX](https://github.com/ml-explore/mlx)** - Apple's Machine Learning Framework
- **[DeepSeek-OCR](https://huggingface.co/deepseek-ai/DeepSeek-OCR)** - Powerful OCR Model
- **[mlx-vlm](https://github.com/Blaizzy/mlx-vlm)** - MLX Vision Language Model Implementation
- **[Flask](https://flask.palletsprojects.com/)** - Lightweight Web Framework

---

## 📞 Contact

- **GitHub**: [bbaaxx/MLX-Video-OCR-DeepSeek-Apple-Silicon](https://github.com/bbaaxx/MLX-Video-OCR-DeepSeek-Apple-Silicon)
- **Issues**: [Submit Issues](https://github.com/bbaaxx/MLX-Video-OCR-DeepSeek-Apple-Silicon/issues)

---

## 🙏 Credits

This is a fork that has significantly diverged from the original repository by [matica0902](https://github.com/matica0902/MLX-Video-OCR-DeepSeek-Apple-Silicon).

Special thanks to the original author for creating this project.

---

<div align="center">

**⭐ If this project helps you, please give it a star!**

Made with ❤️ for Apple Silicon

</div>
