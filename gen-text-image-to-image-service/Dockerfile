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
RUN git clone https://github.com/black-forest-labs/flux2.git ./flux2

RUN pip install --no-cache-dir google-cloud-pubsub google-cloud-storage jupyterlab runpodctl && \
    pip install --no-cache-dir -e ./flux2 --extra-index-url https://download.pytorch.org/whl/cu121

FROM nvidia/cuda:12.9.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app/src:/app/flux2:${PYTHONPATH}" \
    GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    KLEIN_9B_MODEL_PATH="/workspace/models/flux.2-klein-9b/flux-2-klein-9b.safetensors" \
    AE_MODEL_PATH="/workspace/models/flux.2-klein-9b/ae.safetensors" \
    HF_HOME="/workspace/models"

RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && apt-get install -y \
    python3.12 \
    python3.12-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV CPATH="/usr/include/python3.12"
ENV CC=gcc

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/flux2 /app/flux2

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY gen_text_image_to_image_service ./gen_text_image_to_image_service

EXPOSE 8888

CMD ["sh", "-c", "jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --NotebookApp.token='' --NotebookApp.password='' --notebook-dir=/ --ServerApp.allow_origin='*' --FileContentsManager.delete_to_trash=False & tail -f /dev/null"]