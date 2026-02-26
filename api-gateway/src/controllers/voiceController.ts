import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL;

export const getByGender = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Gen voices by gender`)

    const serviceResponse = await axios.get(
      `${VOICE_SERVICE_URL}/get-by-gender/${req.params.gender}`,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to get voices by gender ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to get voices by gender: ${error}`)
      return res.status(500).json(error);
    }
    
    next(error);
  }
};