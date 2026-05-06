FROM gcr.io/loom24-mvp/cuda128-py512

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    LOCAL_MODELS_BASE="/workspace/models" \
    HF_HOME="/workspace/models" \
    TORCH_HOME="/workspace/models/torch_cache" \
    AI_TOOLKIT_PATH="/opt/ai-toolkit" \
    PYTHONPATH="/opt/ai-toolkit" \
    LOG_LEVEL="INFO"

# Clone AI toolkit and install its requirements
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/ostris/ai-toolkit.git /opt/ai-toolkit && \
    cd /opt/ai-toolkit && git checkout 6bb8acbffc2021cc009cc18491f00aa3800bf45a
RUN pip install --no-cache-dir uv
RUN uv pip install --python /opt/venv/bin/python --no-cache-dir -r /opt/ai-toolkit/requirements_base.txt

# Apply patches
COPY patches/toolkit/dataloader_mixins.py /opt/ai-toolkit/toolkit/dataloader_mixins.py
COPY patches/extensions_built_in/diffusion_models/qwen_image/qwen_image_edit.py /opt/ai-toolkit/extensions_built_in/diffusion_models/qwen_image/qwen_image_edit.py

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_toolkit ./ai_toolkit

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
