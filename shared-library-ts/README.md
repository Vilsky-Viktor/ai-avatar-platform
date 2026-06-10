# @loom24/shared — v0.0.23

Shared types, utilities, and services used across all Loom24 backend services.

## Contents

### Types (`@loom24/shared/types`)
- **job** — `Job`, `WorkflowStep`, `StepBase`, `AiModelGateway`, `FaceMatcher`, `HeadDirectionChecker`, and all enums: `JobStatuses`, `Models`, `Platforms`, `Services`, `MediaTypes`, `JobTargets`, `Directions`, `ShotTypes`
- **avatar** — `Avatar`, `AvatarParameters`, `AvatarGender`, `AvatarTypes`
- **voice** — `Voice`
- **image** — `ImageRatios`, `OutputFormats`, `OutputMimeTypes`
- **video** — `VideoRatios`
- **user** — `User`

### Services (`@loom24/shared/services`)
- **messageQueue** — `sendJob` (single job, no retry), `sendJobs` (batch with per-job retry, chunked in groups of 5, fails fast on first chunk failure)
- **storage** — `uploadToBucket`, `downloadFromPath`, `downloadResultFile`, `getMediaUrlFromPath` (Firebase Storage)

### Middlewares (`@loom24/shared/middlewares`)
- **errorHandler** — `errorHandler`, `AppError` (Express error handling)

### Logger (`@loom24/shared/logger`)
- Pino logger with pretty formatting, pre-configured for all services

---

## Publishing to GCP Artifact Registry

### 1. Authenticate
```bash
gcloud auth application-default login
npx google-artifactregistry-auth --repo-config=.npmrc --credential-config=.npmrc
```

### 2. Build and publish
```bash
npm run build
npm publish
```

To publish a new version, bump `version` in `package.json` first.

---

## Installation in a service

### 1. Add `.npmrc` to the service root
```
@loom24:registry=https://us-central1-npm.pkg.dev/loom24-mvp/loom24-npm/
//us-central1-npm.pkg.dev/loom24-mvp/loom24-npm/:always-auth=true
```

### 2. Install the package
```bash
npm install @loom24/shared
```

---

## Usage

```ts
// Types
import { Job, JobStatuses, Models, Platforms, WorkflowStep } from '@loom24/shared/types';
import { Avatar, AvatarGender, AvatarTypes } from '@loom24/shared/types';
import { Voice } from '@loom24/shared/types';
import { ImageRatios, OutputMimeTypes } from '@loom24/shared/types';
import { VideoRatios } from '@loom24/shared/types';
import { User } from '@loom24/shared/types';

// Logger
import logger from '@loom24/shared/logger';

// Services
import { sendJob, sendJobs } from '@loom24/shared/services';
import { uploadToBucket, downloadFromPath } from '@loom24/shared/services';

// Middleware (Express services only)
import { errorHandler, AppError } from '@loom24/shared/middlewares';
```

### `sendJob` usage
```ts
import { sendJob } from '@loom24/shared/services';

await sendJob('workflow-manager', job, 'my-service-name');
```

### `errorHandler` usage
```ts
import { errorHandler } from '@loom24/shared/middlewares';

app.use(errorHandler);
```
