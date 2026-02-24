import axios from 'axios';
import { store } from '../redux/store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})
// Add a request interceptor to add the token
api.interceptors.request.use(
    (config) => {
        // Also check for 'admin_token' since auth sets 'admin_token'
        const state = store.getState();
        const token = state.saasAuth?.adminToken || state.vendorAuth?.vendorToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || sessionStorage.getItem('vendorToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
