import internalTypes from '../types/platform';
import logger from '@loom24/shared/logger';
import { AiModelGateway } from '@loom24/shared/types';

const MAX_RETRIES = 3;
const JITTER_MS = 1000;

export class RateLimitError extends Error {
  cause: any;
  constructor(cause: any) {
    super('Rate limit error');
    this.name = 'RateLimitError';
    this.cause = cause;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRateLimitError = (error: any): boolean => {
  const status = error?.status ?? error?.response?.status;
  if (status === 429) return true;
  const msg: string = error?.message ?? error?.response?.data?.error?.message ?? '';
  return [/capacity/i, /limit/i, /quota/i].some(p => p.test(msg));
};

const isNonRetryable = (error: any): boolean => {
  const status = error?.status ?? error?.response?.status;
  if (status && new Set([400, 401, 403, 404, 422]).has(status)) return true;
  const msg: string = error?.message ?? error?.response?.data?.error?.message ?? '';
  return [/inappropriat/i, /invalid/i, /not.found/i, /forbidden/i, /unauthorized/i, /safety/i, /prohibited/i, /billing/i].some(p => p.test(msg));
};

const withRetry = async <T>(fn: () => Promise<T>, context: object): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (isRateLimitError(error)) {
        logger.warn({ ...context, attempt, err: error }, 'Rate limit error — aborting retries');
        throw new RateLimitError(error);
      }

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
