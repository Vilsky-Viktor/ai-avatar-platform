import { doc, collection, query, where, onSnapshot, DocumentSnapshot, QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { db } from "../firebase";
import { JobStatuses, JobTargets } from '../types/job';

export const listenToDocChanges = (
    collectionId: string, 
    docId: string, 
    callback: (snapshot: DocumentSnapshot<DocumentData>) => void
) => {
    const docRef = doc(db, collectionId, docId);
    return onSnapshot(docRef, callback);
}

export const listenToCollectionByGroupId = (
    collectionId: string,
    userId: string,
    groupId: string,
    callback: (snapshot: QuerySnapshot<DocumentData>) => void
) => {
    if (!userId) throw new Error("User must be authenticated");

    const q = query(
        collection(db, collectionId),
        where("groupId", "==", groupId),
        where("userId", "==", userId)
    );

    let unsubscribe = onSnapshot(q, callback, (error) => {
        console.warn("Firestore listener error, resubscribing ...", error);
        unsubscribe();
        unsubscribe = onSnapshot(q, callback);
    });

    return () => unsubscribe();
}

export const listenToCollectionByAvatarId = (
    collectionId: string,
    userId: string,
    avatarId: string,
    callback: (snapshot: QuerySnapshot<DocumentData>) => void
) => {
    if (!userId) throw new Error("User must be authenticated");

    const q = query(
        collection(db, collectionId),
        where("avatarId", "==", avatarId),
        where("userId", "==", userId),
        where("target", "==", JobTargets.avatarMedia)
    );

    let unsubscribe = onSnapshot(q, callback, (error) => {
        console.warn("Firestore listener error, resubscribing ...", error);
        unsubscribe();
        unsubscribe = onSnapshot(q, callback);
    });

    return () => unsubscribe();
}