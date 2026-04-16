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

class JobInput(BaseModel):
    checkDependencies: bool = False
    inference: InferenceConfig = Field(default_factory=InferenceConfig)
    faceRecognition: FaceRecognition = Field(default_factory=FaceRecognition)
    faceExpression: FaceExpression = Field(default_factory=FaceExpression)
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
