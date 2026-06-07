from __future__ import annotations

import logging
from typing import Optional

from google.cloud import storage as gcs

logger = logging.getLogger(__name__)


class StorageClient:
    def __init__(self, bucket_name: str) -> None:
        self._bucket_name = bucket_name
        self._client: Optional[gcs.Client] = None

    def _get_bucket(self) -> gcs.Bucket:
        if self._client is None:
            self._client = gcs.Client()
        return self._client.bucket(self._bucket_name)

    def download_bytes(self, blob_path: str) -> bytes:
        logger.info(f"Downloading {blob_path}")
        data = self._get_bucket().blob(blob_path).download_as_bytes()
        logger.info(f"Downloaded {len(data)} bytes from {blob_path}")
        return data

    def upload_bytes(self, data: bytes, blob_path: str, content_type: str = "application/octet-stream") -> str:
        self._get_bucket().blob(blob_path).upload_from_string(data, content_type=content_type)
        return blob_path

    def download_to_file(self, blob_path: str, local_path: str) -> None:
        logger.info(f"Downloading {blob_path} → {local_path}")
        self._get_bucket().blob(blob_path).download_to_filename(local_path)
        logger.info(f"Saved to {local_path}")

    def copy_blob(self, src_path: str, dst_path: str) -> None:
        logger.info(f"Copying {src_path} → {dst_path}")
        bucket = self._get_bucket()
        bucket.copy_blob(bucket.blob(src_path), bucket, new_name=dst_path)
        logger.info(f"Copied {src_path} → {dst_path}")

    def rename_blob(self, src_path: str, dst_path: str) -> None:
        logger.info(f"Renaming {src_path} → {dst_path}")
        bucket = self._get_bucket()
        bucket.rename_blob(bucket.blob(src_path), new_name=dst_path)
        logger.info(f"Renamed {src_path} → {dst_path}")

    def delete_blob(self, blob_path: str) -> None:
        logger.info(f"Deleting {blob_path}")
        self._get_bucket().blob(blob_path).delete()
        logger.info(f"Deleted {blob_path}")


def create_storage_client(bucket_name: str) -> StorageClient:
    return StorageClient(bucket_name)
