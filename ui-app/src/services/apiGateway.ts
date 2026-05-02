import axios from 'axios';
import { auth } from '../firebase';
import { type User } from '../types/user';
import type { User as FirebaseUser } from "firebase/auth";
import type { Avatar, AvatarGender, AvatarLoras } from '../types/avatar';
import type { Job, TrainingJobRequest, PhotoJobRequest, InferenceJob } from '../types/job';
import type { Voice } from '../types/voice';

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_GATEWAY_URL });

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const linkGoogleAccount = async (googleIdToken: string): Promise<{ customToken: string }> => {
  const res = await apiClient.post('/auth/link-google', { googleIdToken });
  return res.data;
};

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

export const getAvatarById = async (avatarId: string): Promise<Avatar> => {
  try {
    const res = await apiClient.get(`/avatars/get/${avatarId}`);

    return res.data as Avatar;
  } catch (error) {
    console.error(`Error fetching avatar ${avatarId} avatar:`, error);
    throw error;
  }
}

export const getAvatarBySlug = async (slug: string): Promise<Avatar> => {
  try {
    const res = await apiClient.get(`/avatars/get/slug/${slug}`);

    return res.data as Avatar;
  } catch (error) {
    console.error(`Error fetching avatar ${slug} avatar:`, error);
    throw error;
  }
}

export const getAllUserAvatars = async (): Promise<Avatar[]> => {
  try {
    const res = await apiClient.get('/avatars/get-all');

    return res.data as Avatar[];
  } catch (error) {
    console.error("Error fetching avatars avatar:", error);
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

export const genTrainingSyntheticFrontIdPhoto = async (jobRequest: TrainingJobRequest): Promise<Job> => {
  try {
    const res = await apiClient.post('/jobs/gen-training-synthetic-front-id-photo', jobRequest);

    return res.data as Job;
  } catch (error) {
    console.error("Error creating training synthetic front photo job:", error);
    throw error;
  }
}

export const genTrainingSyntheticIdPhotos = async (jobRequest: TrainingJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-training-synthetic-id-photos', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating training synthetic photo jobs:", error);
    throw error;
  }
}

export const genTrainingTwinIdPhotos = async (jobRequest: TrainingJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-training-twin-id-photos', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating training twin photo jobs:", error);
    throw error;
  }
}

export const genAvatarPhoto = async (jobRequest: PhotoJobRequest): Promise<InferenceJob> => {
  try {
    const res = await apiClient.post('/jobs/gen-avatar-photo', jobRequest);

    return res.data as InferenceJob;
  } catch (error) {
    console.error("Error creating job to generate avatar photo:", error);
    throw error;
  }
}

export const getJobsByGroupId  = async (groupId: string): Promise<InferenceJob[]> => {
  try {
    const res = await apiClient.get(`/jobs/get/group/${groupId}`, {});

    return res.data as InferenceJob[];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
}

export const getJobsByAvatarId  = async (avatarId: string): Promise<InferenceJob[]> => {
  try {
    const res = await apiClient.get(`/jobs/get/avatar/${avatarId}`, {});

    return res.data as InferenceJob[];
  } catch (error) {
    console.error("Error fetching jobs:", error);
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

export const deleteJobById = async (jobId: string): Promise<Job> => {
  try {
    const res = await apiClient.delete(`/jobs/delete-by-id/${jobId}`, {});

    return res.data as Job;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
}

export const getVoicesByGender = async (gender: AvatarGender): Promise<Voice[]> => {
  try {
    const res = await apiClient.get(`/voices/get-by-gender/${gender}`);

    return res.data as Voice[];
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw error;
  }
}

export const trainLoras = async (jobRequest: TrainingJobRequest): Promise<AvatarLoras> => {
  try {
    const res = await apiClient.post(`/jobs/train-loras`, jobRequest);

    return res.data as AvatarLoras;
  } catch (error) {
    console.error("Error creating jobs to train LORAs:", error);
    throw error;
  }
}