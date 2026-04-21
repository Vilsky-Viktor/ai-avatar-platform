# Build image
```
gcloud builds submit --tag gcr.io/loom24-mvp/train-lora-qwen-edit-2511
```

# Message Queue Topic

Publisher = "train-lora-qwen-edit-2511"
Subscriber = "train-lora-qwen-edit-2511-sub"
