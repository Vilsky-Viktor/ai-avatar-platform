import { Job, JobDB } from 'types/job';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || ''
const JOBS_COLLECTION_NAME = process.env.JOBS_COLLECTION_NAME || ''
const db = getFirestore(DB_NAME)

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
