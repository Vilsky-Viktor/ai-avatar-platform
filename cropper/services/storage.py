import io
import os

from PIL import Image, ImageOps

from loom24_shared.services import create_storage_client

_storage = create_storage_client(os.environ["BUCKET_NAME"])


def download_image(blob_path: str) -> Image.Image:
    data = _storage.download_bytes(blob_path)
    return ImageOps.exif_transpose(Image.open(io.BytesIO(data)))


def upload_image(image: Image.Image, blob_path: str) -> str:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=95)
    return _storage.upload_bytes(buf.getvalue(), blob_path, content_type="image/jpeg")
