# gen-wan-22-vace

Generates video using the WAN 2.2 VACE-Fun A14B pipeline. Supports three modes passed explicitly via `mode`:

- **i2v** — animates from a start image; provide the start frame as the first image in `mediaPaths`
- **s2v** — subject-to-video; provide subject reference images in `mediaPaths`
- **v2v_control_ref** — drives motion from a control video with subject appearance from reference images; provide one `.mp4` and one or more images in `mediaPaths`. The control video is preprocessed with DWPose to extract a pose skeleton before generation.

Models required in bucket:
- `models/wan2.2-vace-fun-a14b` — inference model
- `models/dwpose/yolox_l.onnx` — DWPose person detector
- `models/dwpose/dw-ll_ucoco_384.onnx` — DWPose pose estimator

## Build image

```
gcloud builds submit --tag gcr.io/loom24-mvp/gen-wan-22-vace
```

## Message Queue

Topic = `gen-wan-22-vace`
Subscription = `gen-wan-22-vace-sub`

Retry policy: exponential backoff
Min backoff = 10s
Max backoff = 600s

## Key env vars

| Variable | Default | Description |
|---|---|---|
| `VACE_MODEL_NAME` | `wan2.2-vace-fun-a14b` | Model path under `LOCAL_MODELS_PATH` |
| `GPU_MEMORY_MODE` | `model_cpu_offload` | Memory strategy (`sequential_cpu_offload`, `model_cpu_offload`, `model_cpu_offload_and_qfloat8`) |
| `TEACACHE_ENABLED` | `true` | Enable TeaCache inference acceleration |
| `TEACACHE_THRESHOLD` | `0.10` | TeaCache residual threshold |
| `TEACACHE_SKIP_STEPS` | `5` | Number of start steps to skip TeaCache |
| `RIFLEX_K` | `6` | RIFLEx frequency index for long-video extrapolation (applied when video > 81 frames) |
| `MESSAGE_CONCURRENCY` | `1` | Number of parallel workers |
