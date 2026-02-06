import { useState, useEffect } from 'react';

function Manage() {
    const [stats, setStats] = useState({
        totalSellers: 0,
        totalBuyers: 0,
        totalProducts: 0,
        availableProducts: 0,
        soldProducts: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalCommission: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        if (data) {
            const availableProducts = data.products.filter(p => p.status === 'available').length;
            const soldProducts = data.products.filter(p => p.status === 'sold').length;
            const totalRevenue = data.transactions.reduce((sum, t) => sum + t.price, 0);
            const totalCommission = data.transactions.reduce((sum, t) => sum + t.commission, 0);

            setStats({
                totalSellers: data.sellers.length,
                totalBuyers: data.buyers.length,
                totalProducts: data.products.length,
                availableProducts,
                soldProducts,
                totalTransactions: data.transactions.length,
                totalRevenue,
                totalCommission,
            });
        }
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.removeItem('auctionData');
            window.location.reload();
        }
    };

    const handleExportData = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auction-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Manage System</h1>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={handleExportData}>
                            <span>📥</span>
                            Export Data
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Manage</span>
                </div>
            </div>

            <div className="content-body">
                {/* System Overview */}
                <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>System Overview</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{stats.totalSellers}</div>
                                    <div className="stat-label">Total Sellers</div>
                                </div>
                                <div className="stat-icon">👤</div>
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
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{stats.totalProducts}</div>
                                    <div className="stat-label">Total Products</div>
                                </div>
                                <div className="stat-icon">📦</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{stats.totalTransactions}</div>
                                    <div className="stat-label">Total Transactions</div>
                                </div>
                                <div className="stat-icon">📊</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Status */}
                <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Product Status</h3>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{stats.availableProducts}</div>
                                    <div className="stat-label">Available Products</div>
                                </div>
                                <div className="stat-icon">✅</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">{stats.soldProducts}</div>
                                    <div className="stat-label">Sold Products</div>
                                </div>
                                <div className="stat-icon">💵</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Financial Overview</h3>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                                    <div className="stat-label">Total Revenue</div>
                                </div>
                                <div className="stat-icon">💰</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">₹{stats.totalCommission.toLocaleString()}</div>
                                    <div className="stat-label">Total Commission Earned</div>
                                </div>
                                <div className="stat-icon">💵</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div>
                                    <div className="stat-value">
                                        {stats.totalRevenue > 0
                                            ? `${((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1)}%`
                                            : '0%'
                                        }
                                    </div>
                                    <div className="stat-label">Avg Commission Rate</div>
                                </div>
                                <div className="stat-icon">📈</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Actions */}
                <div className="card fade-in">
                    <h3 style={{ marginBottom: '1.5rem' }}>System Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h4 style={{ marginBottom: '0.5rem' }}>Export System Data</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                    Download all auction data as JSON file for backup
                                </p>
                            </div>
                            <button className="btn btn-primary" onClick={handleExportData}>
                                <span>📥</span>
                                Export
                            </button>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid var(--error)'
                        }}>
                            <div>
                                <h4 style={{ marginBottom: '0.5rem', color: 'var(--error)' }}>Clear All Data</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                    Remove all sellers, buyers, products, and transactions. This cannot be undone.
                                </p>
                            </div>
                            <button
                                className="btn"
                                style={{ backgroundColor: 'var(--error)', color: 'white' }}
                                onClick={handleClearData}
                            >
                                <span>🗑️</span>
                                Clear Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="card fade-in" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>System Information</h3>
                    <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Application Name:</span>
                            <span style={{ fontWeight: '600' }}>AuctionBill Management System</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Version:</span>
                            <span style={{ fontWeight: '600' }}>1.0.0</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Storage:</span>
                            <span style={{ fontWeight: '600' }}>Local Storage (Browser)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Last Updated:</span>
                            <span style={{ fontWeight: '600' }}>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Manage;
