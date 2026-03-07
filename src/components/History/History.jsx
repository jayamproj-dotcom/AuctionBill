import { useState, useEffect } from 'react';
import { getAuctionData } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import './History.css';
import { ArrowRightLeft, Download, ShoppingCart, HandCoins, Package, Search, Filter, Calendar } from 'lucide-react';


function History() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
   const [dateFilter, setDateFilter] = useState('all');
const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [searchTerm, dateFilter, transactions]);

    const loadTransactions = () => {
        const data = getAuctionData();
        if (data && data.transactions) {
            const enriched = data.transactions.map(t => {
                const product = data.products.find(p => p.id === t.productId);
                const seller = data.sellers.find(s => s.id === t.sellerId);
                const buyer = data.buyers.find(b => b.id === t.buyerId);
                return {
                    ...t,
                    productName: product ? product.name : 'Unknown Product',
                    sellerName: seller ? seller.name : 'Unknown Seller',
                    buyerName: buyer ? buyer.name : 'Unknown Buyer',
                    finalAmount: t.finalAmount || 0,
                    commissionAmount: t.commissionAmount || 0,
                    netAmount: t.netAmount || 0,
                    // Unit might be in transaction or variant, assuming transaction has it from TodayAuction make
                    unit: t.unit || 'qty'
                };
            });
            setTransactions(enriched.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    };
    const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = (d) => new Date(d.getTime() + 24 * 60 * 60 * 1000);

    switch (filter) {
        case 'today':
            return { start: today, end: next(today) };

        case 'yesterday':
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            return { start: y, end: today };

        case 'week':
            const w = new Date(today);
            w.setDate(w.getDate() - 7);
            return { start: w, end: next(today) };

        case 'month':
            const m = new Date(today);
            m.setDate(1);
            return { start: m, end: next(today) };

        case 'year':
            return { start: new Date(today.getFullYear(), 0, 1), end: next(today) };

        case 'custom':
            const c = new Date(customDate);
            c.setHours(0,0,0,0);
            return { start: c, end: next(c) };

        default:
            return null;
    }
};

    const filterTransactions = () => {
        let filtered = [...transactions];

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter !== 'all') {
    const range = getDateRange(dateFilter);

    if (range) {
        filtered = filtered.filter(t => {
            const d = new Date(t.date);
            return d >= range.start && d < range.end;
        });
    }
}

        setFilteredTransactions(filtered);
    };

    const getTotalStats = () => {
        const total = filteredTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
        const commission = filteredTransactions.reduce((sum, t) => sum + t.commissionAmount, 0);
        const totalQty = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.quantity) || 0), 0);
        return { total, commission, totalQty };
    };

    const stats = getTotalStats();

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>History</h1>
                    <div className="header-actions">
                        <button className="btn btn-outline btn-sm">
                            <span><Download size={18} /></span>
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
                <div className="stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ArrowRightLeft /></div>
                            <div>
                                <div className="stat-value">{filteredTransactions.length}</div>
                                <div className="stat-label">Transactions</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><ShoppingCart /></div>
                            <div>
                                <div className="stat-value">₹{(stats.total / 1000).toFixed(0)}K</div>
                                <div className="stat-label">Total Sales</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><HandCoins /></div>
                            <div>
                                <div className="stat-value">₹{(stats.commission / 1000).toFixed(1)}K</div>
                                <div className="stat-label">Commission</div>
                            </div>
                        </div>
                    </div>

                    {/* <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><Package /></div>
                            <div>
                                <div className="stat-value">{stats.totalQty}</div>
                                <div className="stat-label">Total Qty</div>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Filters */}
                {/* Filters */}
<div className="card fade-in cr-filter-card">
    <div className="cr-filter-row">

        {/* Search */}
        <div className="cr-search-wrap">
            <Search size={15} className="cr-search-icon" />
            <input
                type="text"
                className="cr-search-input"
                placeholder="Search product, seller, buyer…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Filter controls */}
        <div className="cr-controls">

            <div className="cr-select-wrap">
                <Filter size={13} className="cr-select-icon" />
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="cr-select"
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
                <div className="cr-date-wrap fade-in">
                    <Calendar size={13} className="cr-date-icon" />
                    <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="cr-date-input"
                    />
                </div>
            )}

        </div>
    </div>
</div>

                {/* Transaction Cards */}
                <div className="section-header section-header-margin">
                    <h3 className="section-title">Transaction Records</h3>
                </div>

                <div className="card-list fade-in">
                    {filteredTransactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📜</div>
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        filteredTransactions.map(transaction => (
                            <div key={transaction.id} className="data-card">
                                <div className="data-card-header">
                                    <div>
                                        <div className="data-card-title">{transaction.productName}</div>
                                        <div className="data-card-subtitle">{formatDate(transaction.date)}</div>
                                    </div>
                                    <div className="badge badge-success">
                                        Completed
                                    </div>
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
                                    <div className="data-row data-row-divider">
                                        <span className="data-label">Qty / Unit</span>
                                        <span className="data-value">{transaction.quantity} {transaction.unit}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Total Price</span>
                                        <span className="data-value">₹{transaction.finalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row data-row-divider">
                                        <span className="data-label">Commission ({transaction.commissionPercent}%)</span>
                                        <span className="data-value text-amber">₹{transaction.commissionAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Net Amount</span>
                                        <span className="data-value">₹{transaction.netAmount.toLocaleString()}</span>
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

export default History;
