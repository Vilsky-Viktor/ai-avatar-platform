FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    QWEN_MODEL_PATH="/workspace/models/qwen-edit-2511" \
    HF_HOME="/workspace/models" \
    TORCH_HOME="/workspace/models/torch_cache" \
    LOG_LEVEL="INFO"

WORKDIR /app
COPY train_lora_qwen_edit_2511 ./train_lora_qwen_edit_2511

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
