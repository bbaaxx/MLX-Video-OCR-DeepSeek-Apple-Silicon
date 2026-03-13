#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import os
import gc
import re
import traceback
import time
import io
import threading
import multiprocessing
import queue
from pathlib import Path
from PIL import Image
import mlx.core as mx
from mlx_vlm import load, generate

os.environ["HF_HOME"] = str(Path.home() / "hf_cache")

_model_instance = None
_processor_instance = None
_model_instance_lock = threading.Lock()


def _load_model_for_subprocess():
    """Load MLX model in subprocess"""
    global _model_instance, _processor_instance, _model_instance_lock
    with _model_instance_lock:
        if _model_instance is not None and _processor_instance is not None:
            return True
        try:
            print(f"[{os.getpid()}] 🚀 Loading MLX DeepSeek-OCR model in subprocess...")
            model_path = "mlx-community/DeepSeek-OCR-8bit"
            _model_instance, _processor_instance = load(model_path)
            print(f"[{os.getpid()}] ✅ Model loaded successfully in subprocess!")
            print(f"[{os.getpid()}] 🔊 Metal available: {mx.metal.is_available()}")
            return True
        except Exception as e:
            print(f"[{os.getpid()}] ❌ Error loading model in subprocess: {e}")
            traceback.print_exc()
            _model_instance = None
            _processor_instance = None
            return False


def _run_ocr_in_process(image_bytes, prompt, max_tokens, output_queue):
    """Run OCR in separate process"""
    if not _load_model_for_subprocess():
        output_queue.put({"error": "Model load failed in subprocess"})
        return
    try:
        t_load_start = time.time()
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        t_load_end = time.time()
        print(
            f"[{os.getpid()}] 📸 Image loaded: {img.size}, mode: {img.mode}, time: {t_load_end - t_load_start:.2f}s"
        )

        print(f"[{os.getpid()}] 🔍 Starting OCR in subprocess...")
        print(f"[{os.getpid()}] 🔍 Image object type: {type(img)}")
        print(f"[{os.getpid()}] 🔍 Image size: {img.size}, mode: {img.mode}")

        if mx.metal.is_available():
            print(f"[{os.getpid()}] 🔧 Metal available, using default device (GPU)")
        else:
            mx.set_default_device(mx.cpu)
            print(f"[{os.getpid()}] 🔧 Set default device to CPU")

        print(f"[{os.getpid()}] 🔍 Prompt: {prompt[:100]}...")
        print(f"[{os.getpid()}] 🔍 Max tokens: {max_tokens}")

        if _model_instance is None or _processor_instance is None:
            raise RuntimeError("Model or processor is None - model not properly loaded")

        t_ocr_start = time.time()

        max_retries = 3
        retry_tokens = [min(max_tokens, 2048), min(max_tokens, 512), 256]
        res = None

        for attempt in range(max_retries):
            try:
                current_max_tokens = retry_tokens[attempt]
                print(
                    f"[{os.getpid()}] 🔍 Attempt {attempt + 1}/{max_retries}: max_tokens={current_max_tokens}"
                )

                res = generate(
                    model=_model_instance,
                    processor=_processor_instance,
                    image=img,
                    prompt=prompt,
                    max_tokens=current_max_tokens,
                    temperature=0.0,
                    use_cache=False,
                )

                if res is not None:
                    break

            except AttributeError as e:
                if "'NoneType' object has no attribute 'token'" in str(e):
                    print(
                        f"[{os.getpid()}] ⚠️ Attempt {attempt + 1} failed: mlx-vlm bug (last_response=None)"
                    )
                    if attempt < max_retries - 1:
                        time.sleep(1)
                        continue
                    else:
                        raise RuntimeError(
                            "mlx-vlm generate() failed: stream_generate() produced no response. This may be a known issue in CPU mode."
                        )
                else:
                    raise
            except Exception as e:
                print(
                    f"[{os.getpid()}] ⚠️ Attempt {attempt + 1} failed: {type(e).__name__}: {str(e)[:100]}"
                )
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                else:
                    raise

        t_ocr_end = time.time()

        if res is None:
            raise RuntimeError("generate() still returned None after all retries")

        text = res.text if hasattr(res, "text") else str(res)
        text = re.sub(r"<\|grounding\|>|\[\[.*?\]\]", "", text).strip()

        print(
            f"[{os.getpid()}] ✅ OCR completed in {t_ocr_end - t_ocr_start:.2f}s, text length: {len(text)}"
        )
        output_queue.put(
            {
                "success": True,
                "text": text,
                "timing": {
                    "load": t_load_end - t_load_start,
                    "inference": t_ocr_end - t_ocr_start,
                },
            }
        )
    except Exception as e:
        traceback.print_exc()
        output_queue.put({"error": f"OCR processing failed in subprocess: {str(e)}"})
    finally:
        if "img" in locals() and img is not None:
            img.close()
        gc.collect()


def generate_with_timeout_and_process(image, prompt, max_tokens=8192, timeout=160):
    """Generate OCR with timeout using separate process"""
    t_serialize_start = time.time()
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=85)
    image_bytes = buffered.getvalue()
    t_serialize_end = time.time()

    print(
        f"📦 Image serialized: {len(image_bytes) / 1024:.1f}KB (JPEG), time: {t_serialize_end - t_serialize_start:.2f}s"
    )

    output_queue = multiprocessing.Queue()
    t_process_start = time.time()

    process = multiprocessing.Process(
        target=_run_ocr_in_process, args=(image_bytes, prompt, max_tokens, output_queue)
    )
    process.start()
    process.join(timeout=timeout)

    if process.is_alive():
        print(
            f"[{os.getpid()}] ⏰ OCR processing timed out. Terminating subprocess {process.pid}."
        )
        process.terminate()
        process.join(timeout=5)
        if process.is_alive():
            process.kill()
        raise TimeoutError("OCR processing timeout")

    if process.exitcode != 0:
        print(f"[{os.getpid()}] ❌ OCR subprocess exited with code {process.exitcode}")
        try:
            result = output_queue.get_nowait()
            if "error" in result:
                raise RuntimeError(result["error"])
        except queue.Empty:
            pass
        raise RuntimeError(
            f"OCR subprocess exited unexpectedly (code {process.exitcode})"
        )

    try:
        result = output_queue.get(timeout=1)
        t_process_end = time.time()

        if "success" in result:
            timing = result.get("timing", {})
            print(
                f"⏱️ Total time: {t_process_end - t_process_start:.2f}s (serialization: {t_serialize_end - t_serialize_start:.2f}s, inference: {timing.get('inference', 0):.2f}s)"
            )
            return result["text"]
        else:
            raise RuntimeError(result.get("error", "Unknown OCR error in subprocess"))
    except queue.Empty:
        raise RuntimeError("OCR subprocess finished but no result in queue.")
