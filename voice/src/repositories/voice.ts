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

const FILTER_OPTIONS_BATCH_SIZE = 1000;

export const getFilterOptions = async (gender: string): Promise<{
    languages: string[];
    ages: string[];
    categories: string[];
    useCases: string[];
}> => {
    const languages  = new Set<string>();
    const ages       = new Set<string>();
    const categories = new Set<string>();
    const useCases   = new Set<string>();

    let lastDoc: FirebaseFirestore.DocumentSnapshot | undefined;

    while (true) {
        let query = db.collection(VOICES_COLLECTION_NAME)
            .where('gender', '==', gender)
            .select('language', 'age', 'category', 'useCase')
            .orderBy('__name__')
            .limit(FILTER_OPTIONS_BATCH_SIZE);

        if (lastDoc) query = query.startAfter(lastDoc);

        const snapshot = await query.get();

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (d.language) languages.add(d.language);
            if (d.age)      ages.add(d.age);
            if (d.category) categories.add(d.category);
            if (d.useCase)  useCases.add(d.useCase);
        });

        if (snapshot.size < FILTER_OPTIONS_BATCH_SIZE) break;
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    return {
        languages:  [...languages].sort(),
        ages:       [...ages].sort(),
        categories: [...categories].sort(),
        useCases:   [...useCases].sort(),
    };
};
