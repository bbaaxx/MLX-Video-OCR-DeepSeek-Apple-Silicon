#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import json
from pathlib import Path
from flask import request


class I18nBackend:
    def __init__(self):
        self.translations = {}
        self.load_translations()

    def load_translations(self):
        """Load all translation files from static/locales/"""
        try:
            locales_path = Path(__file__).parent / "static" / "locales"
            for lang_dir in locales_path.iterdir():
                if lang_dir.is_dir():
                    lang_code = lang_dir.name
                    self.translations[lang_code] = {}
                    for json_file in lang_dir.glob("*.json"):
                        category = json_file.stem
                        with open(json_file, "r", encoding="utf-8") as f:
                            self.translations[lang_code][category] = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load translations: {e}")

    def t(self, key, lang="zh", **params):
        """Translate a key with optional parameters"""
        try:
            category, *keys = key.split(".")
            text = self.translations.get(lang, {}).get(category, {})
            for k in keys:
                text = text.get(k)

            if text is None:
                text = self.translations.get("zh", {}).get(category, {})
                for k in keys:
                    text = text.get(k)

            if text is None:
                return key

            if params:
                try:
                    return text.format(**params)
                except (KeyError, ValueError):
                    return text
            return text
        except Exception:
            return key

    def get_client_language(self):
        """Get language from request headers"""
        accept_lang = request.headers.get("Accept-Language", "")
        if accept_lang:
            lang = accept_lang.split(",")[0].split("-")[0].lower()
            if lang in self.translations:
                return lang

        lang = request.args.get("lang", "").lower()
        if lang in self.translations:
            return lang

        return "zh"


i18n_backend = I18nBackend()
