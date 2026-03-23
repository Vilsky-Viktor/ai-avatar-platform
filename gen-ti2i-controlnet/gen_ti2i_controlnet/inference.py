import os
import sys

import numpy as np
import torch
import random
from diffusers import FlowMatchEulerDiscreteScheduler
from omegaconf import OmegaConf
from PIL import Image

current_file_path = os.path.abspath(__file__)
project_roots = [os.path.dirname(current_file_path), os.path.dirname(os.path.dirname(current_file_path)), os.path.dirname(os.path.dirname(os.path.dirname(current_file_path)))]
for project_root in project_roots:
    sys.path.insert(0, project_root) if project_root not in sys.path else None

from gen_ti2i_controlnet.videox_fun.dist import set_multi_gpus_devices, shard_model
from gen_ti2i_controlnet.videox_fun.models import (AutoencoderKLFlux2,
                               Mistral3ForConditionalGeneration,
                               PixtralProcessor, Flux2ControlTransformer2DModel)
from gen_ti2i_controlnet.videox_fun.utils.utils import (get_image, get_image_latent)


GPU_memory_mode     = "model_full_load"
ulysses_degree      = 1
ring_degree         = 1
fsdp_dit            = False
fsdp_text_encoder   = False
compile_dit         = False
config_path         = "./config.yaml"
model_name          = "/workspace/models/flux.2-dev"
sampler_name        = "Flow"
transformer_path    = "/workspace/models/flux.2-dev/FLUX.2-dev-Fun-Controlnet-Union-2602.safetensors" 
vae_path            = None
weight_dtype        = torch.bfloat16

device = set_multi_gpus_devices(ulysses_degree, ring_degree)
config = OmegaConf.load(config_path)

transformer = Flux2ControlTransformer2DModel.from_pretrained(
    model_name, 
    subfolder="transformer",
    low_cpu_mem_usage=True,
    torch_dtype=weight_dtype,
    transformer_additional_kwargs=OmegaConf.to_container(config['transformer_additional_kwargs']),
).to(weight_dtype)

if transformer_path is not None:
    print(f"From checkpoint: {transformer_path}")
    if transformer_path.endswith("safetensors"):
        from safetensors.torch import load_file, safe_open
        state_dict = load_file(transformer_path)
    else:
        state_dict = torch.load(transformer_path, map_location="cpu")
    state_dict = state_dict["state_dict"] if "state_dict" in state_dict else state_dict

    m, u = transformer.load_state_dict(state_dict, strict=False)
    print(f"missing keys: {len(m)}, unexpected keys: {len(u)}")

# Get Vae
vae = AutoencoderKLFlux2.from_pretrained(
    model_name, 
    subfolder="vae"
).to(weight_dtype)

if vae_path is not None:
    print(f"From checkpoint: {vae_path}")
    if vae_path.endswith("safetensors"):
        from safetensors.torch import load_file, safe_open
        state_dict = load_file(vae_path)
    else:
        state_dict = torch.load(vae_path, map_location="cpu")
    state_dict = state_dict["state_dict"] if "state_dict" in state_dict else state_dict

    m, u = vae.load_state_dict(state_dict, strict=False)
    print(f"missing keys: {len(m)}, unexpected keys: {len(u)}")

# Get tokenizer and text_encoder
tokenizer = PixtralProcessor.from_pretrained(
    model_name, subfolder="tokenizer"
)
text_encoder = Mistral3ForConditionalGeneration.from_pretrained(
    model_name, subfolder="text_encoder", torch_dtype=weight_dtype,
    low_cpu_mem_usage=True,
)

# Get Scheduler
scheduler = FlowMatchEulerDiscreteScheduler.from_pretrained(
    model_name, 
    subfolder="scheduler"
)

pipeline = Flux2ControlPipeline(
    vae=vae,
    tokenizer=tokenizer,
    text_encoder=text_encoder,
    transformer=transformer,
    scheduler=scheduler,
)

if ulysses_degree > 1 or ring_degree > 1:
    from functools import partial
    transformer.enable_multi_gpus_inference()
    if fsdp_dit:
        shard_fn = partial(shard_model, device_id=device, param_dtype=weight_dtype, module_to_wrapper=list(transformer.transformer_blocks) + list(transformer.single_transformer_blocks))
        pipeline.transformer = shard_fn(pipeline.transformer)
        print("Add FSDP DIT")
    if fsdp_text_encoder:
        shard_fn = partial(shard_model, device_id=device, param_dtype=weight_dtype, module_to_wrapper=text_encoder.language_model.layers, ignored_modules=[text_encoder.language_model.embed_tokens], transformer_layer_cls_to_wrap=["MistralDecoderLayer", "PixtralTransformer"])
        text_encoder = shard_fn(text_encoder)
        print("Add FSDP TEXT ENCODER")

if compile_dit:
    for i in range(len(pipeline.transformer.transformer_blocks)):
        pipeline.transformer.transformer_blocks[i] = torch.compile(pipeline.transformer.transformer_blocks[i])
    print("Add Compile")

if GPU_memory_mode == "model_cpu_offload":
    pipeline.enable_model_cpu_offload(device=device)
else:
    pipeline.to(device=device)


def _generate_random_seed():
    return random.randint(0, 2**32 - 1)

def run_inference(params: dict, images: list[Image.Image], control_image: Image.Image):
    prompt = params.get("prompt")
    width = params.get("width")
    height = params.get("height")
    guidance_scale = params.get("guidance")
    num_inference_steps = params.get("num_steps")
    control_context_scale = params.get("controlnet_scale")
    seed = params["seed"] if params["seed"] else _generate_random_seed()

    generator = torch.Generator(device=device).manual_seed(seed)
    sample_size = [height, width]

    with torch.no_grad():
        image = [get_image(_image) for _image in images]

        inpaint_image = torch.zeros([1, 3, sample_size[0], sample_size[1]])
        mask_image = torch.ones([1, 1, sample_size[0], sample_size[1]]) * 255

        if control_image is not None:
            control_image = get_image_latent(control_image, sample_size=sample_size)[:, :, 0]

        return pipeline(
            prompt              = prompt, 
            height              = sample_size[0],
            width               = sample_size[1],
            generator           = generator,
            guidance_scale      = guidance_scale,
            image               = image,
            inpaint_image       = inpaint_image,
            mask_image          = mask_image,
            control_image       = control_image,
            num_inference_steps = num_inference_steps,
            control_context_scale  = control_context_scale,
        ).images[0]
