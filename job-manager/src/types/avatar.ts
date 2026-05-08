import { Timestamp } from 'firebase-admin/firestore';

export enum AvatarGender {
  male = 'male',
  female = 'female'
}

export enum AvatarTypes {
  twin = 'twin',
  synthetic = 'synthetic'
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
  outfit: string;
  lips: string;
  bustSize: string;
  ears: string;
  bodyHair: string;
  height: string;
}

export type LoraConfig = {
  path: string;
  filename: string;
}

export type AvatarLoras = {
  qwenEdit2511: LoraConfig;
  wan22T2vA14b?: LoraConfig;
}

export type Avatar = {
  id?: string;
  userId?: string;
  name: string;
  slug: string;
  type: AvatarTypes;
  parameters: AvatarParameters;
  mainImagePath?: string;
  voicePath?: string;
  isUploadedVoice?: boolean;
  photoSetGenerated: boolean;
  loras: AvatarLoras;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}