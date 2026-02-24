import api from './api';

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
