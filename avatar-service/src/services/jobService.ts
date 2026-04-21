import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.JOB_MANAGER_SERVICE_URL);

export const deleteJobsByAvatarId = (userId: string, avatarId: string): Promise<void> =>
    client.delete(`/delete-by-avatar-id/${avatarId}`, userId);

export const deleteJobsByUserId = (userId: string): Promise<void> =>
    client.delete(`/delete-by-user-id/${userId}`, userId);
