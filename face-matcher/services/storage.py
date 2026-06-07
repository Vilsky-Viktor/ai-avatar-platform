import os

from loom24_shared.services import create_storage_client

BUCKET_NAME = os.environ["BUCKET_NAME"]

_storage = create_storage_client(BUCKET_NAME)


def download_bytes(blob_path: str) -> bytes:
    return _storage.download_bytes(blob_path)


def rename_blob(src_path: str, dst_path: str) -> None:
    _storage.rename_blob(src_path, dst_path)


def delete_blob(blob_path: str) -> None:
    _storage.delete_blob(blob_path)
