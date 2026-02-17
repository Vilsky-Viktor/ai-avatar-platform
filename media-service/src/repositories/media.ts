import { Media } from '../types/media';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const MEDIA_COLLECTION_NAME = process.env.MEDIA_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

export const create = async (userId: string, media: Omit<Media, 'id'>): Promise<Media> => {
    const mediaRef = db.collection(MEDIA_COLLECTION_NAME).doc();
    const newId = mediaRef.id; 

    const now = Timestamp.now();

    const dbAvatar: Media = {
        ...media,
        id: newId,
        userId: userId,
        createdAt: now,
        updatedAt: now,
    };

    await mediaRef.set(dbAvatar);
    
    return dbAvatar;
}