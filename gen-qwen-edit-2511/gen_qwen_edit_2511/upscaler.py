import os
import cv2
import numpy as np
from PIL import Image

import gen_qwen_edit_2511.patches  # noqa: F401 — must be imported before basicsr
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
import gen_qwen_edit_2511.utils as utils

from gen_qwen_edit_2511.models import Upscaler as UpscalerConfig
from gen_qwen_edit_2511.logger import get_logger

logger = get_logger(__name__)

LOCAL_MODELS_PATH = os.environ.get("LOCAL_MODELS_PATH", "/workspace/models")

_upsampler = None


def _get_upsampler(config: UpscalerConfig) -> RealESRGANer:
    global _upsampler
    if _upsampler is None:
        model_path = os.path.join(LOCAL_MODELS_PATH, "realesrgan", "RealESRGAN_x2plus.pth")
        arch = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
        _upsampler = RealESRGANer(
            scale=2,
            model_path=model_path,
            model=arch,
            tile=config.tile,
            tile_pad=10,
            pre_pad=0,
            half=config.half,
        )
        logger.info("RealESRGAN x2plus loaded")
    return _upsampler


@utils.timeit
def upscale_image(image: Image.Image, config: UpscalerConfig) -> Image.Image:
    upsampler = _get_upsampler(config)

    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    upscaled_bgr, _ = upsampler.enhance(img_bgr, outscale=config.outscale)

    if config.blend < 1.0:
        target_w, target_h = upscaled_bgr.shape[1], upscaled_bgr.shape[0]
        lanczos_bgr = cv2.resize(img_bgr, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
        upscaled_bgr = cv2.addWeighted(upscaled_bgr, config.blend, lanczos_bgr, 1.0 - config.blend, 0)

    return Image.fromarray(cv2.cvtColor(upscaled_bgr, cv2.COLOR_BGR2RGB))
