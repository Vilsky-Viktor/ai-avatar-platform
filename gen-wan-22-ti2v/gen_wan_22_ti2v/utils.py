import io
import time
import functools
import base64
import cv2
import numpy as np
from gen_wan_22_ti2v.logger import get_logger
from PIL import Image

logger = get_logger("utils")

def to_image_bytes(obj, format="PNG") -> bytes:
    if isinstance(obj, bytes):
        return obj
    if hasattr(obj, 'save'):
        buf = io.BytesIO()
        obj.save(buf, format=format)
        return buf.getvalue()
    raise ValueError(f"Cannot convert to bytes: {type(obj)}")

def image_to_base64(image: Image.Image) -> str:
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str


def resize_image_with_padding(img: Image.Image, width: int, height: int) -> Image.Image:
    """Resize preserving aspect ratio, pad to exact (width, height) with gray fill."""
    img_ratio = img.width / img.height
    target_ratio = width / height
    if img_ratio > target_ratio:
        new_w = width
        new_h = round(width / img_ratio)
    else:
        new_h = height
        new_w = round(height * img_ratio)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    padded = Image.new("RGB", (width, height), (128, 128, 128))
    padded.paste(resized, ((width - new_w) // 2, (height - new_h) // 2))
    return padded


def bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes")
    return img


def enhance_image(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge((l, a, b))
    img = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    mean_brightness = np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    if mean_brightness < 80:
        gamma = 1.5
        table = np.array([(i / 255.0) ** (1.0 / gamma) * 255 for i in range(256)]).astype("uint8")
        img = cv2.LUT(img, table)

    return img


def timeit(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        logger.info(f"⏱ {func.__name__} took {elapsed:.3f}s")
        return result
    return wrapper
