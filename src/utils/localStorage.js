export const initialData = {
    sellers: [
        {
            id: 1,
            name: 'Ramesh Kumar',
            contact: '9876543210',
            email: 'ramesh@example.com',
            address: 'Salem, Tamil Nadu',
            totalSales: 45000,
            status: 'active',
            password: '123'
        },
        {
            id: 2,
            name: 'Murugan',
            contact: '9876543211',
            email: 'murugan@example.com',
            address: 'Madurai, Tamil Nadu',
            totalSales: 32000,
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
            totalPurchases: 28000,
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
            totalPurchases: 19000,
            buyerType: 'Retailer',
            status: 'active',
            password: '123'
        }
    ],

    // 🔥 Updated Product Structure
    products: [
        {
            id: 1,
            name: 'Salem Turmeric',
            seller_id: 1,
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
                    commission: 5,
                    pricePerUnit: 12000
                }
            ]
        },

        {
            id: 2,
            name: 'Madurai Jasmine Flowers',
            seller_id: 2,
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
                    commission: 8,
                    pricePerUnit: 300
                }
            ]
        },

        {
            id: 3,
            name: 'Erode Turmeric Powder',
            seller_id: 1,
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
                    commission: 6,
                    pricePerUnit: 9000
                }
            ]
        },

        {
            id: 4,
            name: 'Coimbatore Coconut',
            seller_id: 2,
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
                    commission: 4,
                    pricePerUnit: 25
                }
            ]
        }
    ],

    // 🔥 Updated Transactions (Now Includes variant_id)
    transactions: [
        {
            id: 1,
            date: '2026-02-06',
            product_id: 1,
            variant_id: 101,
            quantity: 50,
            unit: 'kg',
            seller_id: 1,
            buyer_id: 1,
            price: 600000,
            commission: 30000,
            commissionPercent: 5,
            paymentStatus: 'Paid',
            amountPaid: 600000,
            balance: 0
        },
        {
            id: 2,
            date: '2026-02-05',
            product_id: 2,
            variant_id: 201,
            quantity: 20,
            unit: 'kg',
            seller_id: 2,
            buyer_id: 2,
            price: 6000,
            commission: 480,
            commissionPercent: 8,
            paymentStatus: 'Part Paid',
            amountPaid: 3000,
            balance: 3000
        },
        {
            id: 3,
            date: '2026-02-04',
            product_id: 4,
            variant_id: 401,
            quantity: 200,
            unit: 'qty',
            seller_id: 2,
            buyer_id: 1,
            price: 5000,
            commission: 200,
            commissionPercent: 4,
            paymentStatus: 'Paid',
            amountPaid: 5000,
            balance: 0
        }
    ]
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
