import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuctionData, saveAuctionData, getBuyerLedger } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import ConfirmationModal from '../Common/ConfirmationModal';
import './BuyerDetails.css';
import { Plus, Pencil, Trash2, X, ShoppingCart, Search, Eye } from 'lucide-react';
import SearchableSelect from '../Common/SearchableSelect';
import { toast } from 'react-toastify';

function BuyerDetails() {
    const [buyers, setBuyers] = useState([]);
    const [transactions, setTransactions] = useState([]);
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
        buyerType: 'Retailer'
    });

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

    const handleViewTransaction = (transaction) => {
        // Hydrate transaction with full product details
        const data = getAuctionData();
        const product = data.products.find(p => p.id === transaction.productId);

        if (product) {
             // We need to show WHICH variants were bought in this transaction.
             // The transaction object (from 'transactions' array in localStorage) typically stores:
             // - productId
             // - variantId
             // - quantity
             // - price
             // - weight
             // etc.

             // However, 'transactions' in our loadBuyers() scope are flattened.
             // Let's see how they are stored.
             // A transaction is usually 1 record per variant sold? Or 1 record per "cart checkout"?
             // Looking at typical structure: transactions = [{ id, buyerId, sellerId, productId, variantId, quantity, finalAmount, ... }]

             // If the transaction represents a single line item (one variant), we show that.
             // If we want to show "Product Details" broadly, we can fallback to the product info.

             const variant = (product.variants || []).find(v => v.id === transaction.variantId);

             setViewingTransaction({
                 ...transaction,
                 productImage: product.image,
                 productName: product.name,
                 productDate: product.date,
                 variantDetails: variant
             });
             setShowTransactionModal(true);
        }
    };

    useEffect(() => {
        loadBuyers();
        fetchStates();
    }, []);

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

    const loadBuyers = () => {
        const data = getAuctionData();
        if (data && data.buyers) {
            // Sort transactions by date desc, then id desc. Enrich with product details.
            const sortedTransactions = (data.transactions || []).map(t => {
                const product = data.products.find(p => p.id === t.productId);
                return {
                    ...t,
                    productName: product ? product.name : 'Unknown Product',
                    finalAmount: t.finalAmount || 0
                };
            }).sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return b.id - a.id;
            });
            setTransactions(sortedTransactions);

            const allPayments = data.buyerPayments || [];

            // Calculate total purchases and payments for each buyer
            const buyersWithStats = data.buyers.map(buyer => {
                const buyerTransactions = sortedTransactions.filter(t => t.buyerId === buyer.id);
                const buyerPayments = allPayments.filter(p => p.buyerId === buyer.id);

                const totalPurchases = buyerTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
                const totalPaid = buyerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                const balance = totalPurchases - totalPaid;
                const totalItems = buyerTransactions.length;

                return {
                    ...buyer,
                    totalPurchases,
                    totalItems,
                    totalPaid,
                    balance,
                    transactions: buyerTransactions,
                    payments: buyerPayments
                };
            });
            setBuyers(buyersWithStats);
            return buyersWithStats;
        }
        return [];
    };

    const handleViewBuyer = (buyer) => {
        // Re-fetch fresh data to ensure we have latest payments/transactions
        const freshBuyers = loadBuyers();
        const freshBuyer = freshBuyers.find(b => b.id === buyer.id);

        if (freshBuyer) {
            freshBuyer.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            setSelectedBuyer(freshBuyer);
            setLedger(getBuyerLedger(freshBuyer.id));
        }
    };

    const handleBackToBuyers = () => {
        setSelectedBuyer(null);
    };

    const handleToggleStatus = (id) => {
        const data = getAuctionData();
        const index = data.buyers.findIndex(b => b.id === id);
        if (index !== -1) {
            data.buyers[index].status = data.buyers[index].status === 'inactive' ? 'active' : 'inactive';
            saveAuctionData(data);
            loadBuyers();
            // Update selected buyer if modal is open
            if (selectedBuyer && selectedBuyer.id === id) {
                setSelectedBuyer({ ...selectedBuyer, status: data.buyers[index].status });
            }
        }
    };

    const handleToggleBuyerType = (id) => {
        const data = getAuctionData();
        const index = data.buyers.findIndex(b => b.id === id);
        if (index !== -1) {
            const currentType = data.buyers[index].buyerType || 'Retailer';
            data.buyers[index].buyerType = currentType === 'Retailer' ? 'Wholesale' : 'Retailer';
            saveAuctionData(data);
            loadBuyers();
            // Update selected buyer if modal is open
            if (selectedBuyer && selectedBuyer.id === id) {
                setSelectedBuyer({ ...selectedBuyer, buyerType: data.buyers[index].buyerType });
            }
        }
    };

    const handleResetPassword = (id) => {
        const newPassword = prompt('Enter new password:');
        if (newPassword) {
            const data = getAuctionData();
            const index = data.buyers.findIndex(b => b.id === id);
            if (index !== -1) {
                data.buyers[index].password = newPassword;
                saveAuctionData(data);
                alert('Password reset successfully!');
            }
        }
    };

    const handleAddBuyer = (e) => {
        e.preventDefault();
        const data = getAuctionData();

        const buyer = {
            id: Date.now(),
            ...newBuyer,
            totalPurchases: 0,
            status: 'active',
            password: '123' // Default password
        };

        data.buyers.push(buyer);
        saveAuctionData(data);

        setNewBuyer({ name: '', contact: '', address: '', state: '', city: '', email: '', buyerType: 'Retailer' });
        setCities([]);
        setShowAddModal(false);
        loadBuyers();
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [buyerToDelete, setBuyerToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setBuyerToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteBuyer = () => {
        if (buyerToDelete) {
            const data = getAuctionData();
            data.buyers = data.buyers.filter(b => b.id !== buyerToDelete);
            saveAuctionData(data);
            loadBuyers();
            setIsDeleteConfirmOpen(false);
            setBuyerToDelete(null);
        }
    };

    const handleRecordPayment = (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);

        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const data = getAuctionData();

        const newPayment = {
            id: Date.now(),
            buyerId: selectedBuyer.id,
            date: paymentDate,
            amount: amount,
            method: paymentMethod,
            note: paymentNote || 'Global Payment',
            reference: paymentConfig?.type === 'specific' 
                ? `SALE-${paymentConfig.transactionId}` 
                : `PAY-${Date.now()}`
        };

        if (!data.buyerPayments) {
            data.buyerPayments = [];
        }
        data.buyerPayments.push(newPayment);

        saveAuctionData(data);

        // Refresh data using loadBuyers and update selectedBuyer
        const updatedBuyers = loadBuyers();
        const updatedBuyer = updatedBuyers.find(b => b.id === selectedBuyer.id);

        if (updatedBuyer) {
            updatedBuyer.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            setSelectedBuyer(updatedBuyer);
            setLedger(getBuyerLedger(updatedBuyer.id));
        }

        setShowRecordPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        toast.success(`Payment of ₹${amount.toLocaleString()} recorded successfully.`);
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

    const handlePayTransaction = (transaction) => {
        setPaymentConfig({
            targetName: `${transaction.productName} (${formatDate(transaction.date)})`,
            maxAmount: transaction.calculatedBalance,
            transactionId: transaction.id,
            type: 'specific'
        });
        setPaymentAmount(transaction.calculatedBalance);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote(`Payment for ${transaction.productName}`);
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
                    <span onClick={selectedBuyer ? handleBackToBuyers : undefined} style={{ cursor: selectedBuyer ? 'pointer' : 'default', textDecoration: selectedBuyer ? 'underline' : 'none' }}>
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
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Search buyer by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="buyer-search-input"
                                        style={{ paddingRight: '40px', width: '100%' }}
                                    />
                                    <Search size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
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
                                    .filter(buyer => buyer.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(buyer => (
                                        <div key={buyer.id} className="data-card buyer-clickable-card" onClick={() => handleViewBuyer(buyer)}>
                                            <div className="data-card-header">
                                                <div>
                                                    <div className="data-card-title">{buyer.name}</div>
                                                    <div className="data-card-subtitle">{buyer.contact}</div>
                                                </div>
                                                <button className="icon-btn delete" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(buyer.id);
                                                }} title="Delete Buyer">
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="badge badge-warning buyer-type-badge-abs">
                                                    {buyer.buyerType || 'Retailer'}
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
                                                {/* <div className="data-row">
                                                    <span className="data-label">Items Purchased</span>
                                                    <span className="data-value">{buyer.totalItems || 0}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label">Total Purchases</span>
                                                    <span className="data-value text-amber">₹{(buyer.totalPurchases || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label">Balance</span>
                                                    <span className={`data-value ${buyer.balance > 0 ? 'text-error' : 'text-success'}`}>
                                                        ₹{(buyer.balance || 0).toLocaleString()}
                                                    </span>
                                                </div> */}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Detailed View */
                    <div className="fade-in">
                        <div className="card buyer-profile-container" style={{ marginBottom: '2rem' }}>
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
                                        <span className="data-label">Type</span>
                                        <span
                                            onClick={() => handleToggleBuyerType(selectedBuyer.id)}
                                            className="data-value badge badge-warning"
                                            title="Click to toggle buyer type"
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            {selectedBuyer.buyerType || 'Retailer'}
                                            <Pencil size={12} />
                                        </span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Login Access</span>
                                        <span
                                            onClick={() => handleToggleStatus(selectedBuyer.id)}
                                            className={`cursor-pointer badge btn ${selectedBuyer.status === 'inactive' ? 'btn-success' : 'btn-error'} buyer-status-toggle-btn`}
                                        >
                                            {selectedBuyer.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                        </span>
                                    </div>
                                </div>
                                {/* <div className="buyer-profile-actions">
                                    <button
                                        className={`btn ${selectedBuyer.status === 'inactive' ? 'btn-success' : 'btn-error'} status-toggle-btn`}
                                        onClick={() => handleToggleStatus(selectedBuyer.id)}
                                    >
                                        {selectedBuyer.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                    </button>
                                </div> */}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={openPaymentModal}
                                disabled={selectedBuyer.balance <= 0}
                            >
                                <Plus size={16} style={{ marginRight: '5px' }} /> Pay In
                            </button>
                        </div>

                        {/* Stats Row */}
                        {/* <div className="stats-row" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            <div className="card stat-card" style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                                <span className="data-label" style={{ marginBottom: '0.5rem' }}>Total Purchase Volume</span>
                                <span className="data-value text-amber" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{selectedBuyer.totalPurchases.toLocaleString()}</span>
                            </div>
                            <div className="card stat-card" style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                                <span className="data-label" style={{ marginBottom: '0.5rem' }}>Total Paid</span>
                                <span className="data-value text-success" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{selectedBuyer.totalPaid.toLocaleString()}</span>
                            </div>
                            <div className="card stat-card" style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                                <span className="data-label" style={{ marginBottom: '0.5rem' }}>Outstanding Balance</span>
                                <span className="data-value text-error" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{selectedBuyer.balance.toLocaleString()}</span>
                            </div>
                        </div> */}

                        <div className="buyer-history-tabs">
                            <button
                                className={`buyer-tab-button ${activeTab === 'purchases' ? 'active' : ''}`}
                                onClick={() => setActiveTab('purchases')}
                            >
                                {/* Purchase History ({selectedBuyer.transactions.length}) */}
                                Buying Products
                            </button>
                            <button
                                className={`buyer-tab-button ${activeTab === 'payments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payments')}
                            >
                                Payment History
                                {/* Payment History ({selectedBuyer.payments ? selectedBuyer.payments.length : 0}) */}
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
                                            <th>Paid</th>
                                            <th>Balance</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBuyer.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="empty-td">No purchases yet</td>
                                            </tr>
                                        ) : (
                                            (() => {
                                                // Payment Calculation Logic: Specific > FIFO
                                                
                                                // 1. Separate Specific vs General Payments
                                                const specificPayments = {}; // { transactionId: totalAmount }
                                                let generalPaymentPool = 0;

                                                (selectedBuyer.payments || []).forEach(p => {
                                                    // Check if payment mimics "SALE-<timestamp>" pattern created in TodayAuction
                                                    // format: SALE-<transactionId>
                                                    if (p.reference && p.reference.startsWith('SALE-')) {
                                                        const transId = p.reference.split('SALE-')[1]; // This is a string
                                                        // We need to match this with transaction.id which is likely a number
                                                        // Let's store it as string key
                                                        if (transId) {
                                                            specificPayments[transId] = (specificPayments[transId] || 0) + parseFloat(p.amount);
                                                        } else {
                                                             generalPaymentPool += parseFloat(p.amount);
                                                        }
                                                    } else {
                                                        generalPaymentPool += parseFloat(p.amount);
                                                    }
                                                });


                                                // 2. Clone and Sort transactions Oldest => Newest for FIFO calculation of remaining pool
                                                const sortedForCalc = [...selectedBuyer.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

                                                // 3. Calculate paid/balance per transaction
                                                const calculatedTransactions = sortedForCalc.map(t => {
                                                    const billAmount = t.finalAmount;
                                                    
                                                    // A. Apply Specific Payments first
                                                    const specificPaid = specificPayments[String(t.id)] || 0;
                                                    
                                                    // B. Apply General Pool to remainder
                                                    const remainingBill = Math.max(0, billAmount - specificPaid);
                                                    const fifoPaid = Math.min(remainingBill, generalPaymentPool);
                                                    
                                                    // C. Update Pool
                                                    generalPaymentPool = Math.max(0, generalPaymentPool - fifoPaid);

                                                    const totalPaidForThis = specificPaid + fifoPaid;
                                                    const balance = billAmount - totalPaidForThis;

                                                    return {
                                                        ...t,
                                                        calculatedPaid: totalPaidForThis,
                                                        calculatedBalance: balance
                                                    };
                                                });

                                                // 4. Sort Newest => Oldest for Display
                                                calculatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                                                return calculatedTransactions.map(t => (
                                                    <tr key={t.id}>
                                                        <td>{formatDate(t.date)}</td>
                                                        <td className="bold-product">{t.productName}</td>
                                                        <td>₹{t.finalAmount.toLocaleString()}</td>
                                                        <td className="text-success">₹{t.calculatedPaid.toLocaleString()}</td>
                                                        <td className={`text-error ${t.calculatedBalance > 0 ? 'font-bold' : ''}`}>
                                                            ₹{t.calculatedBalance.toLocaleString()}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => handleViewTransaction(t)}
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                {t.calculatedBalance > 0 && (
                                                                    <button
                                                                        className="btn btn-sm btn-primary"
                                                                        onClick={() => handlePayTransaction(t)}
                                                                        title="Pay Balance"
                                                                    >
                                                                        Pay
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()
                                        )}
                                    </tbody>
                                    {/* <tfoot>
                                        <tr>
                                            <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold' }}>Totals:</td>
                                            <td className="text-amber" style={{ fontWeight: 'bold' }}>₹{selectedBuyer.totalPurchases.toLocaleString()}</td>
                                            <td className="text-success" style={{ fontWeight: 'bold' }}>₹{selectedBuyer.totalPaid.toLocaleString()}</td>
                                            <td className="text-error" style={{ fontWeight: 'bold' }}>₹{selectedBuyer.balance.toLocaleString()}</td>
                                        </tr>
                                    </tfoot> */}
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
                                        {ledger.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="empty-td">No transactions found</td>
                                            </tr>
                                        ) : (
                                            ledger.map((entry, index) => (
                                                <tr key={index}>
                                                    <td>{formatDate(entry.date)}</td>
                                                    <td>{entry.description}</td>
                                                    <td className="text-amber">{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                                                    <td className="text-success">{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                                                    <td style={{ fontWeight: 'bold' }} className={entry.balance > 0 ? 'text-error' : 'text-success'}>
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
                                    <label className="form-label">Note</label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        placeholder="e.g. Received via..."
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



            

            {/* Transaction View Modal (Similar to SellerDetails Product View) */}
            {showTransactionModal && viewingTransaction && (
                <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setShowTransactionModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Purchase Details</h3>
                            <button className="modal-close" onClick={() => setShowTransactionModal(false)}><X /></button>
                        </div>
                        <div className="modal-body">
                            <div className="product-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="product-image-preview" style={{ flex: '0 0 150px' }}>
                                        {viewingTransaction.productImage ? (
                                            <img
                                                src={viewingTransaction.productImage}
                                                alt={viewingTransaction.productName}
                                                style={{
                                                    width: '100%',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd'
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="product-image-placeholder"
                                                style={{
                                                    width: '100%',
                                                    height: '120px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '40px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    background: '#f5f5f5'
                                                }}
                                            >
                                                📦
                                            </div>
                                        )}
                                        {viewingTransaction.productDate && (
                                            <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                                                {formatDate(viewingTransaction.productDate)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="product-info-details" style={{ flex: 1 }}>
                                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                            <div>Product: <b>{viewingTransaction.productName}</b></div>
                                            <div>Date: <b>{formatDate(viewingTransaction.date)}</b></div>
                                            <div>Total Bill: <b>₹{viewingTransaction.finalAmount?.toLocaleString()}</b></div>
                                            {/* Note: calculatedPaid/Balance are contextual to the FIFO loop, so they might not be directly available on the 'viewingTransaction' unless we passed the calculated object. The handler passed 't' which IS the calculated object from the render map! */}
                                            <div className="text-success">Paid: <b>₹{viewingTransaction.calculatedPaid?.toLocaleString()}</b></div>
                                            <div className="text-error">Balance: <b>₹{viewingTransaction.calculatedBalance?.toLocaleString()}</b></div>
                                        </div>
                                    </div>
                                </div>

                                <h4 style={{ margin: '0 0 10px 0' }}>Item Details</h4>
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
                                                            // Fallback if data structure is different
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
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Buyer</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddBuyer}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        value={newBuyer.name}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, name: e.target.value })}
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newBuyer.contact}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, contact: e.target.value })}
                                        placeholder="Mobile Number"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mail Id (Email)</label>
                                    <input
                                        type="email"
                                        value={newBuyer.email}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, email: e.target.value })}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
        </>
    );

}

export default BuyerDetails;
