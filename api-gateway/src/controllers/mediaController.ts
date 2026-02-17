import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL;

export const createMedia = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create media`)

    const serviceResponse = await axios.post(
      `${MEDIA_SERVICE_URL}/create`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create media with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create media: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};
