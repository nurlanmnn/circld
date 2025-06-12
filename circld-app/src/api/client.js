// src/api/client.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your actual API base URL
const API_BASE_URL = 'http://localhost:8000/api/';

export const client = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the access token (if any) to every request
client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
