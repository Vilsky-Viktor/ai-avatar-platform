from pathlib import PurePosixPath

from google.cloud.exceptions import NotFound

from storage import download_image, upload_image
from detector import crop_headshot


def _cropped_path(original_path: str, width: int, height: int) -> str:
    p = PurePosixPath(original_path)
    return str(p.with_name(f"{p.stem}-cropped-{width}x{height}{p.suffix}"))


def crop_headshot_to_bucket(image_path: str, width: int, height: int) -> str:
    try:
        image = download_image(image_path)
    except NotFound:
        raise FileNotFoundError(f"Image not found in bucket: {image_path}")

    cropped = crop_headshot(image, width, height)
    dest    = _cropped_path(image_path, width, height)
    upload_image(cropped, dest)
    return dest
