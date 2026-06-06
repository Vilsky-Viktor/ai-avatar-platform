from dotenv import load_dotenv
load_dotenv()

import logging
import os
import threading
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from controllers.crop import crop_to_bucket

logger = logging.getLogger(__name__)

MAX_CONCURRENT_CROPS = int(os.getenv("MAX_CONCURRENT_CROPS", "4"))
_crop_sem = threading.Semaphore(MAX_CONCURRENT_CROPS)

app = FastAPI()

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
