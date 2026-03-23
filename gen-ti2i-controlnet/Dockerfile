# --- Stage 1: Build Environment ---
FROM nvidia/cuda:12.9.0-devel-ubuntu22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && apt-get install -y \
    git python3.12 python3.12-dev python3.12-venv curl && \
    rm -rf /var/lib/apt/lists/*

RUN python3.12 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.12 && \
    python3.12 -m pip install --upgrade pip setuptools wheel

WORKDIR /app

# Clone FaceFusion separately so it stays self-contained
RUN git clone https://github.com/facefusion/facefusion.git ./facefusion

RUN pip install --no-cache-dir google-cloud-pubsub google-cloud-storage google-cloud-firestore insightface pydantic

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt --extra-index-url https://download.pytorch.org/whl/cu121

# Install FaceFusion deps manually (skip its installer — it assumes Conda)
RUN pip install --no-cache-dir \
    -r ./facefusion/requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cu121

RUN pip install --no-cache-dir --force-reinstall onnxruntime-gpu==1.20.1 \
    --extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/

RUN find /opt/venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null; \
    find /opt/venv -type d -name "__pycache__" -exec rm -rf {} +; \
    find /opt/venv -name "*.pyc" -delete; \
    find /opt/venv -name "*.pyo" -delete

RUN curl -fSsL https://github.com/runpod/runpodctl/releases/download/v1.14.3/runpodctl-linux-amd64 \
    -o /usr/local/bin/runpodctl && \
    chmod +x /usr/local/bin/runpodctl

# --- Stage 2: Runtime ---
FROM nvidia/cuda:12.9.0-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app/src:/app/flux2:/app/facefusion:${PYTHONPATH}" \
    GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="flux.2-dev" \
    FLUX2_MODEL_PATH="/workspace/models/flux.2-dev/flux2-dev-fp8_scaled.safetensors" \
    AE_MODEL_PATH="/workspace/models/flux.2-dev/ae.safetensors" \
    HF_HOME="/workspace/models" \
    FACEFUSION_DIR="/app/facefusion" \
    FACEFUSION_MODELS_DIR="/workspace/models/facefusion" \
    LOG_LEVEL="INFO"

RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV CPATH="/usr/include/python3.12"
ENV CC=gcc

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/facefusion /app/facefusion
COPY --from=builder /usr/local/bin/runpodctl /usr/local/bin/runpodctl

ENV PATH="/opt/venv/bin:$PATH"
ENV TF_USE_LEGACY_KERAS=1

WORKDIR /app
COPY gen_text_image_to_image_service ./gen_text_image_to_image_service

EXPOSE 8888

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]