# loom24-shared (Python) — v0.0.23

Shared types and services used across all Loom24 Python services. Pydantic models mirrored 1-to-1 from `@loom24/shared` TypeScript types.

## Contents

### Types (`loom24_shared.types`)
- **job** — `Job`, `StepBase`, `AiModelGatewayStep`, `FaceMatcherStep`, `HeadDirectionCheckerStep`, `WorkflowStep`, and all enums: `JobStatuses`, `Models`, `Platforms`, `Services`, `MediaTypes`, `JobTargets`, `Directions`, `Views`, `ShotTypes`
- **avatar** — `Avatar`, `AvatarParameters`, `AvatarGender`, `AvatarTypes`
- **voice** — `Voice`
- **image** — `ImageRatios`, `OutputFormats`, `OutputMimeTypes`
- **video** — `VideoRatios`
- **user** — `User`

### Services (`loom24_shared.services`)
- **message_queue** — `send_job` (Pub/Sub publish with 3-attempt exponential backoff + jitter)
- **service_client** — `ServiceClient`, `create_service_client` (HTTP client with retry logic)
- **storage_client** — `StorageClient`, `create_storage_client` (GCS client with lazy init)

---

## Installation in a service

Services use Poetry for local development and `pip` in Docker.

### 1. Add to `pyproject.toml`

```toml
[tool.poetry.dependencies]
loom24-shared = {version = "0.0.23", source = "loom24-pypi"}

[[tool.poetry.source]]
name = "loom24-pypi"
url = "https://us-central1-python.pkg.dev/loom24-mvp/loom24-pypi/simple/"
priority = "supplemental"
```

### 2. Authenticate Poetry with the registry (once per machine)

```bash
poetry config http-basic.loom24-pypi oauth2accesstoken "$(gcloud auth print-access-token)"
```

The access token expires in 1 hour — re-run this line if you get an authorization error.

### 3. Install

```bash
poetry install
```

### Docker

The Dockerfile uses `pip` directly (bypasses Poetry's resolver, handles wheel compatibility better):

```dockerfile
RUN --mount=type=secret,id=gcp_key \
    pip install --no-cache-dir keyring keyrings.google-artifactregistry-auth && \
    GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp_key \
    pip install --no-cache-dir \
        --extra-index-url https://us-central1-python.pkg.dev/loom24-mvp/loom24-pypi/simple/ \
        "loom24-shared==0.0.23" <other deps...>
```

The `gcp_key` secret is passed via `docker-compose.yaml`:

```yaml
build:
  context: ./service-name
  secrets:
    - gcp_key

secrets:
  gcp_key:
    file: ./gcp-json-key.json
```

---

## Publishing a new version

1. Bump `version` in `pyproject.toml`
2. Clean, build, and upload:

```bash
cd shared-package-py
rm -rf dist/ build/ loom24_shared.egg-info/
python -m build
twine upload --repository-url https://us-central1-python.pkg.dev/loom24-mvp/loom24-pypi/ dist/*
```

`twine` authenticates via the `keyrings.google-artifactregistry-auth` keyring backend. If not installed:

```bash
pip install build twine keyring keyrings.google-artifactregistry-auth
gcloud auth application-default login
```

3. Update consuming services to reference the new version in their `pyproject.toml`.

---

## Usage

```python
# Types
from loom24_shared.types import Job, JobStatuses, Models, Platforms, Services
from loom24_shared.types import StepBase, FaceMatcherStep, AiModelGatewayStep, HeadDirectionCheckerStep
from loom24_shared.types import Avatar, AvatarGender, AvatarTypes, AvatarParameters
from loom24_shared.types import ImageRatios, VideoRatios
from loom24_shared.types import User, Voice

# Services
from loom24_shared.services import create_service_client, create_storage_client
```

### Deserializing a `Job` from Pub/Sub

```python
import json
from loom24_shared.types import Job, JobStatuses

raw = json.loads(message.data.decode())
job = Job.model_validate(raw)

if job.status == JobStatuses.canceled:
    message.ack()
    return
```

### Casting a workflow step to its concrete type

`Job.workflow` is `List[StepBase]` with `extra='allow'`, so all fields are preserved. Cast to the specific type when you need typed access:

```python
from loom24_shared.types import FaceMatcherStep, Services, JobStatuses

step_idx = next(
    (i for i, s in enumerate(job.workflow)
     if s.service == Services.faceMatcher and s.status == JobStatuses.pending),
    -1,
)
step = FaceMatcherStep.model_validate(job.workflow[step_idx].model_dump())
```

### `create_service_client` usage

```python
import os
from loom24_shared.services import create_service_client
from loom24_shared.types import Job

client = create_service_client(os.environ["JOB_MANAGER_URL"])

def get_job(job: Job) -> Job:
    data = client.get(f"/get/id/{job.id}", job.userId)
    return Job.model_validate(data)
```

### `create_storage_client` usage

```python
import os
from loom24_shared.services import create_storage_client

storage = create_storage_client(os.environ["BUCKET_NAME"])

# Download raw bytes
data: bytes = storage.download_bytes("path/to/file.jpg")

# Upload bytes
storage.upload_bytes(data, "path/to/output.jpg", content_type="image/jpeg")

# Download directly to a local file (e.g. model weights)
storage.download_to_file("models/weights.ckpt", "/local/weights.ckpt")
```
