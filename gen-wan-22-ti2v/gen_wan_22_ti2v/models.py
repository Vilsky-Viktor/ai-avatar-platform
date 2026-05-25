from __future__ import annotations
from pydantic import BaseModel, Field

class FaceExpression(BaseModel):
    enabled: bool = False
    type: str = ""
    scale: float = 1.0

class InferenceConfig(BaseModel):
    prompt: str = ""
    negativePrompt: str | None = None
    seed: int | None = None
    mediaPaths: list[str] = []
    guidanceScale: float = 4.0
    numSteps: int
    width: int
    height: int
    videoLength: int = 81
    fps: int = 16
    shift: float = 5.0

class LoraConfig(BaseModel):
    path: str
    scale: float = 1.0
    filename: str | None = None
    boundary: str | None = None  # "high" → transformer_2 only, "low" → transformer only, None → both

class FaceRecognitionThreshold(BaseModel):
    min: float = 0.95
    max: float | None = None

class FaceRecognition(BaseModel):
    enabled: bool = False
    mediaPaths: list[str] = []
    threshold: FaceRecognitionThreshold = Field(default_factory=FaceRecognitionThreshold)

class FaceDirection(BaseModel):
    enabled: bool = False
    direction: str = "" #left or right

class Upscaler(BaseModel):
    enabled: bool = False
    scale: float = 2.0

class Interpolator(BaseModel):
    enabled: bool = False
    targetFps: int = 24

class JobInput(BaseModel):
    checkDependencies: bool = False
    inference: InferenceConfig = Field(default_factory=InferenceConfig)
    faceRecognition: FaceRecognition = Field(default_factory=FaceRecognition)
    faceExpression: FaceExpression = Field(default_factory=FaceExpression)
    faceDirection: FaceDirection = Field(default_factory=FaceDirection)
    upscaler: Upscaler = Field(default_factory=Upscaler)
    interpolator: Interpolator = Field(default_factory=Interpolator)
    loras: list[LoraConfig] = []

class JobResult(BaseModel):
    mediaPath: str = ""
    faceMatches: list[float] = []
    bestFaceMatch: float | None = None
    errorMessage: str = ""
    fileName: str | None = None

class Metadata(BaseModel):
    dimensions: str = ""
    ratio: str = ""
    angle: str = ""
    shotType: str = ""

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
