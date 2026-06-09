# cropper

Pub/Sub subscriber that crops portrait and full-body photos using YOLO11 pose estimation. Receives messages from its subscription, crops the image in storage, and forwards the updated job to `workflow-manager`.

## Responsibility

- Run YOLO11n-pose on the input image to detect a person and their skeletal keypoints
- Crop to the correct region based on the step's `mode`
- Resize the result to 2048×2048 if larger
- Upload the cropped image to Firebase Storage at the step's `uploadPath`
- Forward the updated job back to `workflow-manager`

## Crop algorithm

1. Run YOLO11n-pose; pick the detection with the highest confidence score
2. Reject if best confidence < 0.3 (no person detected)
3. Collect visible keypoints for the relevant body region
4. Compute bounding box with directional padding based on face turn (yaw) for headshot modes
5. Expand to square, clamp to image bounds
6. Crop and upload to storage

## `mode` values

| Mode | Region |
|---|---|
| `front` | Head and shoulders (front-facing) |
| `quarter` | Head and shoulders (quarter-turn) |
| `side` | Head and shoulders (side-facing) |
| `body` | Full body |

## Concurrency

`MAX_CONCURRENT_MESSAGES` controls both the Pub/Sub flow (max in-flight messages) and the YOLO model pool size. A pool of that many model instances is pre-loaded at startup and returned to the pool after each crop via a `queue.Queue`, so throughput and pool size are always in sync.

## CPU-only

`torch` and `torchvision` are pinned to the CPU wheel from `https://download.pytorch.org/whl/cpu` to avoid pulling NVIDIA CUDA packages during installation.

## Environment variables

| Variable | Description |
|---|---|
| `PROJECT_ID` | GCP project ID (required) |
| `SERVICE_NAME` | Service identifier for logs (default `cropper`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `BUCKET_NAME` | Firebase Storage bucket |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `cropper-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager (default `workflow-manager`) |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages and YOLO pool size (default `10`) |
| `YOLO_MODEL` | Path to YOLO model file (default `models/yolo11n-pose.pt`) |
| `GLOG_minloglevel` | Suppress TensorFlow/GLOG verbose output (set to `2`) |

## Running locally

```bash
poetry install
python main.py
```

For development with hot reload:

```bash
python -m watchfiles "python main.py" .
```
