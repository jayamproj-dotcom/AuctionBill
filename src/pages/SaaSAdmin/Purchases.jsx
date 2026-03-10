import { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { getVendorPurchases } from '../../api/adminApi';
import './SaaSAdmin.css';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await getVendorPurchases();
        if (response.status && response.purchases) {
          const vendorsData = response.purchases.map((purchase) => ({
            id: purchase.id,
            vendorName: purchase.vendorName,
            plan: purchase.plan || 'Unknown',
            price: purchase.price ? `₹${purchase.price.toLocaleString()}` : '₹0',
            paymentStatus: purchase.paymentStatus || 'Paid',
            status: purchase.status,
            expiryDate: purchase.expiryDate,
            transactionId: purchase.transactionId || `TXN_${purchase.id.slice(-6).toUpperCase()}`,
            startDate: purchase.startDate
          }));
          setPurchases(vendorsData);
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  // Helper to check if date is nearing expiry (e.g., within 5 days)
  const isExpiringSoon = (dateString, status) => {
    if (status === 'Inactive' || status === 'Expired' || status === 'Expiring Soon') return false;

    // Simple logic for visual highlighting only, purely illustrative
    // In a real app, combine this with the 'status' field from DB
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays <= 5;
  };

  const getStatusBadge = (status, date) => {
    if (status === 'Inactive' || status === 'Expired') return 'badge-danger';
    if (status === 'Expiring Soon' || isExpiringSoon(date, status)) return 'badge-warning';
    return 'badge-success';
  };

  const filteredPurchases = purchases.filter(purchase => {
    const query = searchQuery.toLowerCase();
    return (
      purchase.vendorName.toLowerCase().includes(query) ||
      purchase.plan.toLowerCase().includes(query) ||
      purchase.transactionId.toLowerCase().includes(query) ||
      purchase.paymentStatus.toLowerCase().includes(query) ||
      purchase.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fade-in">
      <div className="saas-card saas-mb-15 subAdminCard">
        <h2 className="saas-text-2xl saas-font-bold subAdminCardTitle">Vendor Purchase History</h2>
        <p className="saas-text-muted saas-text-sm saas-mb-15">View all vendor subscriptions and purchases</p>
        <div className="saas-flex-between subAdminTopControls">
          <div className="saasSearchWrapperWide">
            <Search size={18} className="saasSearchIconPosition" />
            <input
              type="text"
              className="saas-input saasSearchInputWide"
              placeholder="Search purchases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="saas-flex saas-gap-10px">
            <button className="saas-btn btn-outline">Export CSV</button>
          </div>
        </div>
      </div>

      <div className="saas-card subAdminTableCard">
        <div className="saas-table-container">
          <table className="saas-table subAdminTable saas-desktop-only-480">
            <thead className="subAdminTableHeader">
              <tr>
                <th>Vendor Name</th>
                <th>Plan Detail</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Purchase Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="saas-text-center saas-py-4">
                    <Loader className="saas-spinner saas-inline-block" size={24} /> Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  return (
                    <tr key={purchase.id}>
                      <td className="saas-font-medium">{purchase.vendorName}</td>
                      <td>
                        <span className="saas-font-semibold saas-text-primary">{purchase.plan}</span>
                      </td>
                      <td>{purchase.price}</td>
                      <td>
                        <span className={`saas-badge ${purchase.paymentStatus === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                          {purchase.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="saas-flex-col">
                          <span>{purchase.startDate ? formatDate(purchase.startDate) : '--'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="saas-text-center saas-py-4">
                    No purchases found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="saas-mobile-cards-view-480">
            {isLoading ? (
              <div className="saas-text-center saas-p-20">
                <Loader className="saas-spinner" size={24} /> Loading...
              </div>
            ) : filteredPurchases.length > 0 ? (
              filteredPurchases.map((purchase) => (
                <div key={purchase.id} className="saas-mobile-card">
                  <div className="saas-mobile-card-row">
                    <span className="saas-mobile-card-label">Vendor</span>
                    <span className="saas-mobile-card-value saas-font-bold">{purchase.vendorName}</span>
                  </div>
                  <div className="saas-mobile-card-row">
                    <span className="saas-mobile-card-label">Plan</span>
                    <span className="saas-mobile-card-value saas-font-semibold saas-text-primary">{purchase.plan}</span>
                  </div>
                  <div className="saas-mobile-card-row">
                    <span className="saas-mobile-card-label">Price</span>
                    <span className="saas-mobile-card-value">{purchase.price}</span>
                  </div>
                  <div className="saas-mobile-card-row">
                    <span className="saas-mobile-card-label">Payment</span>
                    <span className="saas-mobile-card-value">
                      <span className={`saas-badge ${purchase.paymentStatus === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                        {purchase.paymentStatus}
                      </span>
                    </span>
                  </div>
                  <div className="saas-mobile-card-row">
                    <span className="saas-mobile-card-label">Date</span>
                    <span className="saas-mobile-card-value">
                      {purchase.startDate ? formatDate(purchase.startDate) : '--'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="saas-text-center saas-p-20 saas-text-muted">
                No purchases found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
