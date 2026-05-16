import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
};

export const unitApi = {
  findAll: (page = 1, limit = 10) => api.get(`/units?page=${page}&limit=${limit}`),
  findOne: (id: string) => api.get(`/units/${id}`),
};

export const reportApi = {
  create: (data: any) => api.post('/reports', data),
  findAll: (page = 1, limit = 10, type?: string) => api.get(`/reports?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
  findOne: (id: string) => api.get(`/reports/${id}`),
  findByUnit: (unitId: string) => api.get(`/reports/unit/${unitId}`),
  uploadPhotos: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    return api.post('/reports/upload-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteBulk: (ids: string[]) => api.post('/reports/delete-bulk', { ids }),
};
