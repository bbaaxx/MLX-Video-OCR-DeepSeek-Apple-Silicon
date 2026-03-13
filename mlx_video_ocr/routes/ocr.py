#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import os
import gc
import traceback
import tempfile
from flask import Blueprint, request, jsonify
from PIL import Image
from mlx_video_ocr.config import MODE_QUICK_MAP, prompts
from mlx_video_ocr.preprocessing import (
    get_preprocessing_config,
    preprocess_image_by_config,
)
from mlx_video_ocr.engines.ocr_engine import generate_with_timeout_and_process
from mlx_video_ocr.utils.api_utils import allowed_file
from mlx_video_ocr.shared_state import model_loaded_status

ocr_bp = Blueprint("ocr", __name__)


@ocr_bp.route("/api/ocr", methods=["POST"])
def ocr():
    """Single image OCR - supports new 3D classification and legacy quick mode"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format"}), 400

    old_mode = request.form.get("mode")
    if old_mode and old_mode in MODE_QUICK_MAP:
        mapping = MODE_QUICK_MAP[old_mode]
        content_type = mapping["content_type"]
        subcategory = mapping["subcategory"]
        complexity = mapping["complexity"]
    else:
        content_type = request.form.get("content_type", "Document")
        subcategory = request.form.get("subcategory", "Academic")
        complexity = request.form.get("complexity", "Medium")

    config = get_preprocessing_config(content_type, subcategory, complexity)
    if not config:
        return jsonify(
            {
                "error": f"Invalid configuration: {content_type}/{subcategory}/{complexity}"
            }
        ), 400

    if not model_loaded_status.value:
        return jsonify({"error": "Model not ready. Please check server status."}), 500

    tmp_path = None
    img = None
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        if tmp_path.lower().endswith(".pdf"):
            return jsonify({"error": "Use PDF batch API for PDF files"}), 400

        img = Image.open(tmp_path).convert("RGB")

        img_processed = preprocess_image_by_config(img, config["image_size"])

        if old_mode and old_mode in prompts:
            prompt = prompts[old_mode]
        else:
            prompt = prompts["basic"]

        print(
            f"📋 Processing with: content_type={content_type}, subcategory={subcategory}, complexity={complexity}"
        )
        print(
            f"   Image size: {config['image_size']}, max_tokens: {config['max_tokens']}"
        )

        text = generate_with_timeout_and_process(
            image=img_processed,
            prompt=prompt,
            max_tokens=config["max_tokens"],
            timeout=300,
        )

        print(f"✅ OCR completed, text length: {len(text)}")
        return jsonify(
            {
                "success": True,
                "text": text,
                "config": {
                    "content_type": content_type,
                    "subcategory": subcategory,
                    "complexity": complexity,
                    "image_size": config["image_size"],
                    "max_tokens": config["max_tokens"],
                },
            }
        )

    except TimeoutError:
        return jsonify({"error": "OCR processing timeout"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"OCR processing failed: {str(e)}"}), 500
    finally:
        if img:
            img.close()
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        gc.collect()
