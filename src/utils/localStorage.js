
export const initialData = {
    sellers: [
        { id: 1, name: 'John Smith', contact: '9876543210', email: 'john@example.com', address: '123 Main St', totalSales: 45000, status: 'active', password: '123' },
        { id: 2, name: 'Sarah Johnson', contact: '9876543211', email: 'sarah@example.com', address: '456 Oak Ave', totalSales: 32000, status: 'active', password: '123' },
    ],
    buyers: [
        { id: 1, name: 'Mike Brown', contact: '9876543220', email: 'mike@example.com', address: '789 Pine Rd', totalPurchases: 28000, buyerType: 'Wholesale', status: 'active', password: '123' },
        { id: 2, name: 'Emily Davis', contact: '9876543221', email: 'emily@example.com', address: '321 Elm St', totalPurchases: 19000, buyerType: 'Retailer', status: 'active', password: '123' },
    ],
    products: [
        { id: 1, name: 'Antique Vase', seller: 'John Smith', price: 5000, quality: 'Excellent', quantity: 1, unit: 'qty', commission: 10, status: 'available' },
        { id: 2, name: 'Vintage Watch', seller: 'Sarah Johnson', price: 8000, quality: 'Good', quantity: 1, unit: 'qty', commission: 12, status: 'available' },
    ],
    transactions: [
        { id: 1, date: '2026-02-06', product: 'Antique Vase', quantity: 1, unit: 'qty', seller: 'John Smith', buyer: 'Mike Brown', price: 5000, commission: 500, commissionPercent: 10, paymentStatus: 'Paid', amountPaid: 5000, balance: 0 },
        { id: 2, date: '2026-02-05', product: 'Vintage Watch', quantity: 1, unit: 'qty', seller: 'Sarah Johnson', buyer: 'Emily Davis', price: 8000, commission: 960, commissionPercent: 12, paymentStatus: 'Part Paid', amountPaid: 4000, balance: 4000 },
        { id: 3, date: '2026-02-04', product: 'Old Painting', quantity: 1, unit: 'qty', seller: 'John Smith', buyer: 'Mike Brown', price: 12000, commission: 1200, commissionPercent: 10, paymentStatus: 'Paid', amountPaid: 12000, balance: 0 },
    ],
};

export const getAuctionData = () => {
    try {
        const data = localStorage.getItem('auctionData');
        return data ? JSON.parse(data) : initialData;
    } catch (error) {
        console.error("Failed to parse auctionData from localStorage:", error);
        return initialData;
    }
};

export const saveAuctionData = (data) => {
    try {
        localStorage.setItem('auctionData', JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save auctionData to localStorage:", error);
        alert("Warning: Storage is full or corrupted. Your changes might not be saved.");
    }
};
