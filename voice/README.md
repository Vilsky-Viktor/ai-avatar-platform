# voice

Voice catalog service. Stores available TTS voice options in Firestore and exposes a filtered listing endpoint.

## Responsibility

- Serve paginated, filtered voice listings by gender and optional attributes (language, age, category, use case)

## Routes

All routes expect `x-user-id` header (injected by `api-gateway`).

| Method | Path | Description |
|---|---|---|
| GET | `/get/gender/:gender` | List voices by gender with optional filters |

### Query parameters for `GET /get/gender/:gender`

| Parameter | Description |
|---|---|
| `language` | Filter by language |
| `age` | Filter by age category |
| `category` | Filter by voice category |
| `useCase` | Filter by intended use case |
| `cursor` | Pagination cursor (document ID) |

## Database

Collection: `voices` (inside Firestore database `ai-avatar-db`)

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |
| `DB_NAME` | Firestore database name |
| `BUCKET_NAME` | Firebase Storage bucket |
| `VOICES_COLLECTION_NAME` | Firestore collection name for voices |

## Running locally

```bash
npm run dev
```
