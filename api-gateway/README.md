# api-gateway

HTTP entry point for all client requests. Verifies Firebase ID tokens, injects `x-user-id` into downstream requests, and proxies to the appropriate internal service.

## Responsibility

- Firebase token verification (LRU-cached, 5-minute TTL, max 1000 entries)
- HTTP proxy to all downstream services with configurable timeout
- Normalises downstream error bodies before forwarding to clients

## Routes

All routes require a valid `Authorization: Bearer <firebase-id-token>` header.

### Auth (`/auth`)

| Method | Path | Downstream |
|---|---|---|
| POST | `/auth/link-google` | `user` — exchange Google ID token for a Firebase custom token |

### Users (`/users`)

| Method | Path | Downstream |
|---|---|---|
| GET | `/users/get/user/:id` | `user` — get user by ID |
| POST | `/users/sync` | `user` — upsert user on login |

### Avatars (`/avatars`)

| Method | Path | Downstream |
|---|---|---|
| GET | `/avatars/get/slug/:slug` | `avatar` |
| GET | `/avatars/get/avatar/:id` | `avatar` |
| GET | `/avatars/get/all` | `avatar` |
| POST | `/avatars/create` | `avatar` |
| PATCH | `/avatars/update/avatar/:id` | `avatar` |
| DELETE | `/avatars/delete/avatar/:id` | `avatar` |

### Jobs (`/jobs`)

| Method | Path | Downstream |
|---|---|---|
| GET | `/jobs/get/group/:groupId` | `job-manager` |
| GET | `/jobs/get/avatar/:avatarId` | `job-manager` |
| GET | `/jobs/counts/avatar/:avatarId` | `job-manager` |
| POST | `/jobs/gen-synthetic-front-id-photo` | `job-manager` |
| POST | `/jobs/gen-synthetic-id-photos` | `job-manager` |
| POST | `/jobs/gen-digital-twin-id-photos` | `job-manager` |
| POST | `/jobs/gen-avatar-photo` | `job-manager` |
| POST | `/jobs/gen-avatar-photo-set` | `job-manager` |
| POST | `/jobs/gen-avatar-video` | `job-manager` |
| POST | `/jobs/mimic-motion` | `job-manager` |
| POST | `/jobs/gen-avatar-audio` | `job-manager` |
| POST | `/jobs/restart/job/:id` | `job-manager` |
| DELETE | `/jobs/delete/job/:id` | `job-manager` |

### Voices (`/voices`)

| Method | Path | Downstream |
|---|---|---|
| GET | `/voices/get/gender/:gender` | `voice` |

### Cropper (`/cropper`)

| Method | Path | Downstream |
|---|---|---|
| POST | `/cropper/crop` | `cropper` |

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account key |
| `PROJECT_ID` | GCP project ID |
| `SERVICE_NAME` | Service identifier for logs |
| `USER_URL` | Internal URL of the `user` service |
| `AVATAR_URL` | Internal URL of the `avatar` service |
| `JOB_MANAGER_URL` | Internal URL of the `job-manager` service |
| `VOICE_URL` | Internal URL of the `voice` service |
| `CROPPER_URL` | Internal URL of the `cropper` service |
| `PROXY_TIMEOUT_MS` | Proxy request timeout in ms (default `120000`) |

## Running locally

```bash
npm run dev
```
