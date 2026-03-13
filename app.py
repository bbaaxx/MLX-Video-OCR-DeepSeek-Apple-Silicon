#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import os
import sys
import atexit
import multiprocessing
from pathlib import Path
from flask import Flask, render_template, jsonify
from config import MAX_CONTENT_LENGTH
from api_utils import preload_model_main_process, cleanup_all_resources
from shared_state import (
    model_loaded_status,
    pdf_tasks,
    preprocess_tasks,
    video_tasks,
    UPLOAD_FOLDER,
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

from routes_ocr import ocr_bp
from routes_preprocessing import preprocessing_bp
from routes_video import video_bp
from routes_pdf import pdf_bp

app.register_blueprint(ocr_bp)
app.register_blueprint(preprocessing_bp)
app.register_blueprint(video_bp)
app.register_blueprint(pdf_bp)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status")
def status():
    return jsonify(
        {
            "model_loaded": model_loaded_status.value,
            "model_healthy": model_loaded_status.value,
        }
    )


@app.route("/api/health")
def health_check():
    return jsonify(
        {
            "status": "healthy",
            "model_loaded": model_loaded_status.value,
            "model_healthy": model_loaded_status.value,
            "active_tasks": len(pdf_tasks),
            "preprocess_tasks": len(preprocess_tasks),
            "video_tasks": len(video_tasks),
        }
    )


def cleanup():
    """Cleanup on application exit"""
    model_loaded_status.value = False
    cleanup_all_resources(pdf_tasks, preprocess_tasks, video_tasks)


atexit.register(cleanup)

if __name__ == "__main__":
    multiprocessing.set_start_method("spawn", force=True)

    print("🚀 Starting Flask OCR Application with Enhanced Features...")
    if not preload_model_main_process(model_loaded_status):
        print(
            "❌ CRITICAL: Model preload status setting failed. Cannot start application."
        )
        sys.exit(1)

    print("✅ Application starting on http://0.0.0.0:5001")
    print("\n📊 Enhanced Features:")
    print("   - 📄 OCR Recognition (Existing Feature)")
    print("   - 🎨 Photo Preprocessing (New Feature)")
    print("   - 🎬 Video Frame Extraction (New Feature)")
    print("   - 📋 PDF Batch Processing (Existing Feature)")
    print("\n🔄 Legacy Mode Support:")
    print("   - 'basic' → Document/Academic/Medium")
    print("   - 'table' → Document/Table/Large")
    print("   - 'markdown' → Document/Content/Medium")
    print("   - 'formula' → Document/Academic/Large")
    print("   - 'product' → Scene/Photo/Small")
    print("\n")
    print("📁 Modular Structure:")
    print("   - config.py: Configuration constants")
    print("   - preprocessing.py: Image preprocessing")
    print("   - video_utils.py: Video frame extraction")
    print("   - ocr_engine.py: Model loading & OCR processing")
    print("   - api_utils.py: Shared utilities")
    print("   - routes_*.py: API endpoints (blueprints)")
    print("\n")

    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
