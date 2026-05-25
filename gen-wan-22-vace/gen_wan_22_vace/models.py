from __future__ import annotations
from pydantic import BaseModel, Field

class InferenceConfig(BaseModel):
    mode: str = "s2v"  # "i2v" | "s2v" | "v2v_control_ref"
    prompt: str = ""
    negativePrompt: str | None = None
    seed: int | None = None
    mediaPaths: list[str] = []  # i2v: [start_image]; s2v: [ref...]; v2v_control_ref: [video, ref...]
    guidanceScale: float = 5.0
    numSteps: int
    width: int
    height: int
    videoLength: int = 81
    fps: int = 16
    shift: float = 12.0
    vaceContextScale: float = 1.0

class LoraConfig(BaseModel):
    path: str
    scale: float = 1.0
    filename: str | None = None
    boundary: str | None = None  # "high" → transformer_2 only, "low" → transformer only, None → both

class Upscaler(BaseModel):
    enabled: bool = False
    scale: float = 2.0

class Interpolator(BaseModel):
    enabled: bool = False
    targetFps: int = 24

class JobInput(BaseModel):
    checkDependencies: bool = False
    inference: InferenceConfig = Field(default_factory=InferenceConfig)
    upscaler: Upscaler = Field(default_factory=Upscaler)
    interpolator: Interpolator = Field(default_factory=Interpolator)
    loras: list[LoraConfig] = []

class JobResult(BaseModel):
    mediaPath: str = ""
    errorMessage: str = ""
    fileName: str | None = None

class Metadata(BaseModel):
    dimensions: str = ""
    ratio: str = ""
    queueTopic: str = ""
    userPrompt: str = ""
    lengthSec: int | None = None

class Job(BaseModel):
    id: str = "unknown"
    groupId: str = ""
    userId: str = ""
    avatarId: str = ""
    mediaType: str = ""
    target: str = ""
    status: str = "generating"
    maxRuns: int
    input: JobInput = Field(default_factory=JobInput)
    result: JobResult = Field(default_factory=JobResult)
    metadata: Metadata = Field(default_factory=Metadata)
    order: int | None = None
