import os
import io
import time
from pathlib import Path
from uuid import uuid4
from google.cloud import storage
from PIL import Image, ExifTags
from filelock import FileLock, Timeout
from gen_ti2i_controlnet.logger import get_logger

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"

# Media cache — downloaded inputs and finalized results (evicted after TTL, re-downloadable)
LOCAL_MEDIA_CACHE_DIR = Path("/workspace/media_cache")
MEDIA_CACHE_TTL_SECONDS = int(os.getenv("MEDIA_CACHE_TTL_SECONDS", "3600"))

# Tmp dir — per-run generated files, not yet uploaded
# TTL acts as a safety net for orphaned files from uncaught exceptions
LOCAL_TMP_DIR = Path("/workspace/tmp")
TMP_TTL_SECONDS = int(os.getenv("TMP_TTL_SECONDS", str(7 * 24 * 3600)))

LOCAL_MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_TMP_DIR.mkdir(parents=True, exist_ok=True)


def _get_media_cache_path(blob_path: str) -> Path:
    """Map GCS blob path → local media cache path (preserving folder structure)"""
    return LOCAL_MEDIA_CACHE_DIR / blob_path.lstrip("/")


def _get_tmp_path(blob_path: str, num_runs: int) -> Path:
    """Map GCS blob path → per-run tmp file: {num_runs}-{stem}-tmp.{ext}"""
    path = Path(blob_path.lstrip("/"))
    name = f"{num_runs}-{path.stem}-tmp{path.suffix}"
    return LOCAL_TMP_DIR / path.parent / name


def _is_file_fresh_enough(path: Path) -> bool:
    """Check if file exists and is younger than TTL"""
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < MEDIA_CACHE_TTL_SECONDS


def _evict_expired_media() -> None:
    """Opportunistic cleanup — remove files older than TTL from media cache only"""
    now = time.time()
    removed = 0

    for file_path in LOCAL_MEDIA_CACHE_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix == ".lock":
            continue
        age = now - file_path.stat().st_mtime
        if age >= MEDIA_CACHE_TTL_SECONDS:
            try:
                file_path.unlink()
                removed += 1
            except Exception as e:
                logger.warning(f"Failed to evict expired file {file_path}: {e}")

    if removed > 0:
        logger.debug(f"Evicted {removed} expired files from media cache")


def _evict_expired_tmp() -> None:
    """Safety-net cleanup — remove orphaned tmp files older than TMP_TTL (default 1 week)"""
    now = time.time()
    removed = 0

    for file_path in LOCAL_TMP_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        age = now - file_path.stat().st_mtime
        if age >= TMP_TTL_SECONDS:
            try:
                file_path.unlink()
                removed += 1
            except Exception as e:
                logger.warning(f"Failed to evict expired tmp file {file_path}: {e}")

    if removed > 0:
        logger.debug(f"Evicted {removed} orphaned tmp files")


def _load_image_from_disk(local_path: Path, label: str) -> Image.Image | None:
    """
    Open and return a PIL image from disk.
    Returns None on any read failure (corrupted file, evicted between check and open, etc.).
    Callers should delete the file and fall through to re-download on None.
    """
    try:
        return Image.open(local_path).convert("RGB")
    except FileNotFoundError:
        logger.debug(f"Cache file disappeared before open (evicted mid-read?): {label}")
        return None
    except Exception as e:
        logger.warning(f"Corrupted cache file {local_path}: {e} — will re-download")
        local_path.unlink(missing_ok=True)
        return None


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


def load_input_images(image_paths: list[str], safety_checker=None) -> list[Image.Image]:
    _evict_expired_media()
    _evict_expired_tmp()

    bucket = storage_client.bucket(BUCKET_NAME)
    valid_images = []

    for blob_path in image_paths:
        local_path = _get_media_cache_path(blob_path)
        lock_path = local_path.with_suffix(local_path.suffix + ".lock")

        # ── Fast path: file looks fresh, try to load without acquiring the lock ──
        if _is_file_fresh_enough(local_path):
            img = _load_image_from_disk(local_path, blob_path)
            if img is not None:
                valid_images.append(img)
                logger.debug(f"Loaded from cache: {blob_path}")
                continue
            # img is None → file was corrupted or evicted; fall through to locked download

        # ── Slow path: acquire lock, re-check, then download ──
        lock = FileLock(str(lock_path), timeout=45)

        try:
            with lock.acquire(timeout=45):
                # Re-check under lock — another pod may have downloaded while we waited
                if _is_file_fresh_enough(local_path):
                    img = _load_image_from_disk(local_path, blob_path)
                    if img is not None:
                        valid_images.append(img)
                        logger.debug(f"Another pod already cached {blob_path}")
                        continue
                    # File appeared but is broken — delete and re-download below
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

                    size_mb = tmp_path.stat().st_size / (1024 * 1024)
                    if size_mb > 20:
                        logger.warning(f"Input too large ({size_mb:.1f} MB): {blob_path}")
                        tmp_path.unlink(missing_ok=True)
                        continue

                    # Atomic on local fs; atomic on NFSv4, not guaranteed on NFSv3
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
            logger.warning(f"Lock timeout for {blob_path} — skipping (another pod is probably handling it)")
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


def save_result_image_locally(blob_path: str, img_byte_arr, num_runs: int) -> str:
    """Save generated image as a per-run tmp file. Never evicted automatically."""
    tmp_path = _get_tmp_path(blob_path, num_runs)
    tmp_path.parent.mkdir(parents=True, exist_ok=True)

    with open(tmp_path, "wb") as file:
        file.write(img_byte_arr.getvalue())

    return str(tmp_path)


def load_tmp_image_from_local_disk(blob_path: str, num_runs: int) -> Image.Image:
    """Load a specific run's tmp file."""
    tmp_path = _get_tmp_path(blob_path, num_runs)
    return Image.open(tmp_path).convert("RGB")


def upload_result_image_from_local_disk(blob_path: str, num_runs: int):
    """Upload a specific run's tmp file to GCS."""
    tmp_path = _get_tmp_path(blob_path, num_runs)
    with open(tmp_path, "rb") as file:
        upload_result_image(blob_path, file)


def move_tmp_to_media_cache(blob_path: str, num_runs: int):
    """Move a specific run's tmp file to the media cache after upload."""
    tmp_path = _get_tmp_path(blob_path, num_runs)
    cache_path = _get_media_cache_path(blob_path)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path.replace(cache_path)


def cleanup_tmp_files(blob_path: str, total_runs: int):
    """Remove all per-run tmp files for a job after finalization."""
    for run in range(1, total_runs + 1):
        _get_tmp_path(blob_path, run).unlink(missing_ok=True)
