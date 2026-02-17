import { useState, useEffect } from 'react';
import { getAuctionData } from '../../utils/localStorage';
import './CommissionRecord.css';
import {Download,BadgeIndianRupee,ArrowRightLeft,ChartNoAxesColumn, Search} from 'lucide-react';

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
        const data = getAuctionData();
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
                    <h1>Commission</h1>
                    <div className="header-actions">
                        <button className="btn btn-outline btn-sm">
                            <span><Download size={18} /></span>
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Commission</span>
                </div>
            </div>

            <div className="content-body">
                {/* Summary Cards */}
                <div className="stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><BadgeIndianRupee /></div>
                            <div>
                                <div className="stat-value">₹{(getTotalCommission() / 1000).toFixed(1)}K</div>
                                <div className="stat-label">Total</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ArrowRightLeft /></div>
                            <div>
                                <div className="stat-value">{filteredCommissions.length}</div>
                                <div className="stat-label">Transactions</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ChartNoAxesColumn /></div>
                            <div>
                                <div className="stat-value">
                                    {filteredCommissions.length > 0
                                        ? `₹${Math.round(getTotalCommission() / filteredCommissions.length).toLocaleString()}`
                                        : '₹0'
                                    }
                                </div>
                                <div className="stat-label">Average</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Breakdown */}
                {Object.keys(monthlyCommissions).length > 0 && (
                    <div className="card fade-in summary-card-margin">
                        <div className="section-header">
                            <h3 className="section-title">Monthly Breakdown</h3>
                        </div>
                        <div className="monthly-breakdown-grid">
                            {Object.entries(monthlyCommissions).map(([month, amount]) => (
                                <div key={month} className="card monthly-card">
                                    <div className="monthly-label">
                                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="monthly-amount">
                                        ₹{amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card fade-in filter-card-margin">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Search</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Product or seller..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingRight: '35px', width: '100%' }}
                                />
                                <Search size={18} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                    </div>
                    {(searchTerm || dateFilter) && (
                        <button
                            className="btn btn-secondary btn-sm clear-filters-btn"
                            onClick={() => { setSearchTerm(''); setDateFilter(''); }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Commission Cards */}
                <div className="section-header commission-details-header">
                    <h3 className="section-title">Commission Details</h3>
                </div>

                <div className="card-list fade-in">
                    {filteredCommissions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💰</div>
                            <p>No commission records found</p>
                        </div>
                    ) : (
                        filteredCommissions.map(commission => (
                            <div key={commission.id} className="data-card">
                                <div className="data-card-header">
                                    <div>
                                        <div className="data-card-title">{commission.product}</div>
                                        <div className="data-card-subtitle">{commission.date}</div>
                                    </div>
                                    <div className="badge badge-success">{commission.commissionPercent}%</div>
                                </div>
                                
                                <div className="data-card-body">
                                    <div className="data-row">
                                        <span className="data-label">Seller</span>
                                        <span className="data-value">{commission.seller}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Sale Price</span>
                                        <span className="data-value">₹{commission.price.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Commission</span>
                                        <span className="data-value text-amber commission-value-large">
                                            ₹{commission.commission.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default CommissionRecord;
