# face-matcher

Pub/Sub subscriber that scores face similarity between a generated image and the avatar's ID photos. Uses InsightFace for face detection and embedding extraction, then picks the best result across multiple retry runs.

## Responsibility

- Download the generated image and all ID photos from Firebase Storage in parallel
- Compute cosine similarity between the generated image embedding and each ID photo embedding
- Track the best result across runs (up to `maxRuns`): if a later run scores better, replace the stored best; otherwise restore the previous best from a temporary backup blob
- Pass the step when `faceMatch >= threshold`, or after the final run regardless

## Best-of-N logic

On each run the service compares the current similarity against the previous best (`step.faceMatch`). The best candidate image is kept as a backup blob at `<imagePath>-prev-tmp<ext>`. On the final run, if the current result is worse, the backup is restored to `imagePath` before marking the step completed.

## Face recognition pool

Multiple `_FaceRecognitionInstance` objects are pre-loaded at startup (controlled by `POOL_SIZE`). Each instance holds a full InsightFace model and an independent LRU embedding cache for ID photos. Instances are drawn from a thread-safe queue for each message.

## Embedding cache

Each pool instance caches embeddings keyed by SHA-256 of the image bytes. Cache entries expire after `EMBEDDING_CACHE_TTL` seconds. The cache evicts expired entries then the oldest entries when it reaches `EMBEDDING_CACHE_MAX_SIZE`.

## Model

InsightFace `buffalo_l` (SCRFD detection + ArcFace recognition). Model files are expected at `INSIGHTFACE_ROOT/models/<INSIGHTFACE_MODEL>/`. If the model directory exists but is missing detection or recognition weights, it is deleted and re-downloaded automatically.

## Environment variables

| Variable | Description |
|---|---|
| `PROJECT_ID` | GCP project ID (required) |
| `SERVICE_NAME` | Service identifier for logs (default `face-matcher`) |
| `BUCKET_NAME` | Firebase Storage bucket |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `face-matcher-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager (default `workflow-manager`) |
| `POOL_SIZE` | Number of InsightFace instances (default `1`) |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default = `POOL_SIZE`) |
| `INSIGHTFACE_MODEL` | InsightFace model name (default `buffalo_l`) |
| `INSIGHTFACE_ROOT` | Root directory for InsightFace models (default `/models/insightface`) |
| `EMBEDDING_CACHE_TTL` | ID photo embedding cache TTL in seconds (default `3600`) |
| `EMBEDDING_CACHE_MAX_SIZE` | Max cached embeddings per pool instance (default `500`) |

## Running locally

```bash
poetry install
python main.py
```
