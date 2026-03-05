import { useState, useEffect } from 'react';
import { getAuctionData } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import './CommissionRecord.css';
import '../TodayAuction/TodayAuction.css';
import {
    BadgeIndianRupee, ArrowRightLeft, ChartNoAxesColumn,
    Search, Filter, Calendar, Save, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { getCommission, updateCommission } from '../../api/commissionApi';

function CommissionRecord() {
    const [commissions, setCommissions] = useState([]);
    const [filteredCommissions, setFilteredCommissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [globalCommission, setGlobalCommission] = useState('');

    const { vendorId } = useSelector(state => state.vendorAuth);
    const currentVendorId = vendorId || sessionStorage.getItem('vendorId');

    const handleSaveCommission = async () => {
        if (!globalCommission && globalCommission !== 0) {
            toast.error('Please enter a commission value');
            return;
        }
        
        try {
            const res = await updateCommission(currentVendorId, globalCommission);
            if (res.success) {
                toast.success(`Global commission of ${globalCommission}% saved successfully!`);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save commission');
        }
    };

    const fetchCommission = async () => {
        if (!currentVendorId) return;
        try {
            const res = await getCommission(currentVendorId);
            if (res.success) {
                setGlobalCommission(res.data || 0);
            }
        } catch (error) {
            console.error('Error fetching commission:', error);
        }
    };

    useEffect(() => {
        loadCommissions();
        fetchCommission();
    }, [currentVendorId]);

    useEffect(() => {
        filterCommissions();
    }, [searchTerm, dateFilter, customDate, commissions]);

    const loadCommissions = () => {
        const data = getAuctionData();
        if (data && data.transactions) {
            const enriched = data.transactions.map(t => {
                const product = data.products.find(p => p.id === t.productId);
                const seller  = data.sellers.find(s => s.id === t.sellerId);
                return {
                    ...t,
                    productName:      product ? product.name : 'Unknown Product',
                    sellerName:       seller  ? seller.name  : 'Unknown Seller',
                    commissionAmount: t.commissionAmount || 0,
                    finalAmount:      t.finalAmount      || 0,
                };
            });
            setCommissions(enriched.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    };

    const getDateRange = (filter) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const next = (d) => new Date(d.getTime() + 24 * 60 * 60 * 1000);
        switch (filter) {
            case 'today':     return { start: today, end: next(today) };
            case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { start: y, end: today }; }
            case 'week':      { const w = new Date(today); w.setDate(w.getDate() - 7); return { start: w, end: next(today) }; }
            case 'month':     { const m = new Date(today); m.setDate(1); return { start: m, end: next(today) }; }
            case 'year':      return { start: new Date(today.getFullYear(), 0, 1), end: next(today) };
            case 'custom':    { const c = new Date(customDate); c.setHours(0,0,0,0); return { start: c, end: next(c) }; }
            default:          return null;
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
            const range = getDateRange(dateFilter);
            if (range) filtered = filtered.filter(c => {
                const d = new Date(c.date);
                return d >= range.start && d < range.end;
            });
        }
        setFilteredCommissions(filtered);
    };

    const getTotalCommission  = () => filteredCommissions.reduce((s, c) => s + (c.commissionAmount || 0), 0);
    const getTotalSales       = () => filteredCommissions.reduce((s, c) => s + (c.finalAmount      || 0), 0);
    const getAvgCommission    = () => filteredCommissions.length > 0
        ? Math.round(getTotalCommission() / filteredCommissions.length)
        : 0;

    return (
        <>
            {/* ── Page Header ──────────────────────────────────── */}
            <div className="content-header">
                <div className="header-top">
                    <h1>Commission</h1>

                    {/* Global Commission quick-set */}
                    <div className="cr-global-bar">
                        <span className="cr-global-label">Global&nbsp;Commission</span>
                        <div className="cr-global-input-wrap">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={globalCommission}
                                onChange={(e) => setGlobalCommission(e.target.value)}
                                className="cr-global-input"
                                placeholder="0"
                            />
                            <span className="cr-percent-badge">%</span>
                        </div>
                        <button className="btn btn-primary btn-sm cr-save-btn" onClick={handleSaveCommission}>
                            <Save size={14} />
                            Save
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

                {/* ── Summary Stats ──────────────────────────────── */}
                <div className="stats-grid fade-in">
                    <div className="stat-card cr-stat-card cr-stat-amber">
                        <div className="stat-header">
                            <div className="stat-icon cr-stat-icon-amber"><BadgeIndianRupee size={20} /></div>
                            <div>
                                <div className="stat-value">₹{(getTotalCommission() / 1000).toFixed(1)}K</div>
                                <div className="stat-label">Total Commission</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card cr-stat-card cr-stat-blue">
                        <div className="stat-header">
                            <div className="stat-icon cr-stat-icon-blue"><ArrowRightLeft size={20} /></div>
                            <div>
                                <div className="stat-value">{filteredCommissions.length}</div>
                                <div className="stat-label">Transactions</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card cr-stat-card cr-stat-green">
                        <div className="stat-header">
                            <div className="stat-icon cr-stat-icon-green"><TrendingUp size={20} /></div>
                            <div>
                                <div className="stat-value">₹{getAvgCommission().toLocaleString()}</div>
                                <div className="stat-label">Avg / Transaction</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Filters Card ───────────────────────────────── */}
                <div className="card fade-in cr-filter-card">
                    <div className="cr-filter-row">

                        {/* Search */}
                        <div className="cr-search-wrap">
                            <Search size={15} className="cr-search-icon" />
                            <input
                                type="text"
                                className="cr-search-input"
                                placeholder="Search product or seller…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Period filter */}
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

                {/* ── Commission Table ────────────────────────────── */}
                <div className="section-header cr-section-header">
                    <h3 className="section-title">Commission Details</h3>
                    <span className="cr-count-chip">{filteredCommissions.length} records</span>
                </div>

                <div className="fade-in">
                    {filteredCommissions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💰</div>
                            <p>No commission records found</p>
                        </div>
                    ) : (
                        <div className="table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper cr-table-wrapper">
                            <table className="data-table custom-data-table commission-table">
                                <thead className="bg-tertiary">
                                    <tr>
                                        <th className="custom-th">Product</th>
                                        <th className="custom-th">Seller</th>
                                        <th className="custom-th">Date</th>
                                        <th className="custom-th cr-num-col">Sale Amount</th>
                                        <th className="custom-th cr-center-col">Comm&nbsp;%</th>
                                        <th className="custom-th cr-num-col cr-highlight-col">Earned</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCommissions.map((c, idx) => (
                                        <tr key={c.id} className={`custom-tr ${idx % 2 === 0 ? 'cr-row-even' : ''}`}>
                                            <td className="custom-td">
                                                <span className="cr-product-name">{c.productName}</span>
                                            </td>
                                            <td className="custom-td">
                                                <span className="cr-seller-name">{c.sellerName}</span>
                                            </td>
                                            <td className="custom-td">
                                                <span className="cr-date-badge">{formatDate(c.date)}</span>
                                            </td>
                                            <td className="custom-td cr-num-col">
                                                <span className="cr-sale-amount">
                                                    ₹{(c.finalAmount || 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="custom-td cr-center-col">
                                                <span className="badge badge-warning cr-pct-badge">
                                                    {c.commissionPercent}%
                                                </span>
                                            </td>
                                            <td className="custom-td cr-num-col cr-highlight-col">
                                                <span className="cr-earned">
                                                    ₹{(c.commissionAmount || 0).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                {/* ── Summary footer ── */}
                                
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}

export default CommissionRecord;
