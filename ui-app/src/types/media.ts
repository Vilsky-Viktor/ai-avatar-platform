import type { FirestoreTimestamp } from "./firestore";

export enum MediaTypes {
    image = 'image',
    video = 'video'
}

export enum MediaSections {
    avatar = 'avatar',
    private = 'private'
}

export type Media = {
    id?: string;
    userId: string;
    avatarId: string;
    jobId: string;
    type: MediaTypes,
    section: MediaSections,
    isRemovable: boolean,
    isIdPhoto: boolean,
    isPhotoSet: boolean,
    path: string;
    dimensions: string;
    upscaled: boolean;
    order: number;
    updatedAt?: FirestoreTimestamp;
    createdAt?: FirestoreTimestamp
}
