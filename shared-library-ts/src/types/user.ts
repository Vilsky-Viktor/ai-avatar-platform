import { Timestamp } from 'firebase-admin/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  img: string | null;
  credits: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
