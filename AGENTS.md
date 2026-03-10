# AGENTS.md - AI Agent Development Guide

**Project**: MLX-Video-OCR-DeepSeek-Apple-Silicon  
**License**: AGPL-3.0-or-later | **Python**: 3.11+ (Apple Silicon)

---

## Build, Test, Run

```bash
./start.sh  # Auto-setup: uv venv, deps, port (8080-8090)

# Manual setup (requires uv)
uv venv && source .venv/bin/activate && uv pip install -r requirements.txt && python3 app.py

# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh  # or: brew install uv

# Testing (NO test infrastructure - manual only)
curl http://localhost:8080/api/health
ls -la ~/hf_cache/hub/models--mlx-community--DeepSeek-OCR-8bit/
lsof -ti:8080 | xargs kill -9  # Kill stuck server
rm -rf uploads/* tmp/*  # Cleanup

# Optional linting
uv pip install ruff black && ruff check app.py && black app.py --line-length 88
```

---

## Project Structure

```
app.py (2,039 lines)      # Flask backend
static/app.js (3,193 lines) # Frontend logic
static/locales/           # i18n (zh/, es/)
templates/index.html      # UI template
```

**API Endpoints**:
- OCR: `POST /api/ocr`, `/api/pdf/init`, `/api/pdf/extract-pages`, `/api/pdf/process-batch`
- Preprocessing: `POST /api/preprocess/upload`, `/process`, `/to-ocr`
- Video: `POST /api/video/upload`, `/extract`, `/process-batch`
- Utility: `GET /api/health`, `/api/status`, `/api/files/<path>`

---

## Python Style

**Imports (3 groups, alphabetical)**:
```python
import gc, os, re
from pathlib import Path
from flask import Flask, request, jsonify
import cv2, numpy as np
import mlx.core as mx
from mlx_vlm import load, generate
```

**Naming**: `snake_case` (vars/funcs), `PascalCase` (classes), `UPPER_SNAKE_CASE` (consts), `_prefix` (private)

**Functions**:
```python
def extract_frames(video_path, output_dir, method="fixed_count", total_frames=1000):
    """Single-line docstring"""

def process_pdf_batch(pdf_path, batch_size=5, task_id=None):
    """Multi-line for complex: Args: pdf_path (str), batch_size (int), task_id (str)"""
```

**Error Handling**:
```python
try:
    result = risky_operation()
except ImportError:
    result = fallback_implementation()
except Exception as e:
    print(f"❌ Error: {e}")
    traceback.print_exc()
finally:
    if resource: resource.close()
    gc.collect()
```

**Logging**: Emoji prefixes (🚀 start, ✅ success, ❌ error, ⚠️ warning, 📊 progress, ⏱️ timing)

**Organization**: Section headers with `====`, group related functions, explain WHY not WHAT

---

## Flask Patterns

```python
@app.route("/api/ocr", methods=["POST"])
def ocr_endpoint():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    return jsonify({"success": True, "text": process_ocr(file)})

# Request: file = request.files["file"] | data = request.get_json() | mode = request.form.get("mode")
# Response: 200 (success), 400 (bad request), 404 (not found), 500 (error)
```

---

## Resource Management

```python
# Cleanup
finally:
    if img: 
        try: img.close()
        except: pass
    if tmp_path and os.path.exists(tmp_path): os.remove(tmp_path)
    gc.collect()

# Multiprocessing with locks
_model_instance = None
_model_instance_lock = threading.Lock()
def _load_model_for_subprocess():
    with _model_instance_lock:
        if _model_instance: return True
        # Load model...
```

---

## Special Patterns

**Retry with token reduction**:
```python
for attempt, tokens in enumerate([2048, 512, 256]):
    try:
        result = generate(..., max_tokens=tokens)
        if result: break
    except Exception:
        if attempt < 2: time.sleep(1)
        else: raise
```

**Batch processing**:
```python
start, end = batch_index * batch_size, min((batch_index + 1) * batch_size, total_items)
for i in range(start, end): process_item(i)
has_more = end < total_items
```

**Path security**:
```python
file_path = Path(UPLOAD_FOLDER).resolve() / filepath
try: file_path.relative_to(Path(UPLOAD_FOLDER).resolve())
except ValueError: return jsonify({"error": "Access denied"}), 403
```

**Configuration**:
```python
PREPROCESSING_CONFIG = {"Document": {"Academic": {"Tiny": {"image_size": (512, 512), "max_tokens": 512}}}}
MODE_QUICK_MAP = {"basic": {"content_type": "Document", "subcategory": "Academic"}}
```

---

## JavaScript Style (static/app.js)

**Organization**: License header → Global vars → Classes → Event handlers  
**Naming**: `camelCase` (vars/funcs), `PascalCase` (classes), `_prefix` (private)

```javascript
// Async/await
async function processOCR(file) {
    try {
        const response = await fetch('/api/ocr', { method: 'POST', body: formData });
        return await response.json();
    } catch (error) {
        console.error('❌ OCR failed:', error);
        throw error;
    }
}

// DOM: Use getElementById, querySelector, classList.add() — avoid inline styles
// Error handling: try/catch/finally with console.error() and user alerts
// Comments: Explain WHY, mixed Chinese/English acceptable
```

---

## Dependencies

Flask 3.0.0 | mlx-vlm 0.3.5 | mlx >= 0.20.0 (Metal GPU) | Pillow >= 10.3.0 | opencv-python >= 4.10.0 | PyMuPDF | Werkzeug 3.0.1

---

## Workflow

1. **Setup**: macOS 13.0+ Apple Silicon → `./start.sh`
2. **Develop**: Edit `app.py` (backend) or `static/app.js` (frontend)
3. **Test**: Manual via http://localhost:8080
4. **Style**: Follow patterns above, emoji logging, resource cleanup
5. **Commit**: Include AGPL-3.0 header

---

## License Header (Required)

```python
#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html
```
