import io
import os

from google.cloud import storage
from PIL import Image, ImageOps

BUCKET_NAME = os.environ.get("BUCKET_NAME", "loom24-mvp.firebasestorage.app")

_client: storage.Client | None = None


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = storage.Client()
    return _client


def download_image(blob_path: str) -> Image.Image:
    bucket = _get_client().bucket(BUCKET_NAME)
    blob = bucket.blob(blob_path)
    data = blob.download_as_bytes()
    img = Image.open(io.BytesIO(data))
    return ImageOps.exif_transpose(img)


def upload_image(image: Image.Image, blob_path: str) -> str:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=95)
    buf.seek(0)

    bucket = _get_client().bucket(BUCKET_NAME)
    bucket.blob(blob_path).upload_from_file(buf, content_type="image/jpeg")

    return blob_path
