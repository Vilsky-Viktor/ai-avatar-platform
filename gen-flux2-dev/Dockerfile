# --- Stage 1: Build Environment ---
FROM nvidia/cuda:12.8.1-devel-ubuntu24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    git python3.12 python3.12-dev python3.12-venv python3-pip curl build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python3.12 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip setuptools wheel

WORKDIR /app

# Clone FaceFusion separately so it stays self-contained
RUN git clone --depth 1 --branch 3.6.0 https://github.com/facefusion/facefusion.git ./facefusion

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt --extra-index-url https://download.pytorch.org/whl/cu128

# Install FaceFusion deps manually (skip its installer — it assumes Conda)
RUN pip install --no-cache-dir \
    -r ./facefusion/requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cu128

RUN pip install --no-cache-dir --force-reinstall onnxruntime-gpu==1.20.1 \
    --extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/

RUN pip install --no-cache-dir \
    tensorrt==10.9.0.34 \
    tensorrt-cu12-bindings==10.9.0.34 \
    tensorrt-cu12-libs==10.9.0.34

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
    PYTHONPATH="/app/facefusion:${PYTHONPATH}" \
    GOOGLE_APPLICATION_CREDENTIALS="/workspace/gcp-json-key.json" \
    MODEL_NAME="flux.2-dev" \
    FLUX2_MODEL_PATH="/workspace/models/flux.2-dev" \
    HF_HOME="/workspace/models" \
    FACEFUSION_DIR="/app/facefusion" \
    TORCHINDUCTOR_CACHE_DIR="/workspace/models/torch_compile_cache" \
    LOG_LEVEL="INFO" \
    MODEL_PRECISION="bf16" \
    TORCHAO_FORCE_SKIP_LOADING_SO_FILES="1" \
    USE_MODEL_COMPILATION="true" \
    USE_FACE_SWAP_TRT_EXECUTOR="true" \
    USE_FACE_RECOGNITION_TRT_EXECUTOR="true" \
    ADAFACE_MODEL_DIR="/workspace/models/adaface" \
    ADAFACE_ARCHITECTURE="ir_101"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-dev \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV CC=gcc \
    CXX=g++ \
    CPATH="/usr/include/python3.12"

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/facefusion /app/facefusion
COPY --from=builder /usr/local/bin/runpodctl /usr/local/bin/runpodctl

# Register TRT shared libs so onnxruntime can find libnvinfer.so.10
RUN find /opt/venv -name "libnvinfer.so*" | head -1 | xargs -I{} dirname {} \
    | xargs -I{} sh -c 'echo "{}" > /etc/ld.so.conf.d/tensorrt.conf' && ldconfig

ENV PATH="/opt/venv/bin:$PATH"
ENV TF_USE_LEGACY_KERAS=1

WORKDIR /app
COPY gen_flux2_dev ./gen_flux2_dev

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
