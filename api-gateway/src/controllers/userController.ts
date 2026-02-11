import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Sync user ID ${userId}`)

    const serviceResponse = await axios.post(
      `${USER_SERVICE_URL}/sync`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to sync user ID ${userId} with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to sync user: ${error}`)
      return res.status(500).json(error);
    }
    
    next(error);
  }
};