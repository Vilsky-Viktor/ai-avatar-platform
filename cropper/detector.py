import numpy as np
import mediapipe as mp
from PIL import Image

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


# Landmarks that define the head + shoulders bounding box
_HEAD_SHOULDER_LANDMARKS = [
    _PoseLandmark.NOSE,
    _PoseLandmark.LEFT_EYE,
    _PoseLandmark.RIGHT_EYE,
    _PoseLandmark.LEFT_EAR,
    _PoseLandmark.RIGHT_EAR,
    _PoseLandmark.LEFT_SHOULDER,
    _PoseLandmark.RIGHT_SHOULDER,
]

_MIN_VISIBILITY = 0.3
_MIN_LANDMARKS  = 3


def crop_headshot(image: Image.Image, target_w: int, target_h: int) -> Image.Image:
    img_rgb   = image.convert("RGB")
    img_array = np.array(img_rgb)
    h, w      = img_array.shape[:2]

    results = _get_pose().process(img_array)

    if not results.pose_landmarks:
        return _fallback_crop(img_rgb, target_w, target_h)

    lm = results.pose_landmarks.landmark
    visible = [
        (lm[i].x * w, lm[i].y * h)
        for i in _HEAD_SHOULDER_LANDMARKS
        if lm[i].visibility > _MIN_VISIBILITY
    ]

    if len(visible) < _MIN_LANDMARKS:
        return _fallback_crop(img_rgb, target_w, target_h)

    xs = [p[0] for p in visible]
    ys = [p[1] for p in visible]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    span_x = max_x - min_x
    span_y = max_y - min_y

    # Measure how far the nose is turned from the shoulder midpoint.
    # face_turn: 0 = frontal, positive = nose pointing right, negative = nose pointing left.
    shoulder_mid_x = (lm[_PoseLandmark.LEFT_SHOULDER].x + lm[_PoseLandmark.RIGHT_SHOULDER].x) / 2 * w
    nose_x         = lm[_PoseLandmark.NOSE].x * w
    face_turn      = (nose_x - shoulder_mid_x) / max(span_x, 1)

    # For profile/quarter views add extra padding on the nose side so the
    # forehead (which has no landmark) is not clipped. Frontal view gets symmetric base padding.
    PAD_SIDE        = 0.20
    PAD_TOP         = 0.25
    PAD_BOTTOM      = 0.12
    TURN_SCALE_SIDE = 0.30  # extra horizontal padding toward the nose side
    TURN_SCALE_TOP  = 0.60  # extra top padding — crown sits higher above ear in profile

    left   = min_x - span_x * (PAD_SIDE + TURN_SCALE_SIDE * max(0.0, -face_turn))
    right  = max_x + span_x * (PAD_SIDE + TURN_SCALE_SIDE * max(0.0,  face_turn))
    top    = min_y - span_y * (PAD_TOP  + TURN_SCALE_TOP  * abs(face_turn))
    bottom = max_y + span_y * PAD_BOTTOM

    left, top, right, bottom = _fit_to_ratio(left, top, right, bottom, w, h, target_w, target_h)

    cropped = img_rgb.crop((left, top, right, bottom))
    return cropped.resize((target_w, target_h), Image.LANCZOS)


def _fit_to_ratio(
    left: float, top: float, right: float, bottom: float,
    img_w: int, img_h: int,
    target_w: int, target_h: int,
) -> tuple[int, int, int, int]:
    """Expand the crop region to match the target aspect ratio, then clamp to image bounds."""
    target_ratio = target_w / target_h
    crop_w = right - left
    crop_h = bottom - top

    if crop_w / crop_h > target_ratio:
        new_h  = crop_w / target_ratio
        extra  = (new_h - crop_h) / 2
        top   -= extra
        bottom += extra
    else:
        new_w  = crop_h * target_ratio
        extra  = (new_w - crop_w) / 2
        left  -= extra
        right += extra

    left   = max(0.0, left)
    top    = max(0.0, top)
    right  = min(float(img_w), right)
    bottom = min(float(img_h), bottom)

    return int(left), int(top), int(right), int(bottom)


def _fallback_crop(image: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Top-biased center crop when no pose is detected."""
    w, h         = image.size
    target_ratio = target_w / target_h
    current_ratio = w / h

    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left  = (w - new_w) // 2
        image = image.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top   = max(0, (h - new_h) // 4)  # bias toward top for portraits
        image = image.crop((0, top, w, top + new_h))

    return image.resize((target_w, target_h), Image.LANCZOS)
