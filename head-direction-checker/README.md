# head-direction-checker

Pub/Sub subscriber that validates head orientation in generated ID photos. Uses an SCRFD ONNX face detection model to locate facial landmarks and compute a yaw ratio, then checks it against the required direction.

## Responsibility

- Run SCRFD face detection on the input image (via `onnxruntime-web` WASM backend)
- Extract 5 facial landmarks (right eye, left eye, nose tip, mouth corners)
- Compute yaw ratio: `(noseTip.x - midEye.x) / interOcularDistance`
- Pass or fail the step based on direction thresholds

## Direction thresholds

| Direction | Condition |
|---|---|
| `front` | `\|yawRatio\| < 0.15` |
| `leftQuarter` | `-0.85 < yawRatio ≤ -0.55` |
| `rightQuarter` | `0.55 ≤ yawRatio < 0.85` |
| `leftSide` | `yawRatio ≤ -1.05` |
| `rightSide` | `yawRatio ≥ 1.05` |

If no face is detected, the step fails. If the inter-ocular distance is too small (near-zero), the step passes by default.

## Model

SCRFD 10G ONNX model at `/app/models/det_10g.onnx` (mounted via Docker volume). Input: 640×640 RGB. Output: 9 tensors (3 scales × score + bbox + keypoints).

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs (default `head-direction-checker`) |
| `BUCKET_NAME` | Firebase Storage bucket |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `head-direction-checker-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default `10`) |

## Running locally

```bash
npm run dev
```
