import { createServiceClient } from '@loom24/shared/services';
import { Avatar } from '@loom24/shared/types';

const client = createServiceClient(process.env.AVATAR_URL);

export const getAvatarById = (userId: string, avatarId: string): Promise<Avatar> =>
  client.get<Avatar>(`/get/avatar/${avatarId}`, userId);
