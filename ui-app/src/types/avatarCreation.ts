import type { Job } from "../types/job";
import { type AvatarParameters, AvatarTypes } from "../types/avatar";


export type GeneralStepData = {
    name: string;
    slug: string;
    type: AvatarTypes;
    parameters: AvatarParameters;
    avatarId: string;
    finished: boolean;
};

export enum IdPhotoModes {
  generate = 'generate',
  upload = 'upload'
};

export type UploadedIdPhoto = {
  photo: string | null;
  isDragging: boolean;
}

export type UploadedPhotoPaths = {
  front: string,
  frontSmile: string,
  rightQuarter: string,
  leftQuarter: string,
}

export type IdPhotoStepData = {
  jobs: (Job | null)[];
  uploadedPhotos?: UploadedPhotoPaths;
  finished: boolean;
};

export type PhotoSetStepData = {
  jobs: (Job | null)[];
  finished: boolean;
};

export type VoiceStepData = {
  uploaded: boolean;
  selectedId: string | null;
  mediaPath: string;
  finished: boolean;
}