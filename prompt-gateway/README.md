# prompt-gateway

HTTP service that runs prompt-based tasks against Gemini models. Each route has its own controller and system prompt, making it easy to add new prompt-driven endpoints.

## Responsibility

- Accept a user prompt via HTTP
- Apply a route-specific system prompt
- Call Gemini via Vertex AI and return the structured result

## Routes

### `/select-id-photos`

| Method | Path | Description |
|---|---|---|
| POST | `/select-id-photos` | Pick the best ID photos for a given scene prompt |

**Request body**

```json
{ "prompt": "A person walking on a beach at sunset" }
```

**Response**

```json
{ "prompt": "A person walking on a beach at sunset", "result": [7, 1] }
```

`result` is an ordered array of ID photo indexes (1–7), most identity-critical first.

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |

## Running locally

```bash
npm run dev
```
