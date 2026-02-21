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

// Update admin password API
export const updateAdminPassword = async (data) => {
    try {
        const response = await api.post('/api/admin/update-password', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// Get admin profile API
export const getAdminProfile = async () => {
    try {
        const response = await api.get('/api/admin/profile');
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// Update admin profile API
export const updateAdminProfile = async (data) => {
    try {
        const response = await api.put('/api/admin/profile', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};


//Subscriptions API
export const getSubscriptions = async () => {
    try {
        const response = await api.get('/api/subscription');
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const createSubscription = async (data) => {
    try {
        const response = await api.post('/api/subscription', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};


export const updateSubscription = async (id, data) => {
    try {
        const response = await api.put(`/api/subscription/${id}`, data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const deleteSubscription = async (id) => {
    try {
        const response = await api.delete(`/api/subscription/${id}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};
