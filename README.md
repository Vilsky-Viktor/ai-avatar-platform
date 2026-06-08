# Loom24

AI-powered avatar media generation platform. Users create digital avatars and generate photos, videos, and audio of them using a multi-model AI pipeline.

## Architecture

```
Browser
  └─ ui-app (React/Vite)
        └─ api-gateway (Express, port 3000)
              ├─ user       (port 3100)  — user accounts
              ├─ avatar     (port 3200)  — avatar CRUD
              ├─ job-manager(port 3300)  — job creation + REST
              ├─ voice      (port 3600)  — voice catalog
              └─ cropper    (port 3800)  — image crop (Python/FastAPI)

Job pipeline (Google Cloud Pub/Sub):
  job-manager → [workflow-manager topic]
      ↓
  workflow-manager  ←→  job-manager (HTTP)
      ↓ (routes to service topic)
  ┌─────────────────────────────────────────┐
  │  ai-model-gateway  (fal.ai + Google AI) │
  │  head-direction-checker (SCRFD ONNX)    │
  │  face-matcher       (InsightFace)       │
  │  thumbnail-maker    (sharp + ffmpeg)    │
  └─────────────────────────────────────────┘
      ↓ (results back to workflow-manager topic)
  workflow-manager  → next step or complete
```

## Services

| Service | Type | Port | Description |
|---|---|---|---|
| [api-gateway](api-gateway/) | HTTP | 3000 | Auth, rate-limit, proxy to all downstream services |
| [user](user/) | HTTP | 3100 | User accounts, Firebase auth sync |
| [avatar](avatar/) | HTTP | 3200 | Avatar CRUD with cascading media cleanup |
| [job-manager](job-manager/) | HTTP | 3300 | Job store, content generation orchestration |
| [voice](voice/) | HTTP | 3600 | Voice catalog |
| [cropper](cropper/) | HTTP | 3800 | YOLO11-based image cropping (Python) |
| [workflow-manager](workflow-manager/) | Pub/Sub | — | Drives multi-step job workflows |
| [ai-model-gateway](ai-model-gateway/) | Pub/Sub | — | Executes AI generation steps |
| [head-direction-checker](head-direction-checker/) | Pub/Sub | — | Validates head orientation |
| [face-matcher](face-matcher/) | Pub/Sub | — | Face similarity scoring |
| [thumbnail-maker](thumbnail-maker/) | Pub/Sub | — | Generates thumbnails from images/videos |

## Shared Libraries

| Package | Language | Description |
|---|---|---|
| [shared-library-ts](shared-library-ts/) | TypeScript | Types, Pub/Sub, GCS storage, logger, error handler |
| [shared-package-py](shared-package-py/) | Python | Pydantic types, Pub/Sub, GCS storage, logger |

## Infrastructure

- **Database**: Firestore (`ai-avatar-db`)
- **Storage**: Firebase Storage (`loom24-mvp.firebasestorage.app`)
- **Messaging**: Google Cloud Pub/Sub
- **Auth**: Firebase Authentication (Google OAuth)
- **AI Platforms**: fal.ai (Kling v3, ElevenLabs, LipSync, SeedVR, Topaz), Google AI Studio (Gemini Image 3 Pro)
- **Secrets**: Google Cloud Secret Manager (API keys)

## Local Development

### Prerequisites

- Docker and Docker Compose
- GCP service account key at `./gcp-json-key.json`

### Run all services

```bash
docker compose up
```

The UI is available at `http://localhost:5173`. The API gateway listens at `http://localhost:3000`.

### Run a single service

```bash
docker compose up api-gateway job-manager
```

### Environment variables

Copy `.env.example` to `.env` in each service directory and fill in the values. See each service's README for the full variable list.

## Job Workflow

Every generation request creates a `Job` document in Firestore with an ordered `workflow` array of steps. Each step targets a specific service. The `workflow-manager` routes each pending step to the correct Pub/Sub topic and handles retries (up to `maxRuns`). When all steps complete, it deletes intermediate files and marks the job as `completed`.

### Workflow example — ID photo generation

```
workflow: [
  { service: "ai-model-gateway",      status: "pending" },  // generate image
  { service: "head-direction-checker", status: "pending" },  // validate direction
  { service: "thumbnail-maker",        status: "pending" },  // resize thumbnail
]
```

### Job statuses

`pending` → `generating` → `completed` | `error`
