import { useState, useEffect } from 'react';

// Sample data store (in-memory)
const initialData = {
    sellers: [
        { id: 1, name: 'John Smith', contact: '9876543210', address: '123 Main St', totalSales: 45000 },
        { id: 2, name: 'Sarah Johnson', contact: '9876543211', address: '456 Oak Ave', totalSales: 32000 },
    ],
    buyers: [
        { id: 1, name: 'Mike Brown', contact: '9876543220', address: '789 Pine Rd', totalPurchases: 28000 },
        { id: 2, name: 'Emily Davis', contact: '9876543221', address: '321 Elm St', totalPurchases: 19000 },
    ],
    products: [
        { id: 1, name: 'Antique Vase', seller: 'John Smith', price: 5000, quality: 'Excellent', quantity: 1, commission: 10, status: 'available' },
        { id: 2, name: 'Vintage Watch', seller: 'Sarah Johnson', price: 8000, quality: 'Good', quantity: 1, commission: 12, status: 'available' },
    ],
    transactions: [
        { id: 1, date: '2026-02-05', product: 'Antique Vase', seller: 'John Smith', buyer: 'Mike Brown', price: 5000, commission: 500, commissionPercent: 10 },
        { id: 2, date: '2026-02-04', product: 'Vintage Watch', seller: 'Sarah Johnson', buyer: 'Emily Davis', price: 8000, commission: 960, commissionPercent: 12 },
    ],
};

function Dashboard() {
    const [stats, setStats] = useState({
        totalSellers: 0,
        totalBuyers: 0,
        totalSales: 0,
        totalCommission: 0,
    });

    useEffect(() => {
        // Calculate stats from data
        const data = JSON.parse(localStorage.getItem('auctionData') || JSON.stringify(initialData));

        const totalSales = data.transactions.reduce((sum, t) => sum + t.price, 0);
        const totalCommission = data.transactions.reduce((sum, t) => sum + t.commission, 0);

        setStats({
            totalSellers: data.sellers.length,
            totalBuyers: data.buyers.length,
            totalSales,
            totalCommission,
        });
    }, []);

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Dashboard</h1>
                    <div className="header-actions">
                        <button className="btn btn-primary">
                            <span>📊</span>
                            Generate Report
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Dashboard</span>
                </div>
            </div>

            <div className="content-body">
                <div className="stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">{stats.totalSellers}</div>
                                <div className="stat-label">Total Sellers</div>
                            </div>
                            <div className="stat-icon">👤</div>
                        </div>
                        <div className="stat-change positive">
                            <span>↑</span>
                            <span>12% from last month</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">{stats.totalBuyers}</div>
                                <div className="stat-label">Total Buyers</div>
                            </div>
                            <div className="stat-icon">🛒</div>
                        </div>
                        <div className="stat-change positive">
                            <span>↑</span>
                            <span>8% from last month</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">₹{stats.totalSales.toLocaleString()}</div>
                                <div className="stat-label">Total Sales</div>
                            </div>
                            <div className="stat-icon">💵</div>
                        </div>
                        <div className="stat-change positive">
                            <span>↑</span>
                            <span>15% from last month</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">₹{stats.totalCommission.toLocaleString()}</div>
                                <div className="stat-label">Total Commission</div>
                            </div>
                            <div className="stat-icon">💰</div>
                        </div>
                        <div className="stat-change positive">
                            <span>↑</span>
                            <span>18% from last month</span>
                        </div>
                    </div>
                </div>

                <div className="card fade-in">
                    <div className="table-header">
                        <h3 className="table-title">Recent Transactions</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Seller</th>
                                    <th>Buyer</th>
                                    <th>Price</th>
                                    <th>Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {JSON.parse(localStorage.getItem('auctionData') || JSON.stringify(initialData))
                                    .transactions.slice(0, 5).map(transaction => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.date}</td>
                                            <td>{transaction.product}</td>
                                            <td>{transaction.seller}</td>
                                            <td>{transaction.buyer}</td>
                                            <td>₹{transaction.price.toLocaleString()}</td>
                                            <td className="text-amber">₹{transaction.commission.toLocaleString()}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;
