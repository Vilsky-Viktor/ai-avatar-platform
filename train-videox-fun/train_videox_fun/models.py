from __future__ import annotations
from pydantic import BaseModel, Field


class ToolkitNetwork(BaseModel):
    type: str
    linear: int
    linear_alpha: int


class ToolkitSave(BaseModel):
    dtype: str
    save_every: int
    max_step_saves_to_keep: int


class ToolkitDataset(BaseModel):
    caption_ext: str
    resolution: list[int]
    caption_dropout_rate: float
    cache_latents_to_disk: bool
    num_frames: int


class ToolkitModelKwargs(BaseModel):
    train_high_noise: bool
    train_low_noise: bool


class ToolkitModel(BaseModel):
    arch: str
    model_kwargs: ToolkitModelKwargs


class ToolkitTrain(BaseModel):
    batch_size: int
    steps: int
    gradient_accumulation: int
    train_unet: bool
    train_text_encoder: bool
    gradient_checkpointing: bool
    noise_scheduler: str
    optimizer: str
    lr: float
    optimizer_params: dict[str, float]
    lr_scheduler: str
    dtype: str
    cache_text_embeddings: bool
    timestep_type: str
    switch_boundary_every: int


class ToolkitProcess(BaseModel):
    type: str
    device: str
    network: ToolkitNetwork
    save: ToolkitSave
    datasets: list[ToolkitDataset]
    train: ToolkitTrain
    model: ToolkitModel


class ToolkitConfig(BaseModel):
    name: str = ""
    process: list[ToolkitProcess]


class Toolkit(BaseModel):
    job: str
    config: ToolkitConfig


class TrainingConfig(BaseModel):
    modelName: str = "wan-22/wan2.2-fun-a14b-inp"
    mediaPaths: list[str] = []
    prompts: list[str] = []
    toolkit: Toolkit


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
    target: str = "wan22T2vA14bLora"
    status: str = "generating"
    maxRuns: int
    input: JobInput = Field(default_factory=JobInput)
    result: JobResult = Field(default_factory=JobResult)
