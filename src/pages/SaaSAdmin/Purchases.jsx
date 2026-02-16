import { useState } from 'react';
import './SaaSAdmin.css';

const Purchases = () => {
  // Mock Purchase Data
  const [purchases] = useState([
    { 
      id: 1, 
      vendorName: 'Royal Auctions', 
      plan: 'Premium', 
      price: '₹9,999', 
      paymentStatus: 'Paid', 
      status: 'Active', 
      expiryDate: '2026-03-20', 
      transactionId: 'TXN_882910'
    },
    { 
      id: 2, 
      vendorName: 'Heritage Bids', 
      plan: 'Basic', 
      price: '₹4,999', 
      paymentStatus: 'Paid', 
      status: 'Active', 
      expiryDate: '2026-02-18', // Expires very soon
      transactionId: 'TXN_772190'
    },
    { 
      id: 3, 
      vendorName: 'City Auction House', 
      plan: 'Standard', 
      price: '₹7,499', 
      paymentStatus: 'Paid', 
      status: 'Expiring Soon', 
      expiryDate: '2026-02-14', // Within 3 days
      transactionId: 'TXN_332101'
    },
    { 
      id: 4, 
      vendorName: 'South Gate Bidding', 
      plan: 'Premium', 
      price: '₹9,999', 
      paymentStatus: 'Failed', 
      status: 'Inactive', 
      expiryDate: '2025-12-01', // Already expired
      transactionId: 'TXN_Failed'
    },
    { 
        id: 5, 
        vendorName: 'Alpha Traders', 
        plan: 'Basic', 
        price: '₹4,999', 
        paymentStatus: 'Paid', 
        status: 'Active', 
        expiryDate: '2026-08-20', 
        transactionId: 'TXN_992100'
      },
  ]);

  // Helper to check if date is nearing expiry (e.g., within 30 days)
  const isExpiringSoon = (dateString, status) => {
    if (status === 'Inactive' || status === 'Expiring Soon') return true;
    
    // Simple logic for visual highlighting only, purely illustrative
    // In a real app, combine this with the 'status' field from DB
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 30;
  };

  const getStatusBadge = (status, date) => {
      if (status === 'Inactive') return 'badge-danger';
      if (status === 'Expiring Soon' || isExpiringSoon(date, status)) return 'badge-warning';
      return 'badge-success';
  };

  return (
    <div className="fade-in">
      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Vendor Purchase History</h3>
          <div className="saas-flex saas-gap-05">
            <input 
              type="text" 
              placeholder="Search purchases..." 
              className="saas-input saas-search-input" 
            />
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
                <th>Status</th>
                <th>Expiry Date</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
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
                            <span>{purchase.expiryDate}</span>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
