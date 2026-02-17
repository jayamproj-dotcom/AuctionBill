import { useState, useEffect } from 'react';
import { getAuctionData } from '../../utils/localStorage';
import './History.css';
import { ArrowRightLeft, Download, ShoppingCart, HandCoins, Package } from 'lucide-react';


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

    const filterTransactions = () => {
        let filtered = [...transactions];

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFilter) {
            filtered = filtered.filter(t => t.date === dateFilter);
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
                                        <div className="data-card-title">{transaction.productName}</div>
                                        <div className="data-card-subtitle">{transaction.date}</div>
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
