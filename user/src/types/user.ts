import { Timestamp } from 'firebase-admin/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  img: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
