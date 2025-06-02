// src/api/client.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your backend’s base URL if needed
const API_BASE = 'http://127.0.0.1:8000';

export const client = axios.create({
  baseURL: `${API_BASE}/api/`,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach the JWT access token on every request
client.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
