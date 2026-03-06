import api from './api';

// AUCTION PRODUCTS
export const getAuctionProducts = async (vendorId, date) => {
    try {
        const response = await api.get(`/auction/products/list/${vendorId}`, { params: { date } });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const addAuctionProduct = async (data) => {
    try {
        const response = await api.post('/auction/products/add', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const updateAuctionProduct = async (id, data) => {
    try {
        const response = await api.put(`/auction/products/update/${id}`, data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const deleteAuctionProduct = async (id) => {
    try {
        const response = await api.delete(`/auction/products/delete/${id}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const toggleProductStatus = async (id) => {
    try {
        const response = await api.patch(`/auction/products/status/${id}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

// BUYERS
export const getBuyers = async (vendorId) => {
    try {
        const response = await api.get(`/auction/buyers/list/${vendorId}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const addBuyer = async (data) => {
    try {
        const response = await api.post('/auction/buyers/add', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const updateBuyer = async (id, data) => {
    try {
        const response = await api.put(`/auction/buyers/update/${id}`, data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const deleteBuyer = async (id) => {
    try {
        const response = await api.delete(`/auction/buyers/delete/${id}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

// TRANSACTIONS
export const recordSale = async (data) => {
    try {
        const response = await api.post('/auction/transactions/add', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const getTransactions = async (vendorId, date) => {
    try {
        const response = await api.get(`/auction/transactions/list/${vendorId}`, { params: { date } });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

// BUYER PAYMENTS
export const getBuyerPayments = async (vendorId, buyerId) => {
    try {
        const response = await api.get(`/auction/payments/list/${vendorId}`, { params: { buyerId } });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};

export const addBuyerPayment = async (data) => {
    try {
        const response = await api.post('/auction/payments/add', data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) throw error.response.data;
        throw error;
    }
};
