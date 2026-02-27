import { useState, useEffect } from 'react';
import { getAuctionData, saveAuctionData } from '../../utils/localStorage';
import { formatDate } from '../../utils/dateUtils';
import ConfirmationModal from '../Common/ConfirmationModal';
import './PendingProducts.css';
import '../TodayAuction/TodayAuction.css'; // Reusing base card styles
import { Undo2, ListFilterPlus, Search } from 'lucide-react';

function PendingProducts() {
    const [pendingProducts, setPendingProducts] = useState([]);
    const [today, setToday] = useState('');
    const [sellers, setSellers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        setToday(todayStr);
        loadPendingProducts(todayStr);
    }, []);

    const loadPendingProducts = (currentDate) => {
        const data = getAuctionData();
        if (data && data.products) {
            setSellers(data.sellers || []);
            const filtered = data.products.filter(p => {
                if (p.status !== 'available') return false;
                if (p.isActive === false) return false;

                // Determine product date
                const pDate = p.date || new Date(p.id).toISOString().split('T')[0];

                // Show only if date is less than today
                if (pDate >= currentDate) return false;

                // Check if any variant is unsold
                if (p.variants) {
                    const productTransactions = (data.transactions || []).filter(t => t.productId === p.id);

                    // We need to check if ANY variant has remaining stock
                    return p.variants.some(v => {
                        const variantTransactions = productTransactions.filter(t => t.variantId === v.id);
                        const sold = variantTransactions.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
                        return (v.quantity - sold) > 0;
                    });
                }
                return false;
            }).map(p => {
                // Enrich variants with sold stats for display
                const productTransactions = (data.transactions || []).filter(t => t.productId === p.id);
                const enrichedVariants = (p.variants || []).map(v => {
                    const variantTransactions = productTransactions.filter(t => t.variantId === v.id);
                    const sold = variantTransactions.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
                    return { ...v, soldQuantity: sold, remaining: v.quantity - sold };
                });
                return { ...p, variants: enrichedVariants };
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
                    {pendingProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">✅</div>
                            <p>No pending products found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper">
                            <table className="data-table custom-data-table">
                                <thead className="bg-tertiary">
                                    <tr>
                                        <th className="custom-th">Product Details</th>
                                        <th className="custom-th">Seller & Date</th>
                                        <th className="custom-th">Variants (Qty & Comm)</th>
                                        <th className="custom-th custom-th-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingProducts
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
                                            <tr key={product.id} className="pending-product-card custom-tr">
                                                <td className="custom-td">
                                                    <div className="font-semibold text-primary table-product-name">
                                                        {product.name}
                                                    </div>
                                                    <span className="badge badge-disabled">Pending</span>
                                                </td>
                                                <td className="custom-td">
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong>{sellers.find(s => s.id === product.sellerId)?.name || 'Unknown'}</strong>
                                                    </div>
                                                    <div className="text-muted table-product-subtext">
                                                        Created: {formatDate(product.date || product.id)}
                                                    </div>
                                                </td>
                                                <td className="custom-td custom-td-variants">
                                                    <div className="product-variants">
                                                        {product.variants && product.variants.map(v => (
                                                            <div key={v.id} className="variant-card">
                                                                <div className="variant-card-header">
                                                                    <span>{v.variety}</span>
                                                                    <span className={`badge ${v.quality === 'Excellent' ? 'badge-success' : v.quality === 'Good' ? 'badge-warning' : 'badge-error'} badge-sm`}>{v.quality}</span>
                                                                </div>
                                                                <div className="variant-card-metrics">
                                                                    <span>{v.remaining} {v.unit}</span>
                                                                    <span className="text-amber font-semibold">{v.commission}% Comm</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="custom-td">
                                                    <div className="action-stack">
                                                        {/* <button
                                                            className="btn btn-error btn-pending-action action-btn-wide"
                                                            onClick={() => handleReturnClick(product)}
                                                        >
                                                            <Undo2 size={16} /> Return
                                                        </button> */}
                                                        <button
                                                            className="btn btn-success btn-pending-action action-btn-wide"
                                                            onClick={() => handleBackToToday(product)}
                                                        >
                                                            <ListFilterPlus size={16} /> To Today
                                                        </button>
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
        </>
    );
}

export default PendingProducts;
