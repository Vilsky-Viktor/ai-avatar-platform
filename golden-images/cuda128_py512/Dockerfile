# --- Stage 1: Build Environment ---
FROM nvidia/cuda:12.8.1-devel-ubuntu24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 python3.12-dev python3.12-venv python3-pip curl build-essential \
    && curl -fSsL https://github.com/runpod/runpodctl/releases/download/v1.14.3/runpodctl-linux-amd64 \
       -o /usr/local/bin/runpodctl \
    && chmod +x /usr/local/bin/runpodctl \
    && rm -rf /var/lib/apt/lists/*

RUN python3.12 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip setuptools wheel

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt --extra-index-url https://download.pytorch.org/whl/cu128 \
    && find /opt/venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null; \
       find /opt/venv -type d -name "__pycache__" -exec rm -rf {} +; \
       find /opt/venv -name "*.pyc" -delete; \
       find /opt/venv -name "*.pyo" -delete

# --- Stage 2: Runtime ---
FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-dev \
    libgl1 \
    libglib2.0-0 \
    libcufft-12-8 \
    libcublas-12-8 \
    libcurand-12-8 \
    libcusparse-12-8 \
    libcusolver-12-8 \
    gcc \
    g++ \
    cuda-nvcc-12-8 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/bin/runpodctl /usr/local/bin/runpodctl

ENV PATH="/opt/venv/bin:/usr/local/cuda-12.8/bin:$PATH" \
    LD_LIBRARY_PATH="/opt/venv/lib/python3.12/site-packages/torch/lib:${LD_LIBRARY_PATH}" \
    CC=gcc \
    CXX=g++
