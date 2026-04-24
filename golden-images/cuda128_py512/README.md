# cuda128-py512

Golden image with CUDA 12.8, Python 3.12, and all service dependencies. No attention backend binaries (FA2/FA3/SageAttention).

## Build and push with GCP Cloud Build

```bash
gcloud builds submit \
  --tag gcr.io/loom24-mvp/cuda128-py512 \
  --machine-type=E2_HIGHCPU_32 \
  .
```

## Use as base image in services

```dockerfile
FROM gcr.io/loom24-mvp/cuda128-py512
```
