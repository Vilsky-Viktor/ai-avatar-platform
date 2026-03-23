from pydantic import BaseModel

class FaceSwapParams(BaseModel):
    enabled: bool = False
    model: str = ""
    weight: float = 1.0
    pixelBoost: str = "1024x1024"
    imageRefIdx: int = 0

class FaceEnhancementParams(BaseModel):
    enabled: bool = False
    model: str = ""
    weight: float = 0.5
    blend: int = 80

class FaceMatchParams(BaseModel):
    enabled: bool = False
    threshold: float = 0.99

class InferenceParams(BaseModel):
    width: int = 1360
    height: int = 768
    guidance: float = 4.0
    numSteps: int = 35
    seed: int | None = None

class JobInput(BaseModel):
    prompt: str = ""
    imagePaths: list[str] = []
    idPhotoPaths: list[str] = []
    checkDependencyImageExistence: bool = False
    upsamplePromptMode: str = "none"
    inference: InferenceParams = InferenceParams()
    faceMatch: FaceMatchParams = FaceMatchParams()
    faceSwap: FaceSwapParams = FaceSwapParams()
    faceEnhancement: FaceEnhancementParams = FaceEnhancementParams()

class JobResult(BaseModel):
    mediaPath: str = ""
    faceMatches: list[float] = []
    errors: list[str] = []

class Job(BaseModel):
    id: str
    groupId: str
    order: int
    userId: str
    avatarId: str
    type: str
    status: str
    numRuns: int = 0
    maxRuns: int = 1
    fileName: str
    input: JobInput = JobInput()
    result: JobResult = JobResult()