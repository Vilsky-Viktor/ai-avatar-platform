FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download InsightFace buffalo_l detection model into the image.
# /models is outside /app so the host volume mount doesn't shadow it.
RUN mkdir -p /models/insightface/models/buffalo_l && \
    curl -fL -o /tmp/buffalo_l.zip \
    "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
    unzip -j /tmp/buffalo_l.zip "det_10g.onnx" -d /models/insightface/models/buffalo_l && \
    rm /tmp/buffalo_l.zip

COPY . .

CMD ["python", "main.py"]
