import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { formatDate } from '../../utils/dateUtils';
import ConfirmationModal from '../Common/ConfirmationModal';
import './SellerDetails.css';
import { Plus, Trash2, X, Eye, Search, Loader, Pencil } from 'lucide-react';
import SearchableSelect from '../Common/SearchableSelect';
import { toast } from 'react-toastify';
import {
    getSellers,
    createSeller,
    updateSeller,
    deleteSeller,
    toggleSellerStatus,
    recordSellerPayment,
    getSellerPayments,
} from '../../api/sellerApi';
import { getAuctionData, getSellerLedger } from '../../utils/localStorage';

function SellerDetails() {
    // ── Auth ─────────────────────────────────────────────
    const { vendorId } = useSelector((state) => state.vendorAuth);
    const currentVendorId = vendorId || sessionStorage.getItem('vendorId');

    // ── Sellers list ──────────────────────────────────────
    const [sellers, setSellers]           = useState([]);
    const [loading, setLoading]           = useState(false);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [ledger, setLedger]             = useState([]);
    const [searchQuery, setSearchQuery]   = useState('');
    const [activeTab, setActiveTab]       = useState('products');

    // ── Add Seller modal ──────────────────────────────────
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving]         = useState(false);
    const [newSeller, setNewSeller]       = useState({
        name: '', contact: '', address: '', state: '', city: '', email: '',
    });

    // ── Edit Seller modal ─────────────────────────────────
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSeller, setEditingSeller] = useState(null);
    const [editCities, setEditCities]       = useState([]);
    const [loadingEditCities, setLoadingEditCities] = useState(false);

    // ── State / City (countriesnow) ───────────────────────
    const [states, setStates]             = useState([]);
    const [cities, setCities]             = useState([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // ── Delete confirm ───────────────────────────────────
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [sellerToDelete, setSellerToDelete]           = useState(null);
    const [isDeleting, setIsDeleting]                   = useState(false);

    // ── Payment modal ─────────────────────────────────────
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate]     = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentNote, setPaymentNote]     = useState('');
    const [isPaymentSaving, setIsPaymentSaving] = useState(false);

    // ── Product view modal ────────────────────────────────
    const [viewingProduct, setViewingProduct]           = useState(null);
    const [showProductViewModal, setShowProductViewModal] = useState(false);

    // ─────────────────────────────────────────────────────
    //  Init
    // ─────────────────────────────────────────────────────
    useEffect(() => {
        if (currentVendorId) loadSellers();
        fetchStates();
    }, [currentVendorId]);

    // ─────────────────────────────────────────────────────
    //  State / City API
    // ─────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────
    //  Load Sellers from DB + merge local transaction stats
    // ─────────────────────────────────────────────────────
    const loadSellers = async () => {
        setLoading(true);
        try {
            const res = await getSellers(currentVendorId);
            const rawSellers = res.data || res.sellers || [];

            // Merge with local auction data for transaction/payment stats
            const localData   = getAuctionData();
            const allProducts = localData?.products     || [];
            const allTxns     = localData?.transactions || [];
            const allPayments = localData?.sellerPayments || [];
            const allCredits  = localData?.sellerCredits  || [];

            const enriched = rawSellers.map(seller => {
                const sid = seller._id || seller.id;
                const sellerProducts    = allProducts.filter(p => p.sellerId === sid);
                const sellerTransactions = allTxns.filter(t  => t.sellerId  === sid);
                const sellerPayments    = allPayments.filter(p => p.sellerId === sid);
                const sellerCredits     = allCredits.filter(c  => c.sellerId === sid);

                const totalGrossSales = sellerTransactions.reduce((s, t) => s + (t.finalAmount    || 0), 0);
                const totalCommission = sellerTransactions.reduce((s, t) => s + (t.commissionAmount || 0), 0);
                const totalNetSales   = sellerTransactions.reduce((s, t) => s + (t.netAmount       || 0), 0);
                const totalPaid       = sellerPayments.reduce((s, p)    => s + (p.amount           || 0), 0);
                const totalCredit     = sellerCredits.reduce((s, c)     => s + (c.amount           || 0), 0);
                const balance         = totalNetSales - totalPaid - totalCredit;

                return {
                    ...seller,
                    id: sid,   // normalise id
                    totalItems: sellerProducts.length,
                    totalSales: totalNetSales,
                    totalGrossSales,
                    totalCommission,
                    totalCredit,
                    totalPaid,
                    balance,
                    products:     sellerProducts,
                    transactions: sellerTransactions,
                    payments:     sellerPayments,
                    credits:      sellerCredits,
                };
            });

            setSellers(enriched);
        } catch (err) {
            console.error('Error loading sellers:', err);
            toast.error(err?.message || 'Failed to load sellers');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────
    //  Open seller detail view
    // ─────────────────────────────────────────────────────
    const openDetailsModal = (seller) => {
        const localData     = getAuctionData();
        const sellerProducts = (localData?.products || [])
            .filter(p => p.sellerId === seller.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        setSelectedSeller({ ...seller, products: sellerProducts });
        setLedger(getSellerLedger(seller.id));
        setActiveTab('products');
    };

    const handleBackToSellers = () => setSelectedSeller(null);

    // ─────────────────────────────────────────────────────
    //  Add Seller
    // ─────────────────────────────────────────────────────
    const handleAddSeller = async (e) => {
        e.preventDefault();
        if (!currentVendorId) { toast.error('Vendor not authenticated'); return; }
        setIsSaving(true);
        try {
            const payload = {
                ...newSeller,
                vendorId: currentVendorId,
            };
            await createSeller(payload);
            toast.success('Seller added successfully!');
            setNewSeller({ name: '', contact: '', address: '', state: '', city: '', email: '' });
            setCities([]);
            setShowAddModal(false);
            loadSellers();
        } catch (err) {
            toast.error(err?.message || 'Failed to add seller');
        } finally {
            setIsSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────
    //  Edit Seller
    // ─────────────────────────────────────────────────────
    const openEditModal = (seller) => {
        setEditingSeller({ ...seller });
        setEditCities([]);
        if (seller.state) fetchEditCities(seller.state);
        setShowEditModal(true);
    };

    const fetchEditCities = async (stateName) => {
        if (!stateName) { setEditCities([]); return; }
        setLoadingEditCities(true);
        try {
            const { data } = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', { country: 'India', state: stateName });
            setEditCities(data.error ? [] : data.data.map(c => ({ name: c })));
        } catch (err) {
            console.error('Error fetching edit cities:', err);
        } finally {
            setLoadingEditCities(false);
        }
    };

    const handleEditSeller = async (e) => {
        e.preventDefault();
        if (!editingSeller) return;
        setIsSaving(true);
        try {
            await updateSeller(editingSeller._id || editingSeller.id, {
                name:    editingSeller.name,
                contact: editingSeller.contact,
                email:   editingSeller.email,
                state:   editingSeller.state,
                city:    editingSeller.city,
                address: editingSeller.address,
            });
            toast.success('Seller updated successfully!');
            setShowEditModal(false);
            setEditingSeller(null);
            // If we were viewing the seller, refresh it
            if (selectedSeller && (selectedSeller._id || selectedSeller.id) === (editingSeller._id || editingSeller.id)) {
                setSelectedSeller(prev => ({ ...prev, ...editingSeller }));
            }
            loadSellers();
        } catch (err) {
            toast.error(err?.message || 'Failed to update seller');
        } finally {
            setIsSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────
    //  Delete Seller
    // ─────────────────────────────────────────────────────
    const handleDeleteClick = (seller) => {
        setSellerToDelete(seller);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteSeller = async () => {
        if (!sellerToDelete) return;
        setIsDeleting(true);
        try {
            await deleteSeller(sellerToDelete._id || sellerToDelete.id);
            toast.success('Seller deleted successfully');
            setIsDeleteConfirmOpen(false);
            setSellerToDelete(null);
            loadSellers();
        } catch (err) {
            toast.error(err?.message || 'Failed to delete seller');
        } finally {
            setIsDeleting(false);
        }
    };

    // ─────────────────────────────────────────────────────
    //  Toggle Status
    // ─────────────────────────────────────────────────────
    const handleToggleStatus = async (id) => {
        const seller = sellers.find(s => s.id === id) || selectedSeller;
        if (!seller) return;
        const newStatus = seller.status === 'inactive' ? 'active' : 'inactive';
        try {
            await toggleSellerStatus(id, newStatus);
            toast.success(`Login ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
            if (selectedSeller?.id === id) {
                setSelectedSeller(prev => ({ ...prev, status: newStatus }));
            }
            loadSellers();
        } catch (err) {
            toast.error(err?.message || 'Failed to update status');
        }
    };

    // ─────────────────────────────────────────────────────
    //  Payment modal helpers
    // ─────────────────────────────────────────────────────
    const openGlobalPaymentModal = () => {
        setPaymentConfig({ type: 'global', targetName: 'Global Account', maxAmount: selectedSeller.balance });
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote('');
        setShowRecordPaymentModal(true);
    };

    const openProductPaymentModal = (product) => {
        const pTransactions = (selectedSeller.transactions || []).filter(t => t.productId === product.id);
        const totalNet  = pTransactions.reduce((s, t) => s + (Number(t.netAmount) || 0), 0);
        const pPayments = (selectedSeller.payments || []).filter(p => p.productId === product.id);
        const totalPaid = pPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const balance   = totalNet - totalPaid;

        setPaymentConfig({ type: 'product', targetId: product.id, targetName: product.name, maxAmount: Math.max(0, balance) });
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote(`Payment for ${product.name}`);
        setShowRecordPaymentModal(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) { toast.error('Please enter a valid amount.'); return; }
        if (paymentConfig?.type === 'product' && paymentConfig.maxAmount !== undefined && amount > paymentConfig.maxAmount) {
            toast.error(`Payment cannot exceed ₹${paymentConfig.maxAmount.toLocaleString()}`);
            return;
        }

        setIsPaymentSaving(true);
        try {
            const payload = {
                vendorId:  currentVendorId,
                sellerId:  selectedSeller._id || selectedSeller.id,
                productId: paymentConfig.type === 'product' ? paymentConfig.targetId : null,
                date:      paymentDate,
                amount,
                method:    paymentMethod,
                type:      paymentConfig.type === 'product' ? 'Sale' : 'Payment',
                note:      paymentNote || (paymentConfig.type === 'product' ? `Payment for ${paymentConfig.targetName}` : 'Global Payment'),
                reference: `PAY-${Date.now()}`,
            };

            await recordSellerPayment(payload);
            toast.success(`Payment of ₹${amount.toLocaleString()} recorded successfully.`);
            setShowRecordPaymentModal(false);
            setPaymentAmount('');
            setPaymentNote('');
            setPaymentConfig(null);
            // Refresh seller data
            await loadSellers();
            // Re-open detail view with fresh data
            const updated = sellers.find(s => s.id === (selectedSeller._id || selectedSeller.id));
            if (updated) setSelectedSeller({ ...updated, products: selectedSeller.products });
            setLedger(getSellerLedger(selectedSeller._id || selectedSeller.id));
        } catch (err) {
            toast.error(err?.message || 'Failed to record payment');
        } finally {
            setIsPaymentSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────
    //  Product View
    // ─────────────────────────────────────────────────────
    const handleViewProduct = (productId) => {
        const product = selectedSeller.products.find(p => p.id === productId);
        if (!product) return;

        const relatedTxns   = (selectedSeller.transactions || []).filter(t => t.productId === productId);
        const variantsWithStats = (product.variants || []).map(variant => {
            const vt = relatedTxns.filter(t => t.variantId === variant.id);
            return {
                ...variant,
                sellQuantity: vt.reduce((s, t) => s + (Number(t.quantity) || 0), 0),
                stats: {
                    price:      vt.reduce((s, t) => s + (t.finalAmount      || 0), 0),
                    commission: vt.reduce((s, t) => s + (t.commissionAmount  || 0), 0),
                    net:        vt.reduce((s, t) => s + (t.netAmount         || 0), 0),
                },
            };
        });

        const totalSales      = relatedTxns.reduce((s, t) => s + (t.finalAmount      || 0), 0);
        const totalCommission = relatedTxns.reduce((s, t) => s + (t.commissionAmount  || 0), 0);
        const totalNet        = relatedTxns.reduce((s, t) => s + (t.netAmount         || 0), 0);
        const pPayments       = (selectedSeller.payments || []).filter(p => p.productId === productId);
        const totalPaid       = pPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

        setViewingProduct({
            ...product,
            variants: variantsWithStats,
            stats: { price: totalSales, commission: totalCommission, net: totalNet, paid: totalPaid, balance: totalNet - totalPaid },
            relatedTransactions: relatedTxns,
        });
        setShowProductViewModal(true);
    };

    // ─────────────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────────────
    return (
        <>
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDeleteSeller}
                title="Delete Seller"
                message="Are you sure you want to delete this seller?"
                subMessage="This action will remove the seller and their history."
                confirmText="Yes, Delete Seller"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* ── Page Header ── */}
            <div className="content-header">
                <div className="header-top">
                    <h1>{selectedSeller ? 'Seller Details' : 'Sellers'}</h1>
                    <div className="header-actions">
                        {selectedSeller ? (
                            <button className="btn btn-secondary" onClick={handleBackToSellers}>
                                <span>←</span> Back to List
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                <span><Plus /></span>
                                Add Seller
                            </button>
                        )}
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span
                        onClick={selectedSeller ? handleBackToSellers : undefined}
                        style={{ cursor: selectedSeller ? 'pointer' : 'default', textDecoration: selectedSeller ? 'underline' : 'none' }}
                    >
                        Sellers
                    </span>
                    {selectedSeller && (
                        <>
                            <span className="breadcrumb-separator">/</span>
                            <span>{selectedSeller.name}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="content-body">
                {!selectedSeller ? (
                    <>
                        <div className="section-header">
                            <h3 className="section-title">All Sellers ({sellers.length})</h3>
                        </div>

                        {/* Search */}
                        <div className="card fade-in search-card">
                            <div className="form-group search-form-group">
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Search seller by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                        style={{ paddingRight: '40px', width: '100%' }}
                                    />
                                    <Search size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                </div>
                            </div>
                        </div>

                        {/* Seller Cards */}
                        <div className="card-list fade-in">
                            {loading ? (
                                <div className="empty-state">
                                    <Loader size={32} className="spin" />
                                    <p>Loading sellers...</p>
                                </div>
                            ) : sellers.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👤</div>
                                    <p>No sellers registered yet</p>
                                </div>
                            ) : (
                                sellers
                                    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(seller => (
                                        <div key={seller.id} className="data-card clickable-card" onClick={() => openDetailsModal(seller)}>
                                            <div className="data-card-header">
                                                <div>
                                                    <div className="data-card-title">{seller.name}</div>
                                                    <div className="data-card-subtitle">{seller.contact}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="icon-btn edit"
                                                        onClick={() => openEditModal(seller)}
                                                        title="Edit Seller"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        className="icon-btn delete"
                                                        onClick={() => handleDeleteClick(seller)}
                                                        title="Delete Seller"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="data-card-body">
                                                <div className="data-row">
                                                    <span className="data-label">Location</span>
                                                    <span className="data-value">
                                                        {[seller.city, seller.state].filter(Boolean).join(', ') || seller.address || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label">Vendor ID</span>
                                                    <span className="data-value" style={{ fontFamily: 'monospace', fontSize: '0.78rem', opacity: 0.7 }}>
                                                        {seller.vendorId || currentVendorId}
                                                    </span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label">Login Access</span>
                                                    <span className={`data-value badge ${seller.status === 'inactive' ? 'badge-error' : 'badge-success'}`}>
                                                        {seller.status === 'inactive' ? 'Disabled' : 'Enabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Detail View */
                    <div className="fade-in">
                        <div className="card profile-container" style={{ marginBottom: '2rem' }}>
                            <div className="profile-layout">
                                <div className="profile-info">
                                  
                                    <div className="data-row">
                                        <span className="data-label">Contact</span>
                                        <span className="data-value">{selectedSeller.contact}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Mail Id</span>
                                        <span className="data-value">{selectedSeller.email || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">State</span>
                                        <span className="data-value">{selectedSeller.state || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">City</span>
                                        <span className="data-value">{selectedSeller.city || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Address</span>
                                        <span className="data-value">{selectedSeller.address || 'N/A'}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Login Access</span>
                                        <span
                                            onClick={() => handleToggleStatus(selectedSeller.id)}
                                            className={`cursor-pointer badge btn ${selectedSeller.status === 'inactive' ? 'btn-success' : 'btn-error'} status-toggle-btn`}
                                        >
                                            {selectedSeller.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => openEditModal(selectedSeller)}>
                                <Pencil size={15} style={{ marginRight: '5px' }} /> Edit
                            </button>
                            <button className="btn btn-primary" onClick={openGlobalPaymentModal}>
                                <Plus size={16} style={{ marginRight: '5px' }} /> Pay Out
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="history-tabs">
                            <button className={`tab-button ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                                Selling Products
                            </button>
                            <button className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
                                Payments History
                            </button>
                        </div>

                        {activeTab === 'products' ? (
                            <div className="table-wrapper history-table-wrapper">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Product</th>
                                            <th>Sales (Net)</th>
                                            <th>Paid</th>
                                            <th>Balance</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!selectedSeller.products || selectedSeller.products.length === 0) ? (
                                            <tr><td colSpan="6" className="empty-td">No items submitted yet</td></tr>
                                        ) : (
                                            (() => {
                                                const sellerTotalNet  = (selectedSeller.transactions || []).reduce((s, t) => s + (Number(t.netAmount) || 0), 0);
                                                const sellerTotalPaid = (selectedSeller.payments    || []).reduce((s, p) => s + (Number(p.amount)   || 0), 0);
                                                const sellerCredits   = (selectedSeller.credits     || []).reduce((s, c) => s + (Number(c.amount)   || 0), 0);
                                                const sellerBalance   = sellerTotalNet - sellerTotalPaid - sellerCredits;
                                                let remainingAdvance  = sellerBalance < 0 ? Math.abs(sellerBalance) : 0;

                                                return selectedSeller.products.map(p => {
                                                    const pTxns    = (selectedSeller.transactions || []).filter(t => t.productId === p.id);
                                                    const totalNet = pTxns.reduce((s, t) => s + (Number(t.netAmount) || 0), 0);
                                                    const pPmts    = (selectedSeller.payments    || []).filter(pm => pm.productId === p.id);
                                                    let totalPaid  = pPmts.reduce((s, pm) => s + (Number(pm.amount) || 0), 0);
                                                    let totalBal   = totalNet - totalPaid;

                                                    if (remainingAdvance > 0 && totalBal > 0) {
                                                        const used = Math.min(remainingAdvance, totalBal);
                                                        totalPaid       += used;
                                                        totalBal        -= used;
                                                        remainingAdvance -= used;
                                                    }

                                                    return (
                                                        <tr key={p.id}>
                                                            <td>{formatDate(p.date)}</td>
                                                            <td className="product-name-bold">{p.name}</td>
                                                            <td>₹{totalNet.toLocaleString()}</td>
                                                            <td className="text-success">₹{totalPaid.toLocaleString()}</td>
                                                            <td className={`text-error ${totalBal > 0 ? 'font-bold' : ''}`}>
                                                                ₹{Math.max(0, totalBal).toLocaleString()}
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                    <button className="btn btn-sm btn-info" onClick={() => handleViewProduct(p.id)} title="View">
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    {totalBal > 0 && (
                                                                        <button className="btn btn-sm btn-primary" onClick={() => openProductPaymentModal(p)} title="Pay">
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
                                </table>
                            </div>
                        ) : (
                            <div className="payment-history-section">
                                <div className="table-wrapper history-table-wrapper">
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Credit (Sale)</th>
                                                <th>Debit (Pay)</th>
                                                <th>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledger.length === 0 ? (
                                                <tr><td colSpan="5" className="empty-td">No transactions found</td></tr>
                                            ) : (
                                                ledger.map((entry, idx) => (
                                                    <tr key={idx}>
                                                        <td>{formatDate(entry.date)}</td>
                                                        <td>{entry.description}</td>
                                                        <td className="text-success">{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                                                        <td className="text-error">{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                                                        <td style={{ fontWeight: 'bold' }} className={entry.balance < 0 ? 'text-success' : ''}>
                                                            {entry.balance < 0 ? `Advance ₹${Math.abs(entry.balance).toLocaleString()}` : `₹${entry.balance.toLocaleString()}`}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Edit Seller Modal ── */}
            {showEditModal && editingSeller && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Seller</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleEditSeller}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        value={editingSeller.name}
                                        onChange={(e) => setEditingSeller({ ...editingSeller, name: e.target.value })}
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number *</label>
                                    <input
                                        type="tel"
                                        value={editingSeller.contact}
                                        onChange={(e) => setEditingSeller({ ...editingSeller, contact: e.target.value })}
                                        placeholder="Mobile Number"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mail Id (Email)</label>
                                    <input
                                        type="email"
                                        value={editingSeller.email || ''}
                                        onChange={(e) => setEditingSeller({ ...editingSeller, email: e.target.value })}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <SearchableSelect
                                            name="state"
                                            value={editingSeller.state || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setEditingSeller(prev => ({ ...prev, state: val, city: '' }));
                                                fetchEditCities(val);
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
                                            value={editingSeller.city || ''}
                                            onChange={(e) => setEditingSeller(prev => ({ ...prev, city: e.target.value }))}
                                            placeholder={loadingEditCities ? 'Loading cities...' : !editingSeller.state ? 'Select state first' : 'Select City'}
                                            options={editCities.map(c => ({ label: c.name, value: c.name }))}
                                            disabled={!editingSeller.state || loadingEditCities}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={editingSeller.address || ''}
                                        onChange={(e) => setEditingSeller({ ...editingSeller, address: e.target.value })}
                                        rows="2"
                                        placeholder="Street / Village / District details"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                    {isSaving ? <><Loader size={14} className="spin" /> Saving...</> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Product View Modal ── */}
            {showProductViewModal && viewingProduct && (
                <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setShowProductViewModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Product Details ({viewingProduct.name})</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {viewingProduct.stats.balance > 0 && (
                                    <div className="badge badge-error">Total Due: ₹{viewingProduct.stats.balance}</div>
                                )}
                                <button className="modal-close" onClick={() => setShowProductViewModal(false)}><X /></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="product-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="product-image-preview" style={{ flex: '0 0 150px' }}>
                                        {viewingProduct.image ? (
                                            <img src={viewingProduct.image} alt={viewingProduct.name} style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        ) : (
                                            <div className="product-image-placeholder" style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', border: '1px solid #ddd', borderRadius: '8px', background: '#f5f5f5' }}>📦</div>
                                        )}
                                        <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>{formatDate(viewingProduct.date)}</div>
                                    </div>
                                    <div className="product-info-details" style={{ flex: 1 }}>
                                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                            <div>Total Sales: <b>₹{viewingProduct.stats.price.toLocaleString()}</b></div>
                                            <div>Commission: <b>₹{viewingProduct.stats.commission.toLocaleString()}</b></div>
                                            <div className="text-success">Total Paid: <b>₹{viewingProduct.stats.paid.toLocaleString()}</b></div>
                                            <div className="text-error">Total Balance: <b>₹{viewingProduct.stats.balance.toLocaleString()}</b></div>
                                        </div>
                                    </div>
                                </div>
                                <h4 style={{ margin: '0 0 10px 0' }}>Variant Details</h4>
                                <div className="table-wrapper">
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Variety</th><th>Qty</th><th>Sold Qty</th><th>Sales</th><th>Comm.</th><th>Net Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingProduct.variants.map((v, idx) => (
                                                <tr key={idx}>
                                                    <td>{v.variety}</td>
                                                    <td>{v.quantity} {v.unit}</td>
                                                    <td>{v.sellQuantity || 0} {v.unit}</td>
                                                    <td>₹{(v.stats?.price || 0).toLocaleString()}</td>
                                                    <td>₹{(v.stats?.commission || 0).toLocaleString()}</td>
                                                    <td className="text-success" style={{ fontWeight: 'bold' }}>₹{(v.stats?.net || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {viewingProduct.variants.length === 0 && (
                                                <tr><td colSpan="6" className="text-center">No variants found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            {viewingProduct.stats.balance > 0 && (
                                <button className="btn btn-primary" onClick={() => openProductPaymentModal(viewingProduct)}>Pay Total Balance</button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setShowProductViewModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Payment Modal ── */}
            {showRecordPaymentModal && selectedSeller && (
                <div className="modal-overlay" onClick={() => setShowRecordPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Pay Out</h3>
                            <button className="modal-close" onClick={() => setShowRecordPaymentModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="modal-body">
                                {paymentConfig?.type === 'product' && (
                                    <>
                                        <div className="data-row" style={{ marginBottom: '1rem' }}>
                                            <span className="data-label">Product Name</span>
                                            <span className="data-value">{paymentConfig.targetName}</span>
                                        </div>
                                        <div className="data-row" style={{ marginBottom: '1rem' }}>
                                            <span className="data-label">Pending Balance</span>
                                            <span className="data-value text-error">₹{paymentConfig?.maxAmount?.toLocaleString() || 0}</span>
                                        </div>
                                    </>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Payment Date</label>
                                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <option value="Cash">Cash</option>
                                        <option value="Gpay">Gpay</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Note" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        max={paymentConfig?.type === 'product' ? paymentConfig.maxAmount : undefined}
                                        min="1"
                                        placeholder="Enter amount"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isPaymentSaving}>
                                    {isPaymentSaving ? <><Loader size={14} className="spin" /> Saving...</> : 'Save Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Add Seller Modal ── */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Seller</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddSeller}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        value={newSeller.name}
                                        onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number *</label>
                                    <input
                                        type="tel"
                                        value={newSeller.contact}
                                        onChange={(e) => setNewSeller({ ...newSeller, contact: e.target.value })}
                                        placeholder="Mobile Number"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mail Id (Email)</label>
                                    <input
                                        type="email"
                                        value={newSeller.email}
                                        onChange={(e) => setNewSeller({ ...newSeller, email: e.target.value })}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <SearchableSelect
                                            name="state"
                                            value={newSeller.state}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewSeller(prev => ({ ...prev, state: val, city: '' }));
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
                                            value={newSeller.city}
                                            onChange={(e) => setNewSeller(prev => ({ ...prev, city: e.target.value }))}
                                            placeholder={loadingCities ? 'Loading cities...' : !newSeller.state ? 'Select state first' : 'Select City'}
                                            options={cities.map(c => ({ label: c.name, value: c.name }))}
                                            disabled={!newSeller.state || loadingCities}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={newSeller.address}
                                        onChange={(e) => setNewSeller({ ...newSeller, address: e.target.value })}
                                        rows="2"
                                        placeholder="Street / Village / District details"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                    {isSaving ? <><Loader size={14} className="spin" /> Adding...</> : 'Add Seller'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default SellerDetails;
