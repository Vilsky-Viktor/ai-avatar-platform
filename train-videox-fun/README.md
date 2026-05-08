# Build image
```
gcloud builds submit --tag gcr.io/loom24-mvp/train-videox-fun
```

# Message Queue Topic

Publisher = "train-videox-fun"
Subscriber = "train-videox-fun-sub"