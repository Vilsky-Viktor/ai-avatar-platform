import type { Job } from "../types/job";
import { AvatarGender, type AvatarParameters } from "../types/avatar";


export type GeneralStepData = {
    name: string;
    slug: string;
    gender: AvatarGender;
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

export type IdPhotoStepData = {
  mode: IdPhotoModes;
  parameters: AvatarParameters;
  variantSets: (Partial<Job> | null)[][],
  carouselIndex: number;
  selectedVariant: number | null;
  idPhotoPaths: string[];
  finished: boolean;
};

export type PhotoSetStepData = {
  jobs: (Partial<Job> | null)[];
  finished: boolean;
};