import type { FirestoreTimestamp } from "./firestore";

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
    groupId: string;
    type: MediaType,
    section: MediaSection,
    isRemovable: boolean,
    isIdPhoto: boolean,
    isPhotoSet: boolean,
    path: string;
    dimensions: string;
    ratio: string;
    angle?: string;
    shotType?: string;
    upscaled: boolean;
    order: number;
    createdAt?: FirestoreTimestamp;
    updatedAt?: FirestoreTimestamp;
}
