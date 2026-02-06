import { useState, useEffect } from 'react';

function History() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [searchTerm, dateFilter, transactions]);

    const loadTransactions = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        if (data && data.transactions) {
            setTransactions(data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.buyer.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter) {
            filtered = filtered.filter(t => t.date === dateFilter);
        }

        setFilteredTransactions(filtered);
    };

    const getTotalStats = () => {
        const total = filteredTransactions.reduce((sum, t) => sum + t.price, 0);
        const commission = filteredTransactions.reduce((sum, t) => sum + t.commission, 0);
        return { total, commission };
    };

    const stats = getTotalStats();

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Auction History</h1>
                    <div className="header-actions">
                        <button className="btn btn-outline">
                            <span>📥</span>
                            Export
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>History</span>
                </div>
            </div>

            <div className="content-body">
                {/* Summary Cards */}
                <div className="stats-grid fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">{filteredTransactions.length}</div>
                                <div className="stat-label">Total Transactions</div>
                            </div>
                            <div className="stat-icon">📊</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">₹{stats.total.toLocaleString()}</div>
                                <div className="stat-label">Total Sales Value</div>
                            </div>
                            <div className="stat-icon">💵</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">₹{stats.commission.toLocaleString()}</div>
                                <div className="stat-label">Total Commission</div>
                            </div>
                            <div className="stat-icon">💰</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card fade-in" style={{ marginTop: '2rem' }}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Search</label>
                            <input
                                type="text"
                                placeholder="Search by product, seller, or buyer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filter by Date</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setSearchTerm(''); setDateFilter(''); }}
                                style={{ width: '100%' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="card fade-in" style={{ marginTop: '2rem' }}>
                    <div className="table-header">
                        <h3 className="table-title">Transaction Records</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Seller</th>
                                    <th>Buyer</th>
                                    <th>Sale Price</th>
                                    <th>Commission %</th>
                                    <th>Commission Amount</th>
                                    <th>Seller Received</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="empty-state">
                                            <div className="empty-state-icon">📜</div>
                                            <p>No transactions found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map(transaction => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.date}</td>
                                            <td>{transaction.product}</td>
                                            <td>{transaction.seller}</td>
                                            <td>{transaction.buyer}</td>
                                            <td>₹{transaction.price.toLocaleString()}</td>
                                            <td className="text-amber">{transaction.commissionPercent}%</td>
                                            <td className="text-amber">₹{transaction.commission.toLocaleString()}</td>
                                            <td>₹{(transaction.price - transaction.commission).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default History;
