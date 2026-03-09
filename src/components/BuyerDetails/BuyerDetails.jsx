import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
    getBuyers, getBuyerSummary, addBuyer, updateBuyer, deleteBuyer, 
    addBuyerPayment
} from '../../api/buyerApi';
import { formatDate } from '../../utils/dateUtils';
import ConfirmationModal from '../Common/ConfirmationModal';
import './BuyerDetails.css';
import { Plus, Pencil, Trash2, X, ShoppingCart, Search, Eye, Download, Filter, Calendar } from 'lucide-react';
import SearchableSelect from '../Common/SearchableSelect';    
import { toast } from 'react-toastify';

function BuyerDetails() {
    const vendorIdFromRedux = useSelector((state) => state.vendorAuth?.vendorId);
    const vendorId = vendorIdFromRedux || sessionStorage.getItem('vendorId');
    const [buyers, setBuyers] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBuyer, setNewBuyer] = useState({
        name: '',
        contact: '',
        address: '',
        state: '',
        city: '',
        email: '',
    });

    // ── Edit Buyer modal ─────────────────────────────────
    const [showEditBuyerModal, setShowEditBuyerModal] = useState(false);
    const [editingBuyer, setEditingBuyer]             = useState(null);
    const [editBuyerCities, setEditBuyerCities]       = useState([]);
    const [loadingEditBuyerCities, setLoadingEditBuyerCities] = useState(false);

    // State / City for Add Buyer form
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [activeTab, setActiveTab] = useState('purchases');

    // Payment Modal State
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Transaction View Modal State
    const [viewingTransaction, setViewingTransaction] = useState(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [dateFilter, setDateFilter] = useState('today');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

    const handleViewTransaction = (transaction) => {
        const product = transaction.productId;
        if (product) {
             const variant = (product.variants || []).find(v => v._id === transaction.variantId || v.id === transaction.variantId);
             setViewingTransaction({
                 ...transaction,
                 productImage: product.image,
                 productName: product.name,
                 productDate: product.date,
                 variantDetails: variant,
                 price: transaction.rate,
                 quantity: transaction.quantity
             });
             setShowTransactionModal(true);
        }
    };

    useEffect(() => {
        if (vendorId) {
            loadBuyers();
            fetchStates();
        }
    }, [vendorId]);

    const fetchStates = async () => {
        setLoadingStates(true);
        try {
            const { data } = await axios.post('https://countriesnow.space/api/v0.1/countries/states', { country: 'India' });
            if (!data.error) setStates(data.data.states);
        } catch (err) {
            console.error('Error fetching states:', err);
        } finally {
            setLoadingStates(false);
        }
    };

    const fetchCities = async (stateName) => {
        if (!stateName) { setCities([]); return; }
        setLoadingCities(true);
        try {
            const { data } = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', { country: 'India', state: stateName });
            setCities(data.error ? [] : data.data.map(c => ({ name: c })));
        } catch (err) {
            console.error('Error fetching cities:', err);
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    const loadBuyers = async () => {
        if (!vendorId) return;
        try {
            const response = await getBuyers(vendorId);
            const buyersData = response.data || [];
            setBuyers(buyersData);
            if (selectedBuyer) {
                handleViewBuyer(selectedBuyer);
            }
        } catch (error) {
            console.error("Error loading buyers:", error);
            toast.error("Failed to load buyers");
        }
    };

    const handleViewBuyer = async (buyer) => {
        const bid = buyer._id || buyer.id;
        try {
            const response = await getBuyerSummary(bid);
            if (response.success) {
                const summaryData = response.data;
                setSelectedBuyer({
                    ...summaryData.buyer,
                    transactions: summaryData.transactions || [],
                    payments: summaryData.payments || []
                });
                setLedger(summaryData.ledger || []);
            }
        } catch (error) {
            console.error("Error fetching buyer summary:", error);
            toast.error("Failed to load buyer details");
        }
    };

    const handleBackToBuyers = () => {
        setSelectedBuyer(null);
    };

    const handleToggleStatus = async (id) => {
        const buyer = buyers.find(b => b._id === id);
        if (!buyer) return;
        try {
            const newStatus = buyer.status === 'inactive' ? 'active' : 'inactive';
            await updateBuyer(id, { status: newStatus });
            toast.success(`Buyer ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
            loadBuyers();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleAddBuyer = async (e) => {
        e.preventDefault();
        const errors = validateBuyerForm(newBuyer);
        if (Object.keys(errors).length > 0) { setBuyerFormErrors(errors); return; }
        setBuyerFormErrors({});
        try {
            await addBuyer({ vendorId, ...newBuyer, status: 'active' });
            setNewBuyer({ name: '', contact: '', address: '', state: '', city: '', email: '' });
            setCities([]);
            setShowAddModal(false);
            toast.success("Buyer added successfully");
            loadBuyers();
        } catch (error) {
            toast.error(error.message || "Failed to add buyer");
        }
    };

    const [buyerFormErrors, setBuyerFormErrors] = useState({});
    const validateBuyerForm = (data) => {
        const errors = {};
        if (!data.name?.trim())
            errors.name = 'Name is required';
        if (!data.contact?.trim())
            errors.contact = 'Contact number is required';
        else if (!/^\d{10}$/.test(data.contact.trim()))
            errors.contact = 'Contact must be exactly 10 digits';
        if (data.email?.trim() && !/^[^@]+@gmail\.com$/i.test(data.email.trim()))
            errors.email = 'Email must end with @gmail.com';
        return errors;
    };

    const openEditBuyerModal = (buyer) => {
        setEditingBuyer({ ...buyer });
        setEditBuyerCities([]);
        if (buyer.state) fetchEditBuyerCities(buyer.state);
        setShowEditBuyerModal(true);
    };

    const fetchEditBuyerCities = async (stateName) => {
        if (!stateName) { setEditBuyerCities([]); return; }
        setLoadingEditBuyerCities(true);
        try {
            const { data } = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', { country: 'India', state: stateName });
            setEditBuyerCities(data.error ? [] : data.data.map(c => ({ name: c })));
        } catch (err) {
            console.error('Error fetching edit cities:', err);
        } finally {
            setLoadingEditBuyerCities(false);
        }
    };

    const handleEditBuyer = async (e) => {
        e.preventDefault();
        if (!editingBuyer) return;
        const errors = validateBuyerForm(editingBuyer);
        if (Object.keys(errors).length > 0) { setBuyerFormErrors(errors); return; }
        setBuyerFormErrors({});
        try {
            await updateBuyer(editingBuyer._id || editingBuyer.id, {
                name:    editingBuyer.name,
                contact: editingBuyer.contact,
                email:   editingBuyer.email,
                state:   editingBuyer.state,
                city:    editingBuyer.city,
                address: editingBuyer.address,
            });
            toast.success('Buyer updated successfully!');
            setShowEditBuyerModal(false);
            setEditingBuyer(null);
            if (selectedBuyer && (selectedBuyer._id || selectedBuyer.id) === (editingBuyer._id || editingBuyer.id)) {
                setSelectedBuyer(prev => ({ ...prev, ...editingBuyer }));
            }
            loadBuyers();
        } catch (err) {
            toast.error(err?.message || 'Failed to update buyer');
        }
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [buyerToDelete, setBuyerToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setBuyerToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteBuyer = async () => {
        if (buyerToDelete) {
            try {
                await deleteBuyer(buyerToDelete);
                toast.success("Buyer deleted successfully");
                loadBuyers();
                setIsDeleteConfirmOpen(false);
                setBuyerToDelete(null);
            } catch (error) {
                toast.error("Failed to delete buyer");
            }
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        try {
            await addBuyerPayment({
                vendorId,
                buyerId: selectedBuyer._id || selectedBuyer.id,
                date: paymentDate,
                amount: amount,
                method: paymentMethod,
                note: paymentNote || 'Global Payment',
                reference: paymentConfig?.type === 'specific' 
                    ? `SALE-${paymentConfig.transactionId}` 
                    : `PAY-${Date.now()}`
            });
            loadBuyers();
            setShowRecordPaymentModal(false);
            setPaymentAmount('');
            setPaymentNote('');
            toast.success(`Payment of ₹${amount.toLocaleString()} recorded successfully.`);
        } catch (error) {
            toast.error("Failed to record payment");
        }
    };

    const openPaymentModal = () => {
        setPaymentConfig({
            targetName: selectedBuyer.name,
            maxAmount: selectedBuyer.balance,
            type: 'general'
        });
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote('');
        setShowRecordPaymentModal(true);
    };

    const getDateRange = (filter) => {
        if (filter === 'all') return null;
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
                if (!customDate) return null;
                const custom = new Date(customDate);
                custom.setHours(0, 0, 0, 0);
                return { start: custom, end: new Date(custom.getTime() + 24 * 60 * 60 * 1000) };
            default:
                return null;
        }
    };

    const isDateInRange = (dateString, range) => {
        if (!range) return true;
        if (!dateString) return false;
        const d = new Date(dateString);
        return d >= range.start && d < range.end;
    };

    const currentRange = getDateRange(dateFilter);
    const filteredTransactions = selectedBuyer?.transactions?.filter(t => isDateInRange(t.date, currentRange)) || [];
    const filteredLedger = ledger?.filter(entry => isDateInRange(entry.date, currentRange)) || [];

    const handlePayTransaction = (transaction) => {
        setPaymentConfig({
            targetName: `${transaction.productName || 'Sale'} (${formatDate(transaction.date)})`,
            maxAmount: transaction.calculatedBalance,
            transactionId: transaction._id || transaction.id,
            type: 'specific'
        });
        setPaymentAmount(transaction.calculatedBalance);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote(`Payment for transaction`);
        setShowRecordPaymentModal(true);
    };

    return (
        <>
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDeleteBuyer}
                title="Delete Buyer"
                message="Are you sure you want to delete this buyer?"
                subMessage="This action will remove the buyer and their entire purchase history."
                confirmText="Yes, Delete Buyer"
                cancelText="Cancel"
                variant="danger"
            />
            <div className="content-header">
                <div className="header-top">
                    <h1>{selectedBuyer ? 'Buyer Details' : 'Buyers'}</h1>
                    <div className="header-actions">
                        {selectedBuyer ? (
                            <button className="btn btn-secondary" onClick={handleBackToBuyers}>
                                <span>←</span> Back to List
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                <span><Plus /></span>
                                Add Buyer
                            </button>
                        )}
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span onClick={selectedBuyer ? handleBackToBuyers : undefined} className={selectedBuyer ? 'buyer-back-link' : 'buyer-back-link-static'}>
                        Buyers
                    </span>
                    {selectedBuyer && (
                        <>
                            <span className="breadcrumb-separator">/</span>
                            <span>{selectedBuyer.name}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="content-body">
                {!selectedBuyer ? (
                    <>
                        <div className="section-header">
                            <h3 className="section-title">All Buyers ({buyers.length})</h3>
                        </div>

                        <div className="card fade-in buyer-search-card">
                            <div className="form-group buyer-search-form-group">
                                <div className="search-input-wrap">
                                    <input
                                        type="text"
                                        placeholder="Search buyer by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="buyer-search-input search-input-padded"
                                    />
                                    <Search size={20} className="search-icon-pos" />
                                </div>
                            </div>
                        </div>
                        <div className="card-list fade-in">
                            {buyers.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon"><ShoppingCart /></div>
                                    <p>No buyers registered yet</p>
                                </div>
                            ) : (
                                buyers
                                    .filter(buyer => (buyer.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(buyer => (
                                        <div key={buyer._id || buyer.id} className="data-card buyer-clickable-card" onClick={() => handleViewBuyer(buyer)}>
                                            <div className="data-card-header">
                                                <div>
                                                    <div className="data-card-title">{buyer.name}</div>
                                                    <div className="data-card-subtitle">{buyer.contact}</div>
                                                </div>
                                                <div className="buyer-card-actions" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="icon-btn edit"
                                                        onClick={() => openEditBuyerModal(buyer)}
                                                        title="Edit Buyer"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        className="icon-btn delete"
                                                        onClick={() => handleDeleteClick(buyer._id || buyer.id)}
                                                        title="Delete Buyer"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="data-card-body">
                                                <div className="data-row">
                                                    <span className="data-label">Location</span>
                                                    <span className="data-value">
                                                        {[buyer.city, buyer.state].filter(Boolean).join(', ') || buyer.address || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label">Login Access</span>
                                                    <span className={`data-value badge ${buyer.status === 'inactive' ? 'badge-error' : 'badge-success'}`}>
                                                        {buyer.status === 'inactive' ? 'Disabled' : 'Enabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Detailed View */
                    <div className="fade-in">
                        <div className="card buyer-profile-container buyer-profile-mb">
                            <div className="buyer-profile-layout">
                                <div className="buyer-profile-info">
                                    <div className="data-row">
                                        <span className="data-label">Contact</span>
                                        <span className="data-value">{selectedBuyer.contact}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Email</span>
                                        <span className="data-value">{selectedBuyer.email || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">State</span>
                                        <span className="data-value">{selectedBuyer.state || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">City</span>
                                        <span className="data-value">{selectedBuyer.city || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Address</span>
                                        <span className="data-value">{selectedBuyer.address || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Login Access</span>
                                        <span
                                            onClick={() => handleToggleStatus(selectedBuyer._id || selectedBuyer.id)}
                                            className={`cursor-pointer badge btn ${selectedBuyer.status === 'inactive' ? 'btn-success' : 'btn-error'} buyer-status-toggle-btn`}
                                        >
                                            {selectedBuyer.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="buyer-profile-actions-row">
                            <div className="buyer-btn-group">
                                <button className="btn btn-secondary" onClick={() => openEditBuyerModal(selectedBuyer)}>
                                    <Pencil size={15} className="btn-icon-mr" /> Edit
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={openPaymentModal}
                                >
                                    <Plus size={16} className="btn-icon-mr" /> Pay In
                                </button>
                            </div>
                            <div className="buyer-btn-group">
                                <div className="dashboard-filter-container">
                                  <div className="filter-dropdown-wrapper">
                                    <Filter className="filter-icon" size={16} />
                                    <select
                                      value={dateFilter}
                                      onChange={(e) => setDateFilter(e.target.value)}
                                      className="dashboard-filter-select"
                                    >
                                      <option value="all">All</option>
                                      <option value="today">Today</option>
                                      <option value="yesterday">Yesterday</option>
                                      <option value="week">This Week</option>
                                      <option value="month">This Month</option>
                                      <option value="year">This Year</option>
                                      <option value="custom">Custom Date</option>
                                    </select>
                                  </div>

                                  {dateFilter === "custom" && (
                                    <div className="custom-date-wrapper fade-in">
                                      <Calendar className="calendar-icon" size={16} />
                                      <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        max={new Date().toISOString().split("T")[0]}
                                        className="dashboard-date-input"
                                      />
                                    </div>
                                  )}
                                </div>
                                <button className="btn btn-secondary" title="Download">
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="buyer-history-tabs">
                            <button
                                className={`buyer-tab-button ${activeTab === 'purchases' ? 'active' : ''}`}
                                onClick={() => setActiveTab('purchases')}
                            >
                                Buying Products
                            </button>
                            <button
                                className={`buyer-tab-button ${activeTab === 'payments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payments')}
                            >
                                Payment History
                            </button>
                        </div>

                        {activeTab === 'purchases' ? (
                            <div className="table-wrapper buyer-history-table-wrapper">
                                <table className="buyer-history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Product</th>
                                            <th>Bill Amount</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="empty-td">No purchases found for this date</td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map(t => (
                                                <tr key={t._id || t.id}>
                                                    <td>{formatDate(t.date)}</td>
                                                    <td className="bold-product">{t.productId?.name || 'Unknown'}</td>
                                                    <td>₹{(t.finalAmount || 0).toLocaleString()}</td>
                                                    <td>
                                                        <div className="buyer-card-actions-inline">
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                onClick={() => handleViewTransaction(t)}
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="table-wrapper buyer-history-table-wrapper">
                                <table className="buyer-history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Debit (Buy)</th>
                                            <th>Credit (Pay)</th>
                                            <th>Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLedger.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="empty-td">No transactions found for this date</td>
                                            </tr>
                                        ) : (
                                            [...filteredLedger].reverse().map((entry, index) => (
                                                <tr key={index}>
                                                    <td>{formatDate(entry.date)}</td>
                                                    <td>{entry.description}</td>
                                                    <td className="text-amber">{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                                                    <td className="text-success">{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                                                    <td className="table-total-bold">
                                                        {entry.balance < 0
                                                            ? `Adv: ₹${Math.abs(entry.balance).toLocaleString()}`
                                                            : `₹${entry.balance.toLocaleString()}`
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Record Payment Modal */}
            {showRecordPaymentModal && selectedBuyer && (
                <div className="modal-overlay" onClick={() => setShowRecordPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Pay In</h3>
                            <button className="modal-close" onClick={() => setShowRecordPaymentModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="modal-body">
                                <div className="data-row payment-modal-row">
                                    <span className="data-label">Buyer Name</span>
                                    <span className="data-value">{selectedBuyer.name}</span>
                                </div>
                                <div className="data-row payment-modal-row">
                                    <span className="data-label">Outstanding Balance</span>
                                    <span className="data-value text-error">₹{selectedBuyer.balance.toLocaleString()}</span>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        placeholder="e.g. Received via..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select
                                        className="form-control"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Gpay">Gpay</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        min="1"
                                        placeholder="Enter amount"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordPaymentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction View Modal */}
            {showTransactionModal && viewingTransaction && (
                <div className="modal-overlay transaction-modal-overlay" onClick={() => setShowTransactionModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Purchase Details</h3>
                            <button className="modal-close" onClick={() => setShowTransactionModal(false)}><X /></button>
                        </div>
                        <div className="modal-body">
                            <div className="product-view-container">
                                <div className="product-view-row">
                                    <div className="product-info-details">
                                        <div className="product-view-stats-grid stats-grid">
                                            <div>Product Name: <b>{viewingTransaction.productName}</b></div>
                                            <div>Date: <b>{formatDate(viewingTransaction.date)}</b></div>
                                            <div>Bill Amount: <b>₹{viewingTransaction.finalAmount?.toLocaleString()}</b></div>
                                        </div>
                                    </div>
                                </div>
                                <h4 className="product-view-variant-header">Item Details</h4>
                                <div className="table-wrapper">
                                    <table className="buyer-history-table">
                                        <thead>
                                            <tr>
                                                <th>Variety</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingTransaction.variantDetails ? (
                                                <tr>
                                                    <td>{viewingTransaction.variantDetails.variety}</td>
                                                    <td>{viewingTransaction.quantity} {viewingTransaction.variantDetails.unit}</td>
                                                    <td>₹{viewingTransaction.price}/{viewingTransaction.variantDetails.unit}</td>
                                                    <td>₹{viewingTransaction.finalAmount?.toLocaleString()}</td>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan="4">
                                                        {viewingTransaction.details ? (
                                                            <span>{viewingTransaction.details}</span>
                                                        ) : (
                                                            <span>Variant details not found (Legacy Record)</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowTransactionModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Buyer Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => { setShowAddModal(false); setBuyerFormErrors({}); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Buyer</h3>
                            <button className="modal-close" onClick={() => { setShowAddModal(false); setBuyerFormErrors({}); }}><X /></button>
                        </div>
                        <form onSubmit={handleAddBuyer}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        value={newBuyer.name}
                                        onChange={(e) => { setNewBuyer({ ...newBuyer, name: e.target.value }); setBuyerFormErrors(p => ({ ...p, name: '' })); }}
                                        placeholder="Full Name"
                                        className={buyerFormErrors.name ? 'input-error' : ''}
                                    />
                                    {buyerFormErrors.name && <small className="field-error">{buyerFormErrors.name}</small>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={newBuyer.contact}
                                        onChange={(e) => { setNewBuyer({ ...newBuyer, contact: e.target.value }); setBuyerFormErrors(p => ({ ...p, contact: '' })); }}
                                        placeholder="10-digit Mobile Number"
                                        maxLength={10}
                                        className={buyerFormErrors.contact ? 'input-error' : ''}
                                    />
                                    {buyerFormErrors.contact && <small className="field-error">{buyerFormErrors.contact}</small>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mail Id (Email) <span className="optional-label">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={newBuyer.email}
                                        onChange={(e) => { setNewBuyer({ ...newBuyer, email: e.target.value }); setBuyerFormErrors(p => ({ ...p, email: '' })); }}
                                        placeholder="example@gmail.com"
                                        className={buyerFormErrors.email ? 'input-error' : ''}
                                    />
                                    {buyerFormErrors.email && <small className="field-error">{buyerFormErrors.email}</small>}
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <SearchableSelect
                                            name="state"
                                            value={newBuyer.state}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewBuyer(prev => ({ ...prev, state: val, city: '' }));
                                                fetchCities(val);
                                            }}
                                            placeholder={loadingStates ? 'Loading...' : 'Select State'}
                                            options={states.map(s => ({ label: s.name, value: s.name }))}
                                            disabled={loadingStates}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <SearchableSelect
                                            name="city"
                                            value={newBuyer.city}
                                            onChange={(e) => setNewBuyer(prev => ({ ...prev, city: e.target.value }))}
                                            placeholder={loadingCities ? 'Loading cities...' : !newBuyer.state ? 'Select state first' : 'Select City'}
                                            options={cities.map(c => ({ label: c.name, value: c.name }))}
                                            disabled={!newBuyer.state || loadingCities}
                                            required
                                            
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={newBuyer.address}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, address: e.target.value })}
                                        rows="2"
                                        placeholder="Street / Shop / Office details"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Buyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit Buyer Modal ── */}
            {showEditBuyerModal && editingBuyer && (
                <div className="modal-overlay" onClick={() => { setShowEditBuyerModal(false); setBuyerFormErrors({}); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Buyer</h3>
                            <button className="modal-close" onClick={() => { setShowEditBuyerModal(false); setBuyerFormErrors({}); }}><X /></button>
                        </div>
                        <form onSubmit={handleEditBuyer}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        value={editingBuyer.name}
                                        onChange={(e) => { setEditingBuyer({ ...editingBuyer, name: e.target.value }); setBuyerFormErrors(p => ({ ...p, name: '' })); }}
                                        placeholder="Full Name"
                                        className={buyerFormErrors.name ? 'input-error' : ''}
                                    />
                                    {buyerFormErrors.name && <small className="field-error">{buyerFormErrors.name}</small>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number *</label>
                                    <input
                                        type="tel"
                                        value={editingBuyer.contact}
                                        onChange={(e) => { setEditingBuyer({ ...editingBuyer, contact: e.target.value }); setBuyerFormErrors(p => ({ ...p, contact: '' })); }}
                                        placeholder="10-digit Mobile Number"
                                        maxLength={10}
                                        className={buyerFormErrors.contact ? 'input-error' : ''}
                                    />
                                    {buyerFormErrors.contact && <small className="field-error">{buyerFormErrors.contact}</small>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email <span className="optional-label">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={editingBuyer.email || ''}
                                        onChange={(e) => { setEditingBuyer({ ...editingBuyer, email: e.target.value }); setBuyerFormErrors(p => ({ ...p, email: '' })); }}
                                        placeholder="example@gmail.com"
                                        className={buyerFormErrors.email ? 'input-error' : ''}
                                    />
                                    {buyerFormErrors.email && <small className="field-error">{buyerFormErrors.email}</small>}
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <SearchableSelect
                                            name="state"
                                            value={editingBuyer.state || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setEditingBuyer(prev => ({ ...prev, state: val, city: '' }));
                                                fetchEditBuyerCities(val);
                                            }}
                                            placeholder={loadingStates ? 'Loading...' : 'Select State'}
                                            options={states.map(s => ({ label: s.name, value: s.name }))}
                                            disabled={loadingStates}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <SearchableSelect
                                            name="city"
                                            value={editingBuyer.city || ''}
                                            onChange={(e) => setEditingBuyer(prev => ({ ...prev, city: e.target.value }))}
                                            placeholder={loadingEditBuyerCities ? 'Loading cities...' : !editingBuyer.state ? 'Select state first' : 'Select City'}
                                            options={editBuyerCities.map(c => ({ label: c.name, value: c.name }))}
                                            disabled={!editingBuyer.state || loadingEditBuyerCities}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={editingBuyer.address || ''}
                                        onChange={(e) => setEditingBuyer({ ...editingBuyer, address: e.target.value })}
                                        rows="2"
                                        placeholder="Street / Shop / Office details"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditBuyerModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default BuyerDetails;