import internalTypes from '../types/platform';
import logger from '@loom24/shared/logger';
import { AiModelGateway } from '@loom24/shared/types';

const MAX_RETRIES = 3;
const JITTER_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422, 429]);
const NON_RETRYABLE_PATTERNS = [/inappropriat/i, /capacity/i, /limit/i, /quota/i, /invalid/i, /not.found/i, /forbidden/i, /unauthorized/i, /billing/i];

const isNonRetryable = (error: any): boolean => {
  const status = error?.status ?? error?.response?.status;
  if (status && NON_RETRYABLE_STATUSES.has(status)) return true;
  const msg: string = error?.message ?? error?.response?.data?.error?.message ?? '';
  return NON_RETRYABLE_PATTERNS.some(p => p.test(msg));
};

const withRetry = async <T>(fn: () => Promise<T>, context: object): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (isNonRetryable(error)) {
        logger.warn({ ...context, attempt, err: error }, 'Non-retryable error — aborting retries');
        break;
      }
      const isLastAttempt = attempt === MAX_RETRIES;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * JITTER_MS;
      logger.warn({ ...context, attempt, nextRetryMs: isLastAttempt ? null : Math.round(delay), err: error }, 'Operation failed, retrying');
      if (!isLastAttempt) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

export const generate = async (data: AiModelGateway) => {
  const service = internalTypes.PLATFORM_TO_SERVICE_MAPPING[data.platform!];
  if (!service) throw new Error(`Unsupported platform: ${data.platform}`);

  const handlerName = internalTypes.MODEL_TO_FUNCTION_MAPPING[data.model!];
  if (!handlerName) throw new Error(`Unsupported model: ${data.model}`);

  const handler = service[handlerName] as internalTypes.ModelHandler | undefined;
  if (!handler) throw new Error(`Model ${data.model} not supported on platform ${data.platform}`);

  return await withRetry(
    () => handler(data),
    { model: data.model, platform: data.platform },
  );
}
