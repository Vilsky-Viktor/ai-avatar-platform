import { Timestamp } from 'firebase-admin/firestore';

export enum MediaType {
    image = 'image',
    video = 'video'
}

export enum MediaSection {
    avatar = 'avatar',
    private = 'private'
}

export type Media = {
    id?: string;
    userId: string;
    avatarId: string;
    jobId: string;
    type: MediaType,
    section: MediaSection,
    isRemovable: boolean,
    isIdPhoto: boolean,
    isPhotoSet: boolean,
    path: string;
    dimensions: string;
    upscaled: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}