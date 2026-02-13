import type { FirestoreTimestamp } from "./firestore";

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
  imageUrl?: string;
  videoUrl?: string;
}

export type IdPhotoJobInput = {
  gender: string;
  ethnicity: string;
  age: string;
  body: string;
  face: string;
  hairStyle: string;
  hairColor: string;
  eyes: string;
  skin: string;
  facialHair: string;
}

export type JobResult = {
  mediaId: string;
  mediaUrl: string;
  error?: string;
}

export type Job = {
  id: string;
  userId: string;
  avatarId: string;
  type: JobTypes;
  status: JobStatuses;
  input: JobInput
  result?: JobResult;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type IdPhotoJob = {
  avatarId: string;
  input: IdPhotoJobInput;
}
