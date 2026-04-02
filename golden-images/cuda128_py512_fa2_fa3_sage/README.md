# cuda128-py512-fa2-fa3-sage

Golden image with CUDA 12.8, Python 3.12, all service dependencies, and pre-compiled FA2 + FA3 + Sage binaries baked in.

## Runtime dependencies

| Package | Purpose |
|---|---|
| `nvidia/cuda:12.8.1-cudnn-runtime-ubuntu24.04` | Base image with CUDA 12.8 runtime + cuDNN |
| `python3.12`, `python3.12-dev` | Python runtime + headers |
| `libgl1`, `libglib2.0-0` | OpenCV runtime libs |
| `libcufft-12-8` | CUDA FFT (required by PyTorch) |
| `libcublas-12-8` | CUDA BLAS (required by PyTorch) |
| `libcurand-12-8` | CUDA RNG (required by PyTorch) |
| `libcusparse-12-8` | CUDA sparse ops (required by PyTorch) |
| `libcusolver-12-8` | CUDA solver (required by PyTorch) |
| `gcc`, `g++` | C/C++ compiler for Triton JIT (SageAttention, torch.compile) |
| `cuda-nvcc-12-8` | CUDA compiler for TorchInductor CUTLASS kernels (torch.compile max_autotune_gemm) |

## Environment variables

| Variable | Value | Purpose |
|---|---|---|
| `PATH` | includes `/usr/local/cuda-12.8/bin` | nvcc on PATH |
| `LD_LIBRARY_PATH` | includes `torch/lib` | FA3 `.so` finds `libc10.so` |
| `CC` | `gcc` | Triton C compiler |
| `CXX` | `g++` | Triton C++ compiler |

## 1. Download binaries from GCS

```bash
mkdir -p binaries
gsutil -m cp -r gs://loom24-mvp.firebasestorage.app/binaries/fa2-cuda128-py312 binaries/
gsutil -m cp -r gs://loom24-mvp.firebasestorage.app/binaries/fa3-cuda128-py312 binaries/
gsutil -m cp -r gs://loom24-mvp.firebasestorage.app/binaries/sage-cuda128-py312 binaries/
```

## 2. Build and push with GCP Cloud Build

```bash
gcloud builds submit \
  --tag gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage \
  --machine-type=E2_HIGHCPU_32 \
  .
```

## 3. Use as base image in services

```dockerfile
FROM gcr.io/loom24-mvp/cuda128-py512-fa2-fa3-sage
```

FA2, FA3 and Sage binaries are pre-installed into site-packages. No runtime download or install is needed — just set `DIFFUSERS_ATTN_BACKEND` to:
- `flash` for FA2
- `_flash_3` for FA3
- `sage` for default Sage
- `_sage_qk_int8_pv_fp8_cuda_sm90` for int8 fp8 Sage optimized for hopper
