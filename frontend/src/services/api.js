import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
};

// HCP
export const hcpService = {
  search: (params) => api.get('/hcp/search', { params }),
  getById: (id) => api.get(`/hcp/${id}`),
  validate: (id) => api.post(`/hcp/${id}/validate`),
  decision: (id, data) => api.post(`/hcp/${id}/decision`, data),
  compare: (id_a, id_b) => api.get('/hcp/compare/records', { params: { id_a, id_b } }),
  getReport: (id) => api.get(`/hcp/${id}/report`),
  getAudit: (id) => api.get(`/hcp/${id}/audit`)
};

// Admin
export const adminService = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
  },
  getUploadHistory: () => api.get('/admin/upload/history'),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats')
};

// Reports
export const reportService = {
  getSummary: (params) => api.get('/report/summary', { params }),
  downloadPdf: (id) => {
    return api.get(`/report/${id}/pdf`, { responseType: 'blob' });
  }
};

export default api;
