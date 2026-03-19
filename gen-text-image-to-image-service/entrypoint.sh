#!/bin/bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf
exec python3.12 -m gen_text_image_to_image_service.main

if [ ! -d "$FACEFUSION_MODELS_DIR" ] || [ -z "$(ls -A $FACEFUSION_MODELS_DIR)" ]; then
    echo "Downloading FaceFusion models..."
    mkdir -p "$FACEFUSION_MODELS_DIR"
    python /app/facefusion/facefusion.py force-download \
        --model-path "$FACEFUSION_MODELS_DIR"
else
    echo "FaceFusion models already present, skipping download."
fi

# exec tail -f /dev/null