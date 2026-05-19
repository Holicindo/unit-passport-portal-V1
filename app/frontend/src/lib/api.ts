import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

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
  findMyFleet: () => api.get('/units/my-fleet'),
  findOne: (id: string) => api.get(`/units/${id}`),
  findByQrToken: (token: string) => api.get(`/units/scan/${token}`),
  requestService: (id: string, data: any) => api.post(`/units/${id}/request-service`, data),
  create: (data: any) => api.post('/units', data),
  update: (id: string, data: any) => api.patch(`/units/${id}`, data),
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

export const serviceLogApi = {
  findAll: (page = 1, limit = 100) => api.get(`/service-logs?page=${page}&limit=${limit}`),
  create: (data: any) => api.post('/service-logs', data),
  update: (id: string, data: any) => api.put(`/service-logs/${id}`, data),
  findByUnit: (unitId: string) => api.get(`/service-logs/unit/${unitId}`),
};

export const partnerApi = {
  findAll: () => api.get('/partners'),
};
