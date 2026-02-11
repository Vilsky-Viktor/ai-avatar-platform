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

export type Avatar = {
  id?: string;
  userId: string;
  name: string;
  gender: AvatarGender;
  imageCount: number;
  videoCount: number;
  parameters?: object;
  image?: string;
  status: AvatarStatus;
}

export type AvatarDB = Avatar & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}