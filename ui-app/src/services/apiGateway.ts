import axios from 'axios';
import { auth } from '../firebase';
import { type User } from '../types/user';
import type { User as FirebaseUser } from "firebase/auth";
import type { Avatar } from '../types/avatar';
import type { Job, TrainingJobRequest } from '../types/job';
import type { Media } from '../types/media';

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_GATEWAY_URL });

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const syncUser = async (user: FirebaseUser): Promise<User> => {
  try {
    const userInfo: User = {
      id: user.uid,
      name: user.displayName!,
      email: user.email ?? user.providerData?.find(p => p.email)?.email ?? '',
      img: user.photoURL,
    };

    const res = await apiClient.post('/users/sync', userInfo);
    
    return res.data as User; 
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getAllUserAvatars = async (): Promise<Avatar[]> => {
  try {
    const res = await apiClient.get('/avatars/get-all');

    return res.data as Avatar[];
  } catch (error) {
    console.error("Error creating avatar:", error);
    throw error;
  }
}

export const createAvatar = async (avatar: Avatar): Promise<Avatar> => {
  try {
    const res = await apiClient.post('/avatars/create', avatar);

    return res.data as Avatar;
  } catch (error) {
    console.error("Error creating avatar:", error);
    throw error;
  }
}

export const updateAvatar = async (id: string, avatarData: Partial<Avatar>): Promise<Avatar> => {
  try {
    const res = await apiClient.patch(`/avatars/update/${id}`, avatarData);

    return res.data as Avatar;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
}

export const deleteAvatarById = async (avatarId: string): Promise<Avatar> => {
  try {
    const res = await apiClient.delete(`/avatars/delete-by-id/${avatarId}`);

    return res.data;
  } catch (error) {
    console.error("Error creating avatar:", error);
    throw error;
  }
}

export const genTrainingPhotoSet = async (job: TrainingJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-training-photo-set', job);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating photo set job:", error);
    throw error;
  }
}

export const genTrainingIdPhotos = async (jobRequest: TrainingJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-training-id-photos', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating photo set job:", error);
    throw error;
  }
}

export const genTrainingIdPhotosFromUploaded = async (jobRequest: TrainingJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-training-id-photos-from-uploaded', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating photo set job:", error);
    throw error;
  }
}

export const restartJobById = async (jobId: string): Promise<Job> => {
  try {
    const res = await apiClient.post(`/jobs/restart/${jobId}`, {});

    return res.data as Job;
  } catch (error) {
    console.error("Error restarting job:", error);
    throw error;
  }
}

export const createMedia = async (media: Media): Promise<Media> => {
  try {
    const res = await apiClient.post('/media/create', media);

    return res.data as Media;
  } catch (error) {
    console.error("Error creating media:", error);
    throw error;
  }
}