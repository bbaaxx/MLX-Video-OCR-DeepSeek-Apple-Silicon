#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import atexit
from pathlib import Path
from flask import Flask, render_template, jsonify
from mlx_video_ocr.config import MAX_CONTENT_LENGTH
from mlx_video_ocr.utils.api_utils import (
    preload_model_main_process,
    cleanup_all_resources,
)
from mlx_video_ocr.shared_state import (
    model_loaded_status,
    pdf_tasks,
    preprocess_tasks,
    video_tasks,
)
from mlx_video_ocr.routes import ocr_bp, pdf_bp, preprocessing_bp, video_bp

PROJECT_ROOT = Path(__file__).parent.parent


def create_app():
    """Flask application factory"""
    app = Flask(
        __name__,
        template_folder=str(PROJECT_ROOT / "templates"),
        static_folder=str(PROJECT_ROOT / "static"),
    )
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    app.register_blueprint(ocr_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(preprocessing_bp)
    app.register_blueprint(video_bp)

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

    return app
