import { Timestamp } from 'firebase-admin/firestore';

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

export type JobInput = {
  prompt?: string;
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
}

export type JobResult = {
  mediaPath: string;
  similarities?: number[];
  maxSimilarity?: number;
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
  input: JobInput
  result?: JobResult;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
