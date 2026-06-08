# avatar

Avatar CRUD service. Manages avatar documents in Firestore and handles cascading cleanup of associated jobs and media on deletion.

## Responsibility

- Create, read, update, and delete avatar documents
- On deletion: removes avatar document, deletes all associated jobs, and removes the avatar's media folder from Firebase Storage (best-effort)

## Routes

All routes expect `x-user-id` header (injected by `api-gateway`).

| Method | Path | Description |
|---|---|---|
| GET | `/get/slug/:slug` | Get avatar by slug |
| GET | `/get/avatar/:id` | Get avatar by ID |
| GET | `/get/all` | Get all avatars for the authenticated user |
| POST | `/create` | Create a new avatar |
| PATCH | `/update/avatar/:id` | Partially update an avatar |
| DELETE | `/delete/avatar/:id` | Delete avatar + jobs + media |

## Database

Collection: `avatars` (inside Firestore database `ai-avatar-db`, under `users/{userId}/avatars`)

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |
| `BUCKET_NAME` | Firebase Storage bucket |
| `DB_NAME` | Firestore database name |
| `USERS_COLLECTION_NAME` | Firestore collection for users |
| `AVATARS_COLLECTION_NAME` | Firestore collection for avatars |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |

## Running locally

```bash
npm run dev
```
