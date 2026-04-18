import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.AVATAR_SERVICE_URL);

export const updateCounterByFieldName = (userId: string, avatarId: string, fieldName: string, amount: number): Promise<void> =>
  client.patch(`/update-counter-by-field-name/${avatarId}`, userId, { fieldName, amount });
