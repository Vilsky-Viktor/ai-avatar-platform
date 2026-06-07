import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import logger from '@loom24/shared/logger';

const PROJECT_ID = process.env.PROJECT_ID;

const client = new SecretManagerServiceClient();

export async function getSecretValue(secretId: string, versionId = 'latest'): Promise<string> {
  const name = `projects/${PROJECT_ID}/secrets/${secretId}/versions/${versionId}`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version?.payload?.data?.toString() || '';
    
    return payload;
  } catch (error) {
    logger.error({ err: error }, 'Error accessing secret');
    throw error;
  }
}