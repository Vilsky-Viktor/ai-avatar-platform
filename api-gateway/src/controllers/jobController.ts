import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const JOB_MANAGER_SERVICE_URL = process.env.JOB_MANAGER_SERVICE_URL;

export const genTrainingPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create training photo set`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/gen-training-photo-set`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create training photo set with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create training photo set: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const genTrainingIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create training id photos`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/gen-training-id-photos`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create training id photos with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create training id photos: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const genTrainingIdPhotosFromUploaded = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create training id photos`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/gen-training-id-photos-from-uploaded`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create training id photos with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create training id photos: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const restartJob = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Restart job`)

    const serviceResponse = await axios.post(
      `${JOB_MANAGER_SERVICE_URL}/restart/${req.params.id}`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to restart job with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to restart job: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};