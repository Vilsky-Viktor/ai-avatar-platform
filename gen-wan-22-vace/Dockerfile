FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="wan-22" \
    HF_HOME="/workspace/models" \
    LOG_LEVEL="INFO" \
    GPU_MEMORY_MODE="model_cpu_offload" \
    SCHEDULER="Flow" \
    DIFFUSERS_ATTN_BACKEND="_sage_qk_int8_pv_fp8_cuda_sm90" \
    VIDEOX_ATTENTION_TYPE="SAGE_ATTENTION" \
    TORCH_HOME="/workspace/models/torch_cache" \
    PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True" \
    VACE_MODEL_NAME="wan2.2-vace-fun-a14b" \
    FLASHVSR_MODEL_NAME="flash-vsr-v11" \
    PYTHONPATH="/app/flashvsr"

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg git cuda-libraries-dev-12-8 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone --depth=1 https://github.com/OpenImagingLab/FlashVSR.git /app/flashvsr && \
    git clone --depth=1 --recurse-submodules https://github.com/mit-han-lab/Block-Sparse-Attention.git /app/block_sparse_attn && \
    sed -i 's/PretrainedConfig/PreTrainedConfig/g' \
        /app/flashvsr/diffsynth/models/stepvideo_text_encoder.py \
        /app/flashvsr/diffsynth/models/kolors_text_encoder.py && \
    touch /app/flashvsr/examples/WanVSR/utils/__init__.py

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python3 -c "from ccvfi import AutoModel, ConfigType; AutoModel.from_pretrained(pretrained_model_name=ConfigType.RIFE_IFNet_v426_heavy)"

COPY gen_wan_22_vace ./gen_wan_22_vace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
