import api from './api';

// Vendor Signup
export const vendorSignup = async (data) => {
    try {
        const response = await api.post('/vendor/signup', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

//Vendor Login
export const vendorLogin = async (data) => {
    try {
        const response = await api.post('/vendor/login', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const updateVendorProfile = async (id, data) => {
    try {
        const response = await api.put(`/vendor/${id}`, data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const forgotPassword = async (data) => {
    try {
        const response = await api.post('/vendor/forgot-password', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const resetPassword = async (data) => {
    try {
        const response = await api.post('/vendor/reset-password', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const changePassword = async (data) => {
    try {
        const response = await api.post('/vendor/change-password', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};
