import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData, getSellerLedger } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import ConfirmationModal from '../Common/ConfirmationModal';
import './SellerDetails.css';
import { Plus, Pencil, Trash2, X, Eye, Search } from 'lucide-react';
import { toast } from 'react-toastify';

function SellerDetails() {
    const [sellers, setSellers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSeller, setNewSeller] = useState({
        name: '',
        contact: '',
        address: '',
        email: '',
    });
    // Payment Modal State
    // Payment Modal State
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState(null); // { type: 'product'|'global', targetId: string, targetName: string, maxAmount: number }
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [activeTab, setActiveTab] = useState('products');

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = () => {
        const data = getAuctionData();
        if (data && data.sellers) {
            const allProducts = data.products || [];
            const allTransactions = data.transactions || [];
            const allPayments = data.sellerPayments || [];
            const allCredits = data.sellerCredits || [];

            // Calculate stats for each seller
            const sellersWithStats = data.sellers.map(seller => {
                const sellerProducts = allProducts.filter(p => p.sellerId === seller.id);
                const sellerTransactions = allTransactions.filter(t => t.sellerId === seller.id);
                const sellerPayments = allPayments.filter(p => p.sellerId === seller.id);
                const sellerCredits = allCredits.filter(c => c.sellerId === seller.id);

                // Calculate Totals
                const totalGrossSales = sellerTransactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
                const totalCommission = sellerTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
                const totalNetSales = sellerTransactions.reduce((sum, t) => sum + (t.netAmount || 0), 0);

                const totalPaid = sellerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                // For now assuming credit is "money given to seller" (like advance), so it reduces the balance owed.
                const totalCredit = sellerCredits.reduce((sum, c) => sum + (c.amount || 0), 0);

                // Balance = Net Sales - Paid - Credit
                const balance = totalNetSales - totalPaid - totalCredit;


                return {
                    ...seller,
                    totalItems: sellerProducts.length,
                    totalSales: totalNetSales, // Use Net Sales for consistency
                    totalGrossSales,
                    totalCommission,
                    totalCredit,
                    totalPaid,
                    balance,
                    products: sellerProducts,
                    transactions: sellerTransactions,
                    payments: sellerPayments,
                    credits: sellerCredits
                };
            });
            setSellers(sellersWithStats);
            return sellersWithStats;
        }
        return [];
    };

    const openDetailsModal = (seller) => {
        // Find seller products from data if not already attached via simplified loadSellers
        const data = getAuctionData();
        const sellerProducts = (data.products || []).filter(p => p.sellerId === seller.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc

        setSelectedSeller({ ...seller, products: sellerProducts });
        setLedger(getSellerLedger(seller.id));
        // setShowDetailsModal(true); // No longer needed
    };

    const handleToggleStatus = (id) => {
        const data = getAuctionData();
        const index = data.sellers.findIndex(s => s.id === id);
        if (index !== -1) {
            data.sellers[index].status = data.sellers[index].status === 'inactive' ? 'active' : 'inactive';
            saveAuctionData(data);
            loadSellers();
            // Update selected seller if modal is open
            if (selectedSeller && selectedSeller.id === id) {
                setSelectedSeller({ ...selectedSeller, status: data.sellers[index].status });
            }
        }
    };

    const handleAddSeller = (e) => {
        e.preventDefault();
        const data = getAuctionData();

        const seller = {
            id: Date.now(),
            ...newSeller,
            totalSales: 0,
            status: 'active',
            password: '123' // Default password
        };

        data.sellers.push(seller);
        saveAuctionData(data);

        setNewSeller({ name: '', contact: '', address: '', email: '' });
        setShowAddModal(false);
        loadSellers();
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [sellerToDelete, setSellerToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setSellerToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteSeller = () => {
        if (sellerToDelete) {
            const data = getAuctionData();
            data.sellers = data.sellers.filter(s => s.id !== sellerToDelete);
            saveAuctionData(data);
            loadSellers();
            setIsDeleteConfirmOpen(false);
            setSellerToDelete(null);
        }
    };

    const handleRecordPayment = (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);

        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (paymentConfig.type === 'product' && paymentConfig.maxAmount !== undefined && amount > paymentConfig.maxAmount) {
            toast.error(`Payment amount cannot exceed the pending balance of ₹${paymentConfig.maxAmount.toLocaleString()}`);
            return;
        }

        const data = getAuctionData();

        // New Payment Record
        const newPayment = {
            id: Date.now(),
            sellerId: selectedSeller.id,
            productId: paymentConfig.type === 'product' ? paymentConfig.targetId : null,
            date: paymentDate,
            amount: amount,
            method: paymentMethod,
            type: paymentConfig.type === 'product' ? 'Sale' : 'Payment',
            note: paymentNote || (paymentConfig.type === 'product' ? `Payment for ${paymentConfig.targetName}` : 'Global Payment'),
            reference: `PAY-${Date.now()}`
        };

        if (!data.sellerPayments) {
            data.sellerPayments = [];
        }
        data.sellerPayments.push(newPayment);

        saveAuctionData(data);

        // Recalculate and reload from source
        const updatedSellers = loadSellers();
        const updatedSeller = updatedSellers.find(s => s.id === selectedSeller.id);

        if (updatedSeller) {
            // Ensure products are sorted just like in openDetailsModal
            updatedSeller.products.sort((a, b) => new Date(b.date) - new Date(a.date));
            setSelectedSeller(updatedSeller);
        }

        setLedger(getSellerLedger(selectedSeller.id));

        setShowRecordPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        setPaymentConfig(null);
        toast.success(`Payment of ₹${amount.toLocaleString()} recorded successfully.`);
    };

    const openGlobalPaymentModal = () => {
        setPaymentConfig({
            type: 'global',
            targetName: 'Global Account',
            maxAmount: selectedSeller.balance // Global balance
        });
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote('');
        setShowRecordPaymentModal(true);
    };

    const openProductPaymentModal = (product) => {
        const pTransactions = (selectedSeller.transactions || []).filter(t => t.productId === product.id);
        const totalNet = pTransactions.reduce((sum, t) => sum + (Number(t.netAmount) || 0), 0);

        const pPayments = (selectedSeller.payments || []).filter(p => p.productId === product.id);
        const totalPaid = pPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const balance = totalNet - totalPaid;

        if (balance <= 0) {
            // Allow payment even if balance is 0? Maybe advance? 
            // For now, let's warn but allow if they really want, or just set maxAmount 0
        }

        setPaymentConfig({
            type: 'product',
            targetId: product.id,
            targetName: product.name,
            maxAmount: Math.max(0, balance)
        });
        setPaymentAmount(''); // Don't prefill full amount, let user type
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNote(`Payment for ${product.name}`);
        setShowRecordPaymentModal(true);
    };

    // Product View Modal State
    const [viewingProduct, setViewingProduct] = useState(null);
    const [showProductViewModal, setShowProductViewModal] = useState(false);

    const handleViewProduct = (productId) => {
        const product = selectedSeller.products.find(p => p.id === productId);
        if (!product) return;

        // Find related transactions for this product
        const relatedTransactions = (selectedSeller.transactions || []).filter(t => t.productId === productId);

        // Calculate Stats PER VARIANT
        const variantsWithStats = (product.variants || []).map(variant => {
            const variantTransactions = relatedTransactions.filter(t => t.variantId === variant.id);
            const price = variantTransactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
            const commission = variantTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
            const net = variantTransactions.reduce((sum, t) => sum + (t.netAmount || 0), 0);
            const soldQty = variantTransactions.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

            // We don't track payments per variant in UI yet, but we could if we wanted.
            // For now, sticky to Product-level tracking as requested.
            return {
                ...variant,
                sellQuantity: soldQty,
                stats: { price, commission, net }
            };
        });

        // Calculate Grand Totals for the product
        const totalSales = relatedTransactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
        const totalCommission = relatedTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
        const totalNet = relatedTransactions.reduce((sum, t) => sum + (t.netAmount || 0), 0);

        // Calculate Paid from payments
        const pPayments = (selectedSeller.payments || []).filter(p => p.productId === productId);
        const totalPaid = pPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalBalance = totalNet - totalPaid;

        setViewingProduct({
            ...product,
            variants: variantsWithStats,
            stats: {
                price: totalSales,
                commission: totalCommission,
                net: totalNet,
                paid: totalPaid,
                balance: totalBalance
            },
            relatedTransactions
        });
        setShowProductViewModal(true);
    };

    const handlePayBalance = (productId) => {
        // No obsolete logic here, now calling openProductPaymentModal
        // But we need the product object, and here we only got productId in previous implementation loop? 
        // Let's find the product again or pass it. The map loop below has 'p' which is product.
        // It's cleaner to pass 'p' in the JSX.
        // For backwards compatibility relative to where this function sat in logic...
        const product = selectedSeller.products.find(p => p.id === productId);
        if (product) openProductPaymentModal(product);
    };

    // Obsolete function removed. 

    // Helper to close details view
    const handleBackToSellers = () => {
        setSelectedSeller(null);
    };




    return (
        <>
            {/* ... Modal Wrappers ... */}
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
            />

            <div className="content-header">
                {/* ... Header Content ... */}
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
                    <span onClick={selectedSeller ? handleBackToSellers : undefined} style={{ cursor: selectedSeller ? 'pointer' : 'default', textDecoration: selectedSeller ? 'underline' : 'none' }}>
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

                        <div className="card-list fade-in">
                            {sellers.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👤</div>
                                    <p>No sellers registered yet</p>
                                </div>
                            ) : (
                                sellers
                                    .filter(seller => seller.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(seller => (
                                        <div key={seller.id} className="data-card clickable-card" onClick={() => openDetailsModal(seller)}>
                                            <div className="data-card-header">
                                                <div>
                                                    <div className="data-card-title">{seller.name}</div>
                                                    <div className="data-card-subtitle">{seller.contact}</div>
                                                </div>
                                                <button className="icon-btn delete" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(seller.id);
                                                }} title="Delete Seller">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="data-card-body">
                                                <div className="data-row">
                                                    <span className="data-label">Address</span>
                                                    <span className="data-value">{seller.address}</span>
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
                    /* Detail View Logic */
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
                                        <span className="data-label">Address</span>
                                        <span className="data-value">{selectedSeller.address}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Login Access</span>
                                        <span onClick={() => handleToggleStatus(selectedSeller.id)} className={`cursor-pointer badge btn ${selectedSeller.status === 'inactive' ? 'btn-success' : 'btn-error'} status-toggle-btn`}>
                                            {selectedSeller.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                        </span>
                                    </div>
                                </div>
                                {/* <div className="profile-actions">
                                    <button
                                        className={`btn ${selectedSeller.status === 'inactive' ? 'btn-success' : 'btn-error'} status-toggle-btn`}
                                        onClick={() => handleToggleStatus(selectedSeller.id)}
                                    >
                                        {selectedSeller.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                    </button>
                                    <button
                                        className="btn btn-primary status-toggle-btn"
                                        onClick={openGlobalPaymentModal}
                                    >
                                        Add Global Payment
                                    </button>
                                </div> */}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={openGlobalPaymentModal}
                            >
                                <Plus size={16} style={{ marginRight: '5px' }} /> Add Only Payment
                            </button>
                        </div>

                        <div className="history-tabs">
                            <button
                                className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                                onClick={() => setActiveTab('products')}
                            >
                                {/* Selling Products ({selectedSeller.products?.length || 0}) */}
                                Selling Products
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payments')}
                            >
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
                                            {/* <th>Status</th> */}
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!selectedSeller.products || selectedSeller.products.length === 0) ? (
                                            <tr>
                                                <td colSpan="7" className="empty-td">No items submitted yet</td>
                                            </tr>
                                        ) : (
                                            (() => {
                                                // 🔥 Calculate Seller Advance First
                                                const sellerTotalNet = (selectedSeller.transactions || [])
                                                    .reduce((sum, t) => sum + (Number(t.netAmount) || 0), 0);

                                                const sellerTotalPaid = (selectedSeller.payments || [])
                                                    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

                                                const sellerCredits = (selectedSeller.credits || [])
                                                    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

                                                const sellerBalance = sellerTotalNet - sellerTotalPaid - sellerCredits;

                                                let remainingAdvance = sellerBalance < 0
                                                    ? Math.abs(sellerBalance)
                                                    : 0;

                                                return selectedSeller.products.map(p => {
                                                    // Calculate product stats from transactions
                                                    const pTransactions = (selectedSeller.transactions || []).filter(t => t.productId === p.id);

                                                    // Net Sales for this product
                                                    const totalNet = pTransactions.reduce((sum, t) => sum + (Number(t.netAmount) || 0), 0);

                                                    // Calculations using sellerPayments table for this product
                                                    const pPayments = (selectedSeller.payments || []).filter(pmt => pmt.productId === p.id);
                                                    let totalPaid = pPayments.reduce((sum, pmt) => sum + (Number(pmt.amount) || 0), 0);

                                                    let totalBalance = totalNet - totalPaid;

                                                    // 🔥 Apply Advance Adjustment
                                                    let advanceUsed = 0;

                                                    if (remainingAdvance > 0 && totalBalance > 0) {
                                                        advanceUsed = Math.min(remainingAdvance, totalBalance);

                                                        totalPaid += advanceUsed;       // ✅ Add to Paid column
                                                        totalBalance -= advanceUsed;    // ✅ Reduce Balance
                                                        remainingAdvance -= advanceUsed;
                                                    }

                                                    console.log(advanceUsed, totalPaid, totalBalance, remainingAdvance);


                                                    const isPaidOff = totalBalance <= 0 && totalNet > 0;

                                                    return (
                                                        <tr key={p.id}>
                                                            <td>{formatDate(p.date)}</td>
                                                            <td className="product-name-bold">{p.name}</td>
                                                            <td>₹{totalNet.toLocaleString()}</td>
                                                            <td className="text-success">₹{totalPaid.toLocaleString()}</td>
                                                            <td className={`text-error ${totalBalance > 0 ? 'font-bold' : ''}`}>
                                                                ₹{Math.max(0, totalBalance).toLocaleString()}
                                                            </td>
                                                            {/* <td>
                                                            {isPaidOff ? (
                                                                <span className="badge badge-success">Paid</span>
                                                            ) : (
                                                                <span className={`badge ${p.status === 'soldout' ? 'badge-warning' : 'badge-info'}`}>
                                                                    {p.status}
                                                                </span>
                                                            )}
                                                        </td> */}
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                    <button className="btn btn-sm btn-info" onClick={() => handleViewProduct(p.id)} title="View Details">
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    {totalBalance > 0 && (
                                                                        <button className="btn btn-sm btn-primary" onClick={() => openProductPaymentModal(p)} title="Pay Balance">
                                                                            Pay
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
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
                                                <tr>
                                                    <td colSpan="5" className="empty-td">No transactions found</td>
                                                </tr>
                                            ) : (
                                                ledger.map((entry, index) => (
                                                    <tr key={index}>
                                                        <td>{formatDate(entry.date)}</td>
                                                        <td>{entry.description}</td>
                                                        <td className="text-success">{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                                                        <td className="text-error">{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                                                        <td style={{ fontWeight: 'bold' }} className={entry.balance < 0 ? 'text-success' : ''}>
                                                            {entry.balance < 0
                                                                ? `Advance ₹${Math.abs(entry.balance).toLocaleString()}`
                                                                : `₹${entry.balance.toLocaleString()}`
                                                            }
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
            </div >

            {/* Product View Modal */}
            {
                showProductViewModal && viewingProduct && (
                    <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setShowProductViewModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Product Details ({viewingProduct.name})</h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {viewingProduct.stats.balance > 0 && (
                                        <div className='badge badge-error'>Total Due: ₹{viewingProduct.stats.balance}</div>
                                    )}
                                    <button className="modal-close" onClick={() => setShowProductViewModal(false)}><X /></button>
                                </div>
                            </div>
                            <div className="modal-body">
                                <div className="product-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div className="product-image-preview" style={{ flex: '0 0 150px' }}>
                                            {viewingProduct.image ? (
                                                <img
                                                    src={viewingProduct.image}
                                                    alt={viewingProduct.name}
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
                                            <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                                                {formatDate(viewingProduct.date)}
                                            </div>
                                        </div>

                                        <div className="product-info-details" style={{ flex: 1 }}>
                                            {/* Summarized Stats */}
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
                                                    <th>Variety</th>
                                                    <th>Qty</th>
                                                    <th>Sold Qty</th>
                                                    <th>Sales</th>
                                                    <th>Comm.</th>
                                                    <th>Net Total</th>
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
                                                        <td className="text-success" style={{ fontWeight: 'bold' }}>
                                                            ₹{(v.stats?.net || 0).toLocaleString()}
                                                        </td>
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
                                    <button className="btn btn-primary" onClick={() => openProductPaymentModal(viewingProduct)}>
                                        Pay Total Balance
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={() => setShowProductViewModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Record Payment Modal (Replaces Bulk Payment) */}
            {
                showRecordPaymentModal && selectedSeller && (
                    <div className="modal-overlay" onClick={() => setShowRecordPaymentModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Record Payment</h3>
                                <button className="modal-close" onClick={() => setShowRecordPaymentModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleRecordPayment}>
                                <div className="modal-body">
                                    {paymentConfig?.type === 'product' && (
                                        <div className="data-row" style={{ marginBottom: '1rem' }}>
                                            <span className="data-label">Product Name</span>
                                            <span className="data-value">{paymentConfig.targetName}</span>
                                        </div>
                                    )}

                                    {paymentConfig?.type === 'product' && (
                                        <div className="data-row" style={{ marginBottom: '1rem' }}>
                                            <span className="data-label">Pending Balance</span>
                                            <span className="data-value text-error">₹{paymentConfig?.maxAmount?.toLocaleString() || 0}</span>
                                        </div>
                                    )}

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
                                        <label className="form-label">Description</label>
                                        <input
                                            type="text"
                                            value={paymentNote}
                                            onChange={(e) => setPaymentNote(e.target.value)}
                                            placeholder="e.g. Note"
                                        />
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
                )
            }

            {/* Add Seller Modal */}
            {
                showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Add New Seller</h3>
                                <button className="modal-close" onClick={() => setShowAddModal(false)}><X /></button>
                            </div>
                            <form onSubmit={handleAddSeller}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            value={newSeller.name}
                                            onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                                            placeholder="Full Name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Number</label>
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
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <textarea
                                            value={newSeller.address}
                                            onChange={(e) => setNewSeller({ ...newSeller, address: e.target.value })}
                                            rows="3"
                                            placeholder="Full address (Village, District...)"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Seller
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}

export default SellerDetails;
