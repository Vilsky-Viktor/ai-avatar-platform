import { Media } from '../types/media';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const MEDIA_COLLECTION_NAME = process.env.MEDIA_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

const batchDeleteQuery = async (query: FirebaseFirestore.Query): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> => {
  const snapshot = await query.get();
  if (snapshot.empty) return [];
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.docs;
};

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

export const deleteById = async (userId: string, id: string): Promise<Media | null> => {
    const jobRef = db.collection(MEDIA_COLLECTION_NAME).doc(id);
    const doc = await jobRef.get();
    
    if (!doc.exists) {
        return null;
    }

    if (doc.data()?.userId !== userId) {
        throw new Error("Unauthorized: User does not own this job resource.");
    }

    await jobRef.delete();
    return doc.data() as Media;
};

export const deleteByAvatarId = async (userId: string, avatarId: string): Promise<Media[]> => {
    const query = db.collection(MEDIA_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId);
    const docs = await batchDeleteQuery(query);
    return docs.map(doc => doc.data() as Media);
};

export const deleteByUserId = async (userId: string): Promise<Media[]> => {
    const query = db.collection(MEDIA_COLLECTION_NAME)
        .where("userId", "==", userId);
    const docs = await batchDeleteQuery(query);
    return docs.map(doc => doc.data() as Media);
};