import { Timestamp } from 'firebase-admin/firestore';

export enum MediaTypes {
  image = 'image',
  video = 'video',
}

export enum JobTargets {
  idPhoto = 'idPhoto',
  avatarMedia = 'avatarMedia',
}

export enum JobStatuses {
  pending = 'pending',
  generating = 'generating',
  completed = 'completed',
  error = 'error',
}

export enum Directions {
  front = 'front',
  left = 'left',
  right = 'right',
}

export type JobMetadata = {
  ratio?: string;
  userPrompt?: string;
  lengthSec?: number;
}

export enum Services {
  imageGenerator = 'image-generator',
  videoGenerator = 'video-generator',
  audioGenerator = 'audio-generator',
  imageUpscaler = 'image-upscaler',
  videoUpscaler = 'video-upscaler',
  lipSync = 'lip-sync',
  faceMatcher = 'face-matcher',
  headDirectionChecker = 'head-direction-checker',
}

export type ServiceBase = {
  service: Services;
  error?: string;
  uploadPath?: string;
  status: JobStatuses;
}

export type ImageGenerator = ServiceBase & {
  prompt: string;
  negativePrompt: string;
  ratio: string;
  imagePaths?: string[];
  safetyTolerance?: number;
  horizontalAngle?: number;
  verticalAngle?: number;
  zoom?: number;
}

export type videoGenerator = ServiceBase & {
  prompt?: string;
  negativePrompt?: string;
  imagePath: string;
  imageRefPaths: string[];
  objectRefPaths?: string[] | null;
  duration: number;
  ratio?: string;
}

export type ImageUpscaler = ServiceBase & {
  imagePath: string;
}

export type VideoUpscaler = ServiceBase & {
  videoPath: string;
}

export type AudioGenerator = ServiceBase & {
  text: string;
  voice: string;
  language: string;
}

export type LipSync = ServiceBase & {
  videoPath: string;
  audioPath: string;
}

export type FaceMatcher = ServiceBase & {
  imagePath: string;
  threshold: number;
}

export type HeadDirectionChecker = ServiceBase & {
  imagePath: string;
  direction: Directions;
}

export type Workflow = 
  ImageGenerator | 
  videoGenerator | 
  ImageUpscaler | 
  VideoUpscaler | 
  AudioGenerator | 
  LipSync | 
  FaceMatcher | 
  HeadDirectionChecker;

export type Job = {
  id?: string;
  groupId?: string;
  userId: string;
  avatarId: string;
  mediaType: MediaTypes;
  target: JobTargets;
  status?: JobStatuses;
  curRun: number;
  maxRuns: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  order?: number;
  workflow: Workflow[];
  metadata?: JobMetadata;
  resultMediaPath: string;
}