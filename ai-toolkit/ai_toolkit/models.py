from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class TrainingConfig(BaseModel):
    modelName: str = "qwen-edit-2511"
    mediaPaths: list[str] = []
    prompts: list[str] = []
    toolkit: dict[str, Any] = Field(default_factory=dict)


class JobInput(BaseModel):
    checkDependencies: bool = False
    training: TrainingConfig = Field(default_factory=TrainingConfig)


class JobResult(BaseModel):
    mediaPath: str = ""
    errorMessage: str = ""
    fileName: str | None = None


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
