# gen-wan-22-mimic-motion

Generates video by mimicking the motion of a control video applied to a reference image, using the WAN 2.2 A14B Control pipeline. Requires both inputs in `mediaPaths`:

- One image path (reference subject)
- One `.mp4` path (motion source)

The output video preserves the subject from the reference image and follows the motion pattern of the control video.

Model: `models/wan-22/wan2.2-fun-a14b-control`

## Build image

```
gcloud builds submit --tag gcr.io/loom24-mvp/gen-wan-22-mimic-motion
```

## Message Queue

Topic = `gen-wan-22-mimic-motion`
Subscription = `gen-wan-22-mimic-motion-sub`

Retry policy: exponential backoff
Min backoff = 10s
Max backoff = 600s

## Key env vars

| Variable | Default | Description |
|---|---|---|
| `CTRL_MODEL_NAME` | `wan-22/wan2.2-fun-a14b-control` | Model path under `LOCAL_MODELS_PATH` |
| `GPU_MEMORY_MODE` | `sequential_cpu_offload` | Memory strategy (`sequential_cpu_offload`, `model_cpu_offload`, `model_cpu_offload_and_qfloat8`, `model_full_load_and_qfloat8`) |
| `TEACACHE_ENABLED` | `true` | Enable TeaCache inference acceleration |
| `TEACACHE_THRESHOLD_CTRL` | `0.15` | TeaCache threshold for control pipeline |
| `MESSAGE_CONCURRENCY` | `1` | Number of parallel workers |
