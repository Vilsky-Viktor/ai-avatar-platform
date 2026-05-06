export enum MediaTypes {
  image = 'image',
  video = 'video',
}

export enum JobTargets {
  trainingPhotoSet = 'trainingPhotoSet',
  qwenEdit2511Lora = 'qwenEdit2511Lora',
  wan22A14bLora = 'wan22A14bLora',
  avatarMedia = 'avatarMedia',
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
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  maxRuns: number;
  result?: InferenceJobResult;
  metadata?: InferenceJobMetadata;
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
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  maxRuns: number;
  result?: TrainingJobResult;
  metadata?: TrainingJobMetadata;
}

export type Job = InferenceJob | TrainingJob;
