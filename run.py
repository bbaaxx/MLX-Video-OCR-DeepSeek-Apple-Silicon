#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

"""Entry point for MLX Video OCR application"""

import sys
import multiprocessing
from mlx_video_ocr.app import create_app
from mlx_video_ocr.utils.api_utils import preload_model_main_process
from mlx_video_ocr.shared_state import model_loaded_status

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
    print("📁 Package Structure:")
    print("   - mlx_video_ocr/config.py: Configuration constants")
    print("   - mlx_video_ocr/preprocessing.py: Image preprocessing")
    print("   - mlx_video_ocr/video_utils.py: Video frame extraction")
    print("   - mlx_video_ocr/engines/ocr_engine.py: Model loading & OCR processing")
    print("   - mlx_video_ocr/utils/api_utils.py: Shared utilities")
    print("   - mlx_video_ocr/routes/: API endpoints (blueprints)")
    print("\n")

    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
