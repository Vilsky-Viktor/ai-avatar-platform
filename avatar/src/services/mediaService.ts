import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.MEDIA_URL);

export const deleteMediaByAvatarId = (userId: string, avatarId: string): Promise<void> =>
    client.delete(`/delete-by-avatar-id/${avatarId}`, userId);

export const deleteMediaByUserId = (userId: string): Promise<void> =>
    client.delete(`/delete-by-user-id/${userId}`, userId);
