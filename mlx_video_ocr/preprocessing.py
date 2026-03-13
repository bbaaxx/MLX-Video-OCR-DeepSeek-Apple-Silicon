#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import cv2
import numpy as np
from PIL import Image
from mlx_video_ocr.config import PREPROCESSING_CONFIG


def remove_background_pil(image):
    """Remove background using rembg"""
    try:
        from rembg import remove

        result = remove(image)
        return result
    except ImportError:
        print("⚠️ rembg not available, using simple background removal")
        img_array = np.array(image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

        rgba = np.zeros((img_array.shape[0], img_array.shape[1], 4), dtype=np.uint8)
        rgba[:, :, :3] = img_array
        rgba[:, :, 3] = mask

        return Image.fromarray(rgba, "RGBA")
    except Exception as e:
        print(f"❌ Background removal failed: {e}")
        return image


def auto_rotate_image(image):
    """Auto-rotate image"""
    try:
        img_array = np.array(image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)

        lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
        if lines is not None:
            angles = []
            for rho, theta in lines[:20]:
                angle = np.degrees(theta) - 90
                angles.append(angle)

            if angles:
                median_angle = np.median(angles)
                if abs(median_angle) > 1:
                    (h, w) = img_array.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                    rotated = cv2.warpAffine(
                        img_array,
                        M,
                        (w, h),
                        flags=cv2.INTER_CUBIC,
                        borderMode=cv2.BORDER_REPLICATE,
                    )
                    return Image.fromarray(rotated)
    except Exception as e:
        print(f"⚠️ Auto-rotate failed: {e}")

    return image


def enhance_image(image):
    """Image enhancement processing"""
    img_array = np.array(image)

    lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)

    return Image.fromarray(sharpened)


def remove_shadows(image):
    """Remove shadows"""
    img_array = np.array(image)
    rgb_planes = cv2.split(img_array)

    result_planes = []
    for plane in rgb_planes:
        dilated_img = cv2.dilate(plane, np.ones((7, 7), np.uint8))
        bg_img = cv2.medianBlur(dilated_img, 21)
        diff_img = 255 - cv2.absdiff(plane, bg_img)
        result_planes.append(diff_img)

    result = cv2.merge(result_planes)
    return Image.fromarray(result)


def binarize_image(image):
    """Binarization processing"""
    img_array = np.array(image.convert("L"))
    _, binary = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return Image.fromarray(binary, "L")


def preprocess_single_image(image, settings):
    """Preprocess single image"""
    processed = image.copy()
    intermediate_images = []

    try:
        if settings.get("auto_rotate", False):
            new_img = auto_rotate_image(processed)
            if new_img is not processed:
                intermediate_images.append(processed)
                processed = new_img

        if settings.get("enhance", False):
            new_img = enhance_image(processed)
            if new_img is not processed:
                intermediate_images.append(processed)
                processed = new_img

        if settings.get("remove_shadows", False):
            new_img = remove_shadows(processed)
            if new_img is not processed:
                intermediate_images.append(processed)
                processed = new_img

        if settings.get("binarize", False):
            new_img = binarize_image(processed)
            if new_img is not processed:
                intermediate_images.append(processed)
                processed = new_img

        if settings.get("remove_bg", False):
            new_img = remove_background_pil(processed)
            if new_img is not processed:
                intermediate_images.append(processed)
                processed = new_img

        for img in intermediate_images:
            if img is not None and img is not processed:
                try:
                    img.close()
                except:
                    pass

        return processed

    except Exception as e:
        print(f"⚠️ Image preprocessing failed: {e}")
        for img in intermediate_images:
            if img is not None:
                try:
                    img.close()
                except:
                    pass
        if processed is not None and processed is not image:
            try:
                processed.close()
            except:
                pass
        raise


def get_preprocessing_config(content_type, subcategory, complexity):
    """Get preprocessing config based on 3D classification"""
    try:
        config = PREPROCESSING_CONFIG[content_type][subcategory][complexity]
        return config
    except KeyError:
        return None


def preprocess_image_by_config(image, image_size):
    """Resize image to specified dimensions"""
    img_processed = image.copy()
    img_processed.thumbnail(image_size, Image.Resampling.LANCZOS)
    print(f"🖼️ Image preprocessed to {image_size}, actual size: {img_processed.size}")
    return img_processed
