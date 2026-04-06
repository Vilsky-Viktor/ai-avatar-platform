FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="flux.2-dev" \
    FLUX2_MODEL_PATH="/workspace/models/flux.2-dev" \
    HF_HOME="/workspace/models" \
    TORCHINDUCTOR_CACHE_DIR="/workspace/models/torch_compile_cache" \
    LOG_LEVEL="INFO" \
    DIFFUSERS_ATTN_BACKEND="_sage_qk_int8_pv_fp8_cuda_sm90" \
    TORCH_HOME="/workspace/models/torch_cache" \
    ADAFACE_MODEL_DIR="/workspace/models/adaface" \
    ADAFACE_ARCHITECTURE="ir_101"

WORKDIR /app
COPY gen_flux2_dev ./gen_flux2_dev

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
