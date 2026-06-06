# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=secret,id=gcp_key \
    pip install --no-cache-dir keyring keyrings.google-artifactregistry-auth && \
    GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp_key \
    pip install --no-cache-dir \
        --extra-index-url https://us-central1-python.pkg.dev/loom24-mvp/loom24-pypi/simple/ \
        python-dotenv google-cloud-pubsub numpy scipy watchfiles \
        opencv-python-headless torch torchvision insightface onnxruntime \
        "loom24-shared==0.0.2"

# Pre-download InsightFace buffalo_l detection model into the image.
# /models is outside /app so the host volume mount doesn't shadow it.
RUN mkdir -p /models/insightface/models/buffalo_l && \
    curl -fL -o /tmp/buffalo_l.zip \
    "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
    unzip -j /tmp/buffalo_l.zip "det_10g.onnx" -d /models/insightface/models/buffalo_l && \
    rm /tmp/buffalo_l.zip

COPY . .

CMD ["python", "-m", "watchfiles", "python main.py"]
