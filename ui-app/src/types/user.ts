import type { FirestoreTimestamp } from "./firestore";

export type User = {
  id: string;
  name: string;
  email: string;
  img: string | null;
  credits?: number;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}