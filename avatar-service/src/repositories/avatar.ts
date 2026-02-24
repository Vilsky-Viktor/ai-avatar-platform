import { Avatar } from '../types/avatar';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const AVATARS_COLLECTION_NAME = process.env.AVATARS_COLLECTION_NAME || ''
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

export const getAll = async (userId: string): Promise<Avatar[]> => {
    const avatarsCollectionRef = db.collection(USERS_COLLECTION_NAME)
        .doc(userId)
        .collection(AVATARS_COLLECTION_NAME);

    const snapshot = await avatarsCollectionRef.get();

    return snapshot.docs.map(doc => doc.data() as Avatar);
}

export const create = async (userId: string, avatar: Omit<Avatar, 'id'>): Promise<Avatar> => {
    const avatarRef = db.collection(USERS_COLLECTION_NAME)
        .doc(userId)
        .collection(AVATARS_COLLECTION_NAME)
        .doc();
    const newId = avatarRef.id; 

    const now = Timestamp.now();

    const dbAvatar: Avatar = {
        ...avatar,
        id: newId,
        userId: userId,
        createdAt: now,
        updatedAt: now,
    };

    await avatarRef.set(dbAvatar);
    
    return dbAvatar;
}

export const update = async (userId: string, avatarId: string, avatarData: Partial<Avatar>): Promise<Avatar> => {
    const avatarRef = db.collection(USERS_COLLECTION_NAME)
        .doc(userId)
        .collection(AVATARS_COLLECTION_NAME)
        .doc(avatarId);
    const now = Timestamp.now();

    const updatePayload = {
        ...avatarData,
        updatedAt: now
    };

    await avatarRef.update(updatePayload);

    const snapshot = await avatarRef.get();
    
    if (!snapshot.exists) {
        throw new Error(`Avatar with id ${avatarId} not found`);
    }

    return snapshot.data() as Avatar;
}

export const updateCounter = async (userId: string, avatarId: string, fieldName: string, amount: number) => {
    const avatarRef = db.collection(USERS_COLLECTION_NAME)
        .doc(userId)
        .collection(AVATARS_COLLECTION_NAME)
        .doc(avatarId);

    const now = Timestamp.now();

    await avatarRef.update({
      [fieldName]: FieldValue.increment(amount),
      updatedAt: now
    });
}

export const deleteByAvatarId = async (userId: string, avatarId: string): Promise<boolean> => {
    const avatarRef = db.collection(USERS_COLLECTION_NAME)
        .doc(userId)
        .collection(AVATARS_COLLECTION_NAME)
        .doc(avatarId);

    const snapshot = await avatarRef.get();
    
    if (!snapshot.exists) {
        return false;
    }

    await avatarRef.delete();

    return true;
}

export const deleteByUserId = async (userId: string): Promise<boolean> => {
    const avatarsCollectionRef = db.collection(USERS_COLLECTION_NAME)
        .doc(userId)
        .collection(AVATARS_COLLECTION_NAME);

    const snapshot = await avatarsCollectionRef.get();

    if (snapshot.empty) {
        return false;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    return true;
};