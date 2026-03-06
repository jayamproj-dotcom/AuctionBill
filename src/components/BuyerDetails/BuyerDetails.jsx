import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
    getBuyers, addBuyer, updateBuyer, deleteBuyer, 
    getTransactions, getBuyerPayments, addBuyerPayment,
    getAuctionProducts
} from '../../api/auctionApi';
import { formatDate } from '../../utils/dateUtils';
import ConfirmationModal from '../Common/ConfirmationModal';
import './BuyerDetails.css';
import { Plus, Pencil, Trash2, X, ShoppingCart, Search, Eye } from 'lucide-react';
import SearchableSelect from '../Common/SearchableSelect';
import { toast } from 'react-toastify';

function BuyerDetails() {
    const vendorIdFromRedux = useSelector((state) => state.vendorAuth?.vendorId);
    const vendorId = vendorIdFromRedux || sessionStorage.getItem('vendorId');
    const [buyers, setBuyers] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [allAuctionProducts, setAllAuctionProducts] = useState([]);
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

    const handleViewTransaction = (transaction) => {
        const product = allAuctionProducts.find(p => p._id === transaction.productId);

        if (product) {
             const variant = (product.variants || []).find(v => v._id === transaction.variantId);

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
            const [buyersRes, transRes, paymentsRes, productsRes] = await Promise.all([
                getBuyers(vendorId),
                getTransactions(vendorId),
                getBuyerPayments(vendorId),
                getAuctionProducts(vendorId)
            ]);

            const buyersData = buyersRes.data || [];
            const transData = transRes.data || [];
            const paymentsData = paymentsRes.data || [];
            const productsData = productsRes.data || [];

            setAllTransactions(transData);
            setAllPayments(paymentsData);
            setAllAuctionProducts(productsData);

            const buyersWithStats = buyersData.map(buyer => {
                const buyerTransactions = transData.filter(t => t.buyerId === buyer._id);
                const buyerPayments = paymentsData.filter(p => p.buyerId === buyer._id);

                const totalPurchases = buyerTransactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
                const totalPaid = buyerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                const balance = totalPurchases - totalPaid;

                return {
                    ...buyer,
                    totalPurchases,
                    totalItems: buyerTransactions.length,
                    totalPaid,
                    balance,
                    transactions: buyerTransactions,
                    payments: buyerPayments
                };
            });

            setBuyers(buyersWithStats);
            
            // If a buyer is currently selected, update their data
            if (selectedBuyer) {
                const updatedSelectedBuyer = buyersWithStats.find(b => b._id === (selectedBuyer._id || selectedBuyer.id));
                if (updatedSelectedBuyer) {
                    setSelectedBuyer(updatedSelectedBuyer);
                    calculateLedger(updatedSelectedBuyer, productsData);
                }
            }
        } catch (error) {
            console.error("Error loading buyers:", error);
            toast.error("Failed to load buyers");
        }
    };

    const calculateLedger = (buyer, products) => {
        let entries = [];
        
        (buyer.transactions || []).forEach(t => {
            const product = products.find(p => p._id === t.productId);
            entries.push({
                date: t.date,
                description: `Purchase - ${product ? product.name : 'Unknown'}`,
                debit: t.finalAmount,
                credit: 0
            });
        });

        (buyer.payments || []).forEach(p => {
            entries.push({
                date: p.date,
                description: p.note || 'Payment',
                debit: 0,
                credit: p.amount
            });
        });

        entries.sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;
        const finalLedger = entries.map(entry => {
            balance += (entry.debit || 0);
            balance -= (entry.credit || 0);
            return { ...entry, balance };
        });

        setLedger(finalLedger.reverse()); // Show newest first
    };

    const handleViewBuyer = (buyer) => {
        setSelectedBuyer(buyer);
        calculateLedger(buyer, allAuctionProducts);
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

    const handleResetPassword = async (id) => {
        const newPassword = prompt('Enter new password:');
        if (newPassword) {
            try {
                await updateBuyer(id, { password: newPassword });
                toast.success('Password reset successfully!');
            } catch (error) {
                toast.error("Failed to reset password");
            }
        }
    };

    const handleAddBuyer = async (e) => {
        e.preventDefault();
        try {
            await addBuyer({
                vendorId,
                ...newBuyer,
                status: 'active'
            });

            setNewBuyer({ name: '', contact: '', address: '', state: '', city: '', email: '' });
            setCities([]);
            setShowAddModal(false);
            toast.success("Buyer added successfully");
            loadBuyers();
        } catch (error) {
            toast.error(error.message || "Failed to add buyer");
        }
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
                                    .filter(buyer => (buyer.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(buyer => (
                                        <div key={buyer._id || buyer.id} className="data-card buyer-clickable-card" onClick={() => handleViewBuyer(buyer)}>
                                            <div className="data-card-header">
                                                <div>
                                                    <div className="data-card-title">{buyer.name}</div>
                                                    <div className="data-card-subtitle">{buyer.contact}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
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
                                        <span className="data-label">Login Access</span>
                                        <span
                                            onClick={() => handleToggleStatus(selectedBuyer._id || selectedBuyer.id)}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <button className="btn btn-secondary" onClick={() => openEditBuyerModal(selectedBuyer)}>
                                <Pencil size={15} style={{ marginRight: '5px' }} /> Edit
                            </button>
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

                                                return calculatedTransactions.map(t => {
                                                    const product = allAuctionProducts.find(p => p._id === t.productId);
                                                    return (
                                                        <tr key={t._id || t.id}>
                                                            <td>{formatDate(t.date)}</td>
                                                            <td className="bold-product">{product ? product.name : 'Unknown'}</td>
                                                            <td>₹{(t.finalAmount || 0).toLocaleString()}</td>
                                                            <td className="text-success">₹{(t.calculatedPaid || 0).toLocaleString()}</td>
                                                            <td className={`text-error ${(t.calculatedBalance || 0) > 0 ? 'font-bold' : ''}`}>
                                                                ₹{(t.calculatedBalance || 0).toLocaleString()}
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
                                                    );
                                                });
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

            {/* ── Edit Buyer Modal ── */}
            {showEditBuyerModal && editingBuyer && (
                <div className="modal-overlay" onClick={() => setShowEditBuyerModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Buyer</h3>
                            <button className="modal-close" onClick={() => setShowEditBuyerModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleEditBuyer}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        value={editingBuyer.name}
                                        onChange={(e) => setEditingBuyer({ ...editingBuyer, name: e.target.value })}
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number *</label>
                                    <input
                                        type="tel"
                                        value={editingBuyer.contact}
                                        onChange={(e) => setEditingBuyer({ ...editingBuyer, contact: e.target.value })}
                                        placeholder="Mobile Number"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        value={editingBuyer.email || ''}
                                        onChange={(e) => setEditingBuyer({ ...editingBuyer, email: e.target.value })}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
