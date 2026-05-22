import { Timestamp } from 'firebase-admin/firestore';
import { AvatarParameters, AvatarTypes } from './avatar';
import { PhotoSetType, qwenEdit2511 } from './image';
import type { VideoRatio } from './image';

export enum MediaTypes {
  image = 'image',
  video = 'video',
}

export enum JobTargets {
  trainingPhotoSet = 'trainingPhotoSet',
  qwenEdit2511Lora = 'qwenEdit2511Lora',
  wan22T2vA14bLora = 'wan22T2vA14bLora',
  avatarMedia = 'avatarMedia',
}

export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  error = 'error',
}

export enum Directions {
  left = 'left',
  right = 'right',
}

export enum FaceExpressionTypes {
  sad = 'sad',
  angry = 'angry',
  confused = 'confused',
  contempt = 'contempt',
  confident = 'confident',
  disgust = 'disgust',
  fear = 'fear',
  happy = 'happy',
  shy = 'shy',
  sleepy = 'sleepy',
  surprised = 'surprised',
  anxious = 'anxious'
}

// ── Shared inference input helpers ──────────────────────────────────────────

export type FaceSwapParams = {
  enabled: boolean;
  model?: string;
  weight?: number;
  pixelBoost?: string;
  referenceIdx?: number;
}

export type FaceEnhancementParams = {
  enabled: boolean;
  model?: string;
  weight?: number;
  blend?: number;
  referenceIdx?: number;
}

export type FaceExpression = {
  enabled: boolean;
  type: FaceExpressionTypes;
  scale?: number;
}

export type FaceRecognition = {
  enabled: boolean;
  mediaPaths?: string[];
  threshold?: {
    min: number;
    max?: number;
  };
}

export type ControlNet = {
  enabled: boolean;
  imagePath?: string;
  scale?: number;
}

export type LoraData = {
  path: string;
  scale?: number;
  filename?: string;
  boundary?: string; // "high" → transformer_2 only, "low" → transformer only, undefined → both
}

export type FaceDirection = {
  enabled: boolean;
  direction?: Directions;
}

// ── Inference ────────────────────────────────────────────────────────────────

export type InferenceConfig = {
  prompt?: string;
  negativePrompt?: string;
  mediaPaths?: string[];
  guidanceScale?: number;
  numSteps: number;
  width?: number;
  height?: number;
  seed?: number;
  videoLength?: number;
  fps?: number;
  shift?: number;
}

export type InferenceJobInput = {
  checkDependencies: boolean;
  inference: InferenceConfig;
  faceRecognition?: FaceRecognition;
  faceExpression?: FaceExpression;
  faceDirection?: FaceDirection;
  loras?: LoraData[];
}

export type InferenceJobResult = {
  mediaPath?: string;
  faceMatches?: number[];
  bestFaceMatch?: number;
  errorMessage?: string;
  fileName?: string;
}

export type InferenceJobMetadata = {
  dimensions?: string;
  ratio?: string;
  angle?: string;
  shotType?: string;
  queueTopic?: string;
  userPrompt?: string;
  lengthSec?: number;
}

// ── Training ─────────────────────────────────────────────────────────────────

export type TrainingConfig = {
  modelName: string;
  mediaPaths: string[];
  prompts: string[];
  toolkit: Record<string, any>;
}

export type TrainingJobInput = {
  checkDependencies: boolean;
  training: TrainingConfig;
}

export type TrainingJobResult = {
  mediaPath?: string;
  errorMessage?: string;
  fileName?: string;
}

export type TrainingJobMetadata = {
  queueTopic?: string;
}

// ── Job ──────────────────────────────────────────────────────────────────────

type BaseJob = {
  id?: string;
  groupId?: string;
  userId: string;
  avatarId: string;
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  maxRuns: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type InferenceJob = BaseJob & {
  order?: number;
  input: InferenceJobInput;
  result?: InferenceJobResult;
  metadata?: InferenceJobMetadata;
}

export type TrainingJob = BaseJob & {
  input: TrainingJobInput;
  result?: TrainingJobResult;
  metadata?: TrainingJobMetadata;
}

export type Job = InferenceJob | TrainingJob;

// ── Request types ─────────────────────────────────────────────────────────────

export type TrainingJobRequest = {
  avatarType: AvatarTypes;
  groupId?: string;
  avatarId: string;
  parameters: AvatarParameters;
}

export type ImageRatio = keyof typeof qwenEdit2511;

export type PhotoJobRequest = {
  avatarId: string;
  ratio: ImageRatio;
  prompt: string;
  referenceImagePaths?: string[];
}

export type VideoJobRequest = {
  avatarId: string;
  ratio: VideoRatio;
  prompt: string;
  referenceImagePaths?: string[];
  lengthSec?: number;
}

export type PhotoSetJobRequest = {
  avatarId: string;
  type: PhotoSetType;
}