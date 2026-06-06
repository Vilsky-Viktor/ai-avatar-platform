import internalTypes from '../types/platform';
import logger from '../logger';
import { AiModelGateway } from '../types/job';

const MAX_RETRIES = 3;

const withRetry = async <T>(fn: () => Promise<T>, context: object): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      logger.warn({ ...context, attempt, err: error }, 'Operation failed, retrying');
    }
  }

  throw lastError;
};

export const generate = async (data: AiModelGateway) => {
  const service = internalTypes.PLATFORM_TO_SERVICE_MAPPING[data.platform];
  if (!service) throw new Error(`Unsupported platform: ${data.model}`);

  const handlerName = internalTypes.MODEL_TO_FUNCTION_MAPPING[data.model];
  if (!handlerName) throw new Error(`Unsupported model: ${data.model}`);

  const handler = service[handlerName] as internalTypes.ModelHandler | undefined;
  if (!handler) throw new Error(`Model ${data.model} not supported on platform ${data.platform}`);

  return await withRetry(
    () => handler(data),
    { model: data.model, platform: data.platform },
  );
}
