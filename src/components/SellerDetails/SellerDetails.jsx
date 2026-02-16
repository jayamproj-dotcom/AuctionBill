import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './SellerDetails.css';
import {Plus,Pencil,Trash2, X} from 'lucide-react';

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

    // Bulk Payment Modal State
    const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
    const [bulkPaymentAmount, setBulkPaymentAmount] = useState('');

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = () => {
        const data = getAuctionData();
        if (data && data.sellers) {
            // Sort transactions by date desc, then id desc (for same day)
            const sortedTransactions = (data.transactions || []).sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return b.id - a.id;
            });
            
            setTransactions(sortedTransactions);
            
            // Calculate stats for each seller
            const sellersWithStats = data.sellers.map(seller => {
                const sellerTransactions = sortedTransactions.filter(t => t.seller === seller.name);
                
                const totalSales = sellerTransactions.reduce((sum, t) => {
                    const price = t.netAmount !== undefined ? t.netAmount : (t.price - t.commission);
                    return sum + price;
                }, 0);

                const totalCredit = sellerTransactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);
                
                const totalItems = sellerTransactions.length;
                return { ...seller, totalSales, totalCredit, totalItems };
            });
            setSellers(sellersWithStats);
        }
    };

    const openDetailsModal = (seller) => {
        const sellerTransactions = transactions.filter(t => t.seller === seller.name);
        setSelectedSeller({ ...seller, transactions: sellerTransactions });
        setShowDetailsModal(true);
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
        const netAmount = transaction.netAmount !== undefined ? transaction.netAmount : (transaction.price - transaction.commission);
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
            const netAmount = transaction.netAmount !== undefined ? transaction.netAmount : (transaction.price - transaction.commission);
            
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
                // We don't explicitly store 'balance' usually for sellers as it is derived, 
                // but if we want to caching it:
                // sellerBalance: balance 
            };

            saveAuctionData(data);
            loadSellers();

            // Update currently selected seller view
            if (selectedSeller) {
                const updatedTransactions = data.transactions.filter(t => t.seller === selectedSeller.name);
                setSelectedSeller(prev => ({ ...prev, transactions: updatedTransactions }));
            }
            setShowPaymentModal(false);
        }
    };

    const handleAmountPaidChange = (e) => {
        if (!currentTransaction) return;
        const val = parseFloat(e.target.value);
        const netAmount = currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : (currentTransaction.price - currentTransaction.commission);
        const credit = currentTransaction.credit || 0;
        const maxPayable = netAmount - credit;
        const minPayable = currentTransaction.sellerAmountPaid || 0;

        const effectiveVal = isNaN(val) ? 0 : val;
        
        // Prevent setting less than already paid
        // If user tries to type lower, we could either block it or let them type but show error on submit. 
        // User request: "if already 1000 gived i cant edit less that 1000"
        // We will enforce it in the state update if it's a valid number
        
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
        const netAmount = currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : (currentTransaction.price - currentTransaction.commission);
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
        
        // Get seller transactions from latest data
        let sellerTransactions = data.transactions.filter(t => t.seller === selectedSeller.name);
        
        // Sort by date ASCENDING (oldest first) for payment distribution
        sellerTransactions.sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
        
        let remainingPayment = paymentAmount;
        let updatedCount = 0;

        // Iterate through transactions and apply payment
        sellerTransactions.forEach(t => {
            if (remainingPayment <= 0) return;

            const netAmount = t.netAmount !== undefined ? t.netAmount : (t.price - t.commission);
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
                    if (newBalance <= 0) { // Using <= 0 to handle potential float precision issues, though logic safeguards it
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
            // Update selected seller view
            if (selectedSeller) {
                 // Re-fetch transactions for selected seller to update UI
                const updatedTransactions = data.transactions.filter(t => t.seller === selectedSeller.name);
                // Sort back to default view (Newest First)
                updatedTransactions.sort((a, b) => {
                    const dateDiff = new Date(b.date) - new Date(a.date);
                    if (dateDiff !== 0) return dateDiff;
                    return b.id - a.id;
                });
                
                // Recalculate seller stats if needed, or just update transactions
                // Ideally we should reload the full seller object, but updating transactions is critical
                setSelectedSeller(prev => ({ 
                    ...prev, 
                    transactions: updatedTransactions,
                    // Optionally update derived stats if displayed in modal
                }));
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
            const netAmount = t.netAmount !== undefined ? t.netAmount : (t.price - t.commission);
            const paid = t.sellerAmountPaid || 0;
            const credit = t.credit || 0;
            return sum + Math.max(0, netAmount - paid - credit);
        }, 0);
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
                    <h1>Sellers</h1>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <span><Plus/></span>
                            Add Seller
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Sellers</span>
                </div>
            </div>

            <div className="content-body">
                <div className="section-header">
                    <h3 className="section-title">All Sellers ({sellers.length})</h3>
                </div>

                <div className="card-list fade-in">
                    {sellers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👤</div>
                            <p>No sellers registered yet</p>
                        </div>
                    ) : (
                        sellers.map(seller => (
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
                                    <div className="data-row">
                                        <span className="data-label">Items Sold</span>
                                        <span className="data-value">{seller.totalItems || 0}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Net Payable</span>
                                        <span className="data-value text-amber">₹{((seller.totalSales || 0) - (seller.totalCredit || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Seller Detail Modal */}
            {showDetailsModal && selectedSeller && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Seller Profile: {selectedSeller.name}</h3>
                            <button className="modal-close" onClick={() => setShowDetailsModal(false)}><X/></button>
                        </div>
                        <div className="modal-body">
                            <div className="card profile-container">
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

                            <h4 className="history-title">Selled Items History ({selectedSeller.transactions.length})</h4>
                            <div className="table-wrapper history-table-wrapper">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Product</th>
                                            <th>Buyer</th>
                                            <th>Price</th>
                                            <th>Credit</th>
                                            <th>Paid</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedSeller.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="empty-td">No items sold yet</td>
                                            </tr>
                                        ) : (
                                            selectedSeller.transactions.map(t => {
                                                const netAmount = t.netAmount !== undefined ? t.netAmount : (t.price - t.commission);
                                                const paid = t.sellerAmountPaid || 0;
                                                const credit = t.credit || 0;
                                                const balance = netAmount - paid - credit;
                                                const status = t.sellerPaymentStatus || 'Pending';

                                                return (
                                                <tr key={t.id}>
                                                    <td>{t.date}</td>
                                                    <td className="product-name-bold">{t.product}</td>
                                                    <td>{t.buyer}</td>
                                                    <td className="text-amber">₹{netAmount.toLocaleString()}</td>
                                                    <td className="text-error">₹{credit.toLocaleString()}</td>
                                                    <td className="text-success">₹{paid.toLocaleString()}</td>
                                                    <td className="text-error">₹{balance.toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge ${status === 'Paid' ? 'badge-success' : status === 'Part Paid' ? 'badge-warning' : 'badge-error'}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="icon-btn edit"
                                                            onClick={() => openPaymentModal(t)}
                                                            title="Update Payment"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
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
                                <div className="data-row" style={{marginBottom: '1rem'}}>
                                    <span className="data-label">Product</span>
                                    <span className="data-value">{currentTransaction.product}</span>
                                </div>
                                <div className="data-row" style={{marginBottom: '1rem'}}>
                                    <span className="data-label">Net Payable Amount</span>
                                    <span className="data-value text-amber">
                                        ₹{(currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : (currentTransaction.price - currentTransaction.commission)).toLocaleString()}
                                    </span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Status</label>
                                    <select
                                        value={paymentForm.status}
                                        onChange={(e) => setPaymentForm({...paymentForm, status: e.target.value})}
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
                                                max={currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : (currentTransaction.price - currentTransaction.commission)}
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
                                                max={currentTransaction.netAmount !== undefined ? currentTransaction.netAmount : (currentTransaction.price - currentTransaction.commission)}
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
                                <div className="data-row" style={{marginBottom: '1rem'}}>
                                    <span className="data-label">Total Pending Balance</span>
                                    <span className="data-value text-error">₹{getTotalPendingBalance().toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray" style={{marginBottom: '1rem'}}>
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
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X/></button>
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
