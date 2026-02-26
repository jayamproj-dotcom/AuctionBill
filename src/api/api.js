import axios from 'axios';
import { store } from '../redux/store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})
// Add a request interceptor to add the token
api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        let token = null;

        const isAdminRoute = config.url.includes('/admin') || config.url.includes('/subscription');
        const isVendorRoute = config.url.includes('/vendor') && !config.url.includes('/admin');

        if (isAdminRoute) {
            token = state.saasAuth?.adminToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
        } else if (isVendorRoute) {
            token = state.vendorAuth?.vendorToken || sessionStorage.getItem('vendorToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
        } else {
            // Fallback to existing logic if route is ambiguous
            token = state.saasAuth?.adminToken || state.vendorAuth?.vendorToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || sessionStorage.getItem('vendorToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
        }

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
