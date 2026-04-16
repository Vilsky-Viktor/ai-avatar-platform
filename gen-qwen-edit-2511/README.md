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