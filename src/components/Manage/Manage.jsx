import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData, initialData } from '../../utils/localStorage';
import './Manage.css';


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
        const data = getAuctionData();
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

    const handleExportData = () => {
        const data = getAuctionData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auction-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleChangePassword = () => {
        const oldPassword = prompt('Enter Current Admin Password:');
        const storedCreds = JSON.parse(localStorage.getItem('adminCredentials')) || {
            username: 'admin',
            password: 'admin@123'
        };

        if (oldPassword === storedCreds.password) {
            const newPassword = prompt('Enter New Admin Password:');
            if (newPassword && newPassword.length >= 4) {
                const confirmPass = prompt('Confirm New Admin Password:');
                if (newPassword === confirmPass) {
                    const newCreds = { ...storedCreds, password: newPassword };
                    localStorage.setItem('adminCredentials', JSON.stringify(newCreds));
                    alert('Admin password changed successfully!');
                } else {
                    alert('Passwords do not match!');
                }
            } else if (newPassword) {
                alert('Password must be at least 4 characters long!');
            }
        } else if (oldPassword !== null) {
            alert('Incorrect current password!');
        }
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            saveAuctionData(initialData);
            window.location.reload();
        }
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
                <div className="card fade-in card-margin-bottom">
                    <h3 className="heading-margin-bottom">System Overview</h3>
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
                <div className="card fade-in card-margin-bottom">
                    <h3 className="heading-margin-bottom">Product Status</h3>
                    <div className="stats-grid stats-grid-flexible">
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
                <div className="card fade-in card-margin-bottom">
                    <h3 className="heading-margin-bottom">Financial Overview</h3>
                    <div className="stats-grid stats-grid-flexible">
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

                {/* Security Actions */}
                <div className="card fade-in card-margin-bottom">
                    <h3 className="heading-margin-bottom">System Security</h3>
                    <div className="action-row">
                        <div>
                            <h4 className="subheading-margin-bottom">Admin Credentials</h4>
                            <p className="text-muted-small">
                                Change your administrative login password
                            </p>
                        </div>
                        <button className="btn btn-warning" onClick={handleChangePassword}>
                            <span>🔑</span>
                            Change Password
                        </button>
                    </div>
                </div>

                {/* System Actions */}
                <div className="card fade-in">
                    <h3 className="heading-margin-bottom">System Actions</h3>
                    <div className="flex-column-gap">
                        <div className="action-row">
                            <div>
                                <h4 className="subheading-margin-bottom">Export System Data</h4>
                                <p className="text-muted-small">
                                    Download all auction data as JSON file for backup
                                </p>
                            </div>
                            <button className="btn btn-primary" onClick={handleExportData}>
                                <span>📥</span>
                                Export
                            </button>
                        </div>

                        <div className="action-row-error">
                            <div>
                                <h4 className="subheading-error">Clear All Data</h4>
                                <p className="text-muted-small">
                                    Remove all sellers, buyers, products, and transactions. This cannot be undone.
                                </p>
                            </div>
                            <button
                                className="btn btn-error-solid"
                                onClick={handleClearData}
                            >
                                <span>🗑️</span>
                                Clear Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="card fade-in card-margin-top">
                    <h3 className="heading-margin-bottom">System Information</h3>
                    <div className="info-grid">
                        <div className="info-row">
                            <span className="label-muted">Application Name:</span>
                            <span className="font-semibold">AuctionBill Management System</span>
                        </div>
                        <div className="info-row">
                            <span className="label-muted">Version:</span>
                            <span className="font-semibold">1.0.0</span>
                        </div>
                        <div className="info-row">
                            <span className="label-muted">Storage:</span>
                            <span className="font-semibold">Local Storage (Browser)</span>
                        </div>
                        <div className="info-row">
                            <span className="label-muted">Last Updated:</span>
                            <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Manage;
