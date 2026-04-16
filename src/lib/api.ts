import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      localStorage.setItem('attendance_auth_sync', Date.now().toString());
      window.location.hash = '#/login';
    }

    let errorMessage = 'Request failed';
    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') {
      errorMessage = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      // FastAPI Validation Error (Array of errors)
      errorMessage = detail[0].msg || 'Validation error';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return Promise.reject(errorMessage);
  }
);

export const api = {
  auth: {
    login: (formData: FormData) => apiClient.post('/auth/login', formData),
    register: (formData: FormData) => apiClient.post('/auth/register', formData),
  },
  user: {
    getProfile: () => apiClient.get('/user/profile'),
    getHistory: (page: number = 1, size: number = 15) => 
      apiClient.get('/user/history', { params: { page, size } }),
    updateTutorialStatus: (hasSeenTutorial: boolean) =>
      apiClient.patch('/user/tutorial-status', { has_seen_tutorial: hasSeenTutorial }),

    uploadFace: (formData: FormData) => apiClient.post('/user/upload-face', formData),
    getFacePhoto: () => apiClient.get('/user/face-photo', { responseType: 'blob' }),
    getFacePhotoUrl: () => `${API_BASE_URL}/user/face-photo`,
  },
  attendance: {
    scanFace: (formData: FormData) => apiClient.post('/attendance/face', formData),
  },
  admin: {
    getUsers: (page: number = 1, size: number = 15, search?: string) => 
      apiClient.get('/admin/users', { params: { page, size, search } }),
    getLogs: (page: number = 1, size: number = 15, start?: string, end?: string, search?: string) => 
      apiClient.get('/admin/logs', { params: { page, size, start_date: start, end_date: end, search } }),
    updateUser: (userId: number, data: Record<string, unknown>) => apiClient.put(`/admin/user/${userId}`, data),
    deleteUser: (userId: number) => apiClient.delete(`/admin/user/${userId}`),
    createUser: (formData: FormData) => apiClient.post('/admin/users', formData),
    updateUserFace: (userId: number, formData: FormData) => apiClient.post(`/admin/user/${userId}/face`, formData),
    deleteUserFace: (userId: number) => apiClient.delete(`/admin/user/${userId}/face`),
    getUserFace: (userId: number) => apiClient.get(`/admin/user/${userId}/face`, { responseType: 'blob' }),
    getFacePhotoUrl: (userId: number) => `${API_BASE_URL}/admin/user/${userId}/face`,
    forceAttendance: (userId: number, type: 'in' | 'out') => apiClient.post(`/admin/user/${userId}/force-attendance?attendance_type=${type}`),
    exportExcel: (start?: string, end?: string, search?: string) => apiClient.get('/admin/export-excel', { 
      params: { start_date: start, end_date: end, search: search },
      responseType: 'blob'
    }),
    testWorker: (message?: string) => apiClient.post('/admin/test-worker', null, { params: { message } }),
  },
};
