import { Job, JobStatuses, JobTargets } from '@loom24/shared/types';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import logger from '@loom24/shared/logger';

const DB_NAME = process.env.DB_NAME || '';
const JOBS_COLLECTION_NAME = process.env.JOBS_COLLECTION_NAME || '';
const db = getFirestore(DB_NAME);

const STATUS_ORDER: Record<string, number> = {
    [JobStatuses.pending]:    0,
    [JobStatuses.generating]: 1,
    [JobStatuses.completed]:  2,
    [JobStatuses.error]:      2,
};

const batchDeleteQuery = async (query: FirebaseFirestore.Query): Promise<void> => {
  const snapshot = await query.limit(500).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  if (snapshot.size === 500) {
    await batchDeleteQuery(query);
  }
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

export const getByGroupId = async (userId: string, groupId: string): Promise<Job[]> => {
    const snapshot = await db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("groupId", "==", groupId)
        .orderBy("order", "asc")
        .get();

    return snapshot.docs.map(doc => doc.data() as Job);
}

export const getByAvatarId = async (userId: string, avatarId: string): Promise<Job[]> => {
    const snapshot = await db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId)
        .orderBy("createdAt", "desc")
        .limit(1000)
        .get();

    return snapshot.docs.map(doc => doc.data() as Job);
}

export const getAvatarIdPhotos = async (userId: string, avatarId: string): Promise<Job[]> => {
    const snapshot = await db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId)
        .where("target", "==", JobTargets.idPhoto)
        .orderBy("order", "asc")
        .limit(1000)
        .get();

    return snapshot.docs.map(doc => doc.data() as Job);
}

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
        const dbJob = {
            ...job,
            id: jobRef.id,
            userId,
            createdAt: now,
            updatedAt: now,
        } as Job;
        batch.set(jobRef, dbJob);
        dbJobs.push(dbJob);
    }

    await batch.commit();
    return dbJobs;
};

export const update = async (userId: string, jobId: string, updateData: Partial<Job>, forceStatus = false): Promise<void> => {
    const jobRef = db.collection(JOBS_COLLECTION_NAME).doc(jobId);

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(jobRef);

        if (!doc.exists) {
            throw Object.assign(new Error(`Job ${jobId} not found`), { status: 404 });
        }

        if (doc.data()?.userId !== userId) {
            throw Object.assign(new Error(`Unauthorized: user ${userId} does not own job ${jobId}`), { status: 403 });
        }

        if (updateData.status) {
            const currentStatus = doc.data()?.status as string;
            const currentOrder = STATUS_ORDER[currentStatus] ?? 0;
            const newOrder = STATUS_ORDER[updateData.status] ?? 0;

            if (!forceStatus && newOrder < currentOrder) {
                logger.warn({ jobId, currentStatus, newStatus: updateData.status }, 'Skipping status update — regression blocked');
                return;
            }
        }

        const { id: _id, userId: _userId, createdAt: _createdAt, ...safeData } = updateData;
        transaction.update(jobRef, {
            ...safeData,
            updatedAt: Timestamp.now()
        });
    });
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
