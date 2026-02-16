import os
import io
from pathlib import Path
from google.cloud import storage
from PIL import Image, ExifTags
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"

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
        if blob.name.endswith('/'): continue
        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        final_dest = local_base_dir / relative_path

        if final_dest.exists() and final_dest.stat().st_size == blob.size:
            continue

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(final_dest))
    logger.info(f"Sync for {model_name} complete")

def load_input_images(image_urls, safety_checker):
    """Downloads and converts input images while checking safety."""
    img_ctx = []
    for p in image_urls:
        if os.path.exists(p):
            if safety_checker.test_image(p):
                continue
            img_ctx.append(Image.open(p).convert("RGB"))
    return img_ctx

def prepare_image_payload(img):
    """Applies EXIF data and converts PIL Image to bytes."""
    exif_data = Image.Exif()
    exif_data[ExifTags.Base.Software] = "AI generated"
    exif_data[ExifTags.Base.Make] = "Loom24.ai"

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG', exif=exif_data)
    img_byte_arr.seek(0)
    return img_byte_arr

def upload_result_image(dest_path, img_byte_arr):
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(dest_path)
    blob.upload_from_file(img_byte_arr, content_type="image/png")
    logger.info(f"Image uploaded to {dest_path}")