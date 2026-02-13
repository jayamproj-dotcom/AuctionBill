import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import ConfirmationModal from '../Common/ConfirmationModal';
import './PendingProducts.css';
import '../TodayAuction/TodayAuction.css'; // Reusing base card styles
import {Undo2, ListFilterPlus} from 'lucide-react';

function PendingProducts() {
    const [pendingProducts, setPendingProducts] = useState([]);
    const [today, setToday] = useState('');

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        setToday(todayStr);
        loadPendingProducts(todayStr);
    }, []);

    const loadPendingProducts = (currentDate) => {
        const data = getAuctionData();
        if (data && data.products) {
            const filtered = data.products.filter(p => {
                if (p.status !== 'available') return false;
                
                // Determine product date (fallback to id timestamp if no explicit date)
                const pDate = p.date || new Date(p.id).toISOString().split('T')[0];
                
                // Show if date is less than today (yesterday or older)
                return pDate < currentDate;
            });
            setPendingProducts(filtered);
        }
    };

    const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
    const [productToReturn, setProductToReturn] = useState(null);

    const [isMoveToTodayConfirmOpen, setIsMoveToTodayConfirmOpen] = useState(false);
    const [productToMove, setProductToMove] = useState(null);

    const handleReturnClick = (product) => {
        setProductToReturn(product);
        setIsReturnConfirmOpen(true);
    };

    const confirmReturnProduct = () => {
        if (productToReturn) {
            const data = getAuctionData();
            // Find product by id directly. Note: data.products is an array.
            const index = data.products.findIndex(p => p.id === productToReturn.id);
            if (index !== -1) {
                // Mark as returned (removing it from active lists)
                data.products[index].status = 'returned';
                saveAuctionData(data);
                loadPendingProducts(today); // Refresh list
                setIsReturnConfirmOpen(false);
                setProductToReturn(null);
            }
        }
    };

    const handleBackToToday = (product) => {
        setProductToMove(product);
        setIsMoveToTodayConfirmOpen(true);
    };

    const confirmMoveToToday = () => {
        if (productToMove) {
            const data = getAuctionData();
            const index = data.products.findIndex(p => p.id === productToMove.id);
            if (index !== -1) {
                // Update date to today
                data.products[index].date = today;
                saveAuctionData(data);
                loadPendingProducts(today);
            }
            setIsMoveToTodayConfirmOpen(false);
            setProductToMove(null);
        }
    };

    return (
        <>
            <ConfirmationModal 
                isOpen={isReturnConfirmOpen}
                onClose={() => setIsReturnConfirmOpen(false)}
                onConfirm={confirmReturnProduct}
                title="Return Product"
                message={`Are you sure you want to return "${productToReturn?.name || 'this product'}"?`}
                subMessage="This item will be marked as returned."
                confirmText="Yes, Return"
                cancelText="Cancel"
                variant="warning"
            />
            <ConfirmationModal 
                isOpen={isMoveToTodayConfirmOpen}
                onClose={() => setIsMoveToTodayConfirmOpen(false)}
                onConfirm={confirmMoveToToday}
                title="Move to Today's Auction"
                message={`Are you sure you want to move "${productToMove?.name || 'this product'}" back to Today's Auction?`}
                subMessage="This item will appear in the active auction list for today."
                confirmText="Yes, Move"
                cancelText="Cancel"
                variant="success"
            />
            <div className="content-header">
                <div className="header-top">
                    <h1>Pending Products</h1>
                </div>
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>Pending Products</span>
                </div>
            </div>

            <div className="content-body pending-products-container">
                <div className="section-header">
                    <h3 className="section-title">Unsold Products from Previous Days ({pendingProducts.length})</h3>
                </div>

                <div className="card-list fade-in">
                    {pendingProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">✅</div>
                            <p>No pending products found.</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {pendingProducts.map(product => (
                                <div key={product.id} className="data-card product-card pending-product-card">
                                    <div className="data-card-header product-card-header">
                                        <div className="data-card-title product-card-title">
                                            {product.name}
                                            {product.varieties && product.varieties.length > 0
                                                ? ` - ${product.varieties
                                                    .filter(v => typeof v === 'string' || v.active !== false)
                                                    .map(v => (typeof v === 'string' ? v : v.name))
                                                    .join(', ')}`
                                                : ''}
                                        </div>
                                        <span className="pending-badge">Pending</span>
                                    </div>
                                    
                                    <div className="data-card-body product-card-body">
                                        <div className="product-image-container">
                                            {product.image ? (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className="product-image"
                                                />
                                            ) : (
                                                <span className="product-image-placeholder">📦</span>
                                            )}
                                        </div>

                                        <div className="data-card-subtitle product-card-subtitle">
                                            Seller: <strong>{product.seller}</strong>
                                        </div>

                                        <div className="date-info">
                                            <span>📅 Created: {product.date || new Date(product.id).toLocaleDateString()}</span>
                                        </div>

                                        <div className="data-row">
                                            <span className="data-label">Base Price</span>
                                            <span className="data-value">₹{product.price.toLocaleString()}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Qty / Unit</span>
                                            <span className="data-value">{product.quantity} {product.unit || 'qty'}</span>
                                        </div>
                                    </div>

                                    <div className="data-card-footer product-card-footer pending-actions">
                                        <button 
                                            className="btn btn-error btn-pending-action return-btn"
                                            onClick={() => handleReturnClick(product)}
                                        >
                                            <Undo2 /> Return
                                        </button>
                                        <button 
                                            className="btn btn-success btn-pending-action back-today-btn"
                                            onClick={() => handleBackToToday(product)}
                                        >
                                            <ListFilterPlus /> To Today
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default PendingProducts;
