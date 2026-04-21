import { createServiceClient } from '../utils/serviceClient';
import { Avatar } from '../types/avatar';

const client = createServiceClient(process.env.AVATAR_SERVICE_URL);

export const updateAvatar = (userId: string, avatarId: string, payload: Partial<Avatar> | Record<string, any>): Promise<void> =>
  client.patch(`/update/${avatarId}`, userId, payload);
