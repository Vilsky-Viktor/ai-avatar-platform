import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const JOB_MANAGER_SERVICE_URL = process.env.JOB_MANAGER_SERVICE_URL;

export const createIdPhotoJobView0 = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create ID photo view 0 job`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/create-id-photo-view0`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create ID photo view 0 job with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create ID photo view 0 job: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const createIdPhotoJobView45 = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create ID photo view 45 job`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/create-id-photo-view45`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create ID photo view 45 job with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create ID photo view 45 job: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const createIdPhotoJobView90 = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create ID photo view 90 job`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/create-id-photo-view90`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create ID photo view 90 job with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create ID photo view 90 job: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const createPhotoSetJob = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create photo set job`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/create-photo-set`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create photo set job with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create photo set job: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};