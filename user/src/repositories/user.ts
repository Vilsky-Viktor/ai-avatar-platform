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

    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
            const dbUser: User = {
                ...user,
                credits: 0,
                createdAt: Timestamp.now() as unknown as User['createdAt'],
                updatedAt: Timestamp.now() as unknown as User['updatedAt'],
            };
            transaction.set(userRef, dbUser);
            return { user: dbUser, created: true };
        }

        const existingUser = userDoc.data() as User;
        const nameChanged = !!user.name && user.name !== existingUser.name;
        const imgChanged = user.img !== existingUser.img;

        if (nameChanged || imgChanged) {
            const updates: Partial<User> = { updatedAt: Timestamp.now() as unknown as User['updatedAt'] };
            if (nameChanged) updates.name = user.name;
            if (imgChanged) updates.img = user.img;
            transaction.update(userRef, updates);
            return { user: { ...existingUser, ...updates }, created: false };
        }

        return { user: existingUser, created: false };
    });
}
