import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './SellerDetails.css';
import { Plus, Pencil, Trash2, X, Eye, Search } from 'lucide-react';

function SellerDetails() {
    const [sellers, setSellers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSeller, setNewSeller] = useState({
        name: '',
        contact: '',
        address: '',
        email: '',
    });
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        status: 'Pending',
        amountPaid: 0,
        balance: 0
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk Payment Modal State
    const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
    const [bulkPaymentAmount, setBulkPaymentAmount] = useState('');

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = () => {
        const data = getAuctionData();
        if (data && data.sellers) {
            const allProducts = data.products || [];
            // We still need transactions to calculate financial stats if we want to show them in the seller card or use them for payment features
            // Ideally payment features rely on transactions.
            const allTransactions = (data.transactions || []).sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return b.id - a.id;
            });

            setTransactions(allTransactions); // Keep global transactions state updated just in case

            // Calculate stats for each seller
            const sellersWithStats = data.sellers.map(seller => {
                // Products for history view
                const sellerProducts = allProducts.filter(p => p.sellerId === seller.id);

                // Transactions for financial stats (total sales, credit, etc.)
                const sellerTransactions = allTransactions.filter(t => t.sellerId === seller.id);

                // Option 1: Calculate total sales based on TRANSACTIONS (actual financial data) - PREFERRED if we want to show revenue
                const totalSales = sellerTransactions.reduce((sum, t) => {
                    const netAmount = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
                    return sum + netAmount;
                }, 0);

                const totalCredit = sellerTransactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);

                const totalItems = sellerProducts.length; // Use product count for "Items Submitted"

                return {
                    ...seller,
                    totalItems,
                    totalSales,
                    totalCredit,
                    products: sellerProducts, // Attach products for detail helper
                    transactions: sellerTransactions // Attach transactions for payment helper
                };
            });
            setSellers(sellersWithStats);
        }
    };

    const openDetailsModal = (seller) => {
        // Find seller products from data if not already attached via simplified loadSellers
        const data = getAuctionData();
        const sellerProducts = (data.products || []).filter(p => p.sellerId === seller.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc

        setSelectedSeller({ ...seller, products: sellerProducts });
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

    const openPaymentModal = (transaction) => {
        setCurrentTransaction(transaction);
        // For sellers: netAmount is the payable. 
        const netAmount = transaction.netAmount !== undefined ? transaction.netAmount : ((transaction.finalAmount || 0) - (transaction.commission || 0));
        const paid = transaction.sellerAmountPaid || 0;
        const credit = transaction.credit || 0;
        // Balance for seller = Net - Paid - Credit
        const balance = netAmount - paid - credit;

        setPaymentForm({
            status: transaction.sellerPaymentStatus || 'Pending',
            amountPaid: paid,
            balance: balance
        });
        setShowPaymentModal(true);
    };

    const handleUpdatePayment = (e) => {
        e.preventDefault();
        if (!currentTransaction) return;

        // Validation: Cannot pay less than what was already paid
        const previousPaid = currentTransaction.sellerAmountPaid || 0;
        let newPaid = parseFloat(paymentForm.amountPaid) || 0;

        if (paymentForm.status === 'Part Paid' && newPaid < previousPaid) {
            alert(`Amount cannot be less than previously paid amount (₹${previousPaid})`);
            return;
        }

        const data = getAuctionData();
        const index = data.transactions.findIndex(t => t.id === currentTransaction.id);

        if (index !== -1) {
            const transaction = data.transactions[index];
            const netAmount = transaction.netAmount !== undefined ? transaction.netAmount : ((transaction.finalAmount || 0) - (transaction.commission || 0));

            let paid = parseFloat(paymentForm.amountPaid) || 0;
            let status = paymentForm.status;
            let balance = parseFloat(paymentForm.balance) || 0;
            const credit = transaction.credit || 0;

            // Logic validations
            if (status === 'Paid') {
                paid = netAmount - credit;
                balance = 0;
            } else if (status === 'Pending') {
                paid = 0;
                balance = netAmount - credit;
            } else if (status === 'Part Paid') {
                // Ensure paid + balance + credit ~= netAmount
                if (Math.abs(paid + balance + credit - netAmount) > 1) {
                    balance = netAmount - paid - credit;
                }
            }

            data.transactions[index] = {
                ...data.transactions[index],
                sellerPaymentStatus: status,
                sellerAmountPaid: paid
            };

            saveAuctionData(data);
            loadSellers();

            // Refresh selected seller transactions if needed for bulk payment calcs repl
            // We can re-fetch transactions for the current selected seller
            if (selectedSeller) {
                const updatedTransactions = (data.transactions || []).filter(t => t.sellerId === selectedSeller.id);
                setSelectedSeller(prev => ({ ...prev, transactions: updatedTransactions }));
            }

            setShowPaymentModal(false);
        }
    };

    const handleAmountPaidChange = (e) => {
        if (!currentTransaction) return;
        const val = parseFloat(e.target.value);
        const netAmount = currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : ((currentTransaction.finalAmount || 0) - (currentTransaction.commission || 0));
        const credit = currentTransaction.credit || 0;
        const maxPayable = netAmount - credit;

        const effectiveVal = isNaN(val) ? 0 : val;
        const newBalance = Math.max(0, maxPayable - effectiveVal);

        setPaymentForm({
            ...paymentForm,
            amountPaid: e.target.value,
            balance: newBalance
        });
    };

    const handleBalanceChange = (e) => {
        if (!currentTransaction) return;
        const val = parseFloat(e.target.value);
        const netAmount = currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : ((currentTransaction.finalAmount || 0) - (currentTransaction.commission || 0));
        const credit = currentTransaction.credit || 0;
        const maxPayable = netAmount - credit;

        const effectiveVal = isNaN(val) ? 0 : val;
        const newPaid = Math.max(0, maxPayable - effectiveVal);

        setPaymentForm({
            ...paymentForm,
            balance: e.target.value,
            amountPaid: newPaid
        });
    };

    const handleBulkPayment = (e) => {
        e.preventDefault();
        const paymentAmount = parseFloat(bulkPaymentAmount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const data = getAuctionData();

        // Get seller transactions from latest data using ID
        let sellerTransactions = data.transactions.filter(t => t.sellerId === selectedSeller.id);

        // Sort by date ASCENDING (oldest first) for payment distribution
        sellerTransactions.sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);

        let remainingPayment = paymentAmount;
        let updatedCount = 0;

        // Iterate through transactions and apply payment
        sellerTransactions.forEach(t => {
            if (remainingPayment <= 0) return;

            const netAmount = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
            const paid = t.sellerAmountPaid || 0;
            const credit = t.credit || 0;
            const currentBalance = netAmount - paid - credit;

            if (currentBalance > 0) {
                // Determine how much we can pay for this transaction
                const amountToPay = Math.min(currentBalance, remainingPayment);

                // Update transaction in main data array
                const index = data.transactions.findIndex(trans => trans.id === t.id);
                if (index !== -1) {
                    const newPaidTotal = paid + amountToPay;
                    const newBalance = netAmount - newPaidTotal - credit;

                    let newStatus = 'Pending';
                    if (newBalance <= 0) {
                        newStatus = 'Paid';
                    } else {
                        newStatus = 'Part Paid';
                    }

                    data.transactions[index] = {
                        ...data.transactions[index],
                        sellerAmountPaid: newPaidTotal,
                        sellerPaymentStatus: newStatus
                    };

                    remainingPayment -= amountToPay;
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            saveAuctionData(data);
            loadSellers();
            // Upate selected seller state
            if (selectedSeller) {
                const updatedTransactions = (data.transactions || []).filter(t => t.sellerId === selectedSeller.id);
                setSelectedSeller(prev => ({ ...prev, transactions: updatedTransactions }));
            }
            setShowBulkPaymentModal(false);
            setBulkPaymentAmount('');
            alert(`Payment allocated successfully to ${updatedCount} transaction(s).`);
        } else {
            alert("No pending balances found to allocate this payment.");
        }
    };

    // Derived state for Modal
    const getTotalPendingBalance = () => {
        if (!selectedSeller || !selectedSeller.transactions) return 0;
        return selectedSeller.transactions.reduce((sum, t) => {
            const netAmount = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
            const paid = t.sellerAmountPaid || 0;
            const credit = t.credit || 0;
            return sum + Math.max(0, netAmount - paid - credit);
        }, 0);
    };

    // Product View Modal State
    const [viewingProduct, setViewingProduct] = useState(null);
    const [showProductViewModal, setShowProductViewModal] = useState(false);

    const handleViewProduct = (productId) => {
        const product = selectedSeller.products.find(p => p.id === productId);
        if (!product) return;

        // Find related transactions for this product
        // We use selectedSeller.transactions which should be populated
        const relatedTransactions = (selectedSeller.transactions || []).filter(t => t.productId === productId);

        // Calculate Stats
        const totalSales = relatedTransactions.reduce((sum, t) => {
            const net = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
            // "Price" typically refers to the Final Amount (Winning Bid) before commission in auction terms, 
            // but user might want Net Payable. Let's show Final Amount as Price, and Commission separately.
            return sum + (t.finalAmount || 0);
        }, 0);

        const totalCommission = relatedTransactions.reduce((sum, t) => sum + (t.commission || 0), 0);

        // Net Payable (Price - Commission)
        const netPayable = relatedTransactions.reduce((sum, t) => {
            const net = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
            return sum + net;
        }, 0);

        const totalPaid = relatedTransactions.reduce((sum, t) => sum + (t.sellerAmountPaid || 0), 0);
        const totalBalance = netPayable - totalPaid - relatedTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);

        setViewingProduct({
            ...product,
            stats: {
                price: totalSales,
                commission: totalCommission,
                net: netPayable,
                paid: totalPaid,
                balance: totalBalance
            },
            relatedTransactions
        });
        setShowProductViewModal(true);
    };

    const handlePayBalance = (productId) => {
        // Quick pay from table row
        // Finds the first pending transaction for this product and opens payment modal
        // Or if multiple, warns user.
        const transactions = (selectedSeller.transactions || []).filter(t => t.productId === productId);
        const pending = transactions.find(t => {
            const net = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
            const paid = t.sellerAmountPaid || 0;
            const credit = t.credit || 0;
            return (net - paid - credit) > 0;
        });

        if (pending) {
            openPaymentModal(pending);
        } else {
            alert("No pending balance found for this product.");
        }
    };

    const handleProductScopePayment = () => {
        // Pay from Product View Modal
        // Similar to handlePayBalance, picks the first pending transaction
        if (viewingProduct && viewingProduct.relatedTransactions) {
            const pending = viewingProduct.relatedTransactions.find(t => {
                const net = t.netAmount !== undefined ? t.netAmount : ((t.finalAmount || 0) - (t.commission || 0));
                const paid = t.sellerAmountPaid || 0;
                const credit = t.credit || 0;
                return (net - paid - credit) > 0;
            });

            if (pending) {
                openPaymentModal(pending);
                // We might want to close the view modal or keep it open?
                // Keeping it open allows seeing updates after pay (if logic refreshes).
                // But openPaymentModal uses `setCurrentTransaction` and `setShowPaymentModal`.
                // It sits on top.
            } else {
                alert("No pending balance to pay.");
            }
        }
    };



    // Helper to close details view
    const handleBackToSellers = () => {
        setSelectedSeller(null);
    };

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
            />

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

                        {/* Search Bar */}
                        <div className="card fade-in search-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Search seller by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                        style={{ width: '100%', padding: '10px 40px 10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                                                <span className={`data-value badge ${seller.loginAccess === 'inactive' ? 'badge-error' : 'badge-success'}`}>
                                                    {seller.loginAccess === 'inactive' ? 'Disabled' : 'Enabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Detail View Logic (formerly modal body) */
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
                                        <span className={`data-value badge ${selectedSeller.status === 'inactive' ? 'badge-error' : 'badge-success'}`}>
                                            {selectedSeller.status === 'inactive' ? 'Disabled' : 'Enabled'}
                                        </span>
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button
                                        className={`btn btn-sm ${selectedSeller.status === 'inactive' ? 'btn-success' : 'btn-error'} status-toggle-btn`}
                                        onClick={() => handleToggleStatus(selectedSeller.id)}
                                    >
                                        {selectedSeller.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-primary status-toggle-btn"
                                        onClick={() => {
                                            setBulkPaymentAmount('');
                                            setShowBulkPaymentModal(true);
                                        }}
                                        disabled={getTotalPendingBalance() <= 0}
                                    >
                                        Pay Balance
                                    </button>
                                </div>
                            </div>
                        </div>

                        <h4 className="history-title">Submitted Products ({selectedSeller.products?.length || 0})</h4>
                        <div className="table-wrapper history-table-wrapper">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>Variant (Qty)</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!selectedSeller.products || selectedSeller.products.length === 0) ? (
                                        <tr>
                                            <td colSpan="5" className="empty-td">No items submitted yet</td>
                                        </tr>
                                    ) : (
                                        selectedSeller.products.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.date}</td>
                                                <td className="product-name-bold">{p.name}</td>
                                                <td>
                                                    {p.variants && p.variants.map((v, idx) => (
                                                        <div key={idx} style={{ fontSize: '0.9em' }}>
                                                            {v.variety} - {v.quantity} {v.unit}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    <span className={`badge ${p.status === 'soldout' ? 'badge-error' : 'badge-success'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-info" onClick={() => handleViewProduct(p.id)} title="View Details" style={{ marginRight: '5px' }}>
                                                        <Eye size={16} />
                                                    </button>
                                                    {/* <button className="btn btn-sm btn-primary" onClick={() => handlePayBalance(p.id)}>
                                                        Pay
                                                    </button> */}
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

            {/* Product View Modal */}
            {showProductViewModal && viewingProduct && (
                <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setShowProductViewModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Product Details</h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {viewingProduct.stats.balance > 0 && (
                                    <button className="btn btn-sm btn-primary" onClick={handleProductScopePayment}>
                                        Pay Balance
                                    </button>
                                )}
                                <button className="modal-close" onClick={() => setShowProductViewModal(false)}><X /></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="product-view-container" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                {viewingProduct.image && (
                                    <div className="product-image-preview" style={{ flex: '0 0 150px' }}>
                                        <img src={viewingProduct.image} alt={viewingProduct.name} style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    </div>
                                )}
                                <div className="product-info-details" style={{ flex: 1 }}>
                                    <div className="data-row">
                                        <span className="data-label">Date</span>
                                        <span className="data-value">{viewingProduct.date}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Product Name</span>
                                        <span className="data-value product-name-bold">{viewingProduct.name}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Variants</span>
                                        <div className="data-value">
                                            {viewingProduct.variants && viewingProduct.variants.map((v, idx) => (
                                                <div key={idx}>{v.variety} - {v.quantity} {v.unit}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="divider" style={{ margin: '15px 0', borderBottom: '1px solid #eee' }}></div>

                                    <div className="data-row">
                                        <span className="data-label">Total Price</span>
                                        <span className="data-value text-amber">₹{viewingProduct.stats.price.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Commission</span>
                                        <span className="data-value">₹{viewingProduct.stats.commission.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Total Paid</span>
                                        <span className="data-value text-success">₹{viewingProduct.stats.paid.toLocaleString()}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Pending Balance</span>
                                        <span className="data-value text-error" style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                                            ₹{viewingProduct.stats.balance.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="stats-buttons" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                        <button className="btn btn-sm btn-outline-success" style={{ cursor: 'default' }}>
                                            Paid: ₹{viewingProduct.stats.paid}
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger" style={{ cursor: 'default' }}>
                                            Balance: ₹{viewingProduct.stats.balance}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowProductViewModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Update Modal */}
            {showPaymentModal && currentTransaction && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Update Payment Details</h3>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdatePayment}>
                            <div className="modal-body">
                                <div className="data-row" style={{ marginBottom: '1rem' }}>
                                    <span className="data-label">Product</span>
                                    <span className="data-value">{currentTransaction.productName}</span>
                                </div>
                                <div className="data-row" style={{ marginBottom: '1rem' }}>
                                    <span className="data-label">Net Payable Amount</span>
                                    <span className="data-value text-amber">
                                        ₹{(currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : ((currentTransaction.finalAmount || 0) - (currentTransaction.commission || 0))).toLocaleString()}
                                    </span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Status</label>
                                    <select
                                        value={paymentForm.status}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                                        disabled={currentTransaction.sellerPaymentStatus === 'Paid'}
                                    >
                                        <option value="Pending" disabled={currentTransaction.sellerPaymentStatus === 'Paid' || (currentTransaction.sellerAmountPaid > 0)}>Pending</option>
                                        <option value="Part Paid">Part Paid</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>

                                {paymentForm.status === 'Part Paid' && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Amount Paid (₹)</label>
                                            <input
                                                type="number"
                                                value={paymentForm.amountPaid}
                                                onChange={handleAmountPaidChange}
                                                max={currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : ((currentTransaction.finalAmount || 0) - (currentTransaction.commission || 0))}
                                                min={currentTransaction.sellerAmountPaid || 0}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Balance Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={paymentForm.balance}
                                                onChange={handleBalanceChange}
                                                max={currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : ((currentTransaction.finalAmount || 0) - (currentTransaction.commission || 0))}
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPaymentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    Update Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Payment Modal */}
            {showBulkPaymentModal && selectedSeller && (
                <div className="modal-overlay" onClick={() => setShowBulkPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Bulk Payment</h3>
                            <button className="modal-close" onClick={() => setShowBulkPaymentModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleBulkPayment}>
                            <div className="modal-body">
                                <div className="data-row" style={{ marginBottom: '1rem' }}>
                                    <span className="data-label">Total Pending Balance</span>
                                    <span className="data-value text-error">₹{getTotalPendingBalance().toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray" style={{ marginBottom: '1rem' }}>
                                    This payment will be automatically distributed to the oldest pending transactions first.
                                </p>
                                <div className="form-group">
                                    <label className="form-label">Payment Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={bulkPaymentAmount}
                                        onChange={(e) => setBulkPaymentAmount(e.target.value)}
                                        max={getTotalPendingBalance()}
                                        min="1"
                                        placeholder="Enter amount"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBulkPaymentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    Pay & Distribute
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Seller Modal */}
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
            )}
        </>
    );
}

export default SellerDetails;
