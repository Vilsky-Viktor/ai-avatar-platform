import axios from 'axios';
import logger from '../logger';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 0;

async function request<T = void>(method: HttpMethod, url: string, userId: string, body?: unknown): Promise<T> {
  const config = { headers: { 'x-user-id': userId }, timeout: REQUEST_TIMEOUT_MS };

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = method === 'get' || method === 'delete'
        ? await axios[method](url, config)
        : await axios[method](url, body, config);
      return response.data as T;
    } catch (error: any) {
      const status = error.response?.status;
      const isClientError = status >= 400 && status < 500;

      if (isClientError) {
        logger.error(`Service call failed [${method.toUpperCase()} ${url}] with status ${status}: ${error.message}`);
        throw error;
      }

      if (attempt < RETRY_ATTEMPTS) {
        const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        logger.warn(`Service call attempt ${attempt}/${RETRY_ATTEMPTS} failed [${method.toUpperCase()} ${url}]: ${error.message} — retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(`Service call failed after ${RETRY_ATTEMPTS} attempts [${method.toUpperCase()} ${url}]: ${error.message}`);
        throw error;
      }
    }
  }
  throw new Error('Unreachable');
}

export const createServiceClient = (baseUrl: string | undefined) => ({
  get:    <T = void>(path: string, userId: string)                    => request<T>('get',    `${baseUrl}${path}`, userId),
  post:   <T = void>(path: string, userId: string, body?: unknown)    => request<T>('post',   `${baseUrl}${path}`, userId, body),
  patch:  <T = void>(path: string, userId: string, body?: unknown)    => request<T>('patch',  `${baseUrl}${path}`, userId, body),
  delete: <T = void>(path: string, userId: string)                    => request<T>('delete', `${baseUrl}${path}`, userId),
});
