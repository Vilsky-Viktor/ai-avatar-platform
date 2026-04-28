import { storage } from "../firebase";
import { ref, getDownloadURL, uploadString, deleteObject } from "firebase/storage";

export const getMediaUrlFromPath = async (path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
}

export const uploadMediaToBucket = async (path: string, base64String: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const uploadResult = await uploadString(storageRef, base64String, 'data_url');
    return uploadResult.metadata.fullPath;
}

export const deleteMediaFromBucket = async (path: string): Promise<void> => {
    await deleteObject(ref(storage, path));
}