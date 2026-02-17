import { useState, useEffect } from 'react';
import { getAuctionData } from '../../utils/localStorage';
import './History.css';
import {ArrowRightLeft, Download,ShoppingCart,HandCoins,Package, Search} from 'lucide-react';


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
        const data = getAuctionData();
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

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon"><Package /></div>
                            <div>
                                <div className="stat-value">{stats.totalQty}</div>
                                <div className="stat-label">Total Qty</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card fade-in filter-card-margin">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Search</label>
                            <div className="search-icon-container">
                                <input
                                    type="text"
                                    placeholder="Product, seller, buyer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input-wrapper"
                                />
                                <Search size={18} className="search-icon-absolute" />
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
                                        <div className="data-card-title">{transaction.product}</div>
                                        <div className="data-card-subtitle">{transaction.date}</div>
                                    </div>
                                    <div className={`badge ${
                                        transaction.paymentStatus === 'Paid' ? 'badge-success' : 
                                        transaction.paymentStatus === 'Part Paid' ? 'badge-warning' : 'badge-error'
                                    }`}>
                                        {transaction.paymentStatus || 'Completed'}
                                    </div>
                                </div>
                                
                                <div className="data-card-body">
                                    <div className="data-row">
                                        <span className="data-label">Seller</span>
                                        <span className="data-value">{transaction.seller}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Buyer</span>
                                        <span className="data-value">{transaction.buyer}</span>
                                    </div>
                                    <div className="data-row data-row-divider">
                                        <span className="data-label">Qty / Unit</span>
                                        <span className="data-value">{transaction.quantity} {transaction.unit}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Total Price</span>
                                        <span className="data-value">₹{transaction.price.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Amount Paid</span>
                                        <span className="data-value text-success">₹{(transaction.amountPaid ?? transaction.price).toLocaleString()}</span>
                                    </div>
                                    {transaction.balance > 0 && (
                                        <div className="data-row">
                                            <span className="data-label">Balance Due</span>
                                            <span className="data-value text-error font-bold">₹{transaction.balance.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="data-row data-row-divider">
                                        <span className="data-label">Commission ({transaction.commissionPercent}%)</span>
                                        <span className="data-value text-amber">₹{transaction.commission.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Seller Share</span>
                                        <span className="data-value">₹{(transaction.price - transaction.commission).toLocaleString()}</span>
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
