#!/bin/bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf

BSA_WHEEL_DIR="/workspace/compiled/block_sparse_attn"
BSA_WHEEL=$(ls "$BSA_WHEEL_DIR"/*.whl 2>/dev/null | head -1)

if [ -z "$BSA_WHEEL" ]; then
    echo "[entrypoint] Compiling block_sparse_attn on GPU (first time)..."
    pip install --no-cache-dir packaging ninja
    cd /app/block_sparse_attn && MAX_JOBS=4 python setup.py bdist_wheel
    if [ $? -ne 0 ]; then
        echo "[entrypoint] ERROR: block_sparse_attn compilation failed"
        exit 1
    fi
    mkdir -p "$BSA_WHEEL_DIR"
    cp /app/block_sparse_attn/dist/*.whl "$BSA_WHEEL_DIR/"
    BSA_WHEEL=$(ls "$BSA_WHEEL_DIR"/*.whl | head -1)
    echo "[entrypoint] block_sparse_attn compiled and cached to $BSA_WHEEL"
fi

echo "[entrypoint] Installing block_sparse_attn from $BSA_WHEEL"
pip install --no-cache-dir "$BSA_WHEEL"

exec python3 -m gen_wan_22_vace.main
