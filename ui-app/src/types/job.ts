import type { FirestoreTimestamp } from "./firestore";
import type { AvatarParameters, AvatarTypes } from "./avatar";
import type { PhotoSetType } from "./image";

export enum MediaType {
  image = 'image',
  video = 'video'
}

export enum JobTargets {
  trainingPhotoSet = 'trainingPhotoSet',
  qwenEdit2511Lora = 'qwenEdit2511Lora',
  avatarMedia = 'avatarMedia',
}

export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  error = 'error',
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

// ── Inference ────────────────────────────────────────────────────────────────

export type InferenceJobResult = {
  mediaPath?: string;
  mediaUrl?: string;
  faceMatches?: number[];
  bestFaceMatch?: number;
  errorMessage?: string;
  fileName?: string;
}

export type InferenceConfig = {
  prompt?: string;
  prompts?: string[];
  negativePrompt?: string;
  mediaPaths?: string[];
  guidanceScale?: number;
  numSteps: number;
  width?: number;
  height?: number;
  seed?: number;
}

export type Upscaler = {
  enabled: boolean;
}

export type InferenceJobInput = {
  inference: InferenceConfig;
  upscaler?: Upscaler;
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

export type InferenceJob = {
  id?: string;
  groupId?: string;
  order?: number;
  userId: string;
  avatarId: string;
  mediaType: MediaType;
  target: JobTargets;
  status?: JobStatuses;
  maxRuns: number;
  input: InferenceJobInput;
  result?: InferenceJobResult;
  metadata?: InferenceJobMetadata;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ── Training ─────────────────────────────────────────────────────────────────

export type TrainingJobResult = {
  mediaPath?: string;
  errorMessage?: string;
  fileName?: string;
}

export type TrainingJobMetadata = {
  queueTopic?: string;
  numBuckets?: number;
}

export type TrainingJob = {
  id?: string;
  groupId?: string;
  userId: string;
  avatarId: string;
  mediaType: MediaType;
  target: JobTargets;
  status?: JobStatuses;
  maxRuns: number;
  result?: TrainingJobResult;
  metadata?: TrainingJobMetadata;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export type Job = InferenceJob | TrainingJob;

export type TrainingJobRequest = {
  avatarType?: AvatarTypes;
  groupId?: string;
  avatarId: string;
  parameters: AvatarParameters;
}

export type PhotoJobRequest = {
  avatarId: string;
  ratio: string;
  prompt: string;
  referenceImagePaths?: string[];
}

export type VideoJobRequest = {
  avatarId: string;
  ratio: string;
  prompt: string;
  referenceImagePaths?: string[];
  lengthSec?: number;
}

export type PhotoSetJobRequest = {
  avatarId: string;
  type: PhotoSetType;
}