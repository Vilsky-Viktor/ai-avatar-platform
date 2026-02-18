import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const AVATAR_SERVICE_URL = process.env.AVATAR_SERVICE_URL;

export const getAllAvatars = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`get all user avatars`)

    const serviceResponse = await axios.get(
      `${AVATAR_SERVICE_URL}/get-all`,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to get all user avatars with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to get all user avatars: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const createAvatar = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  try {
    req.log.info(`Create avatar`)

    const serviceResponse = await axios.post(
      `${AVATAR_SERVICE_URL}/create`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to create avatar with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to create avatar: ${error}`)
      console.log(error);
      return res.status(500).json(error);
    }
  }
};

export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];
  const {id} = req.params;

  try {
    req.log.info(`Update avatar`)

    const serviceResponse = await axios.patch(
      `${AVATAR_SERVICE_URL}/update/${id}`, req.body,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to update avatar with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to update avatar: ${error}`)
      return res.status(500).json(error);
    }
  }
};

export const deleteAvatarById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;

  try {
    req.log.info(`Delete avatar`)

    const serviceResponse = await axios.delete(
      `${AVATAR_SERVICE_URL}/delete-by-avatar-id/${id}`,
      { headers: {'x-user-id': userId} }
    );

    return res.status(serviceResponse.status).json(serviceResponse.data);
  } catch (error: any) {
    if (error.response) {
      req.log.error(`Failed to delete avatar ${id} with status ${error.response.status}`)
      return res.status(error.response.status).json(error.response.data);
    } else {
      req.log.error(`Failed to delete ${id} avatar: ${error}`)
      return res.status(500).json(error);
    }
  }
};