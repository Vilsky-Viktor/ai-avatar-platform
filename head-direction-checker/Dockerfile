FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates unzip && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/models && \
    curl -fL -o /tmp/buffalo_l.zip \
    "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
    unzip -j /tmp/buffalo_l.zip "det_10g.onnx" -d /app/models && \
    rm /tmp/buffalo_l.zip

CMD ["npm", "run", "dev"]