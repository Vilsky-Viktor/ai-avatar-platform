from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel


class JobStatus(str, Enum):
    pending    = "pending"
    generating = "generating"
    completed  = "completed"
    error      = "error"
    canceled   = "canceled"


class FaceMatcherStep(BaseModel):
    model_config = {"extra": "allow"}

    service: str
    status: JobStatus
    model: str
    flow: str
    imagePath: str
    idPhotoPaths: List[str]
    threshold: float
    faceMatch: float = 0.0
    error: Optional[str] = None
    uploadPath: Optional[str] = None


class Job(BaseModel):
    model_config = {"extra": "allow"}

    id: Optional[str] = None
    groupId: Optional[str] = None
    userId: str
    avatarId: str
    mediaType: str
    target: str
    status: Optional[JobStatus] = None
    curRun: int
    maxRuns: int
    order: Optional[int] = None
    workflow: List[Any]
    metadata: Optional[dict] = None
    resultMediaPath: str
