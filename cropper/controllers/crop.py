from pathlib import PurePosixPath

from google.cloud.exceptions import NotFound

from loom24_shared import logger
from services.storage import download_image, upload_image
from utils.detector import crop, CropMode


def _cropped_path(original_path: str) -> str:
    p = PurePosixPath(original_path)
    return str(p.with_name(f"{p.stem}-cropped.png"))


def crop_to_bucket(image_path: str, mode: CropMode = "front") -> str:
    logger.info(f"Downloading image — path={image_path} mode={mode}")
    try:
        image = download_image(image_path)
    except NotFound:
        raise FileNotFoundError(f"Image not found in bucket: {image_path}")

    logger.info(f"Running pose detection — path={image_path} size={image.size}")
    cropped = crop(image, mode=mode)

    dest = _cropped_path(image_path)
    logger.info(f"Uploading crop — src={image_path} dest={dest}")
    upload_image(cropped, dest)
    return dest
