import type { FirestoreTimestamp } from "./firestore";
import type { AvatarParameters } from "./avatar";
import type { PhotoSetType } from "./image";

export enum Views {
  front = 'front',
  leftQuarter = 'leftQuarter',
  rightQuarter = 'rightQuarter',
  leftSide = 'leftSide',
  rightSide = 'rightSide',
}

export enum ShotTypes {
  upperBody = 'upperBody',
  fullBody = 'fullBody',
}

export type IdPhotoJobRequest = {
  groupId?: string;
  avatarId: string;
  parameters: AvatarParameters;
  frontIdPhotoPath?: string;
}

export type PhotoJobRequest = {
  avatarId: string;
  ratio: string;
  prompt: string;
  mediaPaths?: string[];
}

export type VideoJobRequest = {
  avatarId: string;
  ratio: string;
  prompt: string;
  mediaPaths?: string[];
  lengthSec?: number;
  audioText?: string;
}

export type AudioJobRequest = {
  avatarId: string;
  prompt: string;
}

export type PhotoSetJobRequest = {
  avatarId: string;
  type: PhotoSetType;
}

export enum MediaTypes {
  image = 'image',
  video = 'video',
  audio = 'audio'
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
  dimensions?: string;
  userPrompt?: string;
  lengthSec?: number;
}

export enum Services {
  imageGenerator = 'image-generator',
  videoGenerator = 'video-generator',
  audioGenerator = 'audio-generator',
  upscaler = 'upscaler',
  lipSync = 'lip-sync',
  faceMatcher = 'face-matcher',
  headDirectionChecker = 'head-direction-checker',
}

export enum Models {
  qwen = 'qwen',
  flux = 'flux',
  kling = 'kling',
  topaz = 'topaz',
  lipSync = 'lipSync',
  eleven = 'eleven',
  buffaloL = 'buffalo_l',
  seedvr = 'seedvr',
  none = 'none'
}

export enum Flows {
  t2i = 't2i',
  i2i = 'i2i',
  ti2i = 'ti2i',
  ia2i = 'ia2i',
  ti2v = 'ti2v',
  v2v = 'v2v',
  t2a = 't2a',
  va2v = 'va2v',
  none = 'none',
}

export type ServiceBase = {
  service: Services;
  error?: string;
  uploadPath?: string;
  status: JobStatuses;
  model: Models;
  flow: Flows;
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

export type Upscaler = ServiceBase & {
  imagePath?: string;
  videoPath?: string;
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

export type WorkflowStep = 
  ImageGenerator | 
  videoGenerator | 
  Upscaler | 
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
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  order?: number;
  workflow: WorkflowStep[];
  metadata?: JobMetadata;
  resultMediaPath: string;
  resultMediaUrl?: string;
}