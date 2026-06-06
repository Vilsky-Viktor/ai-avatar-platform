# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=secret,id=gcp_key \
    pip install --no-cache-dir keyring keyrings.google-artifactregistry-auth && \
    GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp_key \
    pip install --no-cache-dir \
        --extra-index-url https://us-central1-python.pkg.dev/loom24-mvp/loom24-pypi/simple/ \
        "fastapi>=0.111.0" "uvicorn[standard]" mediapipe Pillow python-dotenv numpy \
        "loom24-shared==0.0.2"

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3800", "--reload"]
