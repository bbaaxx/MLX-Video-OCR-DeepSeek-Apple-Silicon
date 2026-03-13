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
import uuid
from datetime import datetime
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
from mlx_video_ocr.utils.video_utils import extract_frames_from_video
from mlx_video_ocr.utils.api_utils import allowed_video_file
from mlx_video_ocr.shared_state import video_tasks, UPLOAD_FOLDER

video_bp = Blueprint("video", __name__)


@video_bp.route("/api/video/upload", methods=["POST"])
def upload_video():
    """Upload video and extract frames"""

    task_id = str(uuid.uuid4())
    task_dir = Path(UPLOAD_FOLDER) / f"video_{task_id}"
    task_dir.mkdir(parents=True, exist_ok=True)

    video_filename = secure_filename(file.filename)
    video_path = task_dir / video_filename
    file.save(video_path)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return jsonify({"error": "Cannot open video file"}), 400

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    cap.release()

    video_tasks[task_id] = {
        "task_dir": str(task_dir),
        "video_path": str(video_path),
        "video_info": {
            "filename": video_filename,
            "duration": duration,
            "fps": fps,
            "total_frames": total_frames,
            "resolution": f"{width}x{height}",
        },
        "frames": [],
        "settings": {},
        "created_at": datetime.now(),
    }

    return jsonify(
        {
            "success": True,
            "task_id": task_id,
            "video_info": video_tasks[task_id]["video_info"],
        }
    )


@video_bp.route("/api/video/extract", methods=["POST"])
def video_extract():
    """Extract frames from video"""
    data = request.get_json()
    task_id = data.get("task_id")
    settings = data.get("settings", {})

    if task_id not in video_tasks:
        return jsonify({"error": "Task not found"}), 404

    task = video_tasks[task_id]
    task["settings"] = settings

    frames_dir = Path(task["task_dir"]) / "frames"
    frames_dir.mkdir(exist_ok=True)

    method = settings.get("method", "fixed_count")
    interval = settings.get("interval", 5)
    total_frames = settings.get("total_frames", 1000)
    sensitivity = settings.get("sensitivity", 0.5)
    output_format = settings.get("format", "jpg")

    try:
        frames = extract_frames_from_video(
            task["video_path"],
            str(frames_dir),
            method=method,
            interval=interval,
            total_frames=total_frames,
            sensitivity=sensitivity,
        )

        frame_previews = []
        for i, frame_path in enumerate(frames):
            img = None
            try:
                img = Image.open(frame_path)
                img.thumbnail((150, 150), Image.Resampling.LANCZOS)
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                thumb_b64 = base64.b64encode(buffered.getvalue()).decode()

                frame_previews.append(
                    {
                        "index": i + 1,
                        "path": frame_path,
                        "thumb_b64": f"data:image/png;base64,{thumb_b64}",
                        "selected": True,
                    }
                )
            except Exception as e:
                print(f"⚠️ Error generating thumbnail for frame {i}: {e}")
                frame_previews.append(
                    {
                        "index": i + 1,
                        "path": frame_path,
                        "thumb_b64": None,
                        "selected": True,
                    }
                )
            finally:
                if img:
                    try:
                        img.close()
                    except:
                        pass

        task["frames"] = frame_previews

        return jsonify(
            {"success": True, "total_frames": len(frames), "frames": frame_previews}
        )

    except Exception as e:
        print(f"❌ Video extraction failed: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Frame extraction failed: {str(e)}"}), 500


@video_bp.route("/api/video/download", methods=["POST"])
def video_download():
    """Download video frames"""
    data = request.get_json()
    task_id = data.get("task_id")
    selected_frames = data.get("selected_frames", [])

    if task_id not in video_tasks:
        return jsonify({"error": "Task not found"}), 404

    task = video_tasks[task_id]

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for frame_info in task["frames"]:
            if frame_info["index"] in selected_frames or not selected_frames:
                frame_path = Path(frame_info["path"])
                if frame_path.exists():
                    zip_file.write(frame_path, frame_path.name)

    zip_buffer.seek(0)

    return send_file(
        zip_buffer,
        as_attachment=True,
        download_name=f"video_frames_{task_id}.zip",
        mimetype="application/zip",
    )
