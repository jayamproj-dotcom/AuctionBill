export const initialData = {
    sellers: [
        {
            id: 1,
            name: 'Ramesh Kumar',
            contact: '9876543210',
            email: 'ramesh@example.com',
            address: 'Salem, Tamil Nadu',
            status: 'active',
            password: '123'
        },
        {
            id: 2,
            name: 'Murugan',
            contact: '9876543211',
            email: 'murugan@example.com',
            address: 'Madurai, Tamil Nadu',
            status: 'active',
            password: '123'
        }
    ],

    buyers: [
        {
            id: 1,
            name: 'Arun Traders',
            contact: '9876543220',
            email: 'arun@example.com',
            address: 'Chennai, Tamil Nadu',
            buyerType: 'Wholesale',
            status: 'active',
            password: '123'
        },
        {
            id: 2,
            name: 'Lakshmi Stores',
            contact: '9876543221',
            email: 'lakshmi@example.com',
            address: 'Coimbatore, Tamil Nadu',
            buyerType: 'Retailer',
            status: 'active',
            password: '123'
        }
    ],

    // 🔥 Updated Product Structure (Stock Info Only)
    products: [
        {
            id: 1,
            name: 'Salem Turmeric',
            sellerId: 1,
            sellerName: 'Ramesh Kumar',
            status: 'available',
            isActive: true,
            date: '2026-02-14',
            variants: [
                {
                    id: 101,
                    variety: 'Standard',
                    quality: 'Good',
                    quantity: 100,
                    unit: 'kg',
                    commissionPercent: 5
                }
            ]
        },

        {
            id: 2,
            name: 'Madurai Jasmine Flowers',
            sellerId: 2,
            sellerName: 'Murugan',
            status: 'available',
            isActive: true,
            date: '2026-02-14',
            variants: [
                {
                    id: 201,
                    variety: 'Fresh Morning',
                    quality: 'Good',
                    quantity: 50,
                    unit: 'kg',
                    commissionPercent: 8
                }
            ]
        },

        {
            id: 3,
            name: 'Erode Turmeric Powder',
            sellerId: 1,
            sellerName: 'Ramesh Kumar',
            status: 'available',
            isActive: true,
            date: '2026-02-14',
            variants: [
                {
                    id: 301,
                    variety: 'Premium',
                    quality: 'Good',
                    quantity: 75,
                    unit: 'kg',
                    commissionPercent: 6
                }
            ]
        },

        {
            id: 4,
            name: 'Coimbatore Coconut',
            sellerId: 2,
            sellerName: 'Murugan',
            status: 'available',
            isActive: true,
            date: '2026-02-14',
            variants: [
                {
                    id: 401,
                    variety: 'Medium Size',
                    quality: 'Good',
                    quantity: 500,
                    unit: 'qty',
                    commissionPercent: 4
                }
            ]
        }
    ],

    // 🔥 Updated Transactions (Pure Sales Record)
    transactions: [
        {
            id: 1,
            date: "2026-02-06",
            sellerId: 1,
            buyerId: 1,
            productId: 1,
            variantId: 101,
            quantity: 50,
            rate: 12000,
            finalAmount: 600000,
            commissionPercent: 5,
            commissionAmount: 30000,
            netAmount: 570000
        }
    ],

    // 🔥 New Table: sellerPayments (Money Paid to Seller)
    sellerPayments: [
        {
            id: 1,
            sellerId: 1,
            date: "2026-02-06",
            amount: 570000, // Full payment example
            method: "Cash",
            reference: "PAY-001"
        }
    ],

    // 🔥 New Table: sellerCredits (Advance Given)
    sellerCredits: [
        // {
        //     id: 1,
        //     sellerId: 1,
        //     date: "2026-02-01",
        //     amount: 50000,
        //     reason: "Advance given before auction"
        // }
    ],

    // 🔥 New Table: buyerPayments (Money Received from Buyer)
    buyerPayments: []
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
