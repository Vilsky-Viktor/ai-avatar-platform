import type { FirestoreTimestamp } from "./firestore";
import type { AvatarParameters, AvatarTypes } from "./avatar";
import type { MediaType } from "./media";
export type { MediaType };

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

export type InferenceJobMetadata = {
  dimensions?: string;
  ratio?: string;
  angle?: string;
  shotType?: string;
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
}