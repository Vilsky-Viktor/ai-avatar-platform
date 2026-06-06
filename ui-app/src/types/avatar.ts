import type { FirestoreTimestamp } from "./firestore";
import { AvatarGender, AvatarTypes } from '@loom24/shared/types';
import type { AvatarParameters } from '@loom24/shared/types';

export { AvatarGender, AvatarTypes };
export type { AvatarParameters };

export type Avatar = {
  id?: string;
  userId?: string;
  name: string;
  slug: string;
  type: AvatarTypes;
  parameters: AvatarParameters;
  mainImagePath?: string;
  voiceId?: string;
  updatedAt?: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp;
}
