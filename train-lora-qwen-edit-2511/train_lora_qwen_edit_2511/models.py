from __future__ import annotations
from pydantic import BaseModel, Field


class TrainingConfig(BaseModel):
    mediaPaths: list[str] = []
    prompts: list[str] = []
    numSteps: int
    width: int | None = None
    height: int | None = None
    rank: int = 32
    loraAlpha: float = 16.0
    learningRate: float = 1.35e-4
    gradientAccumulationSteps: int = 1
    clipGradNorm: float = 0.5


class JobInput(BaseModel):
    checkDependencies: bool = False
    training: TrainingConfig = Field(default_factory=TrainingConfig)


class JobResult(BaseModel):
    mediaPath: str = ""
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
