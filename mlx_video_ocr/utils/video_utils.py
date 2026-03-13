#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under GNU Affero General Public License v3.0 (AGPL-3.0).
# See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.en.html

import os
import cv2
import numpy as np


def extract_frames_from_video(
    video_path,
    output_dir,
    method="fixed_count",
    interval=5,
    total_frames=1000,
    sensitivity=0.5,
):
    """從影片提取幀"""
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Cannot open video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_video_frames / fps if fps > 0 else 0

    print(
        f"📹 Video info: {total_video_frames} frames, {fps:.2f} FPS, {duration:.2f} seconds"
    )

    frames = []

    if method == "fixed_interval":
        frame_interval = max(1, int(fps / interval))
        if frame_interval == 0:
            frame_interval = 1

        for frame_idx in range(0, total_video_frames, frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                frame_path = os.path.join(output_dir, f"frame_{len(frames):06d}.jpg")
                cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                frames.append(frame_path)

            if len(frames) >= total_frames:
                break

    elif method == "fixed_count":
        frame_interval = max(1, total_video_frames // total_frames)

        for frame_idx in range(0, total_video_frames, frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                frame_path = os.path.join(output_dir, f"frame_{len(frames):06d}.jpg")
                cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                frames.append(frame_path)

            if len(frames) >= total_frames:
                break

    elif method == "scene_change":
        prev_frame = None
        scene_change_threshold = (1.0 - sensitivity) * 0.35 + 0.4
        print(
            f"🎬 Scene change detection: sensitivity={sensitivity:.2f}, threshold={scene_change_threshold:.3f}"
        )

        for frame_idx in range(total_video_frames):
            ret, frame = cap.read()
            if not ret:
                break

            if prev_frame is not None:
                diff = cv2.absdiff(prev_frame, frame)
                non_zero_count = np.count_nonzero(diff)
                total_pixels = diff.shape[0] * diff.shape[1] * diff.shape[2]
                change_ratio = non_zero_count / total_pixels

                if change_ratio > scene_change_threshold:
                    frame_path = os.path.join(
                        output_dir, f"frame_{len(frames):06d}.jpg"
                    )
                    cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    frames.append(frame_path)

            prev_frame = frame.copy()

            if len(frames) >= total_frames:
                break

    cap.release()
    print(f"✅ Extraction completed: {len(frames)} frames")
    return frames
