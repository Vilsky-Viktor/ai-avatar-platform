import type { FirestoreTimestamp } from "./firestore";

export enum AvatarStatus {
  initialized = 'initialized',
  idCreated = 'id_created',
  photosetCreated = 'photoset_created',
  voiceAssigned = 'voice_assigned',
  training = 'training',
  trained = 'trained',
  error = 'error'
}

export enum AvatarTypes {
  digitalTwin = 'twin',
  synthetic = 'synthetic'
}

export enum AvatarGender {
  male = 'male',
  female = 'female'
}

export type AvatarParameters = {
  gender: AvatarGender;
  ethnicity: string;
  skinColor: string;
  age: string;
  attractiveness: string;
  body: string;
  face: string;
  hairStyle: string;
  hairColor: string;
  eyes: string;
  skin: string;
  facialHair: string;
  nose: string;
  eyeLashes: string;
  eyeBrows: string;
  lips: string;
  bustSize: string;
  ears: string;
  bodyHair: string;
  height: string;
}

export type Avatar = {
  id?: string;
  userId?: string;
  name: string;
  slug: string;
  parameters: AvatarParameters;
  mainImagePath?: string;
  status?: AvatarStatus;
  updatedAt?: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp
}