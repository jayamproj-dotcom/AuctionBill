import api from './api';

// Admin login API
export const adminLogin = async (data) => {
    try {
        const response = await api.post('/admin/login', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

// Verify admin password API
export const verifyAdminPassword = async (data) => {
    try {
        const response = await api.post('admin/verify-password', data);
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
        const response = await api.put('admin/update-password', data);
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
        const response = await api.get('admin/profile');
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
        const response = await api.put('admin/update-profile', data);
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
        const response = await api.get('subscription');
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
        const response = await api.post('subscription', data);
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
        const response = await api.put(`subscription/${id}`, data);
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
        const response = await api.delete(`subscription/${id}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};
