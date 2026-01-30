import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  // try {
  //   const serviceResponse = await axios.post(`${USER_SERVICE_URL}/syncUser`, req.body);
  //   return res.status(serviceResponse.status).json(serviceResponse.data);
  // } catch (error: any) {
  //   if (error.response) {
  //     return res.status(error.response.status).json(error.response.data);
  //   }
    
  //   next(error);
  // }
  return res.status(200).json({status: 'ok'});
};