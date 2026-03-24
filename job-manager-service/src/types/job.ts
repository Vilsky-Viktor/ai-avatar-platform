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
}

export type JobInput = {
  prompt?: string;
  idPhotoPaths?: string[];
  imagePaths?: string[];
  videoPath?: string;
  width: number;
  height: number;
  guidance: number;
  numSteps: number;
  maxRuns: number;
  similarityThreshold?: number;
  checkDependencyImageExistance: boolean;
  resultFileName?: string;
  upsamplePromptMode: string;
  seed?: number;
  faceSwap?: FaceSwapParams;
  faceEnhancement?: FaceEnhancementParams;
  controlImage?: string;
  controlnetScale?: number;
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
