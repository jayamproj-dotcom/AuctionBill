import api from './api';

// Admin login API
export const adminLogin = async (data) => {
    try {
        const response = await api.post('/api/admin/login', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};
