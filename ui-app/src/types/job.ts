import type { FirestoreTimestamp } from "./firestore";
import type { AvatarParameters } from "./avatar";

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
  width?: number;
  height?: number;
}

export type JobRequestInput = {
  gender: string;
  parameters: AvatarParameters;
  idPhotoPaths?: string[]
};

export type PhotoSetJobInput = {
  idPhotoPaths: string[];
  gender: string;
  parameters: AvatarParameters;
}

export type JobResult = {
  mediaPath: string;
  mediaUrl?: string;
  minSimilarity?: number;
  maxSimilarity?: number;
  numTries?: number;
  error?: string;
}

export type Job = {
  id: string;
  groupId?: string;
  order?: number;
  userId: string;
  avatarId: string;
  type: JobTypes;
  status: JobStatuses;
  input: JobInput
  result?: JobResult;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type JobRequest = {
  groupId?: string;
  avatarId: string;
  input: JobRequestInput;
}
