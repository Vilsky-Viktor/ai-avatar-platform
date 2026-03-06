import { Timestamp } from 'firebase-admin/firestore';

export enum AvatarStatus {
  initialized = 'initialized',
  idCreated = 'id_created',
  photosetCreated = 'photoset_created',
  voiceAssigned = 'voice_assigned',
  training = 'training',
  trained = 'trained',
  error = 'error'
}

export enum AvatarGender {
  male = 'male',
  female = 'female'
}

export type AvatarParameters = {
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
  outfit: string;
  lips: string;
  bustSize: string;
  ears: string;
  bodyHair: string;
  height: string;
}

export type Avatar = {
  id?: string;
  userId: string;
  name: string;
  slug: string;
  gender: AvatarGender;
  imageCount: number;
  videoCount: number;
  parameters?: AvatarParameters;
  idPhotoPaths?: string[];
  status: AvatarStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}