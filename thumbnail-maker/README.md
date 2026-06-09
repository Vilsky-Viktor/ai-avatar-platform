# thumbnail-maker

Pub/Sub subscriber that generates thumbnails for completed media. Downloads the source image or video from Firebase Storage, resizes/extracts a frame, and uploads the result back to storage.

## Responsibility

- Resize images to a square thumbnail using `sharp`
- Extract a frame from videos at 0.5 s using `fluent-ffmpeg`, then resize to a square
- Upload the thumbnail to the step's `uploadPath`
- Forward the updated job back to `workflow-manager`

## Processing

- **Image**: resize so neither dimension exceeds `size × size` (`fit: outside`, Lanczos3 kernel), output as JPEG. If the source has an alpha channel, flatten it onto a dark gray background (`#646b6b`) before encoding.
- **Video**: write video to a temp file, extract a frame at 0.5 s with ffmpeg (falls back to 0 s on failure), resize the frame, clean up temp files in all cases.

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs (default `thumbnail-maker`) |
| `BUCKET_NAME` | Firebase Storage bucket |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `thumbnail-maker-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default `10`) |

## Running locally

```bash
npm run dev
```
