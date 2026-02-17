import { Timestamp } from 'firebase-admin/firestore';

export enum MediaType {
    image = 'image',
    video = 'video'
}

export type Media = {
    id?: string;
    userId: string;
    avatarId: string;
    jobId: string;
    type: MediaType,
    path: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}