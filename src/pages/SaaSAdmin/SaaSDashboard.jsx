import { useState, useEffect } from 'react';
import './SaaSAdmin.css';
import { Link } from 'react-router-dom';

const SaaSDashboard = () => {
  const [stats, setStats] = useState({
    totalVendors: 12,
    activeSubscriptions: 8,
    monthlyRevenue: 45000,
    pendingApprovals: 3
  });

  const recentVendors = [
    { id: 101, name: 'Royal Auctions', admin: 'Amit Shah', plan: 'Premium', status: 'Active', joined: '2026-02-01' },
    { id: 102, name: 'Heritage Bids', admin: 'Priya Rai', plan: 'Basic', status: 'Active', joined: '2026-02-05' },
    { id: 103, name: 'City Auction House', admin: 'Vikram Singh', plan: 'Free', status: 'Pending', joined: '2026-02-09' },
  ];

  return (
    <div className="fade-in">
      <div className="saas-stats-grid">
    <Link 
  to="/saas/vendors" 
  className="saas-stat-card saas-no-decoration" 
>
  <div className="saas-stat-header">
    <div className="saas-stat-icon icon-blue">🏢</div>
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
            <div className="saas-stat-icon icon-green">💎</div>
          </div>
          <div className="saas-stat-value">{stats.activeSubscriptions}</div>
          <div className="saas-stat-label">Active Subscriptions</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-header">
            <div className="saas-stat-icon icon-amber">💰</div>
          </div>
          <div className="saas-stat-value">₹{stats.monthlyRevenue.toLocaleString()}</div>
          <div className="saas-stat-label">Monthly Revenue</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-header">
            <div className="saas-stat-icon icon-rose">⏳</div>
          </div>
          <div className="saas-stat-value">{stats.pendingApprovals}</div>
          <div className="saas-stat-label">Pending Approvals</div>
        </div>
      </div>

      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Recent Vendor Registrations</h3>
          <button className="saas-btn btn-sm btn-outline">View All</button>
        </div>
        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Admin</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="saas-font-medium">{vendor.name}</td>
                  <td>{vendor.admin}</td>
                  <td>
                     <span className={`saas-badge ${vendor.plan === 'Premium' ? 'badge-info' : 'badge-warning'}`}>
                        {vendor.plan}
                     </span>
                  </td>
                  <td>
                    <span className={`saas-badge ${vendor.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>{vendor.joined}</td>
                  <td>
                    <button className="saas-btn btn-sm btn-outline">Manage</button>
                  </td>
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
