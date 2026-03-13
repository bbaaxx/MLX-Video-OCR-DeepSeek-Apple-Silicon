#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import multiprocessing
import tempfile

UPLOAD_FOLDER = tempfile.gettempdir()

model_loaded_status = multiprocessing.Value("b", False)
pdf_tasks = {}
preprocess_tasks = {}
video_tasks = {}
