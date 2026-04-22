import { createServiceClient } from '../utils/serviceClient';
import { Avatar } from '../types/avatar';

const client = createServiceClient(process.env.AVATAR_URL);

export const getAvatarById = (userId: string, avatarId: string): Promise<Avatar> =>
  client.get<Avatar>(`/get/${avatarId}`, userId);
