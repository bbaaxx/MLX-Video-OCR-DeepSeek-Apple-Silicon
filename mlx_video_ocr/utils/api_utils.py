#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import os
import shutil
import gc
from datetime import datetime, timedelta
from pathlib import Path
import mlx.core as mx
from mlx_video_ocr.config import ALLOWED_EXTENSIONS, ALLOWED_VIDEO_EXTENSIONS


def allowed_file(filename):
    """Check if file has allowed extension"""
    if not filename:
        return False
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_video_file(filename):
    """Check if video file has allowed extension"""
    if not filename:
        return False
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS
    )


def is_model_healthy(model_loaded_status):
    """Check if model is healthy"""
    return model_loaded_status.value


def preload_model_main_process(model_loaded_status):
    """Set model preloaded status for main process"""
    print("🔧 Setting model preloaded status for main process...")
    try:
        if not mx.metal.is_available():
            print("WARNING: Metal is not available, MLX might not perform well.")

        model_loaded_status.value = True
        print("✅ Model preloaded status set successfully for main process.")
        return True
    except Exception as e:
        print(f"❌ Failed to set model preloaded status: {e}")
        return False


def cleanup_old_tasks(pdf_tasks, preprocess_tasks, video_tasks):
    """Clean up expired tasks"""
    now = datetime.now()

    expired = [
        tid
        for tid, t in pdf_tasks.items()
        if now - t["created_at"] > timedelta(minutes=30)
    ]
    for tid in expired:
        pdf_file_path = pdf_tasks[tid].get("pdf_path")
        if pdf_file_path and os.path.exists(pdf_file_path):
            try:
                os.remove(pdf_file_path)
                print(f"🗑️ Removed expired PDF file: {pdf_file_path}")
            except Exception as e:
                print(f"❌ Error removing expired PDF file {pdf_file_path}: {e}")
        del pdf_tasks[tid]

    expired = [
        tid
        for tid, t in preprocess_tasks.items()
        if now - t["created_at"] > timedelta(minutes=30)
    ]
    for tid in expired:
        task_dir = preprocess_tasks[tid].get("task_dir")
        if task_dir and os.path.exists(task_dir):
            try:
                shutil.rmtree(task_dir)
                print(f"🗑️ Removed expired preprocess task: {task_dir}")
            except Exception as e:
                print(f"❌ Error removing preprocess task {task_dir}: {e}")
        del preprocess_tasks[tid]

    expired = [
        tid
        for tid, t in video_tasks.items()
        if now - t["created_at"] > timedelta(minutes=30)
    ]
    for tid in expired:
        task_dir = video_tasks[tid].get("task_dir")
        if task_dir and os.path.exists(task_dir):
            try:
                shutil.rmtree(task_dir)
                print(f"🗑️ Removed expired video task: {task_dir}")
            except Exception as e:
                print(f"❌ Error removing video task {task_dir}: {e}")
        del video_tasks[tid]

    if expired:
        print(f"🧹 Cleaned up {len(expired)} expired tasks")


def cleanup_all_resources(pdf_tasks, preprocess_tasks, video_tasks):
    """Cleanup all resources on application exit"""
    print("🧹 Cleaning up resources on application exit...")

    for task_dict in [pdf_tasks, preprocess_tasks, video_tasks]:
        for task_id in list(task_dict.keys()):
            task = task_dict[task_id]
            task_dir = task.get("task_dir")
            pdf_path = task.get("pdf_path")

            if task_dir and os.path.exists(task_dir):
                try:
                    shutil.rmtree(task_dir)
                    print(f"🗑️ Removed task directory: {task_dir}")
                except Exception as e:
                    print(f"❌ Error removing task directory {task_dir}: {e}")

            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                    print(f"🗑️ Removed PDF file: {pdf_path}")
                except Exception as e:
                    print(f"❌ Error removing PDF file {pdf_path}: {e}")

            del task_dict[task_id]

    gc.collect()
    print("✅ All resources cleaned up.")
