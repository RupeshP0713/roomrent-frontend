import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Admin API
export const adminApi = {
    login: (credentials: any) => api.post('/admin/login', credentials),
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
    deleteUser: (role: string, id: string) => api.delete(`/admin/users/${role}/${id}`),
    getTransactions: () => api.get('/admin/transactions'),
};

// Malik API
export const malikApi = {
    register: (data: any) => api.post('/malik/register', data),
    login: (credentials: any) => api.post('/malik/login', credentials),
    getById: (id: string) => api.get(`/malik/${id}`),
    updateAddress: (id: string, address: string) => api.put(`/malik/${id}/address`, { address }),
    update: (id: string, data: any) => api.put(`/malik/${id}`, data),
    getBhadots: (id: string) => api.get(`/malik/${id}/bhadots`),
    createRequest: (data: any) => api.post('/malik/request', data),
    getRequests: (id: string) => api.get(`/malik/${id}/requests`),
};

// Bhadot API
export const bhadotApi = {
    register: (data: any) => api.post('/bhadot/register', data),
    login: (credentials: any) => api.post('/bhadot/login', credentials),
    getById: (id: string) => api.get(`/bhadot/${id}`),
    update: (id: string, data: any) => api.put(`/bhadot/${id}`, data),
    toggleActive: (id: string, isActive: boolean) => api.put(`/bhadot/${id}/active`, { isActive }),
    getAvailableRooms: () => api.get('/bhadot/available-rooms'),
    getRequests: (id: string) => api.get(`/bhadot/${id}/requests`),
    updateRequestStatus: (requestId: string, status: string) => api.put(`/bhadot/request/${requestId}`, { status }),
};

// Search API
export const searchApi = {
    searchUser: (number: string) => api.get(`/search/${number}`),
};

export default api;
