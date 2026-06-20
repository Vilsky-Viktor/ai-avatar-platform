# gen-wan-22-ti2v

Generates video from a text prompt or a reference image using the WAN 2.2 A14B InP (inpaint) pipeline. Supports two modes selected automatically from `mediaPaths`:

- **T2V** — no `mediaPaths`: generates video from text prompt only
- **I2V** — one image in `mediaPaths`: animates the reference image guided by the prompt

Model: `models/wan-22/wan2.2-fun-a14b-inp`

## Build image

```
gcloud builds submit --tag gcr.io/loom24-mvp/gen-wan-22-ti2v
```

## Message Queue

Topic = `gen-wan-22-ti2v`
Subscription = `gen-wan-22-ti2v-sub`

Retry policy: exponential backoff
Min backoff = 10s
Max backoff = 600s

## Key env vars

| Variable | Default | Description |
|---|---|---|
| `INP_MODEL_NAME` | `wan-22/wan2.2-fun-a14b-inp` | Model path under `LOCAL_MODELS_PATH` |
| `GPU_MEMORY_MODE` | `sequential_cpu_offload` | Memory strategy (`sequential_cpu_offload`, `model_cpu_offload`, `model_cpu_offload_and_qfloat8`, `model_full_load_and_qfloat8`) |
| `TEACACHE_ENABLED` | `true` | Enable TeaCache inference acceleration |
| `TEACACHE_THRESHOLD_T2V` | `0.10` | TeaCache threshold for text-to-video mode |
| `TEACACHE_THRESHOLD_I2V` | `0.15` | TeaCache threshold for image-to-video mode |
| `MESSAGE_CONCURRENCY` | `1` | Number of parallel workers |
