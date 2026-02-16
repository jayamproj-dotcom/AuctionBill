import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './TodayAuction.css';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, X, Eye, EyeOff, PackageSearch } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, required, label }) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (opt) => {
        onChange(opt);
        setSearchTerm(opt.name);
        setIsOpen(false);
    };

    return (
        <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">{label}</label>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === '') onChange({ id: '', name: '' });
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => {
                    setTimeout(() => {
                        const match = options.find(o => o.name.toLowerCase() === searchTerm.toLowerCase());
                        if (match) {
                            if (match.name !== value) onChange(match);
                        } else {
                            onChange({ id: '', name: '' });
                            setSearchTerm('');
                        }
                        setIsOpen(false);
                    }, 200);
                }}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="dropdown-options">
                    {filteredOptions.map(opt => (
                        <li
                            key={opt.id}
                            onMouseDown={() => handleSelect(opt)}
                            className="dropdown-item"
                        >
                            {opt.name}
                        </li>
                    ))}
                </ul>
            )}

        </div>
    );
};

function TodayAuction() {
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showEditProduct, setShowEditProduct] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showHidden, setShowHidden] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: '',
        sellerId: '',
        sellerName: '',
        date: new Date().toISOString().split('T')[0],
        variants: []
    });

    const [variantData, setVariantData] = useState({
        variety: '',
        quality: 'Good',
        quantity: '',
        unit: 'kg',
        commission: ''
    });

    const [imagePreview, setImagePreview] = useState(null);

    const [saleData, setSaleData] = useState({
        buyerId: '',
        buyerName: '',
        variantId: '',
        finalPrice: '',
        qtyToSell: '',
        paymentStatus: 'Paid',
        amountPaid: '',
    });

    const resetVariantData = () => {
        setVariantData({
            variety: '',
            quality: 'Good',
            quantity: '',
            unit: 'kg',
            commission: ''
        });
    };

    const resetProductForm = () => {
        setNewProduct({
            name: '',
            sellerId: '',
            sellerName: '',
            date: new Date().toISOString().split('T')[0],
            variants: [],
            image: ''
        });
        setImagePreview(null);
        resetVariantData();
    };

    const closeAddModal = () => {
        setShowAddProduct(false);
        resetProductForm();
    };

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

    const handleAddVariant = () => {
        if (!variantData.variety || !variantData.quantity) {
            toast.error("Please add at least Variety and Quantity");
            return;
        }

        const newVariant = {
            id: Date.now(),
            ...variantData,
            commission: parseFloat(variantData.commission) || 0,
            quantity: parseFloat(variantData.quantity)
        };

        setNewProduct({
            ...newProduct,
            variants: [...newProduct.variants, newVariant]
        });

        toast.success("Variant added successfully");

        resetVariantData();
    };


    const handleDeleteVariant = (id) => {
        setNewProduct({
            ...newProduct,
            variants: newProduct.variants.filter(v => v.id !== id)
        });
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
        // Find seller name from ID
        const seller = sellers.find(s => s.id === product.sellerId);
        setEditingProduct({
            ...product,
            varieties: product.varieties || '',
            sellerName: seller ? seller.name : ''
        });
        setImagePreview(product.image);
        setShowEditProduct(true);
    };

    const handleEditProduct = (e) => {
        e.preventDefault();
        const data = getAuctionData();
        const index = data.products.findIndex(p => p.id === editingProduct.id);

        if (index !== -1) {
            data.products[index] = {
                ...editingProduct,
                // Ensure variants are preserved or updated if we add editing logic later
                variants: editingProduct.variants,
                // price, quantity, etc. are now in variants or removed
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

        if (!newProduct.name) {
            toast.error("Product name is required");
            return;
        }

        if (!newProduct.sellerId) {
            toast.error("Please select a seller");
            return;
        }

        if (!newProduct.variants || newProduct.variants.length === 0) {
            toast.error("Add at least one variant before saving product");
            return;
        }

        const data = getAuctionData();

        let id = data.products.length + 1;

        const product = {
            id: id,
            name: newProduct.name,
            sellerId: newProduct.sellerId,
            date: newProduct.date || new Date().toISOString().split('T')[0],
            status: 'available',
            isActive: true,
            variants: newProduct.variants,
            image: newProduct.image
        };

        data.products.push(product);
        saveAuctionData(data);

        toast.success("Product added successfully");

        resetProductForm();
        setShowAddProduct(false);
        loadData();
    };


    const handleSellProduct = (e) => {
        e.preventDefault();
        const data = getAuctionData();

        // Update product status/quantity
        const productIndex = data.products.findIndex(p => p.id === selectedProduct.id);
        const product = data.products[productIndex];

        // Find the variant
        const variantIndex = product.variants.findIndex(v => v.id == saleData.variantId);
        if (variantIndex === -1) return; // Should not happen

        const variant = product.variants[variantIndex];
        const sellQty = parseFloat(saleData.qtyToSell) || 0;

        if (sellQty >= variant.quantity) {
            // Sold out this variant
            product.variants[variantIndex].quantity = 0;
            // Check if all variants are sold out? 
            // For now, if all quantities are 0, mark product properly if needed, but 'status' was on product level.
            // Let's keep product 'available' unless all variants zero? 
            // Or just rely on visual disabled state if quantity 0.
        } else {
            product.variants[variantIndex].quantity = variant.quantity - sellQty;
        }

        // Add transaction
        const finalPrice = parseFloat(saleData.finalPrice);
        const commission = (finalPrice * variant.commission) / 100;

        let amountPaid = 0;
        if (saleData.paymentStatus === 'Paid') amountPaid = finalPrice;
        else if (saleData.paymentStatus === 'Part Paid') amountPaid = parseFloat(saleData.amountPaid) || 0;
        else amountPaid = 0;

        const transaction = {
            transaction: 0,
            date: new Date().toISOString().split('T')[0],
            product: `${product.name} - ${variant.variety}`,
            productId: product.id,
            activeVariantId: variant.id,
            quantity: parseFloat(saleData.qtyToSell),
            unit: variant.unit || 'qty',
            sellerId: product.sellerId,
            buyerId: saleData.buyerId,
            price: finalPrice,
            commission: commission,
            commissionPercent: variant.commission,
            paymentStatus: saleData.paymentStatus,
            amountPaid: amountPaid,
            balance: finalPrice - amountPaid,
            // Seller specific fields
            netAmount: finalPrice - commission,
            credit: 0,
            sellerPaymentStatus: 'Pending',
            sellerAmountPaid: 0
        };

        // Fix ID generation to avoid potential collisions if rapid clicks
        transaction.id = Date.now();

        data.transactions.push(transaction);
        saveAuctionData(data);

        setSaleData({ buyerId: '', buyerName: '', variantId: '', finalPrice: '', qtyToSell: '', paymentStatus: 'Paid', amountPaid: '' });
        setShowSellModal(false);
        setSelectedProduct(null);
        loadData();
    };

    const openSellModal = (product) => {
        setSelectedProduct(product);
        setSaleData({
            buyerId: '',
            buyerName: '',
            variantId: '',
            finalPrice: '',
            qtyToSell: '',
            paymentStatus: 'Paid',
            amountPaid: '',
        });
        setShowSellModal(true);
    };

const capitalizeFirst = (text) => {
  if (text == null) return "";
  const str = String(text);
  return str.charAt(0).toUpperCase() + str.slice(1);
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
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={showHidden}
                                onChange={(e) => setShowHidden(e.target.checked)}
                            />
                            <span className="slider"></span>
                            <span className="toggle-label">
                                {showHidden ? '🚫 Hide Disabled' : '👁️ Show Disabled'}
                            </span>
                        </label>
                        <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                            <span><Plus /></span>
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
                            <div className="empty-state-icon"><PackageSearch /></div>
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
                                                {capitalizeFirst(product.name)}
                                                {product.varieties ? ` - ${capitalizeFirst(product.varieties)}` : ''}
                                                {product.isActive === false && (
                                                    <span className="badge badge-error ml-2">Disabled</span>
                                                )}
                                            </div>

                                            <div className="action-buttons">
                                                <button className="icon-btn" onClick={() => toggleProductStatus(product.id)} title={product.isActive === false ? "Enable" : "Disable"}>
                                                    {product.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                                <button className="icon-btn edit" onClick={() => openEditModal(product)} title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="icon-btn delete" onClick={() => handleDeleteClick(product.id)} title="Delete">
                                                    <Trash2 size={18} />
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
                                                Seller: <strong>{sellers.find(s => s.id === product.sellerId)?.name}</strong>
                                            </div>

                                            <div className="product-variants">
                                                {product.variants && product.variants.map(v => (
                                                    <div key={v.id} className="variant-box" style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        padding: '8px',
                                                        borderRadius: '4px',
                                                        marginBottom: '4px',
                                                        fontSize: '0.9em'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span>{capitalizeFirst(v.variety)}</span>
                                                            <span className={`badge ${v.quality === 'Excellent' ? 'badge-success' : v.quality === 'Good' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: '0.7em', padding: '2px 6px' }}>{v.quality}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                                            <span>{v.quantity} {v.unit}</span>
                                                            <span className="text-amber">{v.commission}% Comm</span>
                                                        </div>
                                                    </div>
                                                ))}
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
                <div className="modal-overlay" onClick={closeAddModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Product</h3>
                            <button className="modal-close" onClick={closeAddModal}><X /></button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Auction Date</label>
                                    <input
                                        type="date"
                                        value={newProduct.date}
                                        onChange={(e) => setNewProduct({ ...newProduct, date: e.target.value })}
                                        disabled
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value.replace(/\s/g, '').toLowerCase() })}
                                        placeholder="e.g. Vintage Clock, Fruits..."
                                        required
                                    />
                                </div>

                                <SearchableSelect
                                    label="Seller"
                                    options={sellers}
                                    value={newProduct.sellerName}
                                    onChange={(seller) =>
                                        setNewProduct({
                                            ...newProduct,
                                            sellerId: seller.id,
                                            sellerName: seller.name
                                        })
                                    }
                                    placeholder="Type to search seller..."
                                    required
                                />

                                <div className="form-group">
                                    <label className="form-label">Variants</label>
                                    <div className="variant-row">
                                        <input
                                            type="text"
                                            placeholder="Variety"
                                            value={variantData.variety}
                                            onChange={(e) =>
                                                setVariantData({ ...variantData, variety: e.target.value.toLowerCase() })
                                            }
                                        />

                                        <select
                                            value={variantData.quality}
                                            onChange={(e) =>
                                                setVariantData({ ...variantData, quality: e.target.value })
                                            }
                                        >
                                            <option value="Excellent">Excellent</option>
                                            <option value="Good">Good</option>
                                            <option value="Fair">Fair</option>
                                        </select>

                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={variantData.quantity}
                                            onChange={(e) =>
                                                setVariantData({ ...variantData, quantity: e.target.value })
                                            }
                                        />

                                        <select
                                            value={variantData.unit}
                                            onChange={(e) =>
                                                setVariantData({ ...variantData, unit: e.target.value })
                                            }
                                        >
                                            <option value="kg">kg</option>
                                            <option value="qty">qty</option>
                                            <option value="pcs">pcs</option>
                                            <option value="ltr">ltr</option>
                                            <option value="box">box</option>
                                        </select>

                                        <input
                                            type="number"
                                            placeholder="Comm %"
                                            value={variantData.commission}
                                            onChange={(e) =>
                                                setVariantData({ ...variantData, commission: e.target.value })
                                            }
                                        />

                                        <button type="button" className="btn btn-primary" style={{ padding: '8px 12px' }} onClick={handleAddVariant}>
                                            Add
                                        </button>
                                    </div>
                                </div>
                                {newProduct.variants && newProduct.variants.length > 0 && (
                                    <div className="table-responsive" style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                        <table className="variant-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                                    <th style={{ padding: '8px' }}>Variety</th>
                                                    <th style={{ padding: '8px' }}>Quality</th>
                                                    <th style={{ padding: '8px' }}>Qty</th>
                                                    <th style={{ padding: '8px' }}>Unit</th>
                                                    <th style={{ padding: '8px' }}>Comm %</th>
                                                    <th style={{ padding: '8px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {newProduct.variants.map(v => (
                                                    <tr key={v.id} style={{ borderBottom: '1px solid #333' }}>
                                                        <td style={{ padding: '8px' }}>{v.variety}</td>
                                                        <td style={{ padding: '8px' }}>{v.quality}</td>
                                                        <td style={{ padding: '8px' }}>{v.quantity}</td>
                                                        <td style={{ padding: '8px' }}>{v.unit}</td>
                                                        <td style={{ padding: '8px' }}>{v.commission}%</td>
                                                        <td style={{ padding: '8px' }}>
                                                            <button
                                                                type="button"
                                                                className="icon-btn delete"
                                                                onClick={() => handleDeleteVariant(v.id)}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
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
                                <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
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
                                    <label className="form-label">Auction Date</label>
                                    <input
                                        type="date"
                                        value={editingProduct.date}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, date: e.target.value })}
                                        required
                                        disabled
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value.replace(/\s/g, '').toLowerCase() })}
                                        placeholder="Product Name"
                                        required
                                    />
                                </div>
                                <SearchableSelect
                                    label="Seller"
                                    options={sellers}
                                    value={editingProduct.sellerName}
                                    onChange={(seller) => setEditingProduct({
                                        ...editingProduct,
                                        sellerId: seller.id,
                                        sellerName: seller.name
                                    })}
                                    placeholder="Type to search seller..."
                                    required
                                />

                                {editingProduct.variants && editingProduct.variants.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Variants (Read-only)</label>
                                        <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <table className="variant-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px' }}>Variety</th>
                                                        <th style={{ padding: '8px' }}>Quality</th>
                                                        <th style={{ padding: '8px' }}>Qty</th>
                                                        <th style={{ padding: '8px' }}>Unit</th>
                                                        <th style={{ padding: '8px' }}>Comm %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {editingProduct.variants.map(v => (
                                                        <tr key={v.id} style={{ borderBottom: '1px solid #333' }}>
                                                            <td style={{ padding: '8px' }}>{v.variety}</td>
                                                            <td style={{ padding: '8px' }}>{v.quality}</td>
                                                            <td style={{ padding: '8px' }}>{v.quantity}</td>
                                                            <td style={{ padding: '8px' }}>{v.unit}</td>
                                                            <td style={{ padding: '8px' }}>{v.commission}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
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
                            <button className="modal-close" onClick={() => setShowSellModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSellProduct}>
                            <div className="modal-body">
                                <SearchableSelect
                                    label="Buyer"
                                    options={buyers}
                                    value={saleData.buyerName}
                                    onChange={(buyer) => setSaleData({
                                        ...saleData,
                                        buyerId: buyer.id,
                                        buyerName: buyer.name
                                    })}
                                    placeholder="Type to search buyer..."
                                    required
                                />

                                <div className="form-group">
                                    <label className="form-label">Select Variant</label>
                                    <select
                                        value={saleData.variantId}
                                        onChange={(e) =>
                                            setSaleData({ ...saleData, variantId: e.target.value })
                                        }
                                        required
                                        className="form-input"
                                    >
                                        <option value="">-- Select Variant --</option>
                                        {selectedProduct.variants && selectedProduct.variants.map(v => (
                                            <option key={v.id} value={v.id} disabled={v.quantity <= 0}>
                                                {capitalizeFirst(v.variety)} - {v.quality} - {v.quantity} {v.unit} ({v.commission}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {saleData.variantId && (() => {
                                    const v = selectedProduct.variants.find(val => val.id == saleData.variantId);
                                    if (!v) return null;
                                    return (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Quantity to Sell ({v.unit})</label>
                                                <input
                                                    type="number"
                                                    value={saleData.qtyToSell}
                                                    onChange={(e) => setSaleData({ ...saleData, qtyToSell: e.target.value })}
                                                    max={v.quantity}
                                                    min="0.1"
                                                    step="0.1"
                                                    placeholder={`Max: ${v.quantity}`}
                                                    required
                                                />
                                                <small className="form-hint">
                                                    Remaining: {(v.quantity - (parseFloat(saleData.qtyToSell) || 0)).toFixed(2)} {v.unit}
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
                                                    <strong>Commission ({v.commission}%):</strong>{' '}
                                                    <span className="text-amber">
                                                        ₹{((parseFloat(saleData.finalPrice) || 0) * v.commission / 100).toLocaleString()}
                                                    </span>
                                                </p>
                                                <p className="calc-row-last">
                                                    <strong>Seller Receives:</strong>{' '}
                                                    ₹{((parseFloat(saleData.finalPrice) || 0) * (100 - v.commission) / 100).toLocaleString()}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
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
