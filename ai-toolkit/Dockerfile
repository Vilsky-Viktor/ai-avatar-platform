FROM gcr.io/loom24-mvp/cuda128-py512

ENV GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    LOCAL_MODELS_BASE="/workspace/models" \
    HF_HOME="/workspace/models" \
    TORCH_HOME="/workspace/models/torch_cache" \
    AI_TOOLKIT_PATH="/workspace/ai-toolkit" \
    LOG_LEVEL="INFO"

# Clone AI toolkit and install its requirements
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/ostris/ai-toolkit.git /workspace/ai-toolkit
RUN pip install --no-cache-dir uv
RUN uv pip install --python /opt/venv/bin/python --no-cache-dir -r /workspace/ai-toolkit/requirements_base.txt

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_toolkit ./ai_toolkit

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
