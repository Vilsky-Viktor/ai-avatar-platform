import { createServiceClient } from '@loom24/shared/services';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const deleteJobsByAvatarId = (userId: string, avatarId: string): Promise<void> =>
    client.delete(`/delete/avatar/${avatarId}`, userId);
