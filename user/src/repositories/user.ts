import { User } from '../types/user';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

export const getById = async (id: string): Promise<User | null> => {
    const userRef = db.collection(USERS_COLLECTION_NAME).doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return null;
    return userDoc.data() as User;
}

export const sync = async (user: User): Promise<{ user: User; created: boolean }> => {
    const userRef = db.collection(USERS_COLLECTION_NAME).doc(user.id);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        return { user: userDoc.data() as User, created: false };
    }

    const dbUser: User = {
        ...user,
        credits: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await userRef.set(dbUser);
    return { user: dbUser, created: true };
}