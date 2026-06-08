# ai-model-gateway

Pub/Sub subscriber that executes AI generation steps. Receives jobs from its subscription, calls the appropriate AI platform and model, uploads the result to Firebase Storage, and forwards the updated job back to `workflow-manager`.

## Responsibility

- Authenticate with fal.ai (via API key from Secret Manager) and Google AI Studio (via ADC)
- Dispatch generation requests to the correct platform and model handler
- Upload results to Firebase Storage at the step's `uploadPath`
- Extend Pub/Sub ack deadline every 5 minutes for long-running generations
- Nack on rate-limit errors (429) for automatic re-delivery; mark step as error for all other failures

## Supported models

| Platform | Model | Type |
|---|---|---|
| Google | `gemini-image-3-pro` | Image generation/editing |
| fal.ai | `kling-v3-pro-image-to-video` | Video generation |
| fal.ai | `kling-v3-pro-motion-control` | Motion transfer video |
| fal.ai | `eleven-labs-eleven-v3` | Text-to-speech audio |
| fal.ai | `lip-sync-v3` | Lip-sync video |
| fal.ai | `topaz-video-upscale` | Video upscaling |
| fal.ai | `topaz-image-upscale` | Image upscaling |
| fal.ai | `seedvr-image-upscale` | Image upscaling (SeedVR) |

## Retry behaviour

Each generation call is attempted up to 3 times with exponential backoff + jitter (base 2^n seconds). Rate limit errors (429 or capacity/quota messages) are not retried locally — the message is nacked for Pub/Sub re-delivery. Non-retryable HTTP errors (400, 401, 403, 404, 422) fail immediately.

## Secrets

fal.ai API key is loaded from Google Cloud Secret Manager at startup. The secret name is resolved from the project configuration.

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |
| `BUCKET_NAME` | Firebase Storage bucket |
| `SUBSCRIPTION_ID` | Pub/Sub subscription to consume (default `ai-model-gateway-sub`) |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `MAX_CONCURRENT_MESSAGES` | Max in-flight Pub/Sub messages (default `10`) |

## Running locally

```bash
npm run dev
```
