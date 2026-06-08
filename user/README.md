# user

User account management service. Syncs Firebase Auth users into Firestore and handles Google OAuth token exchange.

## Responsibility

- Upsert users on first login (`sync`)
- Retrieve user profile by ID
- Exchange Google ID tokens for Firebase custom tokens (`link-google`)

## Routes

All routes except `/auth/*` expect `x-user-id` header (injected by `api-gateway`).

| Method | Path | Description |
|---|---|---|
| POST | `/auth/link-google` | Validate a Google ID token and return a Firebase custom token |
| GET | `/get/user/:id` | Get user by ID (enforces `id == x-user-id`) |
| POST | `/sync` | Create or update user document in Firestore |

## Database

Collection: `users` (inside Firestore database `ai-avatar-db`)

Documents are keyed by Firebase UID.

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |
| `DB_NAME` | Firestore database name |
| `USERS_COLLECTION_NAME` | Firestore collection name for users |

## Running locally

```bash
npm run dev
```
