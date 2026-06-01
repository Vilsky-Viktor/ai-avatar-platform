from dataclasses import dataclass
from typing import Literal

import numpy as np
import mediapipe as mp
from PIL import Image

CropMode = Literal["front", "quarter", "side", "full_body"]

_PoseLandmark = mp.solutions.pose.PoseLandmark
_pose: mp.solutions.pose.Pose | None = None


def _get_pose() -> mp.solutions.pose.Pose:
    global _pose
    if _pose is None:
        _pose = mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=0.5,
        )
    return _pose


_HEAD_SHOULDER_LANDMARKS = [
    _PoseLandmark.NOSE,
    _PoseLandmark.LEFT_EYE,
    _PoseLandmark.RIGHT_EYE,
    _PoseLandmark.LEFT_EAR,
    _PoseLandmark.RIGHT_EAR,
    _PoseLandmark.LEFT_SHOULDER,
    _PoseLandmark.RIGHT_SHOULDER,
]

_FULL_BODY_LANDMARKS = [
    _PoseLandmark.NOSE,
    _PoseLandmark.LEFT_EYE,
    _PoseLandmark.RIGHT_EYE,
    _PoseLandmark.LEFT_EAR,
    _PoseLandmark.RIGHT_EAR,
    _PoseLandmark.LEFT_SHOULDER,
    _PoseLandmark.RIGHT_SHOULDER,
    _PoseLandmark.LEFT_HIP,
    _PoseLandmark.RIGHT_HIP,
    _PoseLandmark.LEFT_KNEE,
    _PoseLandmark.RIGHT_KNEE,
    _PoseLandmark.LEFT_ANKLE,
    _PoseLandmark.RIGHT_ANKLE,
    _PoseLandmark.LEFT_FOOT_INDEX,
    _PoseLandmark.RIGHT_FOOT_INDEX,
]

_LOWER_BODY_LANDMARKS = [
    _PoseLandmark.LEFT_HIP,
    _PoseLandmark.RIGHT_HIP,
    _PoseLandmark.LEFT_KNEE,
    _PoseLandmark.RIGHT_KNEE,
    _PoseLandmark.LEFT_ANKLE,
    _PoseLandmark.RIGHT_ANKLE,
]

_MIN_VISIBILITY           = 0.3
_MIN_VISIBILITY_FULL_BODY = 0.1  # lower body scores weaker in distant full-body shots
_MIN_LANDMARKS            = 3
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


def crop(image: Image.Image, mode: CropMode = "front") -> Image.Image:
    img_rgb   = image.convert("RGB")
    img_array = np.array(img_rgb)
    h, w      = img_array.shape[:2]

    results = _get_pose().process(img_array)

    if not results.pose_landmarks:
        raise ValueError("No face or shoulders detected in this image")

    lm = results.pose_landmarks.landmark

    if mode == "full_body":
        left, top, right, bottom = _compute_full_body_crop(lm, w, h)
    else:
        left, top, right, bottom = _compute_headshot_crop(lm, w, h, mode)

    left, top, right, bottom = _fit_to_square(left, top, right, bottom, w, h)

    return img_rgb.crop((left, top, right, bottom))


def _compute_headshot_crop(lm, w: int, h: int, mode: str) -> tuple[float, float, float, float]:
    visible = [
        (lm[i].x * w, lm[i].y * h)
        for i in _HEAD_SHOULDER_LANDMARKS
        if lm[i].visibility > _MIN_VISIBILITY
    ]

    if len(visible) < _MIN_LANDMARKS:
        raise ValueError("Not enough facial landmarks detected — please use a clear front or quarter-view photo")

    xs = [p[0] for p in visible]
    ys = [p[1] for p in visible]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    span_x = max_x - min_x
    span_y = max_y - min_y

    shoulder_mid_x = (lm[_PoseLandmark.LEFT_SHOULDER].x + lm[_PoseLandmark.RIGHT_SHOULDER].x) / 2 * w
    nose_x         = lm[_PoseLandmark.NOSE].x * w
    face_turn      = (nose_x - shoulder_mid_x) / max(span_x, 1)

    p = _PADDING_CONFIG[mode]

    left   = min_x - span_x * (p.side + p.turn_scale_side * max(0.0, -face_turn))
    right  = max_x + span_x * (p.side + p.turn_scale_side * max(0.0,  face_turn))
    top    = min_y - span_y * (p.top  + p.turn_scale_top  * abs(face_turn))
    bottom = max_y + span_y * p.bottom

    return left, top, right, bottom


def _compute_full_body_crop(lm, w: int, h: int) -> tuple[float, float, float, float]:
    visible = [
        (lm[i].x * w, lm[i].y * h)
        for i in _FULL_BODY_LANDMARKS
        if lm[i].visibility > _MIN_VISIBILITY_FULL_BODY
    ]

    if len(visible) < _MIN_LANDMARKS:
        raise ValueError("Not enough body landmarks detected — please use a clear full-body photo")

    lower_body_visible = sum(
        1 for i in _LOWER_BODY_LANDMARKS
        if lm[i].visibility > _MIN_VISIBILITY_FULL_BODY
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
