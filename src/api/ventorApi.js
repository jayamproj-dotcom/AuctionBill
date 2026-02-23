import api from './api';

export const getVendors = async () => {
    try {
        const response = await api.get('/vendor');
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const createVendor = async (data) => {
    try {
        const response = await api.post('/vendor', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};

export const updateVendor = async (id, data) => {
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

export const deleteVendor = async (id) => {
    try {
        const response = await api.delete(`/vendor/${id}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw error;
    }
};
