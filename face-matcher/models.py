from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class JobStatus(str, Enum):
    pending    = "pending"
    generating = "generating"
    completed  = "completed"
    error      = "error"
    canceled   = "canceled"


class StepBase(BaseModel):
    model_config = {"extra": "allow"}

    service: Optional[str] = None
    status: JobStatus
    model: str = ''
    platform: str = ''
    error: Optional[str] = None
    uploadPath: Optional[str] = None


class FaceMatcherStep(StepBase):
    internalService: str
    imagePath: str
    idPhotoPaths: List[str]
    threshold: float
    faceMatch: float = 0.0


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
    workflow: List[StepBase]
    metadata: Optional[dict] = None
    resultMediaPath: str
