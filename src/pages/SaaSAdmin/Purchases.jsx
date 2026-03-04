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
      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Vendor Purchase History</h3>
          <div className="saas-flex saas-gap-05">
            <div className="saas-search-icon-container">
              <input
                type="text"
                placeholder="Search purchases..."
                className="saas-input saas-search-input-wrapper"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="saas-search-icon-absolute" />
            </div>
            <button className="saas-btn btn-outline">Export CSV</button>
          </div>
        </div>

        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Plan Detail</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Current Status</th>
                <th>Purchase Date</th>
                <th>Expiry Date</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="saas-text-center saas-py-4">
                    <Loader className="saas-spinner saas-inline-block" size={24} /> Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  const expiring = isExpiringSoon(purchase.expiryDate, purchase.status);

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
                        <span className={`saas-badge ${getStatusBadge(purchase.status, purchase.expiryDate)}`}>
                          {expiring && purchase.status === 'Active' ? 'Expiring Soon' : purchase.status}
                        </span>
                      </td>
                      <td>
                        <div className="saas-flex-col">
                          <span>{purchase.startDate ? formatDate(purchase.startDate) : '--'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="saas-flex-col">
                          <span>{purchase.expiryDate ? formatDate(purchase.expiryDate) : 'N/A'}</span>
                          {expiring && (
                            <span className="saas-expiry-warning">
                              ⚠️ Renew Soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="saas-transaction-id">
                        {purchase.transactionId}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="saas-text-center saas-py-4">
                    No purchases found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
