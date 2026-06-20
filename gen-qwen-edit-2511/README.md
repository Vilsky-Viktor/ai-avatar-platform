# Build image
```
gcloud builds submit --tag gcr.io/loom24-mvp/gen-qwen-edit-2511
```

# Message Queue Topic

Publisher = "gen-qwen-edit-2511"
Subscriber = "gen-qwen-edit-2511-sub"

Retry policy = retry after exponential backoff delay
Min backoff = 10
Max backoff = 600


# ENV VARS

QUANTIZE_TRANSFORMER: uint3 | uint4 | uint8 | int8
QUANTIZE_TEXT_ENCODER: qfloat8 | int8