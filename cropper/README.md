# cropper

HTTP REST service that crops portrait and full-body photos using YOLO11 pose estimation. Called synchronously by `api-gateway` during avatar photo upload.

## Responsibility

- Run YOLO11n-pose on the input image to detect a person and their skeletal keypoints
- Crop to the correct region based on the requested mode
- Upload the cropped image to Firebase Storage at a path derived from the source
- Return the destination path

## Endpoint

| Method | Path | Description |
|---|---|---|
| POST | `/crop` | Crop an image from storage |

### Request body

```json
{
  "image_path": "media/user-id/avatars/avatar-id/images/front.jpg",
  "mode": "front"
}
```

### `mode` values

| Mode | Region |
|---|---|
| `front` | Head and shoulders (front-facing) |
| `quarter` | Head and shoulders (quarter-turn) |
| `side` | Head and shoulders (side-facing) |
| `full_body` | Full body |

### Response

```json
{ "path": "media/user-id/avatars/avatar-id/images/front-cropped.jpg" }
```

## Crop algorithm

1. Run YOLO11n-pose; pick the detection with the highest confidence score
2. Reject if best confidence < 0.3 (no person detected)
3. Collect visible keypoints for the relevant body region
4. Compute bounding box with directional padding based on face turn (yaw) for headshot modes
5. Expand to square, clamp to image bounds
6. Crop and upload to storage

## Concurrency

A `threading.Semaphore` limits concurrent crops to `MAX_CONCURRENT_CROPS`. A pool of `MAX_CONCURRENT_CROPS` YOLO model instances is pre-loaded at startup (one instance per worker). Models are returned to the pool after each request via a `queue.Queue`.

## CPU-only

`torch` and `torchvision` are pinned to the CPU wheel from `https://download.pytorch.org/whl/cpu` to avoid pulling NVIDIA CUDA packages during installation.

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3800`) |
| `SERVICE_NAME` | Service identifier for logs (default `cropper`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `BUCKET_NAME` | Firebase Storage bucket |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_CROPS` | Max concurrent crop requests (default `5`) |
| `GUNICORN_WORKERS` | Number of Gunicorn worker processes (default `2`) |
| `YOLO_MODEL` | Path to YOLO model file (default `models/yolo11n-pose.pt`) |
| `GLOG_minloglevel` | Suppress TensorFlow/GLOG verbose output (set to `2`) |

## Running locally

```bash
poetry install
gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3800
```

Or for development with hot reload:

```bash
uvicorn main:app --reload --port 3800
```
