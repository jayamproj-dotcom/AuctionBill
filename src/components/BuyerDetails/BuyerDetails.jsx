import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './BuyerDetails.css';
import {Plus,Pencil,Trash2, X,ShoppingCart, Search} from 'lucide-react';

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
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadBuyers();
    }, []);
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

            // Calculate total purchases for each buyer
            const buyersWithStats = data.buyers.map(buyer => {
                const buyerTransactions = sortedTransactions.filter(t => t.buyerId === buyer.id);
                const totalPurchases = buyerTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
                const totalItems = buyerTransactions.length;
                return { ...buyer, totalPurchases, totalItems };
            });
            setBuyers(buyersWithStats);
        }
    };
    const openDetailsModal = (buyer) => {
        const buyerTransactions = transactions.filter(t => t.buyerId === buyer.id);
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
    

            // Update currently selected buyer view
            if (selectedBuyer) {
                const updatedTransactions = data.transactions.filter(t => t.buyer === selectedBuyer.name);
                setSelectedBuyer(prev => ({ ...prev, transactions: updatedTransactions }));
            }
            setShowPaymentModal(false);
        }
    };    const handleAmountPaidChange = (e) => {
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
};    const handleBalanceChange = (e) => {
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
                            <span><Plus /></span>
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

                <div className="card fade-in search-card">
                    <div className="form-group search-form-group">
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search buyer by name..."
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
                    {buyers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><ShoppingCart /></div>
                            <p>No buyers registered yet</p>
                        </div>
                    ) : (
                        buyers
                            .filter(buyer => buyer.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(buyer => (
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
                                        <Trash2 size={18} />
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
                            <button className="modal-close" onClick={() => setShowDetailsModal(false)}><X /></button>
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
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBuyer.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="empty-td">No purchases yet</td>
                                            </tr>
                                        ) : (
                                            selectedBuyer.transactions.map(t => (
                                                <tr key={t.id}>
                                                    <td>{t.date}</td>
                                                    <td className="bold-product">{t.productName}</td>
                                                    <td className="text-amber">₹{t.finalAmount.toLocaleString()}</td>
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
            {/* {showPaymentModal && currentTransaction && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Update Payment Details</h3>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X/></button>
                        </div>
                        <form onSubmit={handleUpdatePayment}>
                            <div className="modal-body">
                                <div className="data-row payment-row">
                                    <span className="data-label">Product</span>
                                    <span className="data-value">{currentTransaction.product}</span>
                                </div>
                                <div className="data-row payment-row">
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
            )} */}


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
