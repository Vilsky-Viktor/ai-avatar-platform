from __future__ import annotations

from pydantic import BaseModel, Field


class InferenceLevel(BaseModel):
    numRuns: int
    numInferenceSteps: int
    width: int
    height: int


class InferenceConfig(BaseModel):
    imagePaths: list[str] = []
    idPhotoPaths: list[str] = []
    inferenceLevels: list[InferenceLevel] = []
    trueCfgScale: float = 4.0


class LoraConfig(BaseModel):
    path: str
    scale: float = 1.0
    filename: str | None = None


class JobInput(BaseModel):
    prompt: str = ""
    negativePrompt: str | None = None
    resultFileName: str | None = None
    checkDependencyImageExistence: bool = False
    inference: InferenceConfig = Field(default_factory=InferenceConfig)
    loras: list[LoraConfig] = []


class Job(BaseModel):
    id: str = "unknown"
    userId: str = ""
    avatarId: str = ""
    type: str = ""
    order: int | None = None
    input: JobInput = Field(default_factory=JobInput)
