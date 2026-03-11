import axios from 'axios';
import { store } from '../redux/store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

// Add retry configuration
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

// Add a request interceptor to add the token
api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        let token = null;

        const currentPath = window.location.pathname;
        const isSaaSContext = currentPath.includes('/saas');

        if (isSaaSContext) {
            token = state.saasAuth?.adminToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
        } else if (currentPath.includes('/vendor')) {
            token = state.vendorAuth?.vendorToken || sessionStorage.getItem('vendorToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
        }

        if (!token) {
            const isAdminRoute = config.url.includes('/admin') || config.url.includes('/subscription');
            const isVendorRoute = config.url.includes('/vendor') && !config.url.includes('/admin');

            if (isAdminRoute) {
                token = state.saasAuth?.adminToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
            } else if (isVendorRoute) {
                token = state.vendorAuth?.vendorToken || sessionStorage.getItem('vendorToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
            } else {
                token = state.saasAuth?.adminToken || state.vendorAuth?.vendorToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || sessionStorage.getItem('vendorToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
            }
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

// Response interceptor for automatic retries
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config } = error;

        // If config does not exist or retry option is not set, reject
        if (!config || config.retryCount >= RETRY_COUNT) {
            return Promise.reject(error);
        }

        // Only retry on network errors or 5xx server errors
        const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);

        if (!shouldRetry) {
            return Promise.reject(error);
        }

        config.retryCount = (config.retryCount || 0) + 1;

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.retryCount));

        console.log(`Retrying request (${config.retryCount}/${RETRY_COUNT})...`);
        return api(config);
    }
);

export default api;
