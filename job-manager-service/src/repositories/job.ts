import { Job } from '../types/job';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || '';
const JOBS_COLLECTION_NAME = process.env.JOBS_COLLECTION_NAME || '';
const db = getFirestore(DB_NAME);

const batchDeleteQuery = async (query: FirebaseFirestore.Query): Promise<void> => {
  const snapshot = await query.get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

export const getById = async (userId: string, id: string): Promise<Job | null> => {
    const doc = await db.collection(JOBS_COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
        return null;
    }

    if (doc.data()?.userId !== userId) {
        throw new Error("Unauthorized: User does not own this job resource.");
    }

    return doc.data() as Job;
};

export const create = async (userId: string, job: Omit<Job, 'id'>): Promise<Job> => {
    const [dbJob] = await createMany(userId, [job]);
    return dbJob;
}

export const createMany = async (userId: string, jobs: Omit<Job, 'id'>[]): Promise<Job[]> => {
    const now = Timestamp.now();
    const batch = db.batch();
    const dbJobs: Job[] = [];

    for (const job of jobs) {
        const jobRef = db.collection(JOBS_COLLECTION_NAME).doc();
        const dbJob: Job = {
            ...job,
            id: jobRef.id,
            userId,
            createdAt: now,
            updatedAt: now,
        };
        batch.set(jobRef, dbJob);
        dbJobs.push(dbJob);
    }

    await batch.commit();
    return dbJobs;
};

export const update = async (userId: string, jobId: string, updateData: Partial<Job>): Promise<boolean> => {
    try {
        const jobRef = db.collection(JOBS_COLLECTION_NAME).doc(jobId);
        const doc = await jobRef.get();

        if (!doc.exists || doc.data()?.userId !== userId) {
            return false;
        }

        await jobRef.update({
            ...updateData,
            updatedAt: Timestamp.now()
        });

        return true;
    } catch (error) {
        return false;
    }
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

export const deleteByAvatarId = async (userId: string, avatarId: string): Promise<void> => {
    const query = db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId);
    await batchDeleteQuery(query);
};