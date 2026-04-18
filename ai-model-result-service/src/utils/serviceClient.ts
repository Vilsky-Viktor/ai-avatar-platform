import axios from 'axios';
import logger from '../logger';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

async function request(method: HttpMethod, url: string, userId: string, body?: unknown): Promise<void> {
  const config = { headers: { 'x-user-id': userId } };

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (method === 'get' || method === 'delete') {
        await axios[method](url, config);
      } else {
        await axios[method](url, body, config);
      }
      return;
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
}

export const createServiceClient = (baseUrl: string | undefined) => ({
  get:    (path: string, userId: string)                    => request('get',    `${baseUrl}${path}`, userId),
  post:   (path: string, userId: string, body?: unknown)    => request('post',   `${baseUrl}${path}`, userId, body),
  patch:  (path: string, userId: string, body?: unknown)    => request('patch',  `${baseUrl}${path}`, userId, body),
  delete: (path: string, userId: string)                    => request('delete', `${baseUrl}${path}`, userId),
});
