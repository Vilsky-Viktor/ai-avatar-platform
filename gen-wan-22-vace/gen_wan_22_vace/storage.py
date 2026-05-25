import os
import io
import threading
import time
from pathlib import Path
from uuid import uuid4
from google.cloud import storage
from PIL import Image, ExifTags
from filelock import FileLock, Timeout
from gen_wan_22_vace.logger import get_logger
import gen_wan_22_vace.utils as utils

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
VACE_MODEL_BUCKET_PATH = os.getenv("VACE_MODEL_BUCKET_PATH", "models/wan2.2-vace-fun-a14b")
DWPOSE_BUCKET_PATH = os.getenv("DWPOSE_BUCKET_PATH", "models/dwpose")
FLASHVSR_BUCKET_PATH = os.getenv("FLASHVSR_BUCKET_PATH", "models/flash-vsr-v11")
LOCAL_MODELS_PATH = "/workspace/models"
LOCAL_LORAS_PATH = "/workspace/loras"

LOCAL_MEDIA_CACHE_DIR = Path("/workspace/media_cache")
MEDIA_CACHE_TTL_SECONDS = int(os.getenv("MEDIA_CACHE_TTL_SECONDS", "3600"))

LOCAL_TMP_DIR = Path("/workspace/tmp")
TMP_TTL_SECONDS = int(os.getenv("TMP_TTL_SECONDS", str(7 * 24 * 3600)))

LOCAL_MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_TMP_DIR.mkdir(parents=True, exist_ok=True)

EVICTION_INTERVAL_SECONDS = 60
_last_eviction_time: float = 0.0
_eviction_lock = threading.Lock()


def _is_blob_up_to_date(local_path: Path, blob) -> bool:
    if not local_path.exists():
        return False
    stat = local_path.stat()
    if stat.st_size != blob.size:
        return False
    if blob.updated is None:
        return True
    return blob.updated.timestamp() <= stat.st_mtime + 30


def _get_media_cache_path(blob_path: str) -> Path:
    return LOCAL_MEDIA_CACHE_DIR / blob_path.lstrip("/")


def _is_file_fresh_enough(path: Path) -> bool:
    try:
        age = time.time() - path.stat().st_mtime
        return age < MEDIA_CACHE_TTL_SECONDS
    except FileNotFoundError:
        return False


def _evict_expired_media() -> None:
    now = time.time()
    removed = 0
    for file_path in LOCAL_MEDIA_CACHE_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix == ".lock":
            continue
        try:
            age = now - file_path.stat().st_mtime
        except FileNotFoundError:
            continue
        if age >= MEDIA_CACHE_TTL_SECONDS:
            try:
                file_path.unlink()
                removed += 1
            except FileNotFoundError:
                pass
            except Exception as e:
                logger.warning(f"Failed to evict expired file {file_path}: {e}")
    if removed > 0:
        logger.debug(f"Evicted {removed} expired files from media cache")


def _evict_expired_tmp() -> None:
    now = time.time()
    removed = 0
    for file_path in LOCAL_TMP_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        try:
            age = now - file_path.stat().st_mtime
        except FileNotFoundError:
            continue
        if age >= TMP_TTL_SECONDS:
            try:
                file_path.unlink()
                removed += 1
            except FileNotFoundError:
                pass
            except Exception as e:
                logger.warning(f"Failed to evict expired tmp file {file_path}: {e}")
    if removed > 0:
        logger.debug(f"Evicted {removed} orphaned tmp files")


def _maybe_run_eviction() -> None:
    global _last_eviction_time
    now = time.time()
    if now - _last_eviction_time >= EVICTION_INTERVAL_SECONDS:
        with _eviction_lock:
            if now - _last_eviction_time >= EVICTION_INTERVAL_SECONDS:
                _evict_expired_media()
                _evict_expired_tmp()
                _last_eviction_time = now


def _load_image_from_disk(local_path: Path, label: str) -> Image.Image | None:
    try:
        return Image.open(local_path).convert("RGB")
    except FileNotFoundError:
        logger.debug(f"Cache file disappeared before open: {label}")
        return None
    except Exception as e:
        logger.warning(f"Corrupted cache file {local_path}: {e} — will re-download")
        local_path.unlink(missing_ok=True)
        return None


def ensure_lora_downloaded(lora_path: str) -> str:
    local_path = Path(LOCAL_LORAS_PATH) / lora_path

    lora_file_extensions = {".safetensors", ".bin", ".pt", ".ckpt"}
    is_file_path = Path(lora_path).suffix in lora_file_extensions

    lock_path = local_path.parent / f".{local_path.name}.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with FileLock(str(lock_path), timeout=300):
        if is_file_path:
            bucket = storage_client.bucket(BUCKET_NAME)
            blob = bucket.get_blob(lora_path)
            if blob is None:
                raise FileNotFoundError(f"No LoRA files found in bucket at: {lora_path}")
            if _is_blob_up_to_date(local_path, blob):
                logger.info(f"LoRA already up-to-date: {lora_path}")
                return str(local_path)
            logger.info(f"Downloading LoRA from bucket: {lora_path}")
            local_path.parent.mkdir(parents=True, exist_ok=True)
            blob.download_to_filename(str(local_path))
            logger.info(f"LoRA download complete: {lora_path}")
        else:
            bucket = storage_client.bucket(BUCKET_NAME)
            blobs = list(bucket.list_blobs(prefix=lora_path.rstrip("/") + "/"))
            if not blobs:
                raise FileNotFoundError(f"No LoRA files found in bucket at: {lora_path}")
            downloaded = 0
            for blob in blobs:
                if blob.name.endswith("/"):
                    continue
                relative = os.path.relpath(blob.name, lora_path)
                dest = local_path / relative
                if _is_blob_up_to_date(dest, blob):
                    continue
                dest.parent.mkdir(parents=True, exist_ok=True)
                blob.download_to_filename(str(dest))
                downloaded += 1
            if downloaded:
                logger.info(f"LoRA sync complete: {lora_path} ({downloaded} file(s) downloaded)")
            else:
                logger.info(f"LoRA already up-to-date: {lora_path}")

    return str(local_path)


def _sync_bucket_path(bucket, bucket_path: str, local_base_dir: Path) -> set:
    """Sync a single bucket prefix to local, returning the set of expected local paths."""
    bucket_models_root = bucket_path.split("/")[0]  # "models"
    prefix = bucket_path.rstrip("/") + "/"
    blobs = [b for b in bucket.list_blobs(prefix=prefix) if not b.name.endswith("/")]

    if not blobs:
        raise RuntimeError(f"No blobs found at gs://{bucket.name}/{prefix}")

    expected: set[Path] = set()
    for blob in blobs:
        relative_path = os.path.relpath(blob.name, bucket_models_root)
        local_path = local_base_dir / relative_path
        expected.add(local_path)

        if _is_blob_up_to_date(local_path, blob):
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(local_path))
        logger.info(f"Downloaded {blob.name}")

    return expected


def sync_models():
    local_base_dir = Path(LOCAL_MODELS_PATH)
    bucket = storage_client.bucket(BUCKET_NAME)
    logger.info(f"Syncing models from bucket: {BUCKET_NAME}")

    expected: set[Path] = set()
    for bucket_path in (VACE_MODEL_BUCKET_PATH, DWPOSE_BUCKET_PATH, FLASHVSR_BUCKET_PATH):
        logger.info(f"Syncing {bucket_path}")
        expected |= _sync_bucket_path(bucket, bucket_path, local_base_dir)

    for bucket_path in (VACE_MODEL_BUCKET_PATH, DWPOSE_BUCKET_PATH, FLASHVSR_BUCKET_PATH):
        bucket_models_root = bucket_path.split("/")[0]
        local_dir = local_base_dir / os.path.relpath(bucket_path, bucket_models_root)
        if local_dir.exists():
            for local_file in local_dir.rglob("*"):
                if local_file.is_file() and local_file not in expected:
                    local_file.unlink()
                    logger.info(f"Removed {local_file}")

    logger.info("Model sync complete")


def load_input_images(image_paths: list[str]) -> list[Image.Image]:
    _maybe_run_eviction()

    bucket = storage_client.bucket(BUCKET_NAME)
    valid_images = []

    for blob_path in image_paths:
        local_path = _get_media_cache_path(blob_path)
        lock_path = local_path.with_suffix(local_path.suffix + ".lock")

        if _is_file_fresh_enough(local_path):
            img = _load_image_from_disk(local_path, blob_path)
            if img is not None:
                valid_images.append(img)
                logger.debug(f"Loaded from cache: {blob_path}")
                continue

        lock = FileLock(str(lock_path), timeout=45)
        try:
            with lock.acquire(timeout=45):
                if _is_file_fresh_enough(local_path):
                    img = _load_image_from_disk(local_path, blob_path)
                    if img is not None:
                        valid_images.append(img)
                        continue
                    local_path.unlink(missing_ok=True)

                blob = bucket.blob(blob_path)
                if not blob.exists():
                    logger.debug(f"Blob not found in GCS: {blob_path}")
                    continue

                try:
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    tmp_path = local_path.with_name(f"{local_path.name}.{uuid4().hex[:10]}.tmp")
                    blob.download_to_filename(str(tmp_path))
                    tmp_path.replace(local_path)
                    img = _load_image_from_disk(local_path, blob_path)
                    if img is not None:
                        valid_images.append(img)
                except Exception as e:
                    logger.error(f"Failed to download/process {blob_path}: {e}", exc_info=True)
                    if 'tmp_path' in locals():
                        tmp_path.unlink(missing_ok=True)
        except Timeout:
            logger.warning(f"Lock timeout for {blob_path} — skipping")
        except Exception as e:
            logger.error(f"Unexpected error for {blob_path}: {e}", exc_info=True)

    logger.debug(f"Loaded {len(valid_images)} valid input images")
    return valid_images


def download_video_to_local(blob_path: str) -> str:
    """Download a video from GCS to the media cache and return its local path."""
    _maybe_run_eviction()

    local_path = _get_media_cache_path(blob_path)
    lock_path = local_path.with_suffix(local_path.suffix + ".lock")

    if _is_file_fresh_enough(local_path):
        logger.debug(f"Video loaded from cache: {blob_path}")
        return str(local_path)

    lock = FileLock(str(lock_path), timeout=120)
    try:
        with lock.acquire(timeout=120):
            if _is_file_fresh_enough(local_path):
                return str(local_path)

            bucket = storage_client.bucket(BUCKET_NAME)
            blob = bucket.blob(blob_path)
            if not blob.exists():
                raise FileNotFoundError(f"Video not found in GCS: {blob_path}")

            local_path.parent.mkdir(parents=True, exist_ok=True)
            tmp_path = local_path.with_name(f"{local_path.name}.{uuid4().hex[:10]}.tmp")
            try:
                logger.info(f"Downloading video: {blob_path}")
                blob.download_to_filename(str(tmp_path))
                tmp_path.replace(local_path)
                logger.info(f"Video cached: {blob_path}")
            except Exception as e:
                tmp_path.unlink(missing_ok=True)
                raise RuntimeError(f"Failed to download video {blob_path}: {e}") from e
    except Timeout:
        raise RuntimeError(f"Lock timeout while downloading video: {blob_path}")

    return str(local_path)


def upload_result_video(dest_path: str, local_path: str):
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(dest_path)
    blob.upload_from_filename(local_path, content_type="video/mp4")
    logger.debug(f"Uploaded video to {dest_path}")
