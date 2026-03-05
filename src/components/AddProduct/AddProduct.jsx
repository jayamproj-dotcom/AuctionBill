import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Plus, X, Loader2, Edit2 } from 'lucide-react';
import * as productApi from '../../api/vendorApi';
import ConfirmationModal from '../Common/ConfirmationModal';
import './AddProduct.css';

function AddProduct() {
    const [masterProducts, setMasterProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    const [newMaster, setNewMaster] = useState({
        name: '',
        varieties: [],
        units: []
    });
    const [tempVariety, setTempVariety] = useState('');
    const [tempUnit, setTempUnit] = useState('kg');

    const vendor = JSON.parse(localStorage.getItem('vendor')) || {};
    const vendorId = vendor.id || vendor._id;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await productApi.getProducts({ vendorId });
            setMasterProducts(data);
        } catch (error) {
            toast.error("Failed to load products");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMaster = async (e) => {
        e.preventDefault();
        if (!newMaster.name) {
            toast.error("Please enter product name");
            return;
        }
        if (newMaster.varieties.length === 0) {
            toast.error("Add at least one variety");
            return;
        }
        if (newMaster.units.length === 0) {
            toast.error("Add at least one quantity type");
            return;
        }

        try {
            if (isEditing) {
                const result = await productApi.updateProduct(editingProductId, newMaster);
                setMasterProducts(masterProducts.map(p => p._id === editingProductId ? result.product : p));
                toast.success("Product updated successfully");
            } else {
                const result = await productApi.addProduct({
                    ...newMaster,
                    vendorId
                });
                setMasterProducts([result.product, ...masterProducts]);
                toast.success("Product added successfully");
            }
            
            closeModal();
        } catch (error) {
            toast.error(error.message || "Failed to save product");
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setEditingProductId(null);
        setNewMaster({ name: '', varieties: [], units: [] });
    };

    const openEditModal = (product) => {
        setIsEditing(true);
        setEditingProductId(product._id);
        setNewMaster({
            name: product.name,
            varieties: product.varieties || [],
            units: product.units || []
        });
        setShowModal(true);
    };

    const addVariety = () => {
        if (!tempVariety.trim()) return;
        if (newMaster.varieties.includes(tempVariety.trim())) {
            toast.warning("Variety already added");
            return;
        }
        setNewMaster({
            ...newMaster,
            varieties: [...newMaster.varieties, tempVariety.trim()]
        });
        setTempVariety('');
    };

    const removeVariety = (val) => {
        setNewMaster({
            ...newMaster,
            varieties: newMaster.varieties.filter(v => v !== val)
        });
    };

    const addUnit = () => {
        if (newMaster.units.includes(tempUnit)) {
            toast.warning("Unit already added");
            return;
        }
        setNewMaster({
            ...newMaster,
            units: [...newMaster.units, tempUnit]
        });
    };

    const removeUnit = (val) => {
        setNewMaster({
            ...newMaster,
            units: newMaster.units.filter(u => u !== val)
        });
    };

    const handleDeleteClick = (id) => {
        setProductToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await productApi.deleteProduct(productToDelete);
            setMasterProducts(masterProducts.filter(item => item._id !== productToDelete));
            toast.success("Product removed from list");
            setShowDeleteModal(false);
        } catch (error) {
            toast.error("Failed to delete product");
        } finally {
            setDeleteLoading(false);
            setProductToDelete(null);
        }
    };

    return (
        <div className="main-content">
            <div className="content-header">
                <div className="add-product-header-top">
                    <h1>Product List</h1>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        Add Product
                    </button>
                </div>
                <div className="add-product-breadcrumb">
                    <span>Home</span>
                    <span className="add-product-breadcrumb-separator">/</span>
                    <span>Product List</span>
                </div>
            </div>

            <div className="add-product-content-body table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper">
                <div className="add-product-card fade-in">
                    <div className="add-product-table-responsive">
                        <table className="add-product-variant-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Varieties</th>
                                    <th>Quantity Types</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Loader2 className="animate-spin" size={24} color="var(--primary-color)" />
                                                <span style={{ color: 'var(--text-secondary)' }}>Loading products...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : masterProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                            No products found. Click "Add Product" to start building your list.
                                        </td>
                                    </tr>
                                ) : (
                                    masterProducts.map(item => (
                                        <tr key={item._id || item.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</td>
                                            <td>
                                                <div className="tag-container">
                                                    {(item.varieties || []).map((v, idx) => (
                                                        <span key={idx} className="variety-tag">{v}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="tag-container">
                                                    {(item.units || []).map((u, idx) => (
                                                        <span key={idx} className="unit-tag">{u}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button
                                                        className="icon-btn edit"
                                                        onClick={() => openEditModal(item)}
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        className="icon-btn delete"
                                                        onClick={() => handleDeleteClick(item._id)}
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={18} />
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

            {/* Modal Popup */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{isEditing ? 'Edit Product' : 'Add New Product to List'}</h3>
                            <button className="modal-close" onClick={closeModal}><X /></button>
                        </div>
                        <form onSubmit={handleAddMaster}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        className="add-product-input"
                                        placeholder="e.g. Turmeric, Jasmine..."
                                        value={newMaster.name}
                                        onChange={e => setNewMaster({...newMaster, name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="builder-section">
                                    <label className="form-label">Varieties</label>
                                    <div className="builder-input-group">
                                        <input
                                            type="text"
                                            className="add-product-input"
                                            placeholder="Add Variety..."
                                            value={tempVariety}
                                            onChange={e => setTempVariety(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addVariety())}
                                        />
                                        <button type="button" className="btn btn-primary btn-sm-product" onClick={addVariety}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div className="tag-container mt-2">
                                        {newMaster.varieties.map((v, i) => (
                                            <span key={i} className="variety-tag-editable">
                                                {v} <X size={14} onClick={() => removeVariety(v)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="builder-section">
                                    <label className="form-label">Quantity Types (Units)</label>
                                    <div className="builder-input-group">
                                        <select
                                            className="add-product-select"
                                            value={tempUnit}
                                            onChange={e => setTempUnit(e.target.value)}
                                        >
                                            <option value="kg">kg</option>
                                            <option value="qty">qty</option>
                                            <option value="pcs">pcs</option>
                                            <option value="ltr">ltr</option>
                                            <option value="box">box</option>
                                        </select>
                                        <button type="button" className="btn btn-primary btn-sm-product" onClick={addUnit}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div className="tag-container mt-2">
                                        {newMaster.units.map((u, i) => (
                                            <span key={i} className="unit-tag-editable">
                                                {u} <X size={14} onClick={() => removeUnit(u)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Product"
                message="Are you sure you want to remove this product from your list?"
                subMessage="This will not affect existing auctions but the product won't be available for new selections."
                confirmText="Yes, Remove"
                isLoading={deleteLoading}
            />
        </div>
    );
}

export default AddProduct;
