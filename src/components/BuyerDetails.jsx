import { useState, useEffect } from 'react';

function BuyerDetails() {
    const [buyers, setBuyers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBuyer, setNewBuyer] = useState({
        name: '',
        contact: '',
        address: '',
    });

    useEffect(() => {
        loadBuyers();
    }, []);

    const loadBuyers = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        if (data && data.buyers) {
            // Calculate total purchases for each buyer
            const buyersWithStats = data.buyers.map(buyer => {
                const buyerTransactions = data.transactions.filter(t => t.buyer === buyer.name);
                const totalPurchases = buyerTransactions.reduce((sum, t) => sum + t.price, 0);
                const totalItems = buyerTransactions.length;
                return { ...buyer, totalPurchases, totalItems };
            });
            setBuyers(buyersWithStats);
        }
    };

    const handleAddBuyer = (e) => {
        e.preventDefault();
        const data = JSON.parse(localStorage.getItem('auctionData'));

        const buyer = {
            id: Date.now(),
            ...newBuyer,
            totalPurchases: 0,
        };

        data.buyers.push(buyer);
        localStorage.setItem('auctionData', JSON.stringify(data));

        setNewBuyer({ name: '', contact: '', address: '' });
        setShowAddModal(false);
        loadBuyers();
    };

    const handleDeleteBuyer = (id) => {
        if (confirm('Are you sure you want to delete this buyer?')) {
            const data = JSON.parse(localStorage.getItem('auctionData'));
            data.buyers = data.buyers.filter(b => b.id !== id);
            localStorage.setItem('auctionData', JSON.stringify(data));
            loadBuyers();
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Buyer Details</h1>
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
                    <span>Buyer Details</span>
                </div>
            </div>

            <div className="content-body">
                <div className="card fade-in">
                    <div className="table-header">
                        <h3 className="table-title">All Buyers ({buyers.length})</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Address</th>
                                    <th>Total Items Purchased</th>
                                    <th>Total Purchases</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buyers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="empty-state-icon">🛒</div>
                                            <p>No buyers registered yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    buyers.map(buyer => (
                                        <tr key={buyer.id}>
                                            <td>{buyer.name}</td>
                                            <td>{buyer.contact}</td>
                                            <td>{buyer.address}</td>
                                            <td>{buyer.totalItems || 0}</td>
                                            <td className="text-amber">₹{(buyer.totalPurchases || 0).toLocaleString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="icon-btn delete" onClick={() => handleDeleteBuyer(buyer.id)}>
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={newBuyer.contact}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, contact: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={newBuyer.address}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, address: e.target.value })}
                                        rows="3"
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
