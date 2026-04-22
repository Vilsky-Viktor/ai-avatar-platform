import { Timestamp } from 'firebase-admin/firestore';
import { MediaType } from './media';

export enum JobTargets {
  trainingPhotoSet = 'trainingPhotoSet',
  qwenEdit2511Lora = 'qwenEdit2511Lora',
}

export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  error = 'error',
}

// ── Inference ────────────────────────────────────────────────────────────────

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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type Job = InferenceJob | TrainingJob;
