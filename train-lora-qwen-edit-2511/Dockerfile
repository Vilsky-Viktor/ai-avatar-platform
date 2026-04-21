FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="qwen-edit-2511" \
    QWEN_MODEL_PATH="/workspace/models/qwen-edit-2511" \
    HF_HOME="/workspace/models" \
    TORCH_HOME="/workspace/models/torch_cache" \
    LOG_LEVEL="INFO" \
    DIFFUSERS_ATTN_BACKEND="flash"

WORKDIR /app
RUN pip install --no-cache-dir bitsandbytes>=0.43.0

COPY train_lora_qwen_edit_2511 ./train_lora_qwen_edit_2511

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
