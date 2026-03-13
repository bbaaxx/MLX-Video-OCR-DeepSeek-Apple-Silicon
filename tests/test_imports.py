#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Basic import tests for mlx_video_ocr package"""


def test_import_config():
    from mlx_video_ocr.config import ALLOWED_EXTENSIONS, MODE_QUICK_MAP

    assert ALLOWED_EXTENSIONS is not None
    assert MODE_QUICK_MAP is not None


def test_import_routes():
    from mlx_video_ocr.routes import ocr_bp, pdf_bp, preprocessing_bp, video_bp

    assert ocr_bp is not None
    assert pdf_bp is not None
    assert preprocessing_bp is not None
    assert video_bp is not None


def test_import_utils():
    from mlx_video_ocr.utils import allowed_file, extract_frames_from_video

    assert allowed_file is not None


def test_import_app_factory():
    from mlx_video_ocr.app import create_app

    assert create_app is not None


if __name__ == "__main__":
    test_import_config()
    test_import_routes()
    test_import_utils()
    test_import_app_factory()
    print("All import tests passed!")
