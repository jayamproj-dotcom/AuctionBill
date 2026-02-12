import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './BuyerDetails.css';

function BuyerDetails() {
    const [buyers, setBuyers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBuyer, setNewBuyer] = useState({
        name: '',
        contact: '',
        address: '',
        email: '',
        buyerType: 'Retailer'
    });
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        status: 'Pending',
        amountPaid: 0,
        balance: 0
    });

    useEffect(() => {
        loadBuyers();
    }, []);

    const loadBuyers = () => {
        const data = getAuctionData();
        if (data && data.buyers) {
            // Sort transactions by date desc, then id desc
            const sortedTransactions = (data.transactions || []).sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return b.id - a.id;
            });
            setTransactions(sortedTransactions);

            // Calculate total purchases for each buyer
            const buyersWithStats = data.buyers.map(buyer => {
                const buyerTransactions = sortedTransactions.filter(t => t.buyer === buyer.name);
                const totalPurchases = buyerTransactions.reduce((sum, t) => sum + t.price, 0);
                const totalItems = buyerTransactions.length;
                return { ...buyer, totalPurchases, totalItems };
            });
            setBuyers(buyersWithStats);
        }
    };

    const openDetailsModal = (buyer) => {
        const buyerTransactions = transactions.filter(t => t.buyer === buyer.name);
        setSelectedBuyer({ ...buyer, transactions: buyerTransactions });
        setShowDetailsModal(true);
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

        setNewBuyer({ name: '', contact: '', address: '', email: '', buyerType: 'Retailer' });
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

    const openPaymentModal = (transaction) => {
        setCurrentTransaction(transaction);
        const price = transaction.price;
        const paid = transaction.amountPaid || 0;
        const balance = transaction.balance !== undefined ? transaction.balance : (price - paid);
        
        setPaymentForm({
            status: transaction.paymentStatus || 'Pending',
            amountPaid: paid,
            balance: balance
        });
        setShowPaymentModal(true);
    };

    const handleUpdatePayment = (e) => {
        e.preventDefault();
        if (!currentTransaction) return;

        // Validation: Cannot pay less than what was already paid
        const previousPaid = currentTransaction.amountPaid || 0;
        let newPaidInput = parseFloat(paymentForm.amountPaid) || 0;
        
        if (paymentForm.status === 'Part Paid' && newPaidInput < previousPaid) {
            alert(`Amount cannot be less than previously paid amount (₹${previousPaid})`);
            return;
        }

        const data = getAuctionData();
        const index = data.transactions.findIndex(t => t.id === currentTransaction.id);

        if (index !== -1) {
            const price = data.transactions[index].price;
            let paid = parseFloat(paymentForm.amountPaid) || 0;
            let status = paymentForm.status;
            let balance = parseFloat(paymentForm.balance) || 0;

            // Logic validations based on status change vs manual edits
            if (status === 'Paid') {
                paid = price;
                balance = 0;
            } else if (status === 'Pending') {
                paid = 0;
                balance = price;
            } else if (status === 'Part Paid') {
               // Final check to ensure no overflow
                if (paid > price) paid = price;
                if (balance < 0) balance = 0;
                // Ensure they sum up (priority to paid if mismatch? or re-calc?)
                if (Math.abs(paid + balance - price) > 1) { // Using a small epsilon for float comparison
                     balance = price - paid;
                }
            }

            data.transactions[index] = {
                ...data.transactions[index],
                paymentStatus: status,
                amountPaid: paid,
                balance: balance
            };

            saveAuctionData(data);
            loadBuyers();

            // Update currently selected buyer view
            if (selectedBuyer) {
                const updatedTransactions = data.transactions.filter(t => t.buyer === selectedBuyer.name);
                setSelectedBuyer(prev => ({ ...prev, transactions: updatedTransactions }));
            }
            setShowPaymentModal(false);
        }
    };

    const handleAmountPaidChange = (e) => {
        const val = parseFloat(e.target.value);
        const price = currentTransaction.price;
        
        // If val is NaN (empty), treat as 0 for calculation but keep input clean
        const effectiveVal = isNaN(val) ? 0 : val;
        const newBalance = Math.max(0, price - effectiveVal);
        
        setPaymentForm({
            ...paymentForm,
            amountPaid: e.target.value, // Keep raw input
            balance: newBalance
        });
    };

    const handleBalanceChange = (e) => {
        const val = parseFloat(e.target.value);
        const price = currentTransaction.price;
        
        // If val is NaN (empty), treat as 0 for calculation but keep input clean
        const effectiveVal = isNaN(val) ? 0 : val;
        const newPaid = Math.max(0, price - effectiveVal);
        
        setPaymentForm({
            ...paymentForm,
            balance: e.target.value, // Keep raw input
            amountPaid: newPaid
        });
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
                    <h1>Buyers</h1>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <span>➕</span>
                            Add Buyer
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Buyers</span>
                </div>
            </div>

            <div className="content-body">
                <div className="section-header">
                    <h3 className="section-title">All Buyers ({buyers.length})</h3>
                </div>

                <div className="card-list fade-in">
                    {buyers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🛒</div>
                            <p>No buyers registered yet</p>
                        </div>
                    ) : (
                        buyers.map(buyer => (
                            <div key={buyer.id} className="data-card clickable-card" onClick={() => openDetailsModal(buyer)}>
                                <div className="data-card-header">
                                    <div>
                                        <div className="data-card-title">{buyer.name}</div>
                                        <div className="data-card-subtitle">{buyer.contact}</div>
                                    </div>
                                    <button className="icon-btn delete" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(buyer.id);
                                    }} title="Delete Buyer">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                                        </svg>
                                    </button>
                                    <div className="badge badge-warning type-badge-abs">
                                        {buyer.buyerType || 'Retailer'}
                                    </div>
                                </div>
                                
                                <div className="data-card-body">
                                    <div className="data-row">
                                        <span className="data-label">Address</span>
                                        <span className="data-value">{buyer.address}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Login Access</span>
                                        <span className={`data-value badge ${buyer.status === 'inactive' ? 'badge-error' : 'badge-success'}`}>
                                            {buyer.status === 'inactive' ? 'Disabled' : 'Enabled'}
                                        </span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Items Purchased</span>
                                        <span className="data-value">{buyer.totalItems || 0}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="data-label">Total Purchases</span>
                                        <span className="data-value text-amber">₹{(buyer.totalPurchases || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Buyer Detail Modal */}
            {showDetailsModal && selectedBuyer && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Buyer Profile: {selectedBuyer.name}</h3>
                            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="card profile-container">
                                <div className="profile-layout">
                                    <div className="profile-info">
                                        <div className="data-row">
                                            <span className="data-label">Contact</span>
                                            <span className="data-value">{selectedBuyer.contact}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Email</span>
                                            <span className="data-value">{selectedBuyer.email || 'N/A'}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Address</span>
                                            <span className="data-value">{selectedBuyer.address}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Type</span>
                                            <span className="data-value badge badge-warning">{selectedBuyer.buyerType || 'Retailer'}</span>
                                        </div>
                                    </div>
                                    <div className="profile-actions">
                                        <button 
                                            className={`btn btn-sm ${selectedBuyer.status === 'inactive' ? 'btn-success' : 'btn-error'} action-btn-fixed`}
                                            onClick={() => handleToggleStatus(selectedBuyer.id)}
                                        >
                                            {selectedBuyer.status === 'inactive' ? 'Enable Login' : 'Disable Login'}
                                        </button>
                                        {/* <button 
                                            className="btn btn-secondary btn-sm action-btn-fixed"
                                            onClick={() => handleResetPassword(selectedBuyer.id)}
                                        >
                                            Reset Password
                                        </button> */}
                                    </div>
                                </div>
                                <div className="data-row volume-row">
                                    <span className="data-label">Total Purchase Volume</span>
                                    <span className="data-value text-amber volume-value">₹{selectedBuyer.totalPurchases.toLocaleString()}</span>
                                </div>
                            </div>

                            <h4 className="history-title">Purchase History ({selectedBuyer.transactions.length})</h4>
                            <div className="table-wrapper history-table-wrapper">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Product</th>
                                            <th>Seller</th>
                                            <th>Price</th>
                                            <th>Paid</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBuyer.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="empty-td">No purchases yet</td>
                                            </tr>
                                        ) : (
                                            selectedBuyer.transactions.map(t => (
                                                <tr key={t.id}>
                                                    <td>{t.date}</td>
                                                    <td className="bold-product">{t.product}</td>
                                                    <td>{t.seller}</td>
                                                    <td className="text-amber">₹{t.price.toLocaleString()}</td>
                                                    <td className="text-success">₹{(t.amountPaid || 0).toLocaleString()}</td>
                                                    <td className="text-error">₹{(t.balance !== undefined ? t.balance : t.price).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge ${t.paymentStatus === 'Paid' ? 'badge-success' : t.paymentStatus === 'Part Paid' ? 'badge-warning' : 'badge-error'}`}>
                                                            {t.paymentStatus || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="icon-btn edit"
                                                            onClick={() => openPaymentModal(t)}
                                                            title="Update Payment"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
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
                                    <span className="data-label">Total Price</span>
                                    <span className="data-value text-amber">₹{currentTransaction.price.toLocaleString()}</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Status</label>
                                    <select
                                        value={paymentForm.status}
                                        onChange={(e) => setPaymentForm({...paymentForm, status: e.target.value})}
                                        disabled={currentTransaction.paymentStatus === 'Paid'}
                                    >
                                        <option value="Pending" disabled={currentTransaction.paymentStatus === 'Paid' || (currentTransaction.amountPaid > 0)}>Pending</option>
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
                                                max={currentTransaction.price}
                                                min={currentTransaction.amountPaid || 0}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Balance Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={paymentForm.balance}
                                                onChange={handleBalanceChange}
                                                max={currentTransaction.price}
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

            
            {/* Add Buyer Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Buyer</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
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
                                <div className="form-group">
                                    <label className="form-label">Buyer Type</label>
                                    <select
                                        value={newBuyer.buyerType}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, buyerType: e.target.value })}
                                    >
                                        <option value="Retailer">Retailer</option>
                                        <option value="Wholesale">Wholesale</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={newBuyer.address}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, address: e.target.value })}
                                        rows="2"
                                        placeholder="Full address (Shop / Office details)"
                                        required
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
