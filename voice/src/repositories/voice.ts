import { Voice } from '../types/voice';
import { getFirestore } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const VOICES_COLLECTION_NAME = process.env.VOICES_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

const PAGE_SIZE = 20;

export type VoiceFilters = {
    language?: string;
    age?: string;
    category?: string;
    useCase?: string;
};

export const getFiltered = async (
    gender: string,
    filters: VoiceFilters,
    cursor?: string,
): Promise<{ voices: Voice[]; nextCursor: string | null }> => {
    let query: FirebaseFirestore.Query = db.collection(VOICES_COLLECTION_NAME)
        .where('gender', '==', gender);

    if (filters.language) query = query.where('language', '==', filters.language);
    if (filters.age)      query = query.where('age',      '==', filters.age);
    if (filters.category) query = query.where('category', '==', filters.category);
    if (filters.useCase)  query = query.where('useCase',  '==', filters.useCase);

    query = query.orderBy('name', 'asc').limit(PAGE_SIZE);

    if (cursor) {
        const cursorDoc = await db.collection(VOICES_COLLECTION_NAME).doc(cursor).get();
        if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const voices = snapshot.docs.map(doc => doc.data() as Voice);
    const nextCursor = snapshot.size === PAGE_SIZE ? (voices[voices.length - 1]?.id ?? null) : null;
    return { voices, nextCursor };
};

export const getFilterOptions = async (gender: string): Promise<{
    languages: string[];
    ages: string[];
    categories: string[];
    useCases: string[];
}> => {
    const snapshot = await db.collection(VOICES_COLLECTION_NAME)
        .where('gender', '==', gender)
        .get();

    const voices = snapshot.docs.map(doc => doc.data() as Voice);
    return {
        languages:  [...new Set(voices.map(v => v.language))].filter(Boolean).sort(),
        ages:       [...new Set(voices.map(v => v.age))].filter(Boolean).sort(),
        categories: [...new Set(voices.map(v => v.category))].filter(Boolean).sort(),
        useCases:   [...new Set(voices.map(v => v.useCase))].filter(Boolean).sort(),
    };
};
