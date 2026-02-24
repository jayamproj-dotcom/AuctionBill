import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal.jsx';
import { useSelector } from 'react-redux';
import { Trash2, X, Search, Plus, Edit, Loader } from 'lucide-react';
import { getSubscriptions, getVendors, createVendor, updateVendor, deleteVendor } from '../../api/adminApi';
import { resolveImageUrl } from '../../utils/imageUtils';

const VendorManagement = () => {
  const role = localStorage.getItem('saas_role');
  const [vendors, setVendors] = useState([]);
  const [plans, setPlans] = useState([]);
  const { saasRole, saasPermissions } = useSelector((state) => state.saasAuth);

  const [profilePicFile, setProfilePicFile] = useState(null);

  const isSubAdmin = saasRole === 'sub-admin' || saasRole === 'subadmin';
  const canManageVendors = !isSubAdmin || saasPermissions?.vendorAdd === true || String(saasPermissions?.vendorAdd).toLowerCase() === 'true';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: '',
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, vendorsRes] = await Promise.all([getSubscriptions(), getVendors()]);
      if (plansRes.status && plansRes.subscriptions) {
        setPlans(plansRes.subscriptions);
        if (plansRes.subscriptions.length > 0) {
          setNewVendor(prev => ({ ...prev, plan: plansRes.subscriptions[0]._id }));
        }
      }
      if (vendorsRes.status && vendorsRes.vendors) {
        setVendors(vendorsRes.vendors);
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVendor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.keys(newVendor).forEach(key => {
        formData.append(key, newVendor[key]);
      });
      if (profilePicFile) {
        formData.append('profilePic', profilePicFile);
      }

      await createVendor(formData);
      setIsAddModalOpen(false);
      setNewVendor({
        name: '',
        email: '',
        phone: '',
        address: '',
        plan: plans.length > 0 ? plans[0]._id : '',
        status: 'Active'
      });
      setProfilePicFile(null);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error adding vendor: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (vendor) => {
    setEditingVendor({ ...vendor, plan: vendor.plan?._id || vendor.plan });
    setProfilePicFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingVendor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.keys(editingVendor).forEach(key => {
        // Exclude system fields or file objects when adding object properties to FormData
        if (key !== '_id' && key !== 'id' && key !== 'profilePic' && key !== 'planEndDate' && key !== 'joinedDate') {
          // If a property is an object, sending [object Object] would break the backend schema mapping
          let value = editingVendor[key];
          if (typeof value === 'object' && value !== null && value._id) {
            value = value._id;
          }
          formData.append(key, value);
        }
      });

      if (profilePicFile) {
        formData.append('profilePic', profilePicFile);
      } else if (editingVendor.profilePic) {
        formData.append('profilePic', editingVendor.profilePic);
      }

      await updateVendor(editingVendor._id || editingVendor.id, formData);
      setIsEditModalOpen(false);
      setEditingVendor(null);
      setProfilePicFile(null);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error updating vendor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = (vendor) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (vendor) => {
    setVendorToDelete(vendor);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (vendorToDelete) {
      try {
        await deleteVendor(vendorToDelete._id || vendorToDelete.id);
        setVendorToDelete(null);
        setIsConfirmOpen(false);
        loadData();
      } catch (error) {
        console.error(error);
        alert("Error deleting vendor");
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
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
            {canManageVendors && (
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
                {canManageVendors && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {vendors.filter(vendor =>
                vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.phone.includes(searchQuery)
              ).map((vendor) => (
                <tr
                  key={vendor._id || vendor.id}
                  onClick={() => handleRowClick(vendor)}
                  className="vendor-row"
                >
                  <td className="saas-font-medium">
                    <div className="saas-flex saas-gap-05" style={{ alignItems: 'center' }}>
                      {vendor.profilePic ? (
                        <img
                          src={resolveImageUrl(vendor.profilePic)}
                          alt="profile"
                          className="vendor-avatar-img-small"
                        />
                      ) : (
                        <div className="vendor-avatar-small">
                          {getInitials(vendor.name)}
                        </div>
                      )}
                      {vendor.name}
                    </div>
                  </td>
                  <td>{vendor.email}</td>
                  <td>
                    <span className={`saas-badge ${(vendor.plan?.name || vendor.plan) === 'Premium' ? 'badge-info' : 'badge-warning'}`}>
                      {vendor.plan?.name || vendor.plan}
                    </span>
                  </td>
                  <td>
                    <span className={`saas-badge ${vendor.status === 'Active' ? 'badge-success' :
                      vendor.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                      {vendor.status}
                    </span>
                  </td>
                  {canManageVendors && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="saas-flex saas-gap-075">
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
                      </div>
                    </td>
                  )}

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
                      {plans.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
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
                  <div className="form-group full-width">
                    <label className="saas-label">Profile Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setProfilePicFile(e.target.files[0])} className="saas-input" />
                  </div>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary" disabled={isSaving}>
                  {isSaving ? <><Loader className="saas-spinner" size={16} /> Saving...</> : 'Add Vendor'}
                </button>
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
                      {plans.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
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
                  <div className="form-group full-width">
                    <label className="saas-label">Profile Image</label>
                    {editingVendor.profilePic ? (
                      <img
                        src={resolveImageUrl(editingVendor.profilePic)}
                        alt="Current Profile"
                        className="vendor-avatar-img-large"
                      />
                    ) : (
                      <div className="vendor-avatar-large">
                        {getInitials(editingVendor.name)}
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setProfilePicFile(e.target.files[0])} className="saas-input" />
                  </div>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary" disabled={isSaving}>
                  {isSaving ? <><Loader className="saas-spinner" size={16} /> Saving...</> : 'Save Changes'}
                </button>
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
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {selectedVendor.profilePic ? (
                    <img
                      src={resolveImageUrl(selectedVendor.profilePic)}
                      alt="profile"
                      className="vendor-avatar-img-large"
                    />
                  ) : (
                    <div className="vendor-avatar-large">
                      {getInitials(selectedVendor.name)}
                    </div>
                  )}
                  <div>
                    <h5 style={{ margin: 0, fontSize: '18px' }}>{selectedVendor.name}</h5>
                    <span style={{ color: '#777', fontSize: '14px' }}>{selectedVendor.email}</span>
                  </div>
                </div>
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
                    <span className={`saas-badge ${(selectedVendor.plan?.name || selectedVendor.plan) === 'Premium' ? 'badge-info' : 'badge-warning'}`}>
                      {selectedVendor.plan?.name || selectedVendor.plan}
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
                    <label className="saas-label saas-text-muted">Plan End Date</label>
                    <div className="saas-font-medium">{formatDate(selectedVendor.planEndDate)}</div>
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
