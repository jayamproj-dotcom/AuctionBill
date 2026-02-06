import { useState, useEffect } from 'react';

function CommissionRecord() {
    const [commissions, setCommissions] = useState([]);
    const [filteredCommissions, setFilteredCommissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        loadCommissions();
    }, []);

    useEffect(() => {
        filterCommissions();
    }, [searchTerm, dateFilter, commissions]);

    const loadCommissions = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        if (data && data.transactions) {
            setCommissions(data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    };

    const filterCommissions = () => {
        let filtered = [...commissions];

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.seller.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter) {
            filtered = filtered.filter(c => c.date === dateFilter);
        }

        setFilteredCommissions(filtered);
    };

    const getTotalCommission = () => {
        return filteredCommissions.reduce((sum, c) => sum + c.commission, 0);
    };

    const getCommissionByMonth = () => {
        const monthlyData = {};
        filteredCommissions.forEach(c => {
            const month = c.date.substring(0, 7); // YYYY-MM
            monthlyData[month] = (monthlyData[month] || 0) + c.commission;
        });
        return monthlyData;
    };

    const monthlyCommissions = getCommissionByMonth();

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Commission Record</h1>
                    <div className="header-actions">
                        <button className="btn btn-outline">
                            <span>📥</span>
                            Export Report
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Commission Record</span>
                </div>
            </div>

            <div className="content-body">
                {/* Summary Cards */}
                <div className="stats-grid fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">₹{getTotalCommission().toLocaleString()}</div>
                                <div className="stat-label">Total Commission</div>
                            </div>
                            <div className="stat-icon">💰</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">{filteredCommissions.length}</div>
                                <div className="stat-label">Total Transactions</div>
                            </div>
                            <div className="stat-icon">📊</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-value">
                                    {filteredCommissions.length > 0
                                        ? `₹${Math.round(getTotalCommission() / filteredCommissions.length).toLocaleString()}`
                                        : '₹0'
                                    }
                                </div>
                                <div className="stat-label">Avg Commission</div>
                            </div>
                            <div className="stat-icon">📈</div>
                        </div>
                    </div>
                </div>

                {/* Monthly Breakdown */}
                {Object.keys(monthlyCommissions).length > 0 && (
                    <div className="card fade-in" style={{ marginTop: '2rem' }}>
                        <div className="table-header">
                            <h3 className="table-title">Monthly Commission Breakdown</h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                {Object.entries(monthlyCommissions).map(([month, amount]) => (
                                    <div key={month} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-amber)' }}>
                                            ₹{amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card fade-in" style={{ marginTop: '2rem' }}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Search</label>
                            <input
                                type="text"
                                placeholder="Search by product or seller..."
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

                {/* Commission Table */}
                <div className="card fade-in" style={{ marginTop: '2rem' }}>
                    <div className="table-header">
                        <h3 className="table-title">Commission Details</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Seller</th>
                                    <th>Sale Price</th>
                                    <th>Commission %</th>
                                    <th>Commission Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCommissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="empty-state-icon">💰</div>
                                            <p>No commission records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCommissions.map(commission => (
                                        <tr key={commission.id}>
                                            <td>{commission.date}</td>
                                            <td>{commission.product}</td>
                                            <td>{commission.seller}</td>
                                            <td>₹{commission.price.toLocaleString()}</td>
                                            <td className="text-amber">{commission.commissionPercent}%</td>
                                            <td className="text-amber" style={{ fontWeight: '600' }}>
                                                ₹{commission.commission.toLocaleString()}
                                            </td>
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

export default CommissionRecord;
