FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="wan-22" \
    WAN_MODEL_PATH="/workspace/models/wan-22" \
    HF_HOME="/workspace/models" \
    LOG_LEVEL="INFO" \
    GPU_MEMORY_MODE="model_cpu_offload" \
    DIFFUSERS_ATTN_BACKEND="_sage_qk_int8_pv_fp8_cuda_sm90" \
    VIDEOX_ATTENTION_TYPE="SAGE_ATTENTION" \
    TORCH_HOME="/workspace/models/torch_cache" \
    PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY gen_wan_22_ti2v ./gen_wan_22_ti2v

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
