import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

// ── Smart 401 interceptor ─────────────────────────────────────────────────────
// IN PRODUCTION: Background APIs, role mismatch (401/403), or transient
// network hiccups should NOT wipe the user session and throw them to /login.
// We only log a warning and let the caller component handle the error gracefully.
// Hard logout is only triggered if an explicit authentication session endpoint
// returns 401 (e.g., /auth/me).
// ─────────────────────────────────────────────────────────────────────────────
let _logoutScheduled = false;

function scheduleLogout() {
  if (_logoutScheduled) return;
  _logoutScheduled = true;
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('_tokenSetAt');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    _logoutScheduled = false;
  }, 500);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url: string = error.config?.url ?? '';
      console.warn('[api] Received 401 Unauthorized for URL:', url);

      // ONLY trigger automatic logout if the core session check (/auth/me) fails with 401,
      // meaning the JWT token is genuinely expired or cryptographically invalid.
      if (url.includes('/auth/me')) {
        const tokenSetAt = parseInt(localStorage.getItem('_tokenSetAt') ?? '0', 10);
        const msSinceLogin = Date.now() - tokenSetAt;
        if (tokenSetAt === 0 || msSinceLogin > 15000) {
          scheduleLogout();
        }
      }
      // For all other endpoints (service logs, units, notifications, etc.), NEVER auto-logout!
      // This protects the user from being kicked out due to permission mismatches,
      // background polling, or cold-start network issues.
    }
    return Promise.reject(error);
  }
);



export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  updateProfile: (data: { name?: string; phone?: string; city?: string }) => api.patch('/auth/me', data),
  getMe: () => api.get('/auth/me'),
};

export const unitApi = {
  findAll: (page = 1, limit = 10, search?: string, city?: string, client?: string) => {
    let url = `/units?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (city) url += `&city=${encodeURIComponent(city)}`;
    if (client) url += `&client=${encodeURIComponent(client)}`;
    return api.get(url);
  },
  findMyFleet: () => api.get('/units/my-fleet'),
  findOne: (id: string) => api.get(`/units/${id}`),
  findByQrToken: (token: string) => api.get(`/units/scan/${token}`),
  requestService: (id: string, data: any) => api.post(`/units/${id}/request-service`, data),
  create: (data: any) => api.post('/units', data),
  update: (id: string, data: any) => api.patch(`/units/${id}`, data),
  updateCalibration: (id: string, data: any) => api.patch(`/units/${id}/calibration`, data),
  delete: (id: string) => api.delete(`/units/${id}`),
  uploadMedia: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return api.post('/units/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  bulkUpload: (file: File, mode: 'upsert' | 'replace' = 'upsert') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return api.post('/units/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 minutes — processing 600+ rows takes time
    });
  },
};

export const reportApi = {
  create: (data: any) => api.post('/reports', data),
  update: (id: string, data: any) => api.patch(`/reports/${id}`, data),
  findAll: (page = 1, limit = 10, type?: string, unitId?: string, status?: string) =>
    api.get(`/reports?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}${unitId ? `&unitId=${unitId}` : ''}${status ? `&status=${status}` : ''}`),
  findOne: (id: string) => api.get(`/reports/${id}`),
  findByUnit: (unitId: string) => api.get(`/reports/unit/${unitId}`),
  findByServiceLog: (serviceLogId: string) => api.get(`/reports/service-log/${serviceLogId}`),
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
  bulkReschedule: (ids: string[], newDate: string, newDeliveryDate?: string) =>
    api.post('/service-logs/bulk-reschedule', { ids, newDate, newDeliveryDate }),
};

export const partnerApi = {
  findAll: () => api.get('/partners'),
  create: (data: any) => api.post('/partners', data),
  update: (id: string, data: any) => api.patch(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
  toggleActive: (id: string, is_active: boolean) => api.patch(`/partners/${id}`, { is_active }),
};

export const clientApi = {
  findAll: (limit = 200) => api.get(`/clients?limit=${limit}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  bulkUpload: (file: File, mode: 'upsert' | 'replace' = 'upsert') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return api.post('/clients/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
  },
};

export const notificationApi = {
  getAlerts: () => api.get('/notifications/alerts'),
  getMessages: () => api.get('/notifications/messages'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const messageApi = {
  getConversations: () => api.get('/messages/conversations'),
  startConversation: (targetUserId: string) => api.post('/messages/conversations/start', { targetUserId }),
  startSupportConversation: () => api.post('/messages/conversations/start-support'),
  getChatHistory: (id: string) => api.get(`/messages/conversations/${id}`),
  sendMessage: (id: string, content: string) => api.post(`/messages/conversations/${id}/send`, { content }),
};

export const userApi = {
  findAll: () => api.get('/auth/users'),
  update: (id: string, data: any) => api.patch(`/auth/users/${id}`, data),
  deleteBulk: (ids: string[]) => api.post('/auth/users/bulk-delete', { ids }),
};

export const iotApi = {
  getLatest: (unitId: string) => api.get(`/units/${unitId}/telemetry/latest`),
  getHistory: (unitId: string, hours: number = 24) => api.get(`/units/${unitId}/telemetry/history?hours=${hours}`),
  getActiveAlerts: () => api.get('/units/iot/alerts'),
};

export const healthScoreApi = {
  getActive: () => api.get('/health-scores/active'),
  getByUnitId: (unitId: string) => api.get(`/health-scores/unit/${unitId}`),
  trigger: () => api.post('/health-scores/trigger'),
  triggerByUnitId: (unitId: string) => api.post(`/health-scores/trigger/${unitId}`),
};
