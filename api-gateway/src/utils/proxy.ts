import axios from 'axios';
import http from 'http';
import https from 'https';
import { Request, Response } from 'express';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS) || 30_000;

const httpAgent  = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

export const createProxyHandler = (
  method: HttpMethod,
  getUrl: (req: Request) => string,
  logMessage: string | ((req: Request) => string),
) => async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'];
  const url = getUrl(req);
  const msg = typeof logMessage === 'function' ? logMessage(req) : logMessage;
  const config = { headers: { 'x-user-id': userId }, timeout: PROXY_TIMEOUT_MS, httpAgent, httpsAgent, params: req.query };

  req.log.info(msg);

  try {
    const serviceResponse = method === 'get' || method === 'delete'
      ? await axios[method](url, config)
      : await axios[method](url, req.body, config);

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error({ err: error }, `${msg} failed with status ${error.response.status}`);
      const errorBody = typeof error.response.data === 'object' && error.response.data !== null
        ? error.response.data
        : { message: String(error.response.data || 'Service error') };
      return res.status(error.response.status).json(errorBody);
    }
    req.log.error({ err: error }, `${msg} failed`);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
