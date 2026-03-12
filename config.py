#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "webm"}
MAX_CONTENT_LENGTH = 512 * 1024 * 1024

PREPROCESSING_CONFIG = {
    "Document": {
        "Academic": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Business": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Content": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Table": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Handwritten": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Complex": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
    },
    "Scene": {
        "Street": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Photo": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Objects": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 512},
            "Small": {"image_size": (640, 640), "max_tokens": 1024},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 2048},
            "Large": {"image_size": (1280, 1280), "max_tokens": 4096},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 8192},
        },
        "Verification": {
            "Tiny": {"image_size": (512, 512), "max_tokens": 256},
            "Small": {"image_size": (640, 640), "max_tokens": 512},
            "Medium": {"image_size": (1024, 1024), "max_tokens": 1024},
            "Large": {"image_size": (1280, 1280), "max_tokens": 2048},
            "Gundam": {"image_size": (1024, 1024), "max_tokens": 4096},
        },
    },
}

MODE_QUICK_MAP = {
    "basic": {
        "content_type": "Document",
        "subcategory": "Academic",
        "complexity": "Medium",
    },
    "table": {
        "content_type": "Document",
        "subcategory": "Table",
        "complexity": "Large",
    },
    "markdown": {
        "content_type": "Document",
        "subcategory": "Content",
        "complexity": "Medium",
    },
    "formula": {
        "content_type": "Document",
        "subcategory": "Academic",
        "complexity": "Large",
    },
    "product": {"content_type": "Scene", "subcategory": "Photo", "complexity": "Small"},
}

prompts = {
    "product": "<image>\nExtract all printed text from this product packaging exactly as it appears. Use Traditional Chinese.",
    "basic": "<image>\nExtract all text from the image. Keep original Traditional Chinese and formatting.",
    "table": "<image>\nConvert this table to clean Markdown format.",
    "markdown": "<image>\nConvert this document page to clean Markdown format.",
    "formula": "<image>\nExtract all mathematical formulas using LaTeX format.",
}

PREPROCESS_PRESETS = {
    "scan_optimize": {
        "auto_rotate": True,
        "enhance": True,
        "remove_shadows": True,
        "binarize": True,
        "remove_bg": False,
    },
    "photo_optimize": {
        "auto_rotate": True,
        "enhance": True,
        "remove_shadows": True,
        "binarize": False,
        "remove_bg": False,
    },
    "enhance_blurry": {
        "auto_rotate": False,
        "enhance": True,
        "remove_shadows": False,
        "binarize": False,
        "remove_bg": False,
    },
    "remove_background_only": {
        "auto_rotate": False,
        "enhance": False,
        "remove_shadows": False,
        "binarize": False,
        "remove_bg": True,
    },
}
