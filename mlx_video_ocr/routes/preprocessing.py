#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import io
import base64
import traceback
import zipfile
from datetime import datetime
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
from mlx_video_ocr.preprocessing import preprocess_single_image
from mlx_video_ocr.utils.api_utils import allowed_file
from mlx_video_ocr.shared_state import preprocess_tasks, UPLOAD_FOLDER

preprocessing_bp = Blueprint("preprocessing", __name__)


@preprocessing_bp.route("/api/preprocess/upload", methods=["POST"])
def preprocess_upload():
    """Upload photos for preprocessing"""
    if "files" not in request.files:
        return jsonify({"error": "No files"}), 400

    files = request.files.getlist("files")
    if not files or files[0].filename == "":
        return jsonify({"error": "No selected files"}), 400

    import uuid

    task_id = str(uuid.uuid4())
    task_dir = Path(UPLOAD_FOLDER) / f"preprocess_{task_id}"
    raw_dir = task_dir / "raw"
    processed_dir = task_dir / "processed"

    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)

    image_files = []

    for file in files:
        if allowed_file(file.filename):
            filename = secure_filename(file.filename)
            raw_path = raw_dir / filename
            file.save(raw_path)

            img = None
            try:
                img = Image.open(raw_path)
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                thumb_b64 = base64.b64encode(buffered.getvalue()).decode()

                image_files.append(
                    {
                        "filename": filename,
                        "raw_path": str(raw_path),
                        "thumb_b64": f"data:image/png;base64,{thumb_b64}",
                        "processed_path": None,
                        "status": "pending",
                    }
                )
            except Exception as e:
                print(f"⚠️ Error generating thumbnail for {filename}: {e}")
                image_files.append(
                    {
                        "filename": filename,
                        "raw_path": str(raw_path),
                        "thumb_b64": None,
                        "processed_path": None,
                        "status": "pending",
                    }
                )
            finally:
                if img:
                    img.close()

    if not image_files:
        return jsonify({"error": "No valid image files"}), 400

    preprocess_tasks[task_id] = {
        "task_dir": str(task_dir),
        "images": image_files,
        "settings": {},
        "created_at": datetime.now(),
    }

    return jsonify(
        {
            "success": True,
            "task_id": task_id,
            "images": image_files,
            "total_images": len(image_files),
        }
    )


@preprocessing_bp.route("/api/preprocess/process", methods=["POST"])
def preprocess_process():
    """Execute photo preprocessing"""
    data = request.get_json()
    task_id = data.get("task_id")
    settings = data.get("settings", {})

    if task_id not in preprocess_tasks:
        return jsonify({"error": "Task not found"}), 404

    task = preprocess_tasks[task_id]
    task["settings"] = settings

    processed_dir = Path(task["task_dir"]) / "processed"

    results = []

    for img_info in task["images"]:
        original_img = None
        processed_img = None
        thumb_img = None

        try:
            raw_path = img_info["raw_path"]
            filename = img_info["filename"]

            original_img = Image.open(raw_path)
            processed_img = preprocess_single_image(original_img, settings)

            output_path = processed_dir / filename
            if processed_img.mode == "RGBA":
                output_path = output_path.with_suffix(".png")
                processed_img.save(output_path, "PNG")
            else:
                processed_img.save(output_path, "JPEG", quality=95)

            thumb_img = processed_img.copy()
            thumb_img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            buffered = io.BytesIO()
            thumb_img.save(buffered, format="PNG")
            processed_thumb_b64 = base64.b64encode(buffered.getvalue()).decode()

            img_info.update(
                {
                    "processed_path": str(output_path),
                    "processed_thumb_b64": f"data:image/png;base64,{processed_thumb_b64}",
                    "status": "completed",
                }
            )

            results.append(
                {
                    "filename": filename,
                    "status": "completed",
                    "processed_path": str(output_path),
                    "processed_thumb_b64": f"data:image/png;base64,{processed_thumb_b64}",
                }
            )

        except Exception as e:
            print(f"❌ Error processing {img_info['filename']}: {e}")
            traceback.print_exc()
            img_info["status"] = "failed"
            results.append(
                {"filename": img_info["filename"], "status": "failed", "error": str(e)}
            )

        finally:
            if original_img:
                try:
                    original_img.close()
                except:
                    pass
            if processed_img and processed_img is not original_img:
                try:
                    processed_img.close()
                except:
                    pass
            if thumb_img:
                try:
                    thumb_img.close()
                except:
                    pass

    return jsonify({"success": True, "results": results})


@preprocessing_bp.route("/api/preprocess/download", methods=["POST"])
def preprocess_download():
    """Download processed photos"""
    data = request.get_json()
    task_id = data.get("task_id")

    if task_id not in preprocess_tasks:
        return jsonify({"error": "Task not found"}), 404

    task = preprocess_tasks[task_id]
    processed_dir = Path(task["task_dir"]) / "processed"

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for img_info in task["images"]:
            if img_info["status"] == "completed" and img_info["processed_path"]:
                file_path = Path(img_info["processed_path"])
                if file_path.exists():
                    zip_file.write(file_path, file_path.name)

    zip_buffer.seek(0)

    return send_file(
        zip_buffer,
        as_attachment=True,
        download_name=f"processed_images_{task_id}.zip",
        mimetype="application/zip",
    )


@preprocessing_bp.route("/api/preprocess/to-ocr", methods=["POST"])
def preprocess_to_ocr():
    """Send processed photos to OCR"""
    data = request.get_json()
    task_id = data.get("task_id")

    if task_id not in preprocess_tasks:
        return jsonify({"error": "Task not found"}), 404

    task = preprocess_tasks[task_id]

    processed_images = []
    for img_info in task["images"]:
        if img_info["status"] == "completed" and img_info["processed_path"]:
            processed_images.append(
                {
                    "filename": img_info["filename"],
                    "processed_path": img_info["processed_path"],
                    "thumb_b64": img_info["processed_thumb_b64"],
                }
            )

    return jsonify({"success": True, "processed_images": processed_images})
