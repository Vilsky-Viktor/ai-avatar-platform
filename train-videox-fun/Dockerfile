FROM gcr.io/loom24-mvp/cuda128-py512

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    LOCAL_MODELS_BASE="/workspace/models" \
    HF_HOME="/workspace/models" \
    TORCH_HOME="/workspace/models/torch_cache" \
    VIDEOX_FUN_PATH="/opt/videox-fun" \
    PYTHONPATH="/opt/videox-fun" \
    LOG_LEVEL="INFO" \
    LORA_OUTPUT_DIR="/workspace/lora_output" \
    DATASET_BASE_DIR="/workspace/datasets" \
    MEDIA_CACHE_DIR="/workspace/media_cache"

RUN apt-get update && apt-get install -y --no-install-recommends git ffmpeg && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/aigc-apps/VideoX-Fun.git /opt/videox-fun && \
    cd /opt/videox-fun && git checkout 4a86483

RUN pip install --no-cache-dir \
    einops timm tomesd torchdiffeq torchsde decord datasets \
    scikit-image omegaconf SentencePiece albumentations \
    "imageio[ffmpeg]" "imageio[pyav]" tensorboard ftfy func_timeout \
    xformers librosa

WORKDIR /app
COPY train_videox_fun ./train_videox_fun

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
