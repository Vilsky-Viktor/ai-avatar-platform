import os
import queue
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import numpy as np
from PIL import Image
from ultralytics import YOLO


CropMode = Literal["front", "quarter", "side", "full_body"]

# COCO 17 keypoint indices
_NOSE           = 0
_LEFT_EYE       = 1
_RIGHT_EYE      = 2
_LEFT_EAR       = 3
_RIGHT_EAR      = 4
_LEFT_SHOULDER  = 5
_RIGHT_SHOULDER = 6
_LEFT_HIP       = 11
_RIGHT_HIP      = 12
_LEFT_KNEE      = 13
_RIGHT_KNEE     = 14
_LEFT_ANKLE     = 15
_RIGHT_ANKLE    = 16

_HEAD_SHOULDER_KPS = [_NOSE, _LEFT_EYE, _RIGHT_EYE, _LEFT_EAR, _RIGHT_EAR, _LEFT_SHOULDER, _RIGHT_SHOULDER]
_FULL_BODY_KPS     = [_NOSE, _LEFT_EYE, _RIGHT_EYE, _LEFT_EAR, _RIGHT_EAR, _LEFT_SHOULDER, _RIGHT_SHOULDER,
                      _LEFT_HIP, _RIGHT_HIP, _LEFT_KNEE, _RIGHT_KNEE, _LEFT_ANKLE, _RIGHT_ANKLE]
_LOWER_BODY_KPS    = [_LEFT_HIP, _RIGHT_HIP, _LEFT_KNEE, _RIGHT_KNEE, _LEFT_ANKLE, _RIGHT_ANKLE]

_YOLO_MODEL  = os.getenv("YOLO_MODEL", "models/yolo11n-pose.pt")
_POOL_SIZE   = int(os.getenv("MAX_CONCURRENT_CROPS", "5"))
_model_pool: queue.Queue = queue.Queue()

_MIN_CONF              = 0.3
_MIN_CONF_FULL_BODY    = 0.1
_MIN_LANDMARKS         = 3
_MIN_LOWER_BODY_LANDMARKS = 2


@dataclass
class _PaddingConfig:
    side: float
    top: float
    bottom: float
    turn_scale_side: float = 0.0
    turn_scale_top: float  = 0.0


_PADDING_CONFIG: dict[str, _PaddingConfig] = {
    "front":     _PaddingConfig(side=0.21, top=0.50, bottom=0.12, turn_scale_side=0.30, turn_scale_top=0.30),
    "quarter":   _PaddingConfig(side=0.23, top=0.50, bottom=0.12, turn_scale_side=0.35, turn_scale_top=0.30),
    "side":      _PaddingConfig(side=0.28, top=0.40, bottom=0.05, turn_scale_side=0.40, turn_scale_top=0.20),
    "full_body": _PaddingConfig(side=0.20, top=0.15, bottom=0.05),
}


def _make_model() -> YOLO:
    return YOLO(_YOLO_MODEL)


def warmup() -> None:
    Path(_YOLO_MODEL).parent.mkdir(parents=True, exist_ok=True)
    dummy = Image.fromarray(np.zeros((64, 64, 3), dtype=np.uint8))
    for _ in range(_POOL_SIZE):
        model = _make_model()
        model(dummy, verbose=False)
        _model_pool.put(model)


def crop(image: Image.Image, mode: CropMode = "front") -> Image.Image:
    img = image.convert("RGB")
    w, h = img.size

    model = _model_pool.get()
    try:
        results = model(img, verbose=False)
    finally:
        _model_pool.put(model)

    if not results or results[0].keypoints is None or len(results[0].boxes) == 0:
        raise ValueError("No person detected in this image")

    best_idx = int(results[0].boxes.conf.argmax())

    kpts  = results[0].keypoints
    kpts_xy   = kpts.xy[best_idx].cpu().numpy()    # (17, 2) — pixel coords
    kpts_conf = kpts.conf[best_idx].cpu().numpy() if kpts.has_visible else np.ones(17, dtype=np.float32)

    if mode == "full_body":
        left, top, right, bottom = _compute_full_body_crop(kpts_xy, kpts_conf, w, h)
    else:
        left, top, right, bottom = _compute_headshot_crop(kpts_xy, kpts_conf, w, h, mode)

    left, top, right, bottom = _fit_to_square(left, top, right, bottom, w, h)

    return img.crop((left, top, right, bottom))


def _compute_headshot_crop(
    kpts_xy: np.ndarray, kpts_conf: np.ndarray, w: int, h: int, mode: str
) -> tuple[float, float, float, float]:
    visible = [
        (kpts_xy[i, 0], kpts_xy[i, 1])
        for i in _HEAD_SHOULDER_KPS
        if kpts_conf[i] > _MIN_CONF
    ]

    if len(visible) < _MIN_LANDMARKS:
        raise ValueError("Not enough facial landmarks detected — please use a clear front or quarter-view photo")

    xs = [p[0] for p in visible]
    ys = [p[1] for p in visible]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    span_x = max_x - min_x
    span_y = max_y - min_y

    shoulder_mid_x = (kpts_xy[_LEFT_SHOULDER, 0] + kpts_xy[_RIGHT_SHOULDER, 0]) / 2
    nose_x         = kpts_xy[_NOSE, 0]
    face_turn      = (nose_x - shoulder_mid_x) / max(span_x, 1)

    p = _PADDING_CONFIG[mode]

    left   = min_x - span_x * (p.side + p.turn_scale_side * max(0.0, -face_turn))
    right  = max_x + span_x * (p.side + p.turn_scale_side * max(0.0,  face_turn))
    top    = min_y - span_y * (p.top  + p.turn_scale_top  * abs(face_turn))
    bottom = max_y + span_y * p.bottom

    return left, top, right, bottom


def _compute_full_body_crop(
    kpts_xy: np.ndarray, kpts_conf: np.ndarray, w: int, h: int
) -> tuple[float, float, float, float]:
    visible = [
        (kpts_xy[i, 0], kpts_xy[i, 1])
        for i in _FULL_BODY_KPS
        if kpts_conf[i] > _MIN_CONF_FULL_BODY
    ]

    if len(visible) < _MIN_LANDMARKS:
        raise ValueError("Not enough body landmarks detected — please use a clear full-body photo")

    lower_body_visible = sum(
        1 for i in _LOWER_BODY_KPS
        if kpts_conf[i] > _MIN_CONF_FULL_BODY
    )
    if lower_body_visible < _MIN_LOWER_BODY_LANDMARKS:
        raise ValueError("Lower body not detected — please use a photo where the full body (legs, feet) is visible")

    xs = [p[0] for p in visible]
    ys = [p[1] for p in visible]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    span_x = max_x - min_x
    span_y = max_y - min_y

    p = _PADDING_CONFIG["full_body"]

    left   = min_x - span_x * p.side
    right  = max_x + span_x * p.side
    top    = min_y - span_y * p.top
    bottom = max_y + span_y * p.bottom

    return left, top, right, bottom


def _fit_to_square(
    left: float, top: float, right: float, bottom: float,
    img_w: int, img_h: int,
) -> tuple[int, int, int, int]:
    """Expand the crop region to a 1:1 square that fits within the image."""
    crop_w = right - left
    crop_h = bottom - top

    if crop_w > crop_h:
        extra  = (crop_w - crop_h) / 2
        top   -= extra
        bottom += extra
    else:
        extra  = (crop_h - crop_w) / 2
        left  -= extra
        right += extra

    # If the square is larger than the image in either dimension, shrink it.
    # Doing this before the shift guarantees the box can always fit without
    # conflicting shifts that cancel each other and leave a non-square result.
    side = min(right - left, float(img_w), float(img_h))
    cx   = (left + right) / 2
    cy   = (top + bottom) / 2
    left, right  = cx - side / 2, cx + side / 2
    top,  bottom = cy - side / 2, cy + side / 2

    # Shift to stay within image bounds (box now fits, so one pass is enough)
    if left < 0:
        right -= left;  left = 0.0
    if top < 0:
        bottom -= top;  top = 0.0
    if right > img_w:
        left -= right - img_w;  right = float(img_w)
    if bottom > img_h:
        top  -= bottom - img_h; bottom = float(img_h)

    l, t, r, b = int(left), int(top), int(right), int(bottom)

    # Force exact square after int truncation (at most 1-pixel adjustment)
    side_i = min(r - l, b - t)
    return l, t, l + side_i, t + side_i
