FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="qwen-edit-2511" \
    QWEN_MODEL_PATH="/workspace/models/qwen-edit-2511" \
    HF_HOME="/workspace/models" \
    LOG_LEVEL="INFO" \
    DIFFUSERS_ATTN_BACKEND="_sage_qk_int8_pv_fp8_cuda_sm90" \
    TORCH_HOME="/workspace/models/torch_cache" \
    ADAFACE_MODEL_DIR="/workspace/models/adaface" \
    ADAFACE_ARCHITECTURE="ir_101" \
    QUANTIZE_TRANSFORMER="" \
    QUANTIZE_TEXT_ENCODER=""

WORKDIR /app
COPY gen_qwen_edit_2511 ./gen_qwen_edit_2511

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
