import { useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal.jsx';
import { Trash2, X, Search, Plus, Edit } from 'lucide-react';

const VendorManagement = () => {
  const role = localStorage.getItem('saas_role');
  const [vendors, setVendors] = useState([
    {
      id: 1,
      name: 'Royal Auctions',
      email: 'royal@example.com',
      plan: 'Premium',
      status: 'Active',
      phone: '+91 98765 43210',
      joinedDate: '2024-01-15',
      lastLogin: '2024-03-10 10:30 AM',
      address: '123, Royal Street, Mumbai, Maharashtra',
      totalAuctions: 154,
      revenue: '₹12,50,000'
    },
    {
      id: 2,
      name: 'Heritage Bids',
      email: 'heritage@example.com',
      plan: 'Basic',
      status: 'Active',
      phone: '+91 87654 32109',
      joinedDate: '2024-02-01',
      lastLogin: '2024-03-09 02:15 PM',
      address: '45, Heritage Lane, Delhi',
      totalAuctions: 45,
      revenue: '₹3,20,000'
    },
    {
      id: 3,
      name: 'City Auction House',
      email: 'city@example.com',
      plan: 'Free',
      status: 'Pending',
      phone: '+91 76543 21098',
      joinedDate: '2024-03-05',
      lastLogin: 'Never',
      address: '78, City Plaza, Bangalore, Karnataka',
      totalAuctions: 0,
      revenue: '₹0'
    },
    {
      id: 4,
      name: 'South Gate Bidding',
      email: 'southgate@example.com',
      plan: 'Premium',
      status: 'Inactive',
      phone: '+91 65432 10987',
      joinedDate: '2023-11-20',
      lastLogin: '2024-01-15 09:00 AM',
      address: '12, South Avenue, Chennai, Tamil Nadu',
      totalAuctions: 312,
      revenue: '₹25,00,000'
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'Basic',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVendor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const vendorToAdd = {
      ...newVendor,
      id: vendors.length + 1,
      joinedDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      totalAuctions: 0,
      revenue: '₹0'
    };
    setVendors([...vendors, vendorToAdd]);
    setIsAddModalOpen(false);
    setNewVendor({
      name: '',
      email: '',
      phone: '',
      address: '',
      plan: 'Basic',
      status: 'Active'
    });
  };

  const handleEditClick = (vendor) => {
    setEditingVendor({ ...vendor });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingVendor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    setVendors(vendors.map(v => v.id === editingVendor.id ? editingVendor : v));
    setIsEditModalOpen(false);
    setEditingVendor(null);
  };

  const handleRowClick = (vendor) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (vendor) => {
    setVendorToDelete(vendor);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (vendorToDelete) {
      setVendors(vendors.filter(v => v.id !== vendorToDelete.id));
      setVendorToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="fade-in">
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor Account"
        message={`Are you sure you want to delete ${vendorToDelete?.name}?`}
        subMessage="This action will permanently remove the vendor and all associated data."
        confirmText="Yes, Delete Vendor"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Manage Vendors</h3>
          <div className="saas-flex saas-gap-05">
            <div className="saas-search-icon-container">
              <input
                type="text"
                placeholder="Search vendors..."
                className="saas-input saas-search-input-wrapper"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="saas-search-icon-absolute" />
            </div>
            {role !== 'subadmin' && (
              <button className="saas-btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={18} /> Add Vendor
              </button>
            )}
          </div>
        </div>
        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Email</th>
                <th>Current Plan</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vendors.filter(vendor =>
                vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.phone.includes(searchQuery)
              ).map((vendor) => (
                <tr
                  key={vendor.id}
                  onClick={() => handleRowClick(vendor)}
                  className="vendor-row"
                >
                  <td className="saas-font-medium">{vendor.name}</td>
                  <td>{vendor.email}</td>
                  <td>
                    <span className={`saas-badge ${vendor.plan === 'Premium' ? 'badge-info' : 'badge-warning'}`}>
                      {vendor.plan}
                    </span>
                  </td>
                  <td>
                    <span className={`saas-badge ${vendor.status === 'Active' ? 'badge-success' :
                      vendor.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="saas-flex saas-gap-075">
                      {role !== 'subadmin' && (
                        <>
                          <button
                            className="icon-btn edit"
                            title="Edit Vendor"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(vendor);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="icon-btn delete"
                            title="Delete Vendor"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(vendor);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div className="saas-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="saas-modal" onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h3 className="saas-text-xl saas-font-semibold">Add New Vendor</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="saas-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="saas-modal-content">
                <div className="inner-grid-2">
                  <div className="form-group">
                    <label className="saas-label">Vendor Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newVendor.name}
                      onChange={handleInputChange}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={newVendor.email}
                      onChange={handleInputChange}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newVendor.phone}
                      onChange={handleInputChange}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Plan</label>
                    <select
                      name="plan"
                      value={newVendor.plan}
                      onChange={handleInputChange}
                      className="saas-select"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="saas-label">Address</label>
                    <textarea
                      name="address"
                      value={newVendor.address}
                      onChange={handleInputChange}
                      className="saas-textarea"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary">Add Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {isEditModalOpen && editingVendor && (
        <div className="saas-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="saas-modal" onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h3 className="saas-text-xl saas-font-semibold">Edit Vendor</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="saas-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="saas-modal-content">
                <div className="inner-grid-2">
                  <div className="form-group">
                    <label className="saas-label">Vendor Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={editingVendor.name}
                      onChange={handleEditChange}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={editingVendor.email}
                      onChange={handleEditChange}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editingVendor.phone}
                      onChange={handleEditChange}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Plan</label>
                    <select
                      name="plan"
                      value={editingVendor.plan}
                      onChange={handleEditChange}
                      className="saas-select"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Status</label>
                    <select
                      name="status"
                      value={editingVendor.status}
                      onChange={handleEditChange}
                      className="saas-select"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="saas-label">Address</label>
                    <textarea
                      name="address"
                      value={editingVendor.address}
                      onChange={handleEditChange}
                      className="saas-textarea"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Info Modal */}
      {isModalOpen && selectedVendor && (
        <div className="saas-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="saas-modal" onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h3 className="saas-text-xl saas-font-semibold">
                Vendor Details: {selectedVendor.name}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="saas-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="saas-modal-content">
              {/* Profile Section */}
              <div className="saas-mb-15">
                <h4 className="saas-profile-header">Business Profile</h4>
                <div className="inner-grid-2">
                  <div>
                    <label className="saas-label saas-text-muted">Vendor Name</label>
                    <div className="saas-font-medium">{selectedVendor.name}</div>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">Email Address</label>
                    <div className="saas-font-medium">{selectedVendor.email}</div>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">Phone Number</label>
                    <div className="saas-font-medium">{selectedVendor.phone}</div>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">Address</label>
                    <div className="saas-font-medium">{selectedVendor.address}</div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="saas-mb-15">
                <h4 className="saas-profile-header">Account Status</h4>
                <div className="inner-grid-2">
                  <div>
                    <label className="saas-label saas-text-muted">Current Plan</label>
                    <span className={`saas-badge ${selectedVendor.plan === 'Premium' ? 'badge-info' : 'badge-warning'}`}>
                      {selectedVendor.plan}
                    </span>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">Account Status</label>
                    <span className={`saas-badge ${selectedVendor.status === 'Active' ? 'badge-success' :
                      selectedVendor.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                      {selectedVendor.status}
                    </span>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">Joined Date</label>
                    <div className="saas-font-medium">{formatDate(selectedVendor.joinedDate)}</div>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">Last Login</label>
                    <div className="saas-font-medium">{formatDate(selectedVendor.lastLogin)}</div>
                  </div>
                </div>
              </div>

              {/* Analytics Preview */}
              <div>
                <h4 className="saas-profile-header">Performance Overview</h4>
                <div className="inner-grid-2">
                  <div className="saas-stat-card saas-p-1">
                    <span className="saas-stat-label">Total Auctions</span>
                    <div className="saas-stat-value saas-text-xl">{selectedVendor.totalAuctions}</div>
                  </div>
                  <div className="saas-stat-card saas-p-1">
                    <span className="saas-stat-label">Total Revenue</span>
                    <div className="saas-stat-value saas-text-xl">{selectedVendor.revenue}</div>
                  </div>
                </div>
              </div>

            </div>
            <div className="saas-modal-footer">
              <button className="saas-btn btn-primary" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
