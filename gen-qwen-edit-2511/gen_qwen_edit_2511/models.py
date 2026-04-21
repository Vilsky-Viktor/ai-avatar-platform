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

class LoraConfig(BaseModel):
    path: str
    scale: float = 1.0
    filename: str | None = None

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

class TrainingConfig(BaseModel):
    outputLoraPath: str                       # GCS destination path, e.g. "models/qwen-edit-2511/loras/avatar-xyz"
    triggerWord: str = "ohwx person"          # Unique token bound to the subject
    rank: int = 128                           # LoRA rank — high for maximum detail capacity
    loraAlpha: float = 128.0                  # Alpha = rank → effective scale = 1.0
    learningRate: float = 1e-4
    numSteps: int = 1500
    gradientAccumulationSteps: int = 4
    resolution: int = 1024                    # Base resolution; per-image buckets snap to nearest


class JobInput(BaseModel):
    checkDependencies: bool = False
    inference: InferenceConfig = Field(default_factory=InferenceConfig)
    faceRecognition: FaceRecognition = Field(default_factory=FaceRecognition)
    faceExpression: FaceExpression = Field(default_factory=FaceExpression)
    faceDirection: FaceDirection = Field(default_factory=FaceDirection)
    loras: list[LoraConfig] = []
    training: TrainingConfig | None = None

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
