import { Job, JobTargets, JobStatuses, MediaTypes } from '@loom24/shared/types';
import { getFirestore } from 'firebase-admin/firestore';

const DB_NAME = process.env.DB_NAME || '';
const JOBS_COLLECTION_NAME = process.env.JOBS_COLLECTION_NAME || '';
const db = getFirestore(DB_NAME);

const PAGE_SIZE = 30;


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

export const getByAvatarId = async (
    userId: string,
    avatarId: string,
    cursor?: string,
    mediaType?: string,
    status?: string,
    targets?: string[],
): Promise<{ jobs: Job[]; nextCursor: string | null }> => {
    const resolvedTargets = targets?.length ? targets : [JobTargets.avatarMedia, JobTargets.idPhoto];

    let query: FirebaseFirestore.Query = db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId)
        .where("target", "in", resolvedTargets);

    if (mediaType) query = query.where("mediaType", "==", mediaType);
    if (status) query = query.where("status", "==", status);

    query = query.orderBy("createdAt", "desc").limit(PAGE_SIZE);

    if (cursor) {
        const cursorDoc = await db.collection(JOBS_COLLECTION_NAME).doc(cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const jobs = snapshot.docs.map(doc => doc.data() as Job);
    const nextCursor = snapshot.size === PAGE_SIZE ? (jobs[jobs.length - 1]?.id ?? null) : null;
    return { jobs, nextCursor };
}

export const getCountsByAvatarId = async (
    userId: string,
    avatarId: string,
): Promise<{ images: number; videos: number; audios: number }> => {
    const base = db.collection(JOBS_COLLECTION_NAME)
        .where('userId', '==', userId)
        .where('avatarId', '==', avatarId)
        .where('target', 'in', [JobTargets.avatarMedia, JobTargets.idPhoto])
        .where('status', '==', JobStatuses.completed);

    const [imagesSnap, videosSnap, audiosSnap] = await Promise.all([
        base.where('mediaType', '==', MediaTypes.image).count().get(),
        base.where('mediaType', '==', MediaTypes.video).count().get(),
        base.where('mediaType', '==', MediaTypes.audio).count().get(),
    ]);

    return {
        images: imagesSnap.data().count,
        videos: videosSnap.data().count,
        audios: audiosSnap.data().count,
    };
};

export const getAvatarIdPhotos = async (userId: string, avatarId: string): Promise<Job[]> => {
    const snapshot = await db.collection(JOBS_COLLECTION_NAME)
        .where("userId", "==", userId)
        .where("avatarId", "==", avatarId)
        .where("target", "==", JobTargets.idPhoto)
        .orderBy("order", "asc")
        .limit(10)
        .get();

    return snapshot.docs.map(doc => doc.data() as Job);
}

export const create = async (userId: string, job: Omit<Job, 'id'>): Promise<Job> => {
    const [dbJob] = await createMany(userId, [job]);
    return dbJob;
}

export const createMany = async (userId: string, jobs: Omit<Job, 'id'>[]): Promise<Job[]> => {
    const now = new Date();
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
        } as unknown as Job;
        batch.set(jobRef, dbJob);
        dbJobs.push(dbJob);
    }

    await batch.commit();
    return dbJobs;
};

export const update = async (userId: string, jobId: string, updateData: Partial<Job>): Promise<void> => {
    const jobRef = db.collection(JOBS_COLLECTION_NAME).doc(jobId);

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(jobRef);

        if (!doc.exists) {
            throw Object.assign(new Error(`Job ${jobId} not found`), { status: 404 });
        }

        if (doc.data()?.userId !== userId) {
            throw Object.assign(new Error(`Unauthorized: user ${userId} does not own job ${jobId}`), { status: 403 });
        }

        const { id: _id, userId: _userId, createdAt: _createdAt, ...safeData } = updateData;
        transaction.update(jobRef, {
            ...safeData,
            updatedAt: new Date()
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
