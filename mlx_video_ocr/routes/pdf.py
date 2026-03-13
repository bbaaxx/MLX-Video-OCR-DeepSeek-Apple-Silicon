#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import io
import os
import gc
import traceback
import uuid
import base64
from datetime import datetime
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image
import fitz
from mlx_video_ocr.config import MODE_QUICK_MAP, prompts
from mlx_video_ocr.preprocessing import (
    get_preprocessing_config,
    preprocess_image_by_config,
)
from mlx_video_ocr.engines.ocr_engine import generate_with_timeout_and_process
from mlx_video_ocr.utils.api_utils import cleanup_old_tasks
from mlx_video_ocr.shared_state import model_loaded_status, pdf_tasks, UPLOAD_FOLDER

pdf_bp = Blueprint("pdf", __name__)


@pdf_bp.route("/api/pdf/init", methods=["POST"])
def init_pdf_task():
    """Initialize PDF processing task"""
    cleanup_old_tasks(pdf_tasks, {}, {})

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    if not file or not file.filename or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

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

    pdf_save_path = None
    thumbnails = []

    try:
        task_id = str(uuid.uuid4())
        pdf_filename = secure_filename(file.filename)
        pdf_save_path = Path(UPLOAD_FOLDER) / f"{task_id}_{pdf_filename}"
        file.save(pdf_save_path)
        print(f"📄 Saved PDF for task {task_id} to: {pdf_save_path}")

        doc = fitz.open(pdf_save_path)
        total_pages = len(doc)
        print(f"📄 Processing PDF with {total_pages} pages for thumbnails")

        for page_num in range(total_pages):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(1, 1))
            img_thumb = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            img_thumb.thumbnail((200, 200), Image.Resampling.LANCZOS)
            buffered = io.BytesIO()
            img_thumb.save(buffered, format="PNG")
            thumb_b64 = base64.b64encode(buffered.getvalue()).decode()
            thumbnails.append(f"data:image/png;base64,{thumb_b64}")
            img_thumb.close()
            del pix

            if page_num % 10 == 0:
                print(f"📊 Generated thumbnails for {page_num + 1}/{total_pages} pages")

        doc.close()

        pdf_tasks[task_id] = {
            "pdf_path": str(pdf_save_path),
            "thumbnails": thumbnails,
            "content_type": content_type,
            "subcategory": subcategory,
            "complexity": complexity,
            "created_at": datetime.now(),
            "total_pages": total_pages,
        }

        print(f"✅ PDF task initialized: {task_id}, pages: {total_pages}")

        return jsonify(
            {
                "success": True,
                "task_id": task_id,
                "total_pages": total_pages,
                "thumbnails": thumbnails,
            }
        )
    except Exception as e:
        traceback.print_exc()
        if pdf_save_path and os.path.exists(pdf_save_path):
            os.remove(pdf_save_path)
        return jsonify({"error": f"PDF initialization failed: {str(e)}"}), 500
    finally:
        gc.collect()


@pdf_bp.route("/api/pdf/extract-pages", methods=["POST"])
def extract_pdf_pages():
    """Extract all PDF pages as image files for preprocessing"""
    data = request.get_json()
    task_id = data.get("task_id")

    if not task_id:
        return jsonify({"success": False, "error": "Task ID is required"}), 400

    if task_id not in pdf_tasks:
        return jsonify({"success": False, "error": "Task expired or not found"}), 404

    task = pdf_tasks[task_id]
    pdf_path = task.get("pdf_path")
    total_pages = task.get("total_pages")

    if not pdf_path:
        return jsonify({"success": False, "error": "PDF path not found in task"}), 400

    if not total_pages or total_pages <= 0:
        return jsonify({"success": False, "error": "Invalid total pages"}), 400

    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        return jsonify(
            {"success": False, "error": f"PDF file not found: {pdf_path}"}
        ), 404

    extract_dir = Path(UPLOAD_FOLDER) / f"pdf_extract_{task_id}"
    try:
        extract_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        return jsonify(
            {"success": False, "error": f"Failed to create extract directory: {str(e)}"}
        ), 500

    image_files = []
    doc = None

    try:
        doc = fitz.open(str(pdf_path))
        print(f"📄 Extracting {total_pages} pages from PDF for preprocessing...")

        upload_folder_path = Path(UPLOAD_FOLDER).resolve()

        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                filename = f"page_{page_num + 1}.png"
                file_path = extract_dir / filename
                img.save(file_path, "PNG")

                thumb = img.copy()
                thumb.thumbnail((200, 200), Image.Resampling.LANCZOS)
                buffered = io.BytesIO()
                thumb.save(buffered, format="PNG")
                thumb_b64 = base64.b64encode(buffered.getvalue()).decode()

                try:
                    file_path_resolved = file_path.resolve()
                    relative_path = str(
                        file_path_resolved.relative_to(upload_folder_path)
                    )
                except ValueError:
                    relative_path = f"pdf_extract_{task_id}/{filename}"

                image_files.append(
                    {
                        "filename": filename,
                        "file_path": str(file_path),
                        "file_url": f"/api/files/{relative_path}",
                        "thumb_b64": f"data:image/png;base64,{thumb_b64}",
                        "page_number": page_num + 1,
                    }
                )

                img.close()
                thumb.close()
                del pix

                if (page_num + 1) % 10 == 0:
                    print(f"📊 Extracted {page_num + 1}/{total_pages} pages")
            except Exception as e:
                print(f"⚠️ Error extracting page {page_num + 1}: {e}")
                traceback.print_exc()
                continue

        if doc:
            doc.close()
            doc = None

        task["extracted_images"] = image_files
        task["extract_dir"] = str(extract_dir)

        if len(image_files) == 0:
            return jsonify(
                {"success": False, "error": "No pages were extracted successfully"}
            ), 500

        print(f"✅ Extracted {len(image_files)}/{total_pages} pages from PDF")

        return jsonify(
            {"success": True, "images": image_files, "total_images": len(image_files)}
        )
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        print(f"❌ Error in extract_pdf_pages: {error_msg}")
        return jsonify(
            {"success": False, "error": f"Failed to extract pages: {error_msg}"}
        ), 500
    finally:
        if doc:
            try:
                doc.close()
            except:
                pass
        gc.collect()


@pdf_bp.route("/api/files/<path:filepath>")
def serve_file(filepath):
    """提供文件访问服务"""
    try:
        file_path = Path(UPLOAD_FOLDER) / filepath
        file_path = file_path.resolve()
        upload_folder_path = Path(UPLOAD_FOLDER).resolve()

        try:
            file_path.relative_to(upload_folder_path)
        except ValueError:
            return jsonify({"error": "Access denied: File outside upload folder"}), 403

        if not file_path.exists() or not file_path.is_file():
            return jsonify({"error": "File not found"}), 404

        return send_file(file_path)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/api/pdf/preview-page", methods=["POST"])
def preview_page():
    """Preview specific PDF page"""
    data = request.get_json()
    task_id = data.get("task_id")
    page_number = data.get("page_number", 1)

    if task_id not in pdf_tasks:
        return jsonify({"error": "Task expired or not found"}), 404

    task = pdf_tasks[task_id]
    pdf_path = task["pdf_path"]
    total_pages = task["total_pages"]

    if page_number < 1 or page_number > total_pages:
        return jsonify({"error": "Page out of range"}), 400

    img_b64 = None
    doc = None
    try:
        doc = fitz.open(pdf_path)
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_b64 = base64.b64encode(buffered.getvalue()).decode()

        img.close()
        del pix

        return jsonify({"success": True, "image": f"data:image/png;base64,{img_b64}"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to generate preview: {str(e)}"}), 500
    finally:
        if doc:
            doc.close()
        gc.collect()


@pdf_bp.route("/api/pdf/process-batch", methods=["POST"])
def process_pdf_batch():
    """Process PDF pages batch with OCR"""
    data = request.get_json()
    task_id = data.get("task_id")
    batch_index = data.get("batch_index", 0)
    batch_size = data.get("batch_size", 2)
    processed_images = data.get("processed_images", {})

    if task_id not in pdf_tasks:
        return jsonify({"error": "Task not found or expired"}), 404

    task = pdf_tasks[task_id]
    pdf_path = task["pdf_path"]
    content_type = task["content_type"]
    subcategory = task["subcategory"]
    complexity = task["complexity"]
    total_pages = task["total_pages"]

    config = get_preprocessing_config(content_type, subcategory, complexity)
    if not config:
        return jsonify(
            {
                "error": f"Invalid configuration: {content_type}/{subcategory}/{complexity}"
            }
        ), 400

    prompt = prompts.get("basic", "<image>\nExtract all text from the image.")

    start_page_idx = batch_index * batch_size
    end_page_idx = min(start_page_idx + batch_size, total_pages)

    if not model_loaded_status.value:
        return jsonify({"error": "Model not ready. Please check server status."}), 500

    results = []
    doc = None

    try:
        use_processed_images = bool(processed_images)

        if use_processed_images:
            print(
                f"🔍 Processing batch {batch_index + 1} with PREPROCESSED images, pages {start_page_idx + 1}-{end_page_idx}"
            )
            print(f"📋 Received processed_images keys: {list(processed_images.keys())}")
        else:
            doc = fitz.open(pdf_path)
            print(
                f"🔍 Processing batch {batch_index + 1}, pages {start_page_idx + 1}-{end_page_idx}"
            )

        for i in range(start_page_idx, end_page_idx):
            page_num = i + 1
            pix = None

            if use_processed_images and str(page_num) in processed_images:
                processed_path = processed_images[str(page_num)]
                print(
                    f"📄 Loading PREPROCESSED page {page_num}/{total_pages} for OCR..."
                )

                try:
                    file_path = Path(processed_path)
                    if not file_path.exists():
                        raise FileNotFoundError(
                            f"Processed image not found: {processed_path}"
                        )

                    img = Image.open(file_path).convert("RGB")
                    print(
                        f"✅ Loaded preprocessed image for page {page_num}: {file_path}"
                    )
                except Exception as e:
                    print(
                        f"⚠️ Failed to load preprocessed image for page {page_num}: {e}"
                    )
                    if doc is None:
                        doc = fitz.open(pdf_path)
                    page = doc[page_num - 1]
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            else:
                if doc is None:
                    doc = fitz.open(pdf_path)
                print(f"📄 Loading page {page_num}/{total_pages} for OCR...")
                page = doc[page_num - 1]

                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            img_processed = preprocess_image_by_config(img, config["image_size"])

            print(
                f"📄 Processing page {page_num} with: {content_type}/{subcategory}/{complexity}"
            )
            text = generate_with_timeout_and_process(
                image=img_processed,
                prompt=prompt,
                max_tokens=config["max_tokens"],
                timeout=300,
            )

            results.append({"page": page_num, "text": text})

            img.close()
            if pix is not None:
                del pix
            del img
            gc.collect()

            print(f"✅ Page {page_num} completed, text length: {len(text)}")

        has_more = end_page_idx < total_pages
        next_batch = batch_index + 1 if has_more else None

        print(
            f"✅ Batch {batch_index + 1} completed, processed: {end_page_idx}/{total_pages}"
        )

        return jsonify(
            {
                "success": True,
                "results": results,
                "has_more": has_more,
                "next_batch_index": next_batch,
                "processed_pages": end_page_idx,
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
        return jsonify({"error": f"Batch processing failed: {str(e)}"}), 500
    finally:
        if doc:
            doc.close()
        gc.collect()


@pdf_bp.route("/api/video/process-batch", methods=["POST"])
def process_video_batch():
    """處理視頻截圖批次OCR"""
    data = request.get_json()
    batch_index = data.get("batch_index", 0)
    batch_size = data.get("batch_size", 2)
    processed_images = data.get("processed_images", {})
    content_type = data.get("content_type", "Document")
    subcategory = data.get("subcategory", "Academic")
    complexity = data.get("complexity", "Medium")

    if not processed_images:
        return jsonify({"error": "No processed images provided"}), 400

    config = get_preprocessing_config(content_type, subcategory, complexity)
    if not config:
        return jsonify(
            {
                "error": f"Invalid configuration: {content_type}/{subcategory}/{complexity}"
            }
        ), 400

    prompt = prompts.get("basic", "<image>\nExtract all text from the image.")

    frame_numbers = sorted([int(k) for k in processed_images.keys()])
    total_frames = len(frame_numbers)

    start_idx = batch_index * batch_size
    end_idx = min(start_idx + batch_size, total_frames)

    if not model_loaded_status.value:
        return jsonify({"error": "Model not ready. Please check server status."}), 500

    results = []

    try:
        print(
            f"🔍 Processing video frames batch {batch_index + 1}, frames {start_idx + 1}-{end_idx}"
        )

        for i in range(start_idx, end_idx):
            if i >= len(frame_numbers):
                break

            frame_num = frame_numbers[i]
            processed_path = processed_images[str(frame_num)]

            print(
                f"📄 Loading PREPROCESSED frame {frame_num}/{total_frames} for OCR..."
            )

            try:
                file_path = Path(processed_path)
                if not file_path.exists():
                    raise FileNotFoundError(
                        f"Processed image not found: {processed_path}"
                    )

                img = Image.open(file_path).convert("RGB")
                print(
                    f"✅ Loaded preprocessed image for frame {frame_num}: {file_path}"
                )
            except Exception as e:
                print(f"⚠️ Failed to load preprocessed image for frame {frame_num}: {e}")
                results.append({"page": frame_num, "text": "", "error": str(e)})
                continue

            img_processed = preprocess_image_by_config(img, config["image_size"])

            print(
                f"📄 Processing frame {frame_num} with: {content_type}/{subcategory}/{complexity}"
            )
            text = generate_with_timeout_and_process(
                image=img_processed,
                prompt=prompt,
                max_tokens=config["max_tokens"],
                timeout=160,
            )

            results.append({"page": frame_num, "text": text})

            img.close()
            del img
            gc.collect()

            print(f"✅ Frame {frame_num} completed, text length: {len(text)}")

        has_more = end_idx < total_frames
        next_batch = batch_index + 1 if has_more else None

        print(
            f"✅ Video batch {batch_index + 1} completed, processed: {end_idx}/{total_frames}"
        )

        return jsonify(
            {
                "success": True,
                "results": results,
                "has_more": has_more,
                "next_batch_index": next_batch,
                "processed_pages": end_idx,
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
        return jsonify({"error": f"Batch processing failed: {str(e)}"}), 500
    finally:
        gc.collect()


@pdf_bp.route("/api/pdf/cancel", methods=["POST"])
def cancel_pdf_task():
    """Cancel PDF processing task"""
    data = request.get_json()
    task_id = data.get("task_id")

    if task_id in pdf_tasks:
        pdf_file_path = pdf_tasks[task_id].get("pdf_path")
        if pdf_file_path and os.path.exists(pdf_file_path):
            try:
                os.remove(pdf_file_path)
                print(f"🗑️ Removed PDF file for cancelled task: {pdf_file_path}")
            except Exception as e:
                print(
                    f"❌ Error removing PDF file for cancelled task {pdf_file_path}: {e}"
                )
        del pdf_tasks[task_id]
        gc.collect()
        print(f"❌ PDF task cancelled: {task_id}")
        return jsonify({"success": True})
    return jsonify({"error": "Task not found or expired"}), 404
