import { doc, collection, query, where, onSnapshot, DocumentSnapshot, QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { db } from "../firebase";

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

    return onSnapshot(q, callback);
}