from dotenv import load_dotenv
load_dotenv()

import os
import threading
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from loom24_shared import logger
from controllers.crop import crop_to_bucket
from utils.detector import warmup as warmup_pose

MAX_CONCURRENT_CROPS = int(os.getenv("MAX_CONCURRENT_CROPS", "4"))
_crop_sem = threading.Semaphore(MAX_CONCURRENT_CROPS)

app = FastAPI()


@app.on_event("startup")
def startup() -> None:
    logger.info("Warming up mediapipe pose model...")
    warmup_pose()
    logger.info("Mediapipe pose model ready")

CropMode = Literal["front", "quarter", "side", "full_body"]


class CropRequest(BaseModel):
    image_path: str
    mode: CropMode = "front"


@app.post("/crop")
def crop_route(req: CropRequest) -> dict:
    with _crop_sem:
        try:
            path = crop_to_bucket(req.image_path, mode=req.mode)
        except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            logger.exception("Unexpected error cropping %s", req.image_path)
            raise HTTPException(status_code=500, detail=str(e))

    return {"path": path}
