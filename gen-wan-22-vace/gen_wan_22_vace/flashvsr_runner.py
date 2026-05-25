#!/usr/bin/env python3
"""
Standalone FlashVSR upscaling runner. Executed as a subprocess by inference.py.
Requires: FlashVSR repo at /app/flashvsr, block_sparse_attn compiled and installed.
"""
import sys
import os

FLASHVSR_DIR = "/app/flashvsr"
FLASHVSR_EXAMPLES_DIR = os.path.join(FLASHVSR_DIR, "examples", "WanVSR")

# Must come before any utils.* or diffsynth imports so the FlashVSR utils package resolves correctly.
sys.path.insert(0, FLASHVSR_EXAMPLES_DIR)

import argparse
import torch
import numpy as np
from PIL import Image
import imageio
from einops import rearrange

from diffsynth import ModelManager, FlashVSRTinyPipeline
from utils.utils import Causal_LQ4x_Proj
from utils.TCDecoder import build_tcdecoder


def _largest_8n1_leq(n: int) -> int:
    return 0 if n < 1 else ((n - 1) // 8) * 8 + 1


def _compute_dims(w0: int, h0: int, scale: float, multiple: int = 128):
    sW = int(round(w0 * scale))
    sH = int(round(h0 * scale))
    tW = max(multiple, (sW // multiple) * multiple)
    tH = max(multiple, (sH // multiple) * multiple)
    return sW, sH, tW, tH


def _pil_to_tensor(img: Image.Image, dtype=torch.bfloat16, device: str = "cuda") -> torch.Tensor:
    arr = np.asarray(img, dtype=np.uint8)
    t = torch.from_numpy(arr).to(device=device, dtype=torch.float32)
    return (t.permute(2, 0, 1) / 255.0 * 2.0 - 1.0).to(dtype)


def _tensor_to_frames(video: torch.Tensor) -> np.ndarray:
    frames = rearrange(video, "C T H W -> T H W C")
    return ((frames.float() + 1) * 127.5).clamp(0, 255).cpu().numpy().astype(np.uint8)


def load_video_tensor(path: str, scale: float, device: str = "cuda") -> tuple:
    rdr = imageio.get_reader(path)
    try:
        meta = rdr.get_meta_data()
    except Exception:
        meta = {}
    fps_val = meta.get("fps", 30)
    fps = int(round(fps_val)) if isinstance(fps_val, (int, float)) else 30

    frames_pil = [Image.fromarray(f).convert("RGB") for f in rdr]
    rdr.close()

    if not frames_pil:
        raise RuntimeError(f"No frames read from {path}")

    orig_count = len(frames_pil)
    w0, h0 = frames_pil[0].size
    sW, sH, tW, tH = _compute_dims(w0, h0, scale)
    print(f"Input {w0}x{h0} scale×{scale} → {sW}x{sH} (target {tW}x{tH}) | {orig_count} frames | {fps} FPS")

    # FlashVSR pipeline requires process_total_num = (F-1)//8 - 2 >= 1, i.e. F >= 25.
    min_extra = max(4, 25 - orig_count)
    padded = frames_pil + [frames_pil[-1]] * min_extra
    F = _largest_8n1_leq(len(padded))
    if F == 0:
        raise RuntimeError(f"Not enough frames in {path}")
    padded = padded[:F]
    print(f"Using {F} frames after padding (orig={orig_count})")

    tensors = []
    for img in padded:
        up = img.resize((sW, sH), Image.BICUBIC)
        l = (sW - tW) // 2
        t = (sH - tH) // 2
        tensors.append(_pil_to_tensor(up.crop((l, t, l + tW, t + tH)), device=device))

    vid = torch.stack(tensors).permute(1, 0, 2, 3).unsqueeze(0)
    return vid, tH, tW, F, fps, orig_count


def init_pipeline(model_dir: str) -> FlashVSRTinyPipeline:
    mm = ModelManager(torch_dtype=torch.bfloat16, device="cpu")
    mm.load_models([os.path.join(model_dir, "diffusion_pytorch_model_streaming_dmd.safetensors")])
    pipe = FlashVSRTinyPipeline.from_model_manager(mm, device="cuda")

    pipe.denoising_model().LQ_proj_in = Causal_LQ4x_Proj(
        in_dim=3, out_dim=1536, layer_num=1
    ).to("cuda", dtype=torch.bfloat16)

    lq_proj_path = os.path.join(model_dir, "LQ_proj_in.ckpt")
    if os.path.exists(lq_proj_path):
        pipe.denoising_model().LQ_proj_in.load_state_dict(
            torch.load(lq_proj_path, map_location="cpu"), strict=True
        )
    pipe.denoising_model().LQ_proj_in.to("cuda")

    pipe.TCDecoder = build_tcdecoder(new_channels=[512, 256, 128, 128], new_latent_channels=16 + 768)
    pipe.TCDecoder.load_state_dict(
        torch.load(os.path.join(model_dir, "TCDecoder.ckpt"), map_location="cpu"), strict=False
    )

    pipe.to("cuda")
    pipe.enable_vram_management(num_persistent_param_in_dit=None)

    prompt_path = os.path.join(FLASHVSR_EXAMPLES_DIR, "prompt_tensor", "posi_prompt.pth")
    ctx = torch.load(prompt_path, map_location="cuda")
    pipe.init_cross_kv(context_tensor=ctx)
    pipe.load_models_to_device(["dit", "vae"])
    return pipe


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--scale", type=float, default=2.0)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    torch.cuda.empty_cache()

    LQ, th, tw, F, fps, orig_count = load_video_tensor(args.input, scale=args.scale)
    pipe = init_pipeline(args.model_dir)

    torch.cuda.empty_cache()

    video = pipe(
        prompt="", negative_prompt="", cfg_scale=1.0, num_inference_steps=1, seed=args.seed,
        LQ_video=LQ, num_frames=F, height=th, width=tw,
        is_full_block=False, if_buffer=True,
        topk_ratio=2.0 * 768 * 1280 / (th * tw),
        kv_ratio=3.0,
        local_range=11,
        color_fix=True,
    )

    frames = _tensor_to_frames(video)
    # Trim padding added to satisfy FlashVSR's minimum-frame requirement.
    frames = frames[:orig_count]
    print(f"Trimmed to {len(frames)} frames (removed {F - orig_count} padding frames)")

    output_dir = os.path.dirname(os.path.abspath(args.output))
    os.makedirs(output_dir, exist_ok=True)
    w = imageio.get_writer(args.output, fps=fps, quality=6)
    for frame in frames:
        w.append_data(frame)
    w.close()
    print(f"Saved → {args.output}")


if __name__ == "__main__":
    main()
