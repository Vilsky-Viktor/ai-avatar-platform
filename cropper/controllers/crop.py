from pathlib import PurePosixPath

from google.cloud.exceptions import NotFound

from storage import download_image, upload_image
from detector import crop, CropMode


def _cropped_path(original_path: str) -> str:
    p = PurePosixPath(original_path)
    return str(p.with_name(f"{p.stem}-cropped{p.suffix}"))


def crop_to_bucket(image_path: str, mode: CropMode = "front") -> str:
    try:
        image = download_image(image_path)
    except NotFound:
        raise FileNotFoundError(f"Image not found in bucket: {image_path}")

    cropped = crop(image, mode=mode)
    dest    = _cropped_path(image_path)
    upload_image(cropped, dest)
    return dest
