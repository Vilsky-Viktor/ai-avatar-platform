
import subprocess
import tempfile
import os
from PIL import Image
import gen_text_image_to_image_service.utils as utils_module
from gen_text_image_to_image_service.logger import get_logger


FACEFUSION_DIR = os.getenv("FACEFUSION_DIR")
DEVICE = "cuda"

logger = get_logger(__name__)

@utils_module.timeit
def swap_face(source_images: list[Image.Image], target_image: Image.Image, swapper_params: dict, enhancer_params: dict) -> Image.Image:  
    if not swapper_params["enabled"] and enhancer_params["enabled"]:
        return target_image
    
    logger.info(f"Run face swap. Fase swap: {swapper_params}. Face enhancement: {enhancer_params}")  
    source_image = source_images[swapper_params["referenceIdx"]]

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as src_tmp, \
         tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tgt_tmp, \
         tempfile.NamedTemporaryFile(suffix=".png", delete=False) as out_tmp:
        source_path = src_tmp.name
        target_path = tgt_tmp.name
        output_path = out_tmp.name

    try:
        source_image.save(source_path)
        target_image.save(target_path)

        processors = []
        if swapper_params["enabled"]:
            processors.append("face_swapper")
        if enhancer_params["enabled"]:
            processors.append("face_enhancer")

        cmd = [
            "python", f"{FACEFUSION_DIR}/facefusion.py", "headless-run",
            "--source-paths", source_path,
            "--target-path", target_path,
            "--output-path", output_path,
            "--processors", *processors,
            "--execution-providers", DEVICE,
            "--output-audio-quality", "100",
            "--log-level", "error"
        ]

        if swapper_params["enabled"]:
            cmd += [
                "--face-swapper-model", swapper_params["model"],
                "--face-swapper-weight", str(swapper_params["weight"]),
                "--face-swapper-pixel-boost", str(swapper_params["pixelBoost"]),
            ]

        if enhancer_params["enabled"]:
            cmd += [
                "--face-enhancer-model", enhancer_params["model"],
                "--face-enhancer-blend", str(enhancer_params["blend"]),
                "--face-enhancer-weight", str(enhancer_params["weight"]),
            ]

        subprocess.run(cmd, check=True, cwd=FACEFUSION_DIR)

        return Image.open(output_path).copy()
    finally:
        os.unlink(source_path)
        os.unlink(target_path)
        os.unlink(output_path)