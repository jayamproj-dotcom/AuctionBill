import { useState, useEffect } from 'react';
import './SaaSAdmin.css';
import { Link } from 'react-router-dom';
import { Users, Crown, Banknote, Hourglass, Settings, Trash2 } from 'lucide-react';
import { getVendors, getVendorPurchases } from '../../api/adminApi';
import { formatDate } from '../../utils/dateUtils';

const SaaSDashboard = () => {
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0
  });

  const [recentVendors, setRecentVendors] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vendorsRes, purchasesRes] = await Promise.all([
          getVendors(),
          getVendorPurchases()
        ]);
        
        let calculatedRevenue = 0;
        
        if (purchasesRes.status && purchasesRes.purchases) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          calculatedRevenue = purchasesRes.purchases.reduce((total, purchase) => {
             const purchaseDate = new Date(purchase.startDate || new Date());
             if (purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear) {
                 return total + (Number(purchase.price) || 0);
             }
             return total;
          }, 0);
        }

        if (vendorsRes.status && vendorsRes.vendors) {
          const vendors = vendorsRes.vendors;

          setStats(prev => ({
            ...prev,
            totalVendors: vendors.length,
            pendingApprovals: vendors.filter(v => v.status === 'Pending').length,
            activeSubscriptions: vendors.filter(v => v.status === 'Active').length,
            monthlyRevenue: calculatedRevenue
          }));

          const sortedVendors = [...vendors].sort((a, b) => {
            const dateA = new Date(a.joinedDate || a.createdAt);
            const dateB = new Date(b.joinedDate || b.createdAt);
            return dateB - dateA;
          });

          setRecentVendors(sortedVendors.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching Dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="fade-in">
      <div className="saas-stats-grid">
        <Link
          to="/saas/vendors"
          className="saas-stat-card saas-no-decoration"
        >
          <div className="saas-stat-header">
            <div className="saas-stat-icon icon-blue"><Users size={32} /></div>
          </div>

          <div className="saas-stat-value">
            {stats.totalVendors}
          </div>

          <div className="saas-stat-label">
            Total Vendors
          </div>
        </Link>


        <div className="saas-stat-card">
          <div className="saas-stat-header">
            <div className="saas-stat-icon icon-green"><Crown size={32} /></div>
          </div>
          <div className="saas-stat-value">{stats.activeSubscriptions}</div>
          <div className="saas-stat-label">Active Subscriptions</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-header">
            <div className="saas-stat-icon icon-amber"><Banknote size={32} /></div>
          </div>
          <div className="saas-stat-value">₹{stats.monthlyRevenue.toLocaleString()}</div>
          <div className="saas-stat-label">Monthly Revenue</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-header">
            <div className="saas-stat-icon icon-rose"><Hourglass size={32} /></div>
          </div>
          <div className="saas-stat-value">{stats.pendingApprovals}</div>
          <div className="saas-stat-label">Pending Approvals</div>
        </div>
      </div>

      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Recent Vendor Registrations</h3>
          <Link to="/saas/vendors"> <button className="saas-btn btn-sm btn-outline">View All</button></Link>
        </div>
        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {recentVendors.map((vendor) => (
                <tr key={vendor._id || vendor.id}>
                  <td className="saas-font-medium">{vendor.name}</td>
                  <td>{vendor.email}</td>
                  <td>
                    <span className={`saas-badge ${(vendor.plan?.name || vendor.plan || '') === 'Premium' ? 'badge-info' : 'badge-warning'}`}>
                      {vendor.plan?.name || vendor.plan || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`saas-badge ${vendor.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>{formatDate(vendor.joinedDate || vendor.createdAt)}</td>
                  {/* <td>
                    <div className="action-buttons">
                        <button className="icon-btn edit" title="Manage Vendor">
                            <Settings size={18} />
                        </button>
                         <button className="icon-btn delete" title="Delete Vendor">
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>  */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SaaSDashboard;
