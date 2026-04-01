#!/bin/bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf

# Redirect FaceFusion model storage to persistent network volume
mkdir -p /workspace/models/facefusion
rm -rf /app/facefusion/.assets/models
mkdir -p /app/facefusion/.assets
ln -sf /workspace/models/facefusion /app/facefusion/.assets/models

exec python3.12 -m gen_flux2_dev.main

# exec tail -f /dev/null