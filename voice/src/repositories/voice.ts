import { Voice } from '../types/voice';
import { getFirestore } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const VOICES_COLLECTION_NAME = process.env.VOICES_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

export const getByGender = async (gender: string): Promise<Voice[]> => {
    const voicesCollectionRef = db.collection(VOICES_COLLECTION_NAME).where("gender", "==", gender);

    const snapshot = await voicesCollectionRef.get();

    return snapshot.docs.map(doc => doc.data() as Voice);
}

