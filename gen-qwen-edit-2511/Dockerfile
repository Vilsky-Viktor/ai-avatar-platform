# --- Stage 1: Build Environment ---
FROM nvidia/cuda:12.8.1-devel-ubuntu24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 python3.12-dev python3.12-venv python3-pip curl build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python3.12 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip setuptools wheel

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt --extra-index-url https://download.pytorch.org/whl/cu128

RUN pip install --no-cache-dir packaging ninja && \
    TORCH_CUDA_ARCH_LIST="9.0 10.0" MAX_JOBS=4 pip install --no-cache-dir flash-attn==2.8.3 --no-build-isolation

RUN find /opt/venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null; \
    find /opt/venv -type d -name "__pycache__" -exec rm -rf {} +; \
    find /opt/venv -name "*.pyc" -delete; \
    find /opt/venv -name "*.pyo" -delete

RUN curl -fSsL https://github.com/runpod/runpodctl/releases/download/v1.14.3/runpodctl-linux-amd64 \
    -o /usr/local/bin/runpodctl && \
    chmod +x /usr/local/bin/runpodctl

# --- Stage 2: Runtime ---
FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="qwen-edit-2511" \
    QWEN_MODEL_PATH="/workspace/models/qwen-edit-2511" \
    HF_HOME="/workspace/models" \
    LOG_LEVEL="INFO" \
    ADAFACE_MODEL_DIR="/workspace/models/adaface" \
    ADAFACE_ARCHITECTURE="ir_101"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/bin/runpodctl /usr/local/bin/runpodctl

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY gen_qwen_edit_2511 ./gen_qwen_edit_2511

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
