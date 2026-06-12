# video-trimmer

Pub/Sub subscriber that trims videos to a maximum duration. Downloads the source video from Firebase Storage, checks its duration, trims it in place if it exceeds the limit, and forwards the job to `workflow-manager`.

## Responsibility

- Download the video from the path specified in the `VideoTrimmer` workflow step
- Detect duration using `music-metadata`
- If duration exceeds `maxDurationSec`, trim to that length using `fluent-ffmpeg` with stream copy (no re-encode)
- Upload the trimmed video back to the **same** path, overwriting the original
- Forward the updated job back to `workflow-manager`

## Processing

- **No trim needed**: video is within `maxDurationSec` — uploaded file is left untouched, step completes immediately
- **Trim**: write video to a temp file, run `ffmpeg -t <maxDurationSec> -c copy`, read the output, upload to the original path, clean up temp files in all cases

## Workflow step

```typescript
VideoTrimmer = {
  service: Services.videoTrimmer,
  status: JobStatuses.pending,
  videoPath: string,       // GCS path of the video to trim (overwritten in place)
  maxDurationSec: number,  // maximum allowed duration in seconds
}
```

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs (default `video-trimmer`) |
| `BUCKET_NAME` | Firebase Storage bucket |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `video-trimmer-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default `10`) |

## Running locally

```bash
npm run dev
```
