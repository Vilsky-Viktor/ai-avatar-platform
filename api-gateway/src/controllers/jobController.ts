import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL;

export const createIdPhotoJob = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create ID photo job`)

    const serviceResponse = await axios.post(
      `${JOB_SERVICE_URL}/create-id-photo`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create ID photo job with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create ID photo job: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};
