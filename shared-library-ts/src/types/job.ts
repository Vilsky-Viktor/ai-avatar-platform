import { ImageRatios } from './image';
import { VideoRatios } from './video';
import type { AvatarParameters } from './avatar';

export enum ShotTypes {
  upperBody = 'upperBody',
  fullBody = 'fullBody',
}

export enum CropperModes {
  front = 'front',
  quarter = 'quarter',
  side = 'side',
  body = 'body'
}

export type PhotoSetType =
  'whatsapp-stickers' |
  'around-the-world' |
  'outfit-styles' |
  'luxury-life';

export type IdPhotoJobRequest = {
  groupId?: string;
  avatarId: string;
  parameters: AvatarParameters;
  idPhotoPath?: string;
  order?: number;
  mode?: CropperModes;
  direction?: Directions;
}

export type PhotoJobRequest = {
  avatarId: string;
  ratio: ImageRatios;
  prompt: string;
  mediaPaths?: string[];
  shotType: ShotTypes,
  direction: Directions,
}

export type VideoJobRequest = {
  avatarId: string;
  ratio: VideoRatios;
  prompt: string;
  mediaPaths?: string[];
  lengthSec?: number;
  audioText?: string;
  audioPath?: string;
}

export type MimicMotionRequest = {
  avatarId: string;
  imagePath: string;
  videoPath: string;
  keepOriginalAudio: boolean;
}

export type AudioJobRequest = {
  avatarId: string;
  prompt: string;
}

export type PhotoSetJobRequest = {
  avatarId: string;
  type: PhotoSetType;
}

export enum MediaTypes {
  image = 'image',
  video = 'video',
  audio = 'audio',
  text = 'text',
}

export enum JobTargets {
  idPhoto = 'idPhoto',
  avatarMedia = 'avatarMedia',
}

export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  canceled = 'canceled',
  error = 'error',
}

export enum Directions {
  front = 'front',
  leftQuarter = 'leftQuarter',
  rightQuarter = 'rightQuarter',
  leftSide = 'leftSide',
  rightSide = 'rightSide',
}

export type JobMetadata = {
  ratio?: string;
  dimensions?: string;
  userPrompt?: string;
  lengthSec?: number;
}

export enum Platforms {
  falai = 'fal-ai',
  google = 'google',
  none = 'none',
}

export enum Models {
  qwenImage2512 = 'qwen-image-2512',
  qwenImageEdit2511 = 'qwen-image-edit-2511',
  qwenImageEdit2512MultipleAnglesLora = 'qwen-image-edit-2511-multiple-angles-lora',
  fluxV2ProEdit = 'flux-v2-pro-edit',
  klingV3ProImageToVideo = 'kling-v3-pro-image-to-video',
  klingV3ProMotionControl = 'kling-v3-pro-motion-control',
  topazImageUpscale = 'topaz-image-upscale',
  topazVideoUpscale = 'topaz-video-upscale',
  lipSyncV3 = 'lip-sync-v3',
  elevenV3 = 'eleven-labs-eleven-v3',
  seedvrImageUpscale = 'seedvr-image-upscale',
  geminiImage3Pro = 'gemini-image-3-pro',
  birefNetV2 = 'BirefNetV2',
}

export enum Services {
  faceMatcher = 'face-matcher',
  headDirectionChecker = 'head-direction-checker',
  aiModelGateway = 'ai-model-gateway',
  thumbnailMaker = 'thumbnail-maker',
  cropper = 'cropper',
  imageResizer = 'image-resizer'
}

export type StepBase = {
  error?: string;
  uploadPath?: string;
  status: JobStatuses;
  model?: Models;
  platform?: Platforms;
  service: Services;
}

export type AiModelGateway = StepBase & {
  prompt?: string;
  negativePrompt?: string;
  ratio?: string;
  imagePaths?: string[];
  videoPaths?: string[];
  audioPaths?: string[];
  idPhotoPaths?: string[];
  objectRefPaths?: string[] | null;
  safetyTolerance?: number;
  horizontalAngle?: number;
  verticalAngle?: number;
  zoom?: number;
  temperature?: number;
  keepOriginalAudio?: boolean;
  duration?: number;
  voice?: string;
}

export type FaceMatcher = StepBase & {
  imagePath: string;
  idPhotoPaths: string[];
  threshold: number;
  faceMatch?: number;
}

export type HeadDirectionChecker = StepBase & {
  imagePath: string;
  direction: Directions;
}

export type ThumbnailMaker = StepBase & {
  mediaType: MediaTypes;
  mediaPath: string;
  size: number;
}

export type Cropper = StepBase & {
  mediaPath: string;
  mode: CropperModes;
}

export type ImageResizer = StepBase & {
  mediaPath: string;
  width: number;
  height: number;
}

export type WorkflowStep =
  AiModelGateway |
  FaceMatcher |
  HeadDirectionChecker |
  ThumbnailMaker |
  Cropper |
  ImageResizer;

export type Job = {
  id?: string;
  groupId?: string;
  userId: string;
  avatarId: string;
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  curRun: number;
  maxRuns: number;
  createdAt?: Date;
  updatedAt?: Date;
  order?: number;
  workflow: WorkflowStep[];
  metadata?: JobMetadata;
  resultMediaPath: string;
  resultMediaUrl?: string;
  resultThumbnailPath?: string;
  resultThumbnailUrl?: string;
}
