import { User } from '../types/user';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

export const sync = async (user: User): Promise<User> => {
    const userRef = db.collection(USERS_COLLECTION_NAME).doc(user.id);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        return userDoc.data() as User;
    }

    const dbUser: User = {
        ...user,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await userRef.set(dbUser);
    return dbUser;
}