import { useState, useEffect } from 'react';

function SellerDetails() {
    const [sellers, setSellers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSeller, setNewSeller] = useState({
        name: '',
        contact: '',
        address: '',
    });

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        if (data && data.sellers) {
            // Calculate total sales for each seller
            const sellersWithStats = data.sellers.map(seller => {
                const sellerTransactions = data.transactions.filter(t => t.seller === seller.name);
                const totalSales = sellerTransactions.reduce((sum, t) => sum + t.price, 0);
                const totalItems = sellerTransactions.length;
                return { ...seller, totalSales, totalItems };
            });
            setSellers(sellersWithStats);
        }
    };

    const handleAddSeller = (e) => {
        e.preventDefault();
        const data = JSON.parse(localStorage.getItem('auctionData'));

        const seller = {
            id: Date.now(),
            ...newSeller,
            totalSales: 0,
        };

        data.sellers.push(seller);
        localStorage.setItem('auctionData', JSON.stringify(data));

        setNewSeller({ name: '', contact: '', address: '' });
        setShowAddModal(false);
        loadSellers();
    };

    const handleDeleteSeller = (id) => {
        if (confirm('Are you sure you want to delete this seller?')) {
            const data = JSON.parse(localStorage.getItem('auctionData'));
            data.sellers = data.sellers.filter(s => s.id !== id);
            localStorage.setItem('auctionData', JSON.stringify(data));
            loadSellers();
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Seller Details</h1>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <span>➕</span>
                            Add Seller
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Seller Details</span>
                </div>
            </div>

            <div className="content-body">
                <div className="card fade-in">
                    <div className="table-header">
                        <h3 className="table-title">All Sellers ({sellers.length})</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Address</th>
                                    <th>Total Items Sold</th>
                                    <th>Total Sales</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sellers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="empty-state-icon">👤</div>
                                            <p>No sellers registered yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sellers.map(seller => (
                                        <tr key={seller.id}>
                                            <td>{seller.name}</td>
                                            <td>{seller.contact}</td>
                                            <td>{seller.address}</td>
                                            <td>{seller.totalItems || 0}</td>
                                            <td className="text-amber">₹{(seller.totalSales || 0).toLocaleString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="icon-btn delete" onClick={() => handleDeleteSeller(seller.id)}>
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

            {/* Add Seller Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Seller</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddSeller}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        value={newSeller.name}
                                        onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={newSeller.contact}
                                        onChange={(e) => setNewSeller({ ...newSeller, contact: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={newSeller.address}
                                        onChange={(e) => setNewSeller({ ...newSeller, address: e.target.value })}
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
