import { Timestamp } from 'firebase-admin/firestore';
import { AvatarParameters } from './avatar';

export enum MediaTypes {
  image = 'image',
  video = 'video',
}

export enum JobTargets {
  trainingPhotoSet = 'trainingPhotoSet',
}

export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  error = 'error',
}

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

export type FaceExpression = {
  enabled: boolean;
  type: FaceExpressionTypes;
  scale?: number;
}

export type InferenceConfig = {
  prompt?: string;
  negativePrompt?: string;
  mediaPaths?: string[];
  guidanceScale?: number;
  numSteps: number;
  width?: number;
  height?: number;
  seed?: number;
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
}

export type JobInput = {
  checkDependencies: boolean;
  inference: InferenceConfig;
  faceRecognition?: FaceRecognition;
  faceExpression?: FaceExpression;
  loras?: LoraData[];
}

export type JobRequestInput = {
  gender: string;
  parameters: AvatarParameters;
  idPhotoPaths?: string[]
};

export type JobResult = {
  mediaPath?: string;
  faceMatches?: number[];
  bestFaceMatch?: number;
  errorMessage?: string;
  fileName: string;
}

export type Metadata = {
  dimensions: string;
  ratio: string;
  angle: string;
  shotType: string;
  queueTopic?: string;
}

export type Job = {
  id?: string;
  groupId?: string;
  order?: number;
  userId: string;
  avatarId: string;
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  maxRuns: number;
  input: JobInput;
  result?: JobResult;
  metadata?: Metadata;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type JobRequest = {
  groupId?: string;
  avatarId: string;
  input: JobRequestInput;
}

export type TrainingJobRequest = {
  groupId?: string;
  avatarId: string;
  parameters: AvatarParameters;
}