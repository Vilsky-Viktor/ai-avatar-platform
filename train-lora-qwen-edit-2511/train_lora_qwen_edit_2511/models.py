from __future__ import annotations
from pydantic import BaseModel, Field


class InferenceConfig(BaseModel):
    prompts: list[str] = []
    seed: int | None = None
    mediaPaths: list[str] = []
    guidanceScale: float = 4.0
    numSteps: int
    width: int = 1328
    height: int = 1328
    rank: int = 128
    loraAlpha: float = 128.0
    learningRate: float = 1e-4
    gradientAccumulationSteps: int = 4

class JobInput(BaseModel):
    checkDependencies: bool = False
    inference: InferenceConfig = Field(default_factory=InferenceConfig)

class JobResult(BaseModel):
    mediaPath: str = ""
    faceMatches: list[float] = []
    bestFaceMatch: float | None = None
    errorMessage: str = ""
    fileName: str | None = None

class Metadata(BaseModel):
    numBuckets: int = 1

class Job(BaseModel):
    id: str = "unknown"
    groupId: str = ""
    userId: str = ""
    avatarId: str = ""
    mediaType: str = ""
    target: str = "qwenEdit2511Lora"
    status: str = "generating"
    maxRuns: int
    input: JobInput = Field(default_factory=JobInput)
    result: JobResult = Field(default_factory=JobResult)
    metadata: Metadata = Field(default_factory=Metadata)
    order: int | None = None
