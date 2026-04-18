import axios from 'axios';
import logger from '../logger';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

async function request(method: HttpMethod, url: string, userId: string, body?: unknown): Promise<void> {
  const config = { headers: { 'x-user-id': userId } };
  try {
    if (method === 'get' || method === 'delete') {
      await axios[method](url, config);
    } else {
      await axios[method](url, body, config);
    }
  } catch (error: any) {
    logger.error(`Service call failed [${method.toUpperCase()} ${url}] with status ${error.response?.status}: ${error.message}`);
    throw error;
  }
}

export const createServiceClient = (baseUrl: string | undefined) => ({
  get:    (path: string, userId: string)                    => request('get',    `${baseUrl}${path}`, userId),
  post:   (path: string, userId: string, body?: unknown)    => request('post',   `${baseUrl}${path}`, userId, body),
  patch:  (path: string, userId: string, body?: unknown)    => request('patch',  `${baseUrl}${path}`, userId, body),
  delete: (path: string, userId: string)                    => request('delete', `${baseUrl}${path}`, userId),
});
