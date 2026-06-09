# job-manager

Central job store and content generation orchestrator. Persists `Job` documents in Firestore, exposes a REST API for querying and managing jobs, and kicks off workflows by publishing to the `workflow-manager` Pub/Sub topic.

## Responsibility

- Create and persist jobs with multi-step workflows
- Publish new jobs to `workflow-manager` for execution
- Provide CRUD and query endpoints for the job store
- Restart failed jobs (resets all steps to `pending` and re-publishes)
- Delete jobs and their associated media blobs

## Job types

### ID photo generation

Creates jobs that generate headshot-style ID photos of an avatar. Three modes:

- **`gen-synthetic-front-id-photo`** — single front-facing synthetic ID photo (1 job, workflow: `ai-model-gateway` → `head-direction-checker` → `thumbnail-maker`)
- **`gen-synthetic-id-photos`** — full set of synthetic ID photos across multiple angles (batch)
- **`gen-digital-twin-id-photo`** — single ID photo using the avatar's uploaded reference image for higher fidelity

### Content generation

- **`gen-avatar-photo`** — single image using Gemini Image 3 Pro with the avatar's ID photos as identity references
- **`gen-avatar-photo-set`** — themed photo sets (`whatsapp-stickers`, `outfit-styles`, `around-the-world`, `luxury-life`)
- **`gen-avatar-video`** — video generation with Kling v3. Optional lip-sync: provide `audioText` to generate speech with ElevenLabs then sync, or `audioPath` to sync existing audio
- **`mimic-motion`** — transfer motion from a reference video onto the avatar using Kling v3 motion control
- **`gen-avatar-audio`** — text-to-speech with ElevenLabs using the avatar's assigned voice

## Routes

All routes expect `x-user-id` header (injected by `api-gateway`).

### Content generation

| Method | Path | Description |
|---|---|---|
| POST | `/gen-synthetic-front-id-photo` | Create synthetic front ID photo job |
| POST | `/gen-synthetic-id-photos` | Create full synthetic ID photo set |
| POST | `/gen-digital-twin-id-photo` | Create a single digital twin ID photo job |
| POST | `/gen-avatar-photo` | Generate a single avatar photo |
| POST | `/gen-avatar-photo-set` | Generate a themed photo set |
| POST | `/gen-avatar-video` | Generate an avatar video |
| POST | `/mimic-motion` | Generate a mimic-motion video |
| POST | `/gen-avatar-audio` | Generate avatar audio (TTS) |

### Job management

| Method | Path | Description |
|---|---|---|
| GET | `/get/job/:id` | Get job by ID |
| GET | `/get/group/:groupId` | Get all jobs in a group |
| GET | `/get/avatar/:avatarId` | Paginated jobs for an avatar (cursor, filters: `mediaType`, `status`, `target`) |
| GET | `/counts/avatar/:avatarId` | Job counts grouped by status for an avatar |
| POST | `/restart/job/:id` | Reset and re-publish a job |
| PATCH | `/update/job/:id` | Partial update of a job document |
| DELETE | `/delete/job/:id` | Delete job + all associated media blobs |
| DELETE | `/delete/avatar/:avatarId` | Delete all jobs for an avatar |

## Database

Collection: `jobs` (inside Firestore database `ai-avatar-db`, under `users/{userId}/jobs`)

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
| `JOBS_COLLECTION_NAME` | Firestore collection name for jobs |
| `WORKFLOW_MANAGER_TOPIC` | Pub/Sub topic name for workflow-manager |
| `AVATAR_URL` | Internal URL of the `avatar` service |

## Running locally

```bash
npm run dev
```
