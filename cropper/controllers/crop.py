from google.cloud.exceptions import NotFound
from PIL import Image

from loom24_shared import logger
from services.storage import download_image, upload_image
from utils.detector import crop, CropMode

_MODE_MAP = {
    "front":   "front",
    "quarter": "quarter",
    "side":    "side",
    "body":    "full_body",
}

MAX_SIZE = 2048


def crop_to_path(image_path: str, upload_path: str, mode: str = "front") -> tuple[int, int]:
    detector_mode: CropMode = _MODE_MAP.get(mode, mode)  # type: ignore[assignment]

    logger.info(f"Downloading image — path={image_path} mode={mode}")
    try:
        image = download_image(image_path)
    except NotFound:
        raise FileNotFoundError(f"Image not found in bucket: {image_path}")

    logger.info(f"Running pose detection — path={image_path} size={image.size}")
    cropped = crop(image, mode=detector_mode)

    if cropped.width > MAX_SIZE:
        logger.info(f"Resizing crop from {cropped.size} to {MAX_SIZE}x{MAX_SIZE}")
        cropped = cropped.resize((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)

    logger.info(f"Uploading result — dest={upload_path} size={cropped.size}")
    upload_image(cropped, upload_path)
    return cropped.width, cropped.height
