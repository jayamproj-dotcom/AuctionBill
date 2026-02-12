import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './TodayAuction.css';


function TodayAuction() {
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showEditProduct, setShowEditProduct] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [tempVariety, setTempVariety] = useState('');
    const [showHidden, setShowHidden] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: '',
        seller: '',
        price: '',
        credit: '',
        quality: 'Good',
        quantity: 1,
        unit: 'qty',
        commission: 10,
        image: '',
        varieties: [],
    });

    const [imagePreview, setImagePreview] = useState(null);

    const [saleData, setSaleData] = useState({
        buyer: '',
        finalPrice: '',
        qtyToSell: '',
        paymentStatus: 'Paid',
        amountPaid: '',
        variety: '', 
    });

    const handleImageUpload = (e, target = 'new') => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                if (target === 'new') {
                    setNewProduct({ ...newProduct, image: base64String });
                } else {
                    setEditingProduct({ ...editingProduct, image: base64String });
                }
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const addVariety = (target) => {
        if (!tempVariety.trim()) return;
        
        const varietyObj = { name: tempVariety.trim(), active: true };

        if (target === 'new') {
            setNewProduct({
                ...newProduct,
                varieties: [...(newProduct.varieties || []), varietyObj] // Store object
            });
        } else {
            setEditingProduct({
                ...editingProduct,
                varieties: [...(editingProduct.varieties || []), varietyObj]
            });
        }
        setTempVariety('');
    };

    const toggleVarietyStatus = (index, target) => {
        if (target === 'new') {
            const updated = [...(newProduct.varieties || [])];
            const v = updated[index];
            // Handle legacy string if any
            if (typeof v === 'string') updated[index] = { name: v, active: false };
            else updated[index] = { ...v, active: !v.active };
            
            setNewProduct({ ...newProduct, varieties: updated });
        } else {
             const updated = [...(editingProduct.varieties || [])];
            const v = updated[index];
            if (typeof v === 'string') updated[index] = { name: v, active: false };
            else updated[index] = { ...v, active: !v.active };
            
            setEditingProduct({ ...editingProduct, varieties: updated });
        }
    };

    const toggleProductStatus = (id) => {
        const data = getAuctionData();
        const index = data.products.findIndex(p => p.id === id);
        if (index !== -1) {
            // Toggle isActive. If undefined, assume true -> switch to false.
            const currentStatus = data.products[index].isActive !== false;
            data.products[index].isActive = !currentStatus;
            saveAuctionData(data);
            loadData();
        }
    };

    const removeVariety = (index, target) => {
        if (target === 'new') {
            const updated = [...(newProduct.varieties || [])];
            updated.splice(index, 1);
            setNewProduct({ ...newProduct, varieties: updated });
        } else {
            const updated = [...(editingProduct.varieties || [])];
            updated.splice(index, 1);
            setEditingProduct({ ...editingProduct, varieties: updated });
        }
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setProductToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteProduct = () => {
        if (productToDelete) {
            const data = getAuctionData();
            data.products = data.products.filter(p => p.id !== productToDelete);
            saveAuctionData(data);
            loadData();
            setIsDeleteConfirmOpen(false);
            setProductToDelete(null);
        }
    };

    const openEditModal = (product) => {
        setEditingProduct({ ...product, varieties: product.varieties || [] });
        setImagePreview(product.image);
        setTempVariety('');
        setShowEditProduct(true);
    };

    const handleEditProduct = (e) => {
        e.preventDefault();
        const data = getAuctionData();
        const index = data.products.findIndex(p => p.id === editingProduct.id);
        
        if (index !== -1) {
            data.products[index] = {
                ...editingProduct,
                price: parseFloat(editingProduct.price),
                credit: parseFloat(editingProduct.credit) || 0,
                quantity: parseInt(editingProduct.quantity),
                commission: parseFloat(editingProduct.commission),
                varieties: editingProduct.varieties,
            };
            saveAuctionData(data);
            setShowEditProduct(false);
            setEditingProduct(null);
            setImagePreview(null);
            loadData();
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const data = getAuctionData();
        // Load all available products. Sort by ID (desc) to show newest first.
        const sortedProducts = data.products
            .filter(p => p.status === 'available')
            .sort((a, b) => b.id - a.id);
        setProducts(sortedProducts);
        setSellers(data.sellers);
        setBuyers(data.buyers);
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        const data = getAuctionData();

        const product = {
            id: Date.now(),
            ...newProduct,
            price: parseFloat(newProduct.price),
            credit: parseFloat(newProduct.credit) || 0,
            quantity: parseInt(newProduct.quantity),
            commission: parseFloat(newProduct.commission),
            status: 'available',
            isActive: true,
            varieties: newProduct.varieties || [],
        };

        data.products.push(product);
        saveAuctionData(data);

        setNewProduct({
            name: '',
            seller: '',
            price: '',
            credit: '',
            quality: 'Good',
            quantity: 1,
            unit: 'qty',
            commission: 10,
            image: '',
            varieties: [],
        });
        setImagePreview(null);
        setTempVariety('');
        setShowAddProduct(false);
        loadData();
    };

    const handleSellProduct = (e) => {
        e.preventDefault();
        const data = getAuctionData();

        // Update product status/quantity
        const productIndex = data.products.findIndex(p => p.id === selectedProduct.id);
        const sellQty = parseFloat(saleData.qtyToSell) || 0;
        
        if (sellQty >= data.products[productIndex].quantity) {
            data.products[productIndex].status = 'sold';
            data.products[productIndex].quantity = 0;
        } else {
            const currentQty = data.products[productIndex].quantity;
            const currentPrice = data.products[productIndex].price;
            // Recalculate base price for remaining stock
            data.products[productIndex].price = (currentPrice / currentQty) * (currentQty - sellQty);
            data.products[productIndex].quantity = currentQty - sellQty;
        }

        // Add transaction
        const finalPrice = parseFloat(saleData.finalPrice);
        const commission = (finalPrice * selectedProduct.commission) / 100;
        
        let amountPaid = 0;
        if (saleData.paymentStatus === 'Paid') amountPaid = finalPrice;
        else if (saleData.paymentStatus === 'Part Paid') amountPaid = parseFloat(saleData.amountPaid) || 0;
        else amountPaid = 0;

        const transaction = {
            transaction: 0,
            date: new Date().toISOString().split('T')[0],
            product: saleData.variety ? `${selectedProduct.name} - ${saleData.variety}` : selectedProduct.name,
            quantity: parseFloat(saleData.qtyToSell),
            unit: selectedProduct.unit || 'qty',
            seller: selectedProduct.seller,
            buyer: saleData.buyer,
            price: finalPrice,
            commission: commission,
            commissionPercent: selectedProduct.commission,
            paymentStatus: saleData.paymentStatus,
            amountPaid: amountPaid,
            balance: finalPrice - amountPaid,
            // Seller specific fields
            netAmount: finalPrice - commission,
            credit: selectedProduct.credit || 0, // Pass credit to transaction
            sellerPaymentStatus: 'Pending',
            sellerAmountPaid: 0
        };

        // Clear credit from product so it's only applied once
        data.products[productIndex].credit = 0;

        // Fix ID generation to avoid potential collisions if rapid clicks
        transaction.id = Date.now();

        data.transactions.push(transaction);
        saveAuctionData(data);

        setSaleData({ buyer: '', finalPrice: '', qtyToSell: '', paymentStatus: 'Paid', amountPaid: '', variety: '' });
        setShowSellModal(false);
        setSelectedProduct(null);
        loadData();
    };

    const openSellModal = (product) => {
        setSelectedProduct(product);
        setSaleData({ 
            buyer: '', 
            finalPrice: product.price,
            qtyToSell: product.quantity,
            paymentStatus: 'Paid',
            amountPaid: '',
            variety: ''
        });
        setShowSellModal(true);
    };

    return (
        <>
            <ConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDeleteProduct}
                title="Delete Product"
                message="Are you sure you want to delete this product?"
                subMessage="This item will be removed from the auction list."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                variant="danger"
            />
            <div className="content-header">
                <div className="header-top">
                    <h1>Today Auction</h1>
                    <div className="header-actions">
                         <label className="toggle-hidden">
                            <input 
                                type="checkbox" 
                                checked={showHidden} 
                                onChange={(e) => setShowHidden(e.target.checked)} 
                            />
                            Show Disabled
                        </label>
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
                <div className="section-header">
                    <h3 className="section-title">Available Products ({products.length})</h3>
                </div>

                <div className="card-list fade-in">
                    {products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📦</div>
                            <p>No products available for auction today</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products
                                .filter(p => showHidden || p.isActive !== false)
                                .map(product => (
                                <div key={product.id} className={`data-card product-card ${product.isActive === false ? 'product-disabled' : ''}`}>
                                    <div className="data-card-header product-card-header">
                                        <div className="data-card-title product-card-title">
                                        {product.name}
                                        {product.varieties && product.varieties.length > 0
                                            ? ` - ${product.varieties
                                                .filter(v => typeof v === 'string' || v.active !== false) // Show only active varieties in title
                                                .map(v => (typeof v === 'string' ? v : v.name))
                                                .join(', ')}`
                                            : ''}
                                        {product.isActive === false && <span className="badge badge-error ml-2">Disabled</span>}
                                        </div>
                                        <div className="action-buttons">
                                            <button className="icon-btn" onClick={() => toggleProductStatus(product.id)} title={product.isActive === false ? "Enable" : "Disable"}>
                                                {product.isActive === false ? '👁️' : '🚫'}
                                            </button>
                                            <button className="icon-btn edit" onClick={() => openEditModal(product)} title="Edit">
                                                ✏️
                                            </button>
                                            <button className="icon-btn delete" onClick={() => handleDeleteClick(product.id)} title="Delete">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    
                                    <div className="data-card-body product-card-body">
                                        <div className="product-image-container">
                                            {product.image ? (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className={`product-image ${product.isActive === false ? 'grayscale' : ''}`}
                                                />
                                            ) : (
                                                <span className="product-image-placeholder">📦</span>
                                            )}
                                        </div>

                                        <div className="data-card-subtitle product-card-subtitle">
                                            Seller: <strong>{product.seller}</strong>
                                        </div>

                                        <div className="data-row">
                                            <span className="data-label">Base Price</span>
                                            <span className="data-value">₹{product.price.toLocaleString()}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Quality</span>
                                            <span className="data-value">
                                                <span className={`badge ${product.quality === 'Excellent' ? 'badge-success' :
                                                        product.quality === 'Good' ? 'badge-warning' : 'badge-error'
                                                    }`}>
                                                    {product.quality}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Qty / Unit</span>
                                            <span className="data-value">{product.quantity} {product.unit || 'qty'}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Comm %</span>
                                            <span className="data-value text-amber">{product.commission}%</span>
                                        </div>
                                        {/* {product.credit > 0 && (
                                            <div className="data-row">
                                                <span className="data-label">Credit</span>
                                                <span className="data-value text-error">₹{product.credit.toLocaleString()}</span>
                                            </div>
                                        )} */}
                                    </div>
                                    <div className="data-card-footer product-card-footer">
                                        <button
                                            className="btn btn-success sell-btn-full"
                                            onClick={() => openSellModal(product)}
                                            disabled={product.isActive === false}
                                        >
                                            Sell
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                                        placeholder="e.g. Vintage Clock, Fruits..."
                                        required
                                    />
                                </div>

                                           <div className="form-group">
                                    <label className="form-label">Varieties (Optional)</label>
                                    <div className="variety-input-group">
                                        <input
                                            type="text"
                                            value={tempVariety}
                                            onChange={(e) => setTempVariety(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addVariety('new');
                                                }
                                            }}
                                            placeholder="e.g. Rasakadali, Red..."
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => addVariety('new')}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="variety-tags">
                                        {(newProduct.varieties || []).map((v, i) => {
                                            const vName = typeof v === 'string' ? v : v.name;
                                            const isActive = typeof v === 'string' ? true : v.active;
                                            return (
                                                <span key={i} className={`variety-tag ${!isActive ? 'variety-disabled' : ''}`}>
                                                    <span 
                                                        className="variety-toggle" 
                                                        onClick={() => toggleVarietyStatus(i, 'new')}
                                                        title={isActive ? "Disable" : "Enable"}
                                                    >
                                                        {isActive ? '🟢' : '⚪'}
                                                    </span>
                                                    {vName}
                                                    <span 
                                                        className="variety-tag-remove"
                                                        onClick={() => removeVariety(i, 'new')}
                                                    >×</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Seller</label>
                                    <input
                                        type="text"
                                        list="seller-list"
                                        value={newProduct.seller}
                                        onChange={(e) => setNewProduct({ ...newProduct, seller: e.target.value })}
                                        placeholder="Type to search seller..."
                                        required
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Base Price (₹)</label>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: Math.max(0, e.target.value) })}
                                            placeholder="Base Price"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Credit / Advance (₹)</label>
                                        <input
                                            type="number"
                                            value={newProduct.credit}
                                            onChange={(e) => setNewProduct({ ...newProduct, credit: Math.max(0, e.target.value) })}
                                            placeholder="Optional Credit"
                                            min="0"
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
                                        <div className="qty-input-group">
                                            <input
                                                type="number"
                                                value={newProduct.quantity}
                                                onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                                min="1"
                                                placeholder="Qty"
                                                className="qty-input-main"
                                                required
                                            />
                                            <select
                                                value={newProduct.unit}
                                                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                                className="qty-input-unit"
                                                required
                                            >
                                                <option value="qty">qty</option>
                                                <option value="kg">kg</option>
                                                <option value="pcs">pcs</option>
                                                <option value="ltr">ltr</option>
                                                <option value="box">box</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Commission %</label>
                                        <input
                                            type="number"
                                            value={newProduct.commission}
                                            onChange={(e) => setNewProduct({ ...newProduct, commission: Math.max(0, Math.min(100, e.target.value)) })}
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            placeholder="%"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Product Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="image-upload-input"
                                    />
                                    {imagePreview && (
                                        <div className="image-preview-container">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview"
                                                className="image-preview"
                                            />
                                        </div>
                                    )}
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

            {/* Edit Product Modal */}
            {showEditProduct && editingProduct && (
                <div className="modal-overlay" onClick={() => {
                    setShowEditProduct(false);
                    setImagePreview(null);
                }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Product</h3>
                            <button className="modal-close" onClick={() => {
                                setShowEditProduct(false);
                                setImagePreview(null);
                            }}>×</button>
                        </div>
                        <form onSubmit={handleEditProduct}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        placeholder="Product Name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Varieties</label>
                                    <div className="variety-input-group">
                                        <input
                                            type="text"
                                            value={tempVariety}
                                            onChange={(e) => setTempVariety(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addVariety('edit');
                                                }
                                            }}
                                            placeholder="e.g. Rasakadali, Red..."
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => addVariety('edit')}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="variety-tags">
                                        {(editingProduct.varieties || []).map((v, i) => {
                                             const vName = typeof v === 'string' ? v : v.name;
                                             const isActive = typeof v === 'string' ? true : v.active;
                                             return (
                                                <span key={i} className={`variety-tag ${!isActive ? 'variety-disabled' : ''}`}>
                                                    <span 
                                                        className="variety-toggle" 
                                                        onClick={() => toggleVarietyStatus(i, 'edit')}
                                                        title={isActive ? "Disable" : "Enable"}
                                                    >
                                                         {isActive ? '🟢' : '⚪'}
                                                    </span>
                                                    {vName}
                                                    <span 
                                                        className="variety-tag-remove"
                                                        onClick={() => removeVariety(i, 'edit')}
                                                    >×</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Seller</label>
                                    <input
                                        type="text"
                                        list="seller-list"
                                        value={editingProduct.seller}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, seller: e.target.value })}
                                        placeholder="Type to search seller..."
                                        required
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Base Price (₹)</label>
                                        <input
                                            type="number"
                                            value={editingProduct.price}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, price: Math.max(0, e.target.value) })}
                                            placeholder="Base Price"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Credit / Advance (₹)</label>
                                        <input
                                            type="number"
                                            value={editingProduct.credit}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, credit: Math.max(0, e.target.value) })}
                                            placeholder="Optional Credit"
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quality</label>
                                        <select
                                            value={editingProduct.quality}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, quality: e.target.value })}
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
                                        <div className="qty-input-group">
                                            <input
                                                type="number"
                                                value={editingProduct.quantity}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                                                min="1"
                                                placeholder="Qty"
                                                className="qty-input-main"
                                                required
                                            />
                                            <select
                                                value={editingProduct.unit}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                                                className="qty-input-unit"
                                            >
                                                <option value="qty">qty</option>
                                                <option value="kg">kg</option>
                                                <option value="pcs">pcs</option>
                                                <option value="ltr">ltr</option>
                                                <option value="box">box</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Commission %</label>
                                        <input
                                            type="number"
                                            value={editingProduct.commission}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, commission: Math.max(0, Math.min(100, e.target.value)) })}
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            placeholder="%"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Product Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'edit')}
                                        className="image-upload-input"
                                    />
                                    {imagePreview && (
                                        <div className="image-preview-container">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview"
                                                className="image-preview"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => {
                                    setShowEditProduct(false);
                                    setImagePreview(null);
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
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
                                    <input
                                        type="text"
                                        list="buyer-list"
                                        value={saleData.buyer}
                                        onChange={(e) => setSaleData({ ...saleData, buyer: e.target.value })}
                                        placeholder="Type to search buyer..."
                                        required
                                    />
                                </div>
                                {selectedProduct.varieties && selectedProduct.varieties.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Variety</label>
                                        <select
                                            value={saleData.variety}
                                            onChange={(e) => setSaleData({ ...saleData, variety: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Variety</option>
                                            {selectedProduct.varieties
                                                .filter(v => typeof v === 'string' || v.active !== false) // Only active
                                                .map((v, i) => {
                                                    const vName = typeof v === 'string' ? v : v.name;
                                                    return <option key={i} value={vName}>{vName}</option>;
                                                })
                                            }
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Quantity to Sell ({selectedProduct.unit})</label>
                                    <input
                                        type="number"
                                        value={saleData.qtyToSell}
                                        onChange={(e) => setSaleData({ ...saleData, qtyToSell: e.target.value })}
                                        max={selectedProduct.quantity}
                                        min="0.1"
                                        step="0.1"
                                        placeholder={`Max: ${selectedProduct.quantity}`}
                                        required
                                    />
                                    <small className="form-hint">
                                        Remaining: {(selectedProduct.quantity - (parseFloat(saleData.qtyToSell) || 0)).toFixed(2)} {selectedProduct.unit}
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Final Price (₹)</label>
                                    <input
                                        type="number"
                                        value={saleData.finalPrice}
                                        onChange={(e) => setSaleData({ ...saleData, finalPrice: Math.max(0, e.target.value) })}
                                        placeholder="Selling Price"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-grid qty-input-group">
                                    <div className="form-group">
                                        <label className="form-label">Payment Status</label>
                                        <select
                                            value={saleData.paymentStatus}
                                            onChange={(e) => setSaleData({ ...saleData, paymentStatus: e.target.value })}
                                            required
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Part Paid">Part Paid</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                    {saleData.paymentStatus === 'Part Paid' && (
                                        <div className="form-group">
                                            <label className="form-label">Amount Paid (₹)</label>
                                            <input
                                                type="number"
                                                value={saleData.amountPaid}
                                                onChange={(e) => setSaleData({ ...saleData, amountPaid: Math.max(0, Math.min(saleData.finalPrice, e.target.value)) })}
                                                max={saleData.finalPrice}
                                                min="0"
                                                placeholder="Received amount"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="card calc-card">
                                    <p className="calc-row">
                                        <strong>Commission ({selectedProduct.commission}%):</strong>{' '}
                                        <span className="text-amber">
                                            ₹{((parseFloat(saleData.finalPrice) || 0) * selectedProduct.commission / 100).toLocaleString()}
                                        </span>
                                    </p>
                                    <p className="calc-row-last">
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
                                    Sell
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Datalists for Autocomplete */}
            <datalist id="seller-list">
                {sellers.map(seller => (
                    <option key={seller.id} value={seller.name} />
                ))}
            </datalist>
            <datalist id="buyer-list">
                {buyers.map(buyer => (
                    <option key={buyer.id} value={buyer.name} />
                ))}
            </datalist>
        </>
    );
}

export default TodayAuction;
