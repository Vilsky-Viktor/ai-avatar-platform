from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

from controllers.crop import crop_headshot_to_bucket

app = FastAPI()


class CropRequest(BaseModel):
    image_path: str
    width: int
    height: int

    @field_validator("width", "height")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("must be positive")
        return v


@app.post("/crop-headshot")
def crop_headshot_route(req: CropRequest) -> dict:
    try:
        path = crop_headshot_to_bucket(req.image_path, req.width, req.height)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"path": path}
