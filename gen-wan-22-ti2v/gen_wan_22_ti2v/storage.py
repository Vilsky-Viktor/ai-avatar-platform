import os
import io
import threading
import time
from pathlib import Path
from uuid import uuid4
from google.cloud import storage
from PIL import Image, ExifTags
from filelock import FileLock, Timeout
from gen_wan_22_ti2v.logger import get_logger
import gen_wan_22_ti2v.utils as utils

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"
LOCAL_LORAS_PATH = "/workspace/loras"

# Media cache — downloaded inputs and finalized results (evicted after TTL, re-downloadable)
LOCAL_MEDIA_CACHE_DIR = Path("/workspace/media_cache")
MEDIA_CACHE_TTL_SECONDS = int(os.getenv("MEDIA_CACHE_TTL_SECONDS", "3600"))

# Tmp dir — per-run generated files, not yet uploaded
# TTL acts as a safety net for orphaned files from uncaught exceptions
LOCAL_TMP_DIR = Path("/workspace/tmp")
TMP_TTL_SECONDS = int(os.getenv("TMP_TTL_SECONDS", str(7 * 24 * 3600)))

LOCAL_MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_TMP_DIR.mkdir(parents=True, exist_ok=True)

EVICTION_INTERVAL_SECONDS = 60
_last_eviction_time: float = 0.0
_eviction_lock = threading.Lock()


def _get_media_cache_path(blob_path: str) -> Path:
    return LOCAL_MEDIA_CACHE_DIR / blob_path.lstrip("/")


def _get_tmp_path(blob_path: str, num_runs: int) -> Path:
    path = Path(blob_path.lstrip("/"))
    name = f"{num_runs}-{path.stem}-tmp{path.suffix}"
    return LOCAL_TMP_DIR / path.parent / name


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


def _load_image_from_disk(local_path: Path, label: str) -> Image.Image | None:
    try:
        return Image.open(local_path).convert("RGB")
    except FileNotFoundError:
        logger.debug(f"Cache file disappeared before open (evicted mid-read?): {label}")
        return None
    except Exception as e:
        logger.warning(f"Corrupted cache file {local_path}: {e} — will re-download")
        local_path.unlink(missing_ok=True)
        return None


def ensure_lora_downloaded(lora_path: str) -> str:
    """Ensure a LoRA directory is present locally. Downloads from GCS if missing or incomplete.

    ``lora_path`` is the GCS path as given in the job, e.g.
    ``"models/qwen-edit-2511/loras/Qwen-Image-Edit-InSubject"``.
    Returns the absolute local path.
    """
    local_path = Path(LOCAL_LORAS_PATH) / lora_path

    lora_file_extenstions = {".safetensors", ".bin", ".pt", ".ckpt"}
    is_file_path = Path(lora_path).suffix in lora_file_extenstions

    # Fast path only for single-file LoRAs — directory LoRAs always sync to catch
    # new checkpoints added to the bucket after the initial download.
    if is_file_path and local_path.is_file():
        logger.info(f"LoRA already cached: {lora_path}")
        return str(local_path)

    lock_path = local_path.parent / f".{local_path.name}.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with FileLock(str(lock_path), timeout=300):
        if is_file_path:
            if local_path.is_file():
                logger.info(f"LoRA already cached (downloaded by concurrent thread): {lora_path}")
                return str(local_path)
            logger.info(f"Downloading LoRA from bucket: {lora_path}")
            bucket = storage_client.bucket(BUCKET_NAME)
            blob = bucket.blob(lora_path)
            if not blob.exists():
                raise FileNotFoundError(f"No LoRA files found in bucket at: {lora_path}")
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
                if dest.exists() and dest.stat().st_size == blob.size:
                    continue
                dest.parent.mkdir(parents=True, exist_ok=True)
                blob.download_to_filename(str(dest))
                downloaded += 1
            if downloaded:
                logger.info(f"LoRA sync complete: {lora_path} ({downloaded} file(s) downloaded)")
            else:
                logger.info(f"LoRA already up-to-date: {lora_path}")

    return str(local_path)



def download_models(model_name):
    remote_prefix = f"{BUCKET_MODELS_PATH}/{model_name}/"
    local_base_dir = Path(LOCAL_MODELS_PATH)
    logger.info(f"Syncing {model_name} from bucket: {BUCKET_NAME}")

    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix=remote_prefix))

    if not blobs:
        logger.error(f"No blobs found for {remote_prefix}")
        return

    for blob in blobs:
        if blob.name.endswith('/'):
            continue
        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        final_dest = local_base_dir / relative_path

        if final_dest.exists() and final_dest.stat().st_size == blob.size:
            continue

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(final_dest))
    logger.info(f"Sync for {model_name} complete")


def sync_models():
    """
    True sync of models/ folder from GCS to local disk:
    - Downloads files that are missing or have a different size.
    - Removes local files that no longer exist in the bucket.
    """
    local_base_dir = Path(LOCAL_MODELS_PATH)
    logger.info(f"Syncing models folder from bucket: {BUCKET_NAME}")

    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = [b for b in bucket.list_blobs(prefix=f"{BUCKET_MODELS_PATH}/") if not b.name.endswith("/")]

    if not blobs:
        raise RuntimeError(f"No blobs found at gs://{BUCKET_NAME}/{BUCKET_MODELS_PATH}/")

    expected: set[Path] = set()
    for blob in blobs:
        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        local_path = local_base_dir / relative_path
        expected.add(local_path)

        if local_path.exists() and local_path.stat().st_size == blob.size:
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(local_path))
        logger.info(f"Downloaded {blob.name}")

    if local_base_dir.exists():
        for local_file in local_base_dir.rglob("*"):
            if local_file.is_file() and local_file not in expected:
                local_file.unlink()
                logger.info(f"Removed {local_file}")

    logger.info("Models folder sync complete")


def load_input_videos(image_paths: list[str]) -> list[Image.Image]:
    global _last_eviction_time
    now = time.time()
    if now - _last_eviction_time >= EVICTION_INTERVAL_SECONDS:
        with _eviction_lock:
            if now - _last_eviction_time >= EVICTION_INTERVAL_SECONDS:
                _evict_expired_media()
                _evict_expired_tmp()
                _last_eviction_time = now

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
                        logger.debug(f"Another pod already cached {blob_path}")
                        continue
                    local_path.unlink(missing_ok=True)

                blob = bucket.blob(blob_path)
                if not blob.exists():
                    logger.debug(f"Blob not found in GCS: {blob_path}")
                    continue

                try:
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    tmp_path = local_path.with_name(f"{local_path.name}.{uuid4().hex[:10]}.tmp")

                    logger.debug(f"Downloading {blob_path} → {tmp_path}")
                    blob.download_to_filename(str(tmp_path))

                    tmp_path.replace(local_path)
                    logger.debug(f"Cached fresh image: {blob_path}")

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
            logger.error(f"Unexpected error in locked section for {blob_path}: {e}", exc_info=True)

    logger.debug(f"Loaded {len(valid_images)} valid input images")
    return valid_images


def prepare_image_payload(img):
    exif_data = Image.Exif()
    exif_data[ExifTags.Base.Software] = "AI generated"
    exif_data[ExifTags.Base.Make] = "Loom24.ai"

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG', exif=exif_data)
    img_byte_arr.seek(0)
    return img_byte_arr


def upload_result_image(dest_path: str, img_byte_arr):
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(dest_path)
    blob.upload_from_file(img_byte_arr, content_type="image/png")
    logger.debug(f"Uploaded to {dest_path}")


def upload_result_video(dest_path: str, local_file: str):
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(dest_path)
    blob.upload_from_filename(local_file, content_type="video/mp4")
    logger.debug(f"Uploaded video to {dest_path}")


def save_result_image_locally(blob_path: str, img_byte_arr) -> str:
    cache_path = _get_media_cache_path(blob_path)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "wb") as file:
        file.write(img_byte_arr.getvalue())
    return str(cache_path)
