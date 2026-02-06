import { useState, useEffect } from 'react';

const initialData = {
    sellers: [
        { id: 1, name: 'John Smith', contact: '9876543210', address: '123 Main St', totalSales: 45000 },
        { id: 2, name: 'Sarah Johnson', contact: '9876543211', address: '456 Oak Ave', totalSales: 32000 },
    ],
    buyers: [
        { id: 1, name: 'Mike Brown', contact: '9876543220', address: '789 Pine Rd', totalPurchases: 28000 },
        { id: 2, name: 'Emily Davis', contact: '9876543221', address: '321 Elm St', totalPurchases: 19000 },
    ],
    products: [
        { id: 1, name: 'Antique Vase', seller: 'John Smith', price: 5000, quality: 'Excellent', quantity: 1, commission: 10, status: 'available' },
        { id: 2, name: 'Vintage Watch', seller: 'Sarah Johnson', price: 8000, quality: 'Good', quantity: 1, commission: 12, status: 'available' },
    ],
    transactions: [
        { id: 1, date: '2026-02-05', product: 'Antique Vase', seller: 'John Smith', buyer: 'Mike Brown', price: 5000, commission: 500, commissionPercent: 10 },
        { id: 2, date: '2026-02-04', product: 'Vintage Watch', seller: 'Sarah Johnson', buyer: 'Emily Davis', price: 8000, commission: 960, commissionPercent: 12 },
    ],
};

function TodayAuction() {
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [newProduct, setNewProduct] = useState({
        name: '',
        seller: '',
        price: '',
        quality: 'Good',
        quantity: 1,
        commission: 10,
    });

    const [saleData, setSaleData] = useState({
        buyer: '',
        finalPrice: '',
    });

    useEffect(() => {
        // Initialize localStorage if empty
        if (!localStorage.getItem('auctionData')) {
            localStorage.setItem('auctionData', JSON.stringify(initialData));
        }
        loadData();
    }, []);

    const loadData = () => {
        const data = JSON.parse(localStorage.getItem('auctionData'));
        setProducts(data.products.filter(p => p.status === 'available'));
        setSellers(data.sellers);
        setBuyers(data.buyers);
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        const data = JSON.parse(localStorage.getItem('auctionData'));

        const product = {
            id: Date.now(),
            ...newProduct,
            price: parseFloat(newProduct.price),
            quantity: parseInt(newProduct.quantity),
            commission: parseFloat(newProduct.commission),
            status: 'available',
        };

        data.products.push(product);
        localStorage.setItem('auctionData', JSON.stringify(data));

        setNewProduct({
            name: '',
            seller: '',
            price: '',
            quality: 'Good',
            quantity: 1,
            commission: 10,
        });
        setShowAddProduct(false);
        loadData();
    };

    const handleSellProduct = (e) => {
        e.preventDefault();
        const data = JSON.parse(localStorage.getItem('auctionData'));

        // Update product status
        const productIndex = data.products.findIndex(p => p.id === selectedProduct.id);
        data.products[productIndex].status = 'sold';

        // Add transaction
        const finalPrice = parseFloat(saleData.finalPrice);
        const commission = (finalPrice * selectedProduct.commission) / 100;

        const transaction = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            product: selectedProduct.name,
            seller: selectedProduct.seller,
            buyer: saleData.buyer,
            price: finalPrice,
            commission: commission,
            commissionPercent: selectedProduct.commission,
        };

        data.transactions.push(transaction);
        localStorage.setItem('auctionData', JSON.stringify(data));

        setSaleData({ buyer: '', finalPrice: '' });
        setShowSellModal(false);
        setSelectedProduct(null);
        loadData();
    };

    const openSellModal = (product) => {
        setSelectedProduct(product);
        setSaleData({ buyer: '', finalPrice: product.price });
        setShowSellModal(true);
    };

    return (
        <>
            <div className="content-header">
                <div className="header-top">
                    <h1>Today Auction</h1>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                            <span>➕</span>
                            Add Product
                        </button>
                    </div>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Today Auction</span>
                </div>
            </div>

            <div className="content-body">
                <div className="card fade-in">
                    <div className="table-header">
                        <h3 className="table-title">Available Products ({products.length})</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Seller</th>
                                    <th>Base Price</th>
                                    <th>Quality</th>
                                    <th>Quantity</th>
                                    <th>Commission %</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            <div className="empty-state-icon">📦</div>
                                            <p>No products available for auction today</p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(product => (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.seller}</td>
                                            <td>₹{product.price.toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${product.quality === 'Excellent' ? 'badge-success' :
                                                        product.quality === 'Good' ? 'badge-warning' : 'badge-error'
                                                    }`}>
                                                    {product.quality}
                                                </span>
                                            </td>
                                            <td>{product.quantity}</td>
                                            <td className="text-amber">{product.commission}%</td>
                                            <td>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => openSellModal(product)}
                                                >
                                                    Sell
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
                <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Product</h3>
                            <button className="modal-close" onClick={() => setShowAddProduct(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Seller</label>
                                    <select
                                        value={newProduct.seller}
                                        onChange={(e) => setNewProduct({ ...newProduct, seller: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Seller</option>
                                        {sellers.map(seller => (
                                            <option key={seller.id} value={seller.name}>{seller.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Base Price (₹)</label>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quality</label>
                                        <select
                                            value={newProduct.quality}
                                            onChange={(e) => setNewProduct({ ...newProduct, quality: e.target.value })}
                                        >
                                            <option value="Excellent">Excellent</option>
                                            <option value="Good">Good</option>
                                            <option value="Fair">Fair</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            value={newProduct.quantity}
                                            onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Commission %</label>
                                        <input
                                            type="number"
                                            value={newProduct.commission}
                                            onChange={(e) => setNewProduct({ ...newProduct, commission: e.target.value })}
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProduct(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sell Product Modal */}
            {showSellModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Sell Product: {selectedProduct.name}</h3>
                            <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSellProduct}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Buyer</label>
                                    <select
                                        value={saleData.buyer}
                                        onChange={(e) => setSaleData({ ...saleData, buyer: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Buyer</option>
                                        {buyers.map(buyer => (
                                            <option key={buyer.id} value={buyer.name}>{buyer.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Final Price (₹)</label>
                                    <input
                                        type="number"
                                        value={saleData.finalPrice}
                                        onChange={(e) => setSaleData({ ...saleData, finalPrice: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="card" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)' }}>
                                    <p style={{ marginBottom: '0.5rem' }}>
                                        <strong>Commission ({selectedProduct.commission}%):</strong>{' '}
                                        <span className="text-amber">
                                            ₹{((parseFloat(saleData.finalPrice) || 0) * selectedProduct.commission / 100).toLocaleString()}
                                        </span>
                                    </p>
                                    <p style={{ marginBottom: 0 }}>
                                        <strong>Seller Receives:</strong>{' '}
                                        ₹{((parseFloat(saleData.finalPrice) || 0) * (100 - selectedProduct.commission) / 100).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSellModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Complete Sale
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default TodayAuction;
