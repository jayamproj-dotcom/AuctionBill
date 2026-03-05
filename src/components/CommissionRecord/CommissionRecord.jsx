import { useState, useEffect } from 'react';
import { getAuctionData } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import './CommissionRecord.css';
import { Download, BadgeIndianRupee, ArrowRightLeft, ChartNoAxesColumn, Search } from 'lucide-react';

function CommissionRecord() {
    const [commissions, setCommissions] = useState([]);
    const [filteredCommissions, setFilteredCommissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadCommissions();
    }, []);

    useEffect(() => {
        filterCommissions();
    }, [searchTerm, dateFilter, customDate, commissions]);

    const loadCommissions = () => {
        const data = getAuctionData();
        if (data && data.transactions) {
            const enriched = data.transactions.map(t => {
                const product = data.products.find(p => p.id === t.productId);
                const seller = data.sellers.find(s => s.id === t.sellerId);
                return {
                    ...t,
                    productName: product ? product.name : 'Unknown Product',
                    sellerName: seller ? seller.name : 'Unknown Seller',
                    commissionAmount: t.commissionAmount || 0,
                    finalAmount: t.finalAmount || 0
                };
            });
            setCommissions(enriched.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    };

    const getDateRange = (filter) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'today':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday, end: today };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'month':
                const monthStart = new Date(today);
                monthStart.setDate(1);
                return { start: monthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                return { start: yearStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'custom':
                const custom = new Date(customDate);
                custom.setHours(0, 0, 0, 0);
                return { start: custom, end: new Date(custom.getTime() + 24 * 60 * 60 * 1000) };
            case 'all':
            default:
                return null;
        }
    };

    const filterCommissions = () => {
        let filtered = [...commissions];

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter !== 'all') {
            const dateRange = getDateRange(dateFilter);
            if (dateRange) {
                filtered = filtered.filter(c => {
                    const transDate = new Date(c.date);
                    return transDate >= dateRange.start && transDate < dateRange.end;
                });
            }
        }

        setFilteredCommissions(filtered);
    };

    const getTotalCommission = () => {
        return filteredCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    };

    const getCommissionByMonth = () => {
        const monthlyData = {};
        filteredCommissions.forEach(c => {
            const month = c.date.substring(0, 7); // YYYY-MM
            monthlyData[month] = (monthlyData[month] || 0) + (c.commissionAmount || 0);
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
                        <div className="dashboard-filter-container">
                            <div className="search-icon-container" style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search product or seller..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input dashboard-filter-select"
                                    style={{ padding: '0.35rem 0.75rem', paddingRight: '35px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '0.875rem' }}
                                />
                                <Search size={16} className="search-icon-absolute" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                            </div>

                            <div className="filter-dropdown-wrapper">
                                <Filter className="filter-icon" size={16} />
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="dashboard-filter-select"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                    <option value="custom">📅 Custom Date</option>
                                </select>
                            </div>

                            {dateFilter === 'custom' && (
                                <div className="custom-date-wrapper fade-in">
                                    <Calendar className="calendar-icon" size={16} />
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="dashboard-date-input"
                                    />
                                </div>
                            )}

                        </div>
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

                {/* Monthly Breakdown
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
                )} */}

                {/* Filters - Moved to header */}

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
                                        <div className="data-card-title">{commission.productName}</div>
                                        <div className="data-card-subtitle">{formatDate(commission.date)}</div>
                                    </div>
                                    <div className="badge badge-success">{commission.commissionPercent}%</div>
                                </div>

                                <div className="data-card-body">
                                    <div className="data-row">
                                        <span className="data-label">Seller</span>
                                        <span className="data-value">{commission.sellerName}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Sale Price</span>
                                        <span className="data-value">₹{(commission.finalAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Commission</span>
                                        <span className="data-value text-amber commission-value-large">
                                            ₹{(commission.commissionAmount || 0).toLocaleString()}
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
