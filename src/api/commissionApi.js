import api from './api';

export const getCommission = async (vendorId) => {
    try {
        const response = await api.get(`/commission/${vendorId}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const updateCommission = async (vendorId, value) => {
    try {
        const response = await api.put(`/commission/${vendorId}`, { value });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};
