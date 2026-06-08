from dotenv import load_dotenv
load_dotenv()

import os
import time
import threading
from contextlib import asynccontextmanager
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from loom24_shared import logger
from controllers.crop import crop_to_bucket
from utils.detector import warmup as warmup_pose

SERVICE_NAME         = os.getenv("SERVICE_NAME", "cropper")
PORT                 = os.getenv("PORT", "3800")
MAX_CONCURRENT_CROPS = int(os.getenv("MAX_CONCURRENT_CROPS", "5"))
_crop_sem = threading.Semaphore(MAX_CONCURRENT_CROPS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info(f"[{SERVICE_NAME}] Warming up YOLO pose model...")
    warmup_pose()
    logger.info(f"[{SERVICE_NAME}] Listening on port {PORT}")
    yield


app = FastAPI(lifespan=lifespan)

CropMode = Literal["front", "quarter", "side", "full_body"]


class CropRequest(BaseModel):
    image_path: str
    mode: CropMode = "front"


@app.post("/crop")
def crop_route(req: CropRequest) -> dict:
    logger.info(f"Crop request received — path={req.image_path} mode={req.mode}")

    t0 = time.perf_counter()
    with _crop_sem:
        try:
            path = crop_to_bucket(req.image_path, mode=req.mode)
        except FileNotFoundError as e:
            logger.warning(f"Image not found — path={req.image_path} err={e}")
            raise HTTPException(status_code=404, detail=str(e))
        except ValueError as e:
            logger.warning(f"Crop validation error — path={req.image_path} err={e}")
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected crop error — path={req.image_path} err={e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    elapsed_ms = round((time.perf_counter() - t0) * 1000)
    logger.info(f"Crop done — src={req.image_path} dest={path} ms={elapsed_ms}")
    return {"path": path}
