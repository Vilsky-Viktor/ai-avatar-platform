import { doc, onSnapshot, DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from "../firebase";

export const listenToDocChanges = (
    collectionId: string, 
    docId: string, 
    callback: (snapshot: DocumentSnapshot<DocumentData>) => void
) => {
    const docRef = doc(db, collectionId, docId);
    return onSnapshot(docRef, callback);
}