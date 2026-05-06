# Build image
```
gcloud builds submit --tag gcr.io/loom24-mvp/gen-wan-22
```

# Message Queue Topic

Publisher = "gen-wan-22"
Subscriber = "gen-wan-22-sub"

Retry policy = retry after exponential backoff delay
Min backoff = 10
Max backoff = 600