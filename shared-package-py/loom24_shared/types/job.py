from __future__ import annotations

from enum import Enum
from typing import Annotated, Any, List, Optional, Union

from pydantic import BaseModel, Field

from .avatar import AvatarParameters
from .image import ImageRatios
from .video import VideoRatios


class Views(str, Enum):
    front = 'front'
    leftQuarter = 'leftQuarter'
    rightQuarter = 'rightQuarter'
    leftSide = 'leftSide'
    rightSide = 'rightSide'


class ShotTypes(str, Enum):
    upperBody = 'upperBody'
    fullBody = 'fullBody'


class MediaTypes(str, Enum):
    image = 'image'
    video = 'video'
    audio = 'audio'
    text = 'text'


class JobTargets(str, Enum):
    idPhoto = 'idPhoto'
    avatarMedia = 'avatarMedia'


class JobStatuses(str, Enum):
    pending = 'pending'
    generating = 'generating'
    completed = 'completed'
    canceled = 'canceled'
    error = 'error'


class Directions(str, Enum):
    front = 'front'
    leftQuarter = 'leftQuarter'
    rightQuarter = 'rightQuarter'
    leftSide = 'leftSide'
    rightSide = 'rightSide'


class Platforms(str, Enum):
    falai = 'fal-ai'
    google = 'google'
    none = 'none'


class Models(str, Enum):
    qwenImage2512 = 'qwen-image-2512'
    qwenImageEdit2511 = 'qwen-image-edit-2511'
    qwenImageEdit2512MultipleAnglesLora = 'qwen-image-edit-2511-multiple-angles-lora'
    fluxV2ProEdit = 'flux-v2-pro-edit'
    klingV3ProImageToVideo = 'kling-v3-pro-image-to-video'
    klingV3ProMotionControl = 'kling-v3-pro-motion-control'
    topazImageUpscale = 'topaz-image-upscale'
    topazVideoUpscale = 'topaz-video-upscale'
    lipSyncV3 = 'lip-sync-v3'
    elevenV3 = 'eleven-labs-eleven-v3'
    seedvrImageUpscale = 'seedvr-image-upscale'
    geminiImage3Pro = 'gemini-image-3-pro'
    none = 'none'


class Services(str, Enum):
    faceMatcher = 'face-matcher'
    headDirectionChecker = 'head-direction-checker'
    aiModelGateway = 'ai-model-gateway'
    thumbnailMaker = 'thumbnail-maker'


class JobMetadata(BaseModel):
    ratio: Optional[str] = None
    dimensions: Optional[str] = None
    userPrompt: Optional[str] = None
    lengthSec: Optional[int] = None


# ── Workflow step types ────────────────────────────────────────────────────────

class StepBase(BaseModel):
    model_config = {'extra': 'allow'}

    status: JobStatuses
    model: Optional[Models] = None
    platform: Optional[Platforms] = None
    service: Services
    error: Optional[str] = None
    uploadPath: Optional[str] = None


class AiModelGatewayStep(StepBase):
    prompt: Optional[str] = None
    negativePrompt: Optional[str] = None
    ratio: Optional[str] = None
    imagePaths: Optional[List[str]] = None
    videoPaths: Optional[List[str]] = None
    audioPaths: Optional[List[str]] = None
    idPhotoPaths: Optional[List[str]] = None
    objectRefPaths: Optional[List[str]] = None
    safetyTolerance: Optional[float] = None
    horizontalAngle: Optional[float] = None
    verticalAngle: Optional[float] = None
    zoom: Optional[float] = None
    temperature: Optional[float] = None
    keepOriginalAudio: Optional[bool] = None
    duration: Optional[float] = None
    voice: Optional[str] = None


class ThumbnailMakerStep(StepBase):
    mediaType: MediaTypes
    mediaPath: str
    size: int


class FaceMatcherStep(StepBase):
    imagePath: str
    idPhotoPaths: List[str]
    threshold: float
    faceMatch: Optional[float] = None


class HeadDirectionCheckerStep(StepBase):
    imagePath: str
    direction: Directions


WorkflowStep = Annotated[
    Union[FaceMatcherStep, HeadDirectionCheckerStep, ThumbnailMakerStep, AiModelGatewayStep],
    Field(discriminator=None),
]


# ── Request types ──────────────────────────────────────────────────────────────

class IdPhotoJobRequest(BaseModel):
    groupId: Optional[str] = None
    avatarId: str
    parameters: AvatarParameters
    frontIdPhotoPath: Optional[str] = None


class PhotoJobRequest(BaseModel):
    avatarId: str
    ratio: ImageRatios
    prompt: str
    mediaPaths: Optional[List[str]] = None


class VideoJobRequest(BaseModel):
    avatarId: str
    ratio: VideoRatios
    prompt: str
    mediaPaths: Optional[List[str]] = None
    lengthSec: Optional[int] = None
    audioText: Optional[str] = None
    audioPath: Optional[str] = None


class MimicMotionRequest(BaseModel):
    avatarId: str
    imagePath: str
    videoPath: str
    keepOriginalAudio: bool


class AudioJobRequest(BaseModel):
    avatarId: str
    prompt: str


class PhotoSetJobRequest(BaseModel):
    avatarId: str
    type: str


# ── Job ────────────────────────────────────────────────────────────────────────

class Job(BaseModel):
    model_config = {'extra': 'allow'}

    id: Optional[str] = None
    groupId: Optional[str] = None
    userId: str
    avatarId: str
    mediaType: MediaTypes
    target: JobTargets
    status: Optional[JobStatuses] = None
    curRun: int
    maxRuns: int
    createdAt: Optional[Any] = None
    updatedAt: Optional[Any] = None
    order: Optional[int] = None
    workflow: List[StepBase]
    metadata: Optional[JobMetadata] = None
    resultMediaPath: str
    resultThumbnailPath: Optional[str] = None
