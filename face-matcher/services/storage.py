import os
import logging

from loom24_shared.services import create_storage_client

BUCKET_NAME = os.environ["BUCKET_NAME"]

_storage = create_storage_client(BUCKET_NAME)
logger   = logging.getLogger(__name__)

_MODEL_FILES = [
    "models/adaface/adaface_ir101_webface12m.ckpt",
    "models/adaface/adaface_ir101.onnx",
    "models/adaface/adaface_ir101.onnx.data",
]


def download_bytes(blob_path: str) -> bytes:
    return _storage.download_bytes(blob_path)


def download_models(local_dir: str) -> None:
    os.makedirs(local_dir, exist_ok=True)

    for blob_path in _MODEL_FILES:
        filename   = os.path.basename(blob_path)
        local_path = os.path.join(local_dir, filename)

        if os.path.exists(local_path):
            logger.info(f"Model file already present, skipping: {local_path}")
            continue

        _storage.download_to_file(blob_path, local_path)
        logger.info(f"Saved {os.path.getsize(local_path):,} bytes to {local_path}")
