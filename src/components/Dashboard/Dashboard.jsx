import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesCombined, Users, UsersRound, HandCoins, BadgeIndianRupee, Bell, ArrowDownLeft, ArrowUpRight, Filter, Calendar } from "lucide-react";
import { getAuctionData } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import Notification from '../Common/Notification';
import './Dashboard.css';


function Dashboard() {
    const [stats, setStats] = useState({
        totalSellers: 0,
        totalBuyers: 0,
        totalSales: 0,
        totalCommission: 0,
        todayAuctions: 0,
        totalQty: 0,
        totalPayIn: 0,
        totalPayOut: 0,
    });
    const [dateFilter, setDateFilter] = useState('today');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [demoExpiryDate, setDemoExpiryDate] = useState('');

    useEffect(() => {
        // For testing the UI, let's set the expiry to 5 days from now
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        setDemoExpiryDate(futureDate.toISOString().split('T')[0]);
        
        calculateStats();
    }, [dateFilter, customDate]);

    const getDateRange = (filter) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'today':
                return {
                    start: today,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    start: yesterday,
                    end: today
                };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                return {
                    start: weekStart,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'month':
                const monthStart = new Date(today);
                monthStart.setDate(1);
                return {
                    start: monthStart,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                return {
                    start: yearStart,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'custom':
                const custom = new Date(customDate);
                custom.setHours(0, 0, 0, 0);
                return {
                    start: custom,
                    end: new Date(custom.getTime() + 24 * 60 * 60 * 1000)
                };
            default:
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
        }
    };

    const calculateStats = () => {
        const data = getAuctionData();

        // Get today's date for today's auctions
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = data.transactions.filter(t => t.date === today);

        // Get filtered transactions based on selected date range
        const dateRange = getDateRange(dateFilter);
        const filtered = data.transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= dateRange.start && transDate < dateRange.end;
        }).map(t => {
            // resolving names
            const product = data.products.find(p => p.id === t.productId);
            const variant = product?.variants?.find(v => v.id === t.variantId);
            const seller = data.sellers.find(s => s.id === t.sellerId);
            const buyer = data.buyers.find(b => b.id === t.buyerId);

            return {
                ...t,
                productName: product ? product.name : 'Unknown Product',
                variantName: variant ? variant.variety : '',
                sellerName: seller ? seller.name : 'Unknown Seller',
                buyerName: buyer ? buyer.name : 'Unknown Buyer',
                // Map old fields if needed or just use new ones in UI
                finalAmount: t.finalAmount || 0,
                commissionAmount: t.commissionAmount || 0
            };
        });

        const totalSales = filtered.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
        const totalCommission = filtered.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
        const totalQty = filtered.reduce((sum, t) => sum + (parseFloat(t.quantity) || 0), 0);

        // Calculate Pay In (Buyer Payments)
        const buyerPayments = data.buyerPayments || [];
        const filteredPayIn = buyerPayments.filter(p => {
            const pDate = new Date(p.date);
            return pDate >= dateRange.start && pDate < dateRange.end;
        });
        const totalPayIn = filteredPayIn.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        // Calculate Pay Out (Seller Payments)
        const sellerPayments = data.sellerPayments || [];
        const filteredPayOut = sellerPayments.filter(p => {
            const pDate = new Date(p.date);
            return pDate >= dateRange.start && pDate < dateRange.end;
        });
        const totalPayOut = filteredPayOut.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        setStats({
            totalBuyers: data.buyers.length,
            totalSellers: data.sellers.length,
            totalSales,
            totalCommission,
            todayAuctions: todayTransactions.length,
            totalQty,
            totalPayIn,
            totalPayOut
        });

        setFilteredTransactions(filtered);
    };

    const getFilterLabel = () => {
        switch (dateFilter) {
            case 'today': return 'Today';
            case 'yesterday': return 'Yesterday';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            case 'custom': return formatDate(customDate);
            default: return 'Today';
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Dashboard</h1>
                    <div className="header-actions">
                        <div className="dashboard-filter-container">
                            <div className="filter-dropdown-wrapper">
                                <Filter className="filter-icon" size={16} />
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="dashboard-filter-select"
                                >
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                    <option value="custom">Custom Date</option>
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

                        <Notification expiryDate={demoExpiryDate} />
                        {/* Demo Button removed */}
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Dashboard</span>
                </div>
            </div>

            <div className="content-body">
                {/* Stats Grid - 5 Cards */}
                <div className="stats-grid dashboard-stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ChartNoAxesCombined /></div>
                            <Link to="/admin/today-auction"><div>
                                <div className="stat-value">{stats.todayAuctions}</div>
                                <div className="stat-label">Today</div>
                            </div></Link>
                        </div>
                        <div className="stat-change positive">
                            <span>📅</span>
                            <span>Live Count</span>
                        </div>
                    </div>

                    <Link to="/vendor/seller-details">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon"><Users /></div>
                                <div>
                                    <div className="stat-value">{stats.totalSellers}</div>
                                    <div className="stat-label">Sellers</div>
                                </div>
                            </div>
                            <div className="stat-change positive">
                                <span>↑</span>
                                <span>12% this month</span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/vendor/buyer-details">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon"><UsersRound /></div>
                                <div>
                                    <div className="stat-value">{stats.totalBuyers}</div>
                                    <div className="stat-label">Buyers</div>
                                </div>
                            </div>
                            <div className="stat-change positive">
                                <span>↑</span>
                                <span>8% this month</span>
                            </div>
                        </div>
                    </Link>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ArrowDownLeft className="text-success" /></div>
                            <div>
                                <div className="stat-value">₹{stats.totalPayIn.toLocaleString()}</div>
                                <div className="stat-label">Pay In</div>
                            </div>
                        </div>
                        <div className="stat-change positive">
                            <span>↑</span>
                            <span>{getFilterLabel()}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ArrowUpRight className="text-danger" /></div>
                            <div>
                                <div className="stat-value">₹{stats.totalPayOut.toLocaleString()}</div>
                                <div className="stat-label">Pay Out</div>
                            </div>
                        </div>
                        <div className="stat-change positive">
                            <span>↑</span>
                            <span>{getFilterLabel()}</span>
                        </div>
                    </div>

                    <Link to="/vendor/history">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon"><BadgeIndianRupee /></div>
                                <div>
                                    <div className="stat-value">₹{(stats.totalSales / 1000).toFixed(0)}K</div>
                                    <div className="stat-label">Sales</div>
                                </div>
                            </div>
                            <div className="stat-change positive">
                                <span>↑</span>
                                <span>{getFilterLabel()}</span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/vendor/commission">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon"><HandCoins /></div>
                                <div>
                                    <div className="stat-value">₹{(stats.totalCommission / 1000).toFixed(1)}K</div>
                                    <div className="stat-label">Commission</div>
                                </div>
                            </div>
                            <div className="stat-change positive">
                                <span>↑</span>
                                <span>{getFilterLabel()}</span>
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Date Filter Selection */}
                {/* <div className="card filter-card fade-in">
                    <div className={`form-grid ${dateFilter === 'custom' ? 'filter-grid-custom' : 'filter-grid-single'}`}>
                        <div className="form-group">
                            <label className="form-label">Quick Filter</label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="full-width-select"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                                <option value="custom">📅 Custom Date</option>
                            </select>
                        </div>
                        {dateFilter === 'custom' && (
                            <div className="form-group fade-in">
                                <label className="form-label">Pick a Date</label>
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="full-width-input"
                                />
                            </div>
                        )}
                    </div>
                </div> */}

                {/* Recent Transactions - Mobile Card List */}
                <div className="section-header section-margin-top">
                    <h3 className="section-title">Transactions ({getFilterLabel()})</h3>
                </div>

                <div className="card-list fade-in">
                    {filteredTransactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <p>No transactions for {getFilterLabel().toLowerCase()}</p>
                        </div>
                    ) : (
                        filteredTransactions.slice(0, 10).map(transaction => (
                            <div key={transaction.id} className="data-card">
                                <div className="data-card-header">
                                    <div>
                                        <div className="data-card-title">{transaction.productName}</div>
                                        <div className="data-card-subtitle">{formatDate(transaction.date)}</div>
                                    </div>
                                    <div className="badge badge-success">Completed</div>
                                </div>

                                <div className="data-card-body">
                                    <div className="data-row">
                                        <span className="data-label">Seller</span>
                                        <span className="data-value">{transaction.sellerName}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Buyer</span>
                                        <span className="data-value">{transaction.buyerName}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Qty / Unit</span>
                                        <span className="data-value">{transaction.quantity} {transaction.unit || 'qty'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Price</span>
                                        <span className="data-value">₹{(transaction.finalAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Commission</span>
                                        <span className="data-value text-amber">₹{(transaction.commissionAmount || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="data-card-footer">
                                    <button className="btn btn-sm btn-outline">View Details</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default Dashboard;