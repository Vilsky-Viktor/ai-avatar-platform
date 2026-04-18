import axios from 'axios';
import { Request, Response } from 'express';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

export const createProxyHandler = (
  method: HttpMethod,
  getUrl: (req: Request) => string,
  logMessage: string | ((req: Request) => string),
) => async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'];
  const url = getUrl(req);
  const msg = typeof logMessage === 'function' ? logMessage(req) : logMessage;
  const config = { headers: { 'x-user-id': userId } };

  req.log.info(msg);

  try {
    const serviceResponse = method === 'get' || method === 'delete'
      ? await axios[method](url, config)
      : await axios[method](url, req.body, config);

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`${msg} failed with status ${error.response.status}`);
      return res.status(error.response.status).json(error.response.data);
    }
    req.log.error(`${msg} failed: ${error}`);
    return res.status(500).json(error);
  }
};
