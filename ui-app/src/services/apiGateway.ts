import axios from 'axios';
import { auth } from '../firebase';
import { type User } from '../types/user';
import type { User as FirebaseUser } from "firebase/auth";
import type { Avatar, AvatarGender } from '../types/avatar';
import type { Job, IdPhotoJobRequest, PhotoJobRequest, PhotoSetJobRequest, VideoJobRequest, AudioJobRequest, MimicMotionRequest } from '../types/job';
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

export type CropMode = 'front' | 'quarter' | 'side' | 'full_body';

export const cropPerson = async (imagePath: string, mode: CropMode = 'front'): Promise<{ path: string }> => {
  const res = await apiClient.post('/cropper/crop', { image_path: imagePath, mode });
  return res.data;
};

export const linkGoogleAccount = async (googleIdToken: string): Promise<{ customToken: string }> => {
  const res = await apiClient.post('/auth/link-google', { googleIdToken });
  return res.data;
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const res = await apiClient.get(`/users/get/user/${userId}`);
    
    return res.data as User; 
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
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
    const res = await apiClient.get(`/avatars/get/avatar/${avatarId}`);

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
    const res = await apiClient.get('/avatars/get/all');

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
    const res = await apiClient.patch(`/avatars/update/avatar/${id}`, avatarData);

    return res.data as Avatar;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
}

export const deleteAvatarById = async (avatarId: string): Promise<Avatar> => {
  try {
    const res = await apiClient.delete(`/avatars/delete/avatar/${avatarId}`);

    return res.data;
  } catch (error) {
    console.error("Error creating avatar:", error);
    throw error;
  }
}

export const genSyntheticFrontIdPhoto = async (jobRequest: IdPhotoJobRequest): Promise<Job> => {
  try {
    const res = await apiClient.post('/jobs/gen-synthetic-front-id-photo', jobRequest);

    return res.data as Job;
  } catch (error) {
    console.error("Error creating training synthetic front photo job:", error);
    throw error;
  }
}

export const genSyntheticIdPhotos = async (jobRequest: IdPhotoJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-synthetic-id-photos', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating training synthetic photo jobs:", error);
    throw error;
  }
}

export const genDigitalTwinIdPhotos = async (jobRequest: IdPhotoJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-digital-twin-id-photos', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating training twin photo jobs:", error);
    throw error;
  }
}

export const genAvatarPhoto = async (jobRequest: PhotoJobRequest): Promise<Job> => {
  try {
    const res = await apiClient.post('/jobs/gen-avatar-photo', jobRequest);

    return res.data as Job;
  } catch (error) {
    console.error("Error creating job to generate avatar photo:", error);
    throw error;
  }
}

export const genAvatarPhotoSet = async (jobRequest: PhotoSetJobRequest): Promise<Job[]> => {
  try {
    const res = await apiClient.post('/jobs/gen-avatar-photo-set', jobRequest);

    return res.data as Job[];
  } catch (error) {
    console.error("Error creating job to generate avatar photo set:", error);
    throw error;
  }
}

export const genAvatarVideo = async (jobRequest: VideoJobRequest): Promise<Job> => {
  try {
    const res = await apiClient.post('/jobs/gen-avatar-video', jobRequest);

    return res.data as Job;
  } catch (error) {
    console.error("Error creating job to generate avatar video:", error);
    throw error;
  }
}

export const mimicMotion = async (jobRequest: MimicMotionRequest): Promise<Job> => {
  try {
    const res = await apiClient.post('/jobs/mimic-motion', jobRequest);

    return res.data as Job;
  } catch (error) {
    console.error("Error creating job to mimic motion video:", error);
    throw error;
  }
}

export const genAvatarAudio = async (jobRequest: AudioJobRequest): Promise<Job> => {
  try {
    const res = await apiClient.post('/jobs/gen-avatar-audio', jobRequest);

    return res.data as Job;
  } catch (error) {
    console.error("Error creating job to generate avatar audio:", error);
    throw error;
  }
}

export const getJobsByGroupId  = async (groupId: string): Promise<Job[]> => {
  try {
    const res = await apiClient.get(`/jobs/get/group/${groupId}`, {});

    return res.data as Job[];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
}

export const getJobsByAvatarId  = async (avatarId: string): Promise<Job[]> => {
  try {
    const res = await apiClient.get(`/jobs/get/avatar/${avatarId}`, {});

    return res.data as Job[];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
}

export const restartJobById = async (jobId: string): Promise<Job> => {
  try {
    const res = await apiClient.post(`/jobs/restart/job/${jobId}`, {});

    return res.data as Job;
  } catch (error) {
    console.error("Error restarting job:", error);
    throw error;
  }
}

export const deleteJobById = async (jobId: string): Promise<Job> => {
  try {
    const res = await apiClient.delete(`/jobs/delete/job/${jobId}`, {});

    return res.data as Job;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
}

export const getVoicesByGender = async (gender: AvatarGender): Promise<Voice[]> => {
  try {
    const res = await apiClient.get(`/voices/get/gender/${gender}`);

    return res.data as Voice[];
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw error;
  }
}
