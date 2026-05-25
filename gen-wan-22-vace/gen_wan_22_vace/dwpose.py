import os
import cv2
import numpy as np
from pathlib import Path
from typing import Optional

from .logger import get_logger
from .dwpose_utils import DWposeDetector

logger = get_logger(__name__)

LOCAL_MODELS_PATH = os.environ.get("LOCAL_MODELS_PATH", "/workspace/models")
DWPOSE_MODELS_DIR = os.path.join(LOCAL_MODELS_PATH, "dwpose")

_detector: Optional[DWposeDetector] = None


def _get_detector() -> DWposeDetector:
    global _detector
    if _detector is None:
        onnx_det = os.path.join(DWPOSE_MODELS_DIR, "yolox_l.onnx")
        onnx_pose = os.path.join(DWPOSE_MODELS_DIR, "dw-ll_ucoco_384.onnx")
        if not os.path.exists(onnx_det) or not os.path.exists(onnx_pose):
            raise FileNotFoundError(
                f"DWPose ONNX models not found at {DWPOSE_MODELS_DIR}. "
                "Upload yolox_l.onnx and dw-ll_ucoco_384.onnx to bucket at models/dwpose/"
            )
        _detector = DWposeDetector(onnx_det, onnx_pose)
        logger.info("DWPose detector loaded")
    return _detector


def _hwc3(x: np.ndarray) -> np.ndarray:
    assert x.dtype == np.uint8
    if x.ndim == 2:
        x = x[:, :, None]
    H, W, C = x.shape
    if C == 3:
        return x
    if C == 1:
        return np.concatenate([x, x, x], axis=2)
    if C == 4:
        color = x[:, :, 0:3].astype(np.float32)
        alpha = x[:, :, 3:4].astype(np.float32) / 255.0
        y = color * alpha + 255.0 * (1.0 - alpha)
        return y.clip(0, 255).astype(np.uint8)


def _pad64(x: int) -> int:
    return int(np.ceil(x / 64.0) * 64 - x)


def _process_frame(detector: DWposeDetector, frame_bgr: np.ndarray, target_h: int, target_w: int) -> np.ndarray:
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    img = _hwc3(frame_rgb)

    H_raw, W_raw, _ = img.shape
    k = 512.0 / float(min(H_raw, W_raw))
    interp = cv2.INTER_CUBIC if k > 1 else cv2.INTER_AREA
    H_t = int(np.round(H_raw * k))
    W_t = int(np.round(W_raw * k))
    img = cv2.resize(img, (W_t, H_t), interpolation=interp)

    H_pad, W_pad = _pad64(H_t), _pad64(W_t)
    img_padded = np.ascontiguousarray(np.pad(img, [[0, H_pad], [0, W_pad], [0, 0]], mode="edge"))

    pose = detector(img_padded)
    pose = np.ascontiguousarray(pose[:H_t, :W_t])
    pose = _hwc3(pose)

    pose = cv2.resize(pose, (target_w, target_h), interpolation=cv2.INTER_LINEAR)
    return cv2.cvtColor(pose, cv2.COLOR_RGB2BGR)


def generate_pose_video(input_video_path: str, video_length: int, target_h: int, target_w: int, fps: int) -> str:
    detector = _get_detector()

    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {input_video_path}")

    out_path = str(Path(input_video_path).stem) + "-pose.mp4"
    out_path = str(Path(input_video_path).parent / out_path)
    writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (target_w, target_h))

    count = 0
    try:
        while count < video_length:
            ret, frame = cap.read()
            if not ret:
                break
            writer.write(_process_frame(detector, frame, target_h, target_w))
            count += 1
    finally:
        cap.release()
        writer.release()

    if count == 0:
        raise RuntimeError(f"No frames read from video: {input_video_path}")

    logger.info(f"Generated pose video: {count} frames → {out_path}")
    return out_path
