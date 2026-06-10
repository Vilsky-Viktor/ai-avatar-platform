# image-resizer

Pub/Sub subscriber that resizes images to exact dimensions and uploads the result to a given path.

## Responsibility

- Download the source image from `mediaPath` in GCS
- Resize to the exact `width` × `height` specified in the step using Lanczos3 interpolation
- Encode as PNG (lossless, compression level 9, adaptive filtering)
- Upload the result to `uploadPath` in GCS

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs (default `image-resizer`) |
| `BUCKET_NAME` | Firebase Storage bucket |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `image-resizer-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default `10`) |

## Running locally

```bash
npm run dev
```
