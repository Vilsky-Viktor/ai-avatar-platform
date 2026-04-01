import { Timestamp } from 'firebase-admin/firestore';
import { AvatarParameters } from './avatar';

export enum JobTypes {
  idPhoto = 'idPhoto',
  photoSet = 'photoSet',
  text2image = 'text2image',
  textImage2image = 'textimage2image'
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

export type InferenceLevel = {
  numRuns: number;
  numInferenceSteps: number;
  width: number;
  height: number;
}

export type Inference = {
  imagePaths: string[];
  idPhotoPaths: string[];
  inferenceLevels: InferenceLevel[];
  trueCfgScale: number;
  seed?: number;
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
  prompt?: string;
  videoPath?: string;
  checkDependencyImageExistence: boolean;
  faceSwap?: FaceSwapParams;
  faceEnhancement?: FaceEnhancementParams;
  controlnet?: ControlNet;
  inference?: Inference;
  resultFileName?: string;
  loras?: LoraData[];
}

export type JobRequestInput = {
  gender: string;
  parameters: AvatarParameters;
  idPhotoPaths?: string[]
};

export type JobResult = {
  mediaPath: string;
  similarities?: number[];
  maxSimilarity?: number;
  bestRunNum?: number;
  error?: string;
}

export type Job = {
  id?: string;
  groupId?: string;
  order?: number;
  userId: string;
  avatarId: string;
  type: JobTypes;
  status: JobStatuses;
  numRuns: number;
  input: JobInput
  result?: JobResult;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type JobRequest = {
  groupId?: string;
  avatarId: string;
  input: JobRequestInput;
}
