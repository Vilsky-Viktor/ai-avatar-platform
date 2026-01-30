import axios from 'axios';
import { auth } from '../firebase';
import { type User } from '../types/user';

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_GATEWAY_URL });

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createUser = async (user: User) => {
  try {
    const res = await apiClient.post('/users/create', user);
    return res.data; 
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};