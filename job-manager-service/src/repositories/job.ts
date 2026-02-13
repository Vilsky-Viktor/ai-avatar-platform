import { Job, JobDB } from 'types/job';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || '';
const JOBS_COLLECTION_NAME = process.env.JOBS_COLLECTION_NAME || '';
const db = getFirestore(DB_NAME);

export const create = async (userId: string, job: Omit<Job, 'id'>): Promise<JobDB> => {
    const jobRef = db.collection(JOBS_COLLECTION_NAME)
        .doc();
    const newId = jobRef.id; 

    const now = Timestamp.now();

    const dbJob: JobDB = {
        ...job,
        id: newId,
        userId: userId,
        createdAt: now,
        updatedAt: now,
    };

    await jobRef.set(dbJob);
    
    return dbJob;
}

export const deleteById = async (userId: string, id: string): Promise<boolean> => {
    const jobRef = db.collection(JOBS_COLLECTION_NAME).doc(id);
    const doc = await jobRef.get();
    
    if (!doc.exists) {
        return false;
    }

    if (doc.data()?.userId !== userId) {
        throw new Error("Unauthorized: User does not own this job resource.");
    }

    await jobRef.delete();
    return true;
};

export const deleteByAvatarId = async (userId: string, avatarId: string): Promise<boolean> => {
    const jobsQuery = db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId);

    const snapshot = await jobsQuery.get();
    
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

export const deleteByUserId = async (userId: string): Promise<boolean> => {
    const jobsQuery = db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId);

    const snapshot = await jobsQuery.get();
    
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