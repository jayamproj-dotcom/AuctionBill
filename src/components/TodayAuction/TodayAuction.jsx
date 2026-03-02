import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './TodayAuction.css';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, X, Eye, EyeOff, PackageSearch, Search } from 'lucide-react';

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
        <div className="form-group form-group-relative">
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
    const [searchQuery, setSearchQuery] = useState('');


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
        sellQuantity: 0,
        unit: 'kg',
        commission: '',
        commissionAmountForSellQuantity: 0,
        priceAmountForSellQuantity: 0,
        balance: 0,
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
            commission: '',
            commissionAmountForSellQuantity: 0,
            priceAmountForSellQuantity: 0,
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
            commissionPercent: parseFloat(variantData.commission) || 0, // Using commissionPercent
            quantity: parseFloat(variantData.quantity),
            // sellQuantity, balance, etc removed
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
        const today = new Date().toISOString().split('T')[0];

        // Enrich products with calculated sold stats from transactions
        const productsWithStats = data.products.map(p => {
            const productTransactions = (data.transactions || []).filter(t => t.productId === p.id);

            const variantsWithStats = (p.variants || []).map(v => {
                const variantTransactions = productTransactions.filter(t => t.variantId === v.id);
                const sold = variantTransactions.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
                return { ...v, sellQuantity: sold };
            });

            // Determine status dynamically
            const isSoldOut = variantsWithStats.length > 0 && variantsWithStats.every(v => v.sellQuantity >= v.quantity);
            const status = isSoldOut ? 'soldout' : p.status;

            return { ...p, variants: variantsWithStats, status };
        });

        // Load all available products. Sort by ID (desc) to show newest first.
        const sortedProducts = productsWithStats
            .filter(p => (p.status === 'available' || p.status === 'soldout') && p.date === today)
            .sort((a, b) => b.id - a.id);

        setProducts(sortedProducts);
        setSellers(data.sellers.filter(s => s.status === 'active'));
        setBuyers(data.buyers.filter(b => b.status === 'active'));
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

        // Find the variant to validate stock
        const productIndex = data.products.findIndex(p => p.id === selectedProduct.id);
        const product = data.products[productIndex];
        const variantIndex = product.variants.findIndex(v => v.id == saleData.variantId);
        if (variantIndex === -1) return;

        const variant = product.variants[variantIndex];

        // Calculate current sold quantity from transactions
        const existingTransactions = (data.transactions || []).filter(t => t.variantId === variant.id);
        const currentSold = existingTransactions.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

        const sellQty = parseFloat(saleData.qtyToSell) || 0;
        const available = variant.quantity - currentSold;

        if (sellQty > available) {
            toast.error(`Cannot sell more than available quantity (${available})`);
            return;
        }

        // Calculate amounts
        const finalPrice = parseFloat(saleData.finalPrice) || 0;
        const totalAmount = finalPrice;
        const totalCommission = (totalAmount * variant.commissionPercent) / 100; // Assuming commissionPercent is in variant

        // Create Transaction Record (Pure Sales)
        const transaction = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],

            sellerId: product.sellerId,
            buyerId: saleData.buyerId,

            productId: product.id,
            variantId: variant.id,

            quantity: sellQty,
            rate: finalPrice / sellQty, // Calculate rate per unit
            finalAmount: totalAmount,

            commissionPercent: variant.commissionPercent,
            commissionAmount: totalCommission,
            netAmount: totalAmount - totalCommission
        };

        if (!data.transactions) data.transactions = [];
        data.transactions.push(transaction);

        // Record Payment if applicable
        let paymentAmount = 0;
        if (saleData.paymentStatus === 'Paid') {
            paymentAmount = totalAmount;
        } else if (saleData.paymentStatus === 'Part Paid') {
            paymentAmount = parseFloat(saleData.amountPaid) || 0;
        }

        if (paymentAmount > 0) {
            const payment = {
                id: Date.now() + 1, // Ensure unique ID (offset from transaction)
                buyerId: saleData.buyerId,
                date: new Date().toISOString().split('T')[0],
                amount: paymentAmount,
                method: 'Cash', // Default to Cash for now
                note: `Payment for ${product.name} (${variant.variety})`,
                reference: `SALE-${transaction.id}`
            };

            if (!data.buyerPayments) data.buyerPayments = [];
            data.buyerPayments.push(payment);
        }

        saveAuctionData(data);

        setSaleData({ buyerId: '', buyerName: '', variantId: '', finalPrice: '', qtyToSell: '', paymentStatus: 'Paid', amountPaid: '' });
        setShowSellModal(false);
        setSelectedProduct(null);
        loadData(); // This will recalculate sold stats and update UI
        toast.success("Sale recorded successfully");
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

                {/* Search Bar */}
                <div className="card fade-in search-card">
                    <div className="form-group search-form-group">
                        <div className="search-icon-container">
                            <input
                                type="text"
                                placeholder="Search by product, seller, or variant..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <Search size={20} className="search-icon-absolute" />
                        </div>
                    </div>
                </div>

                <div className="card-list fade-in">
                    {products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><PackageSearch /></div>
                            <p>No products available for auction today</p>
                        </div>
                    ) : (
                        <div className="table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper">
                            <table className="data-table custom-data-table">
                                <thead className="bg-tertiary">
                                    <tr>
                                        <th className="custom-th">Product Details</th>
                                        <th className="custom-th">Seller</th>
                                        <th className="custom-th">Variants (Qty & Comm)</th>
                                        <th className="custom-th">Status</th>
                                        <th className="custom-th custom-th-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products
                                        .filter(product => {
                                            if (!searchQuery) return true;
                                            const query = searchQuery.toLowerCase();
                                            const seller = sellers.find(s => s.id === product.sellerId);
                                            const sellerName = seller ? seller.name.toLowerCase() : '';
                                            const productName = product.name.toLowerCase();
                                            const hasMatchingVariant = product.variants && product.variants.some(v => v.variety.toLowerCase().includes(query));
                                            
                                            return sellerName.includes(query) || productName.includes(query) || hasMatchingVariant;
                                        })
                                        .map(product => (
                                            <tr key={product.id} className={`${product.isActive === false ? 'product-disabled' : ''} custom-tr`}>
                                                <td className="custom-td">
                                                    <div className="font-semibold text-primary table-product-name">
                                                        {capitalizeFirst(product.name)}
                                                    </div>
                                                    {product.varieties && (
                                                        <div className="text-muted table-product-subtext">
                                                            {capitalizeFirst(product.varieties)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="custom-td">
                                                    <strong>{sellers.find(s => s.id === product.sellerId)?.name}</strong>
                                                </td>
                                                <td className="custom-td custom-td-variants">
                                                    <div className="product-variants">
                                                        {product.variants && product.variants.map(v => {
                                                            const sold = v.sellQuantity || 0;
                                                            const remaining = v.quantity - sold;
                                                            return (
                                                                <div key={v.id} className="variant-card">
                                                                    <div className="variant-card-header">
                                                                        <span>{capitalizeFirst(v.variety)}</span>
                                                                        <span className={`badge ${v.quality === 'Excellent' ? 'badge-success' : v.quality === 'Good' ? 'badge-warning' : 'badge-error'} badge-sm`}>{v.quality}</span>
                                                                    </div>
                                                                    <div className="variant-card-metrics">
                                                                        <span>{remaining} {v.unit}</span>
                                                                        <span className="text-amber font-semibold">{v.commission}% Comm</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="custom-td">
                                                    {product.status === 'soldout' ? (
                                                        <span className="badge badge-error">Sold Out</span>
                                                    ) : product.isActive === false ? (
                                                        <span className="badge badge-disabled">Disabled</span>
                                                    ) : (
                                                        <span className="badge badge-success">Available</span>
                                                    )}
                                                </td>
                                                <td className="custom-td">
                                                    <div className="action-stack">
                                                        <button
                                                            className="btn btn-success action-btn-wide"
                                                            onClick={() => openSellModal(product)}
                                                            disabled={product.isActive === false || product.status === 'soldout'}
                                                        >
                                                            Sell
                                                        </button>
                                                        <div className="action-icon-row">
                                                            <button className="icon-btn action-icon-small" onClick={() => toggleProductStatus(product.id)} title={product.isActive === false ? "Enable" : "Disable"}>
                                                                {product.isActive === false ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                            <button className="icon-btn edit action-icon-small" onClick={() => openEditModal(product)} title="Edit">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button className="icon-btn delete action-icon-small" onClick={() => handleDeleteClick(product.id)} title="Delete">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
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
                                            <option value="Excellent">quality1</option>
                                            <option value="Good">quality2</option>
                                            <option value="Fair">quality3</option>
                                        </select>

                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={variantData.quantity}
                                            min={1}
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
                                            min={0}
                                            value={variantData.commission}
                                            onChange={(e) =>
                                                setVariantData({ ...variantData, commission: e.target.value })
                                            }
                                        />

                                        <button type="button" className="btn btn-primary add-variant-btn" onClick={handleAddVariant}>
                                            Add
                                        </button>
                                    </div>
                                </div>
                                {newProduct.variants && newProduct.variants.length > 0 && (
                                    <div className="table-responsive table-responsive-variants">
                                        <table className="variant-table">
                                            <thead>
                                                <tr className="variant-table-th">
                                                    <th className="variant-table-th">Variety</th>
                                                    <th className="variant-table-th">Quality</th>
                                                    <th className="variant-table-th">Qty</th>
                                                    <th className="variant-table-th">Unit</th>
                                                    <th className="variant-table-th">Comm %</th>
                                                    <th className="variant-table-th">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {newProduct.variants.map(v => (
                                                    <tr key={v.id} className="variant-table-tr">
                                                        <td className="variant-table-td">{v.variety}</td>
                                                        <td className="variant-table-td">{v.quality}</td>
                                                        <td className="variant-table-td">{v.quantity}</td>
                                                        <td className="variant-table-td">{v.unit}</td>
                                                        <td className="variant-table-td">{v.commission}%</td>
                                                        <td className="variant-table-td">
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
                                {/* <div className="form-group">
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
                                </div> */}

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
                                        <div className="table-responsive-variants">
                                            <table className="variant-table">
                                                <thead>
                                                    <tr className="variant-table-tr-header">
                                                        <th className="variant-table-th">Variety</th>
                                                        <th className="variant-table-th">Quality</th>
                                                        <th className="variant-table-th">Qty</th>
                                                        <th className="variant-table-th">Unit</th>
                                                        <th className="variant-table-th">Comm %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {editingProduct.variants.map(v => (
                                                        <tr key={v.id} className="variant-table-tr">
                                                            <td className="variant-table-td">{v.variety}</td>
                                                            <td className="variant-table-td">{v.quality}</td>
                                                            <td className="variant-table-td">{v.quantity}</td>
                                                            <td className="variant-table-td">{v.unit}</td>
                                                            <td className="variant-table-td">{v.commission}%</td>
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
                                        {selectedProduct.variants && selectedProduct.variants.map(v => {
                                            const sold = v.sellQuantity || 0;
                                            const remaining = v.quantity - sold;
                                            return (
                                                <option key={v.id} value={v.id} disabled={remaining <= 0}>
                                                    {capitalizeFirst(v.variety)} - {v.quality} - {remaining} / {v.quantity} {v.unit} ({v.commission}%)
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                {saleData.variantId && (() => {
                                    const v = selectedProduct.variants.find(val => val.id == saleData.variantId);
                                    if (!v) return null;
                                    const sold = v.sellQuantity || 0;
                                    const available = v.quantity - sold;

                                    return (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Quantity to Sell ({v.unit})</label>
                                                <input
                                                    type="number"
                                                    value={saleData.qtyToSell}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setSaleData({ ...saleData, qtyToSell: '' });
                                                        } else {
                                                            const numVal = parseFloat(val);
                                                            if (numVal > available) {
                                                                toast.error(`Quantity cannot exceed ${available} ${v.unit}`);
                                                                setSaleData({ ...saleData, qtyToSell: available });
                                                            } else {
                                                                setSaleData({ ...saleData, qtyToSell: val });
                                                            }
                                                        }
                                                    }}
                                                    max={available}
                                                    min="1"
                                                    step="1"
                                                    placeholder={`Max: ${available}`}
                                                    required
                                                />
                                                <small className="form-hint">
                                                    Remaining: {(available - (parseFloat(saleData.qtyToSell) || 0)).toFixed(2)} {v.unit}
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
                                            {/* <div className="form-grid qty-input-group">
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
                                            </div> */}
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
