import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatDate } from '../../utils/dateUtils';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal.jsx';
import { useSelector } from 'react-redux';
import { Trash2, X, Search, Plus, Edit, Loader, Filter, Download } from 'lucide-react';
import { getSubscriptions, getVendors, createVendor, updateVendor, deleteVendor, exportVendors } from '../../api/adminApi';
import useOfflineForm from '../../hooks/useOfflineForm';

const VendorManagement = () => {
  const role = localStorage.getItem('saas_role');
  const [vendors, setVendors] = useState([]);
  const [plans, setPlans] = useState([]);
  const { saasRole, saasPermissions } = useSelector((state) => state.saasAuth);


  const isSubAdmin = saasRole === 'sub-admin' || saasRole === 'subadmin';
  const canManageVendors = !isSubAdmin || saasPermissions?.vendorAdd === true || String(saasPermissions?.vendorAdd).toLowerCase() === 'true';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportParams, setExportParams] = useState({
    startDate: null,
    endDate: null,
    state: '',
    city: '',
    status: '',
    plan: ''
  });
  const [exportCities, setExportCities] = useState([]);
  const [loadingExportCities, setLoadingExportCities] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingFilterCities, setLoadingFilterCities] = useState(false);

  const [filters, setFilters] = useState({
    state: '',
    city: '',
    status: '',
    plan: ''
  });

  const [filterCities, setFilterCities] = useState([]);

  const initialNewVendor = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    plan: '',
    status: 'Active'
  };

  const {
    formData: newVendor,
    setFormData: setNewVendor,
    handleChange: handleInputChange,
    handleSubmit: handleAddSubmit,
    isSubmitting: isSavingAdd,
    resetForm: resetAddForm
  } = useOfflineForm('draft_new_vendor', initialNewVendor, async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    await createVendor(formData);
    setIsAddModalOpen(false);
    resetAddForm();
    loadData();
  });

  useEffect(() => {
    loadData();
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: "India" })
      });
      const data = await response.json();
      if (!data.error) {
        setStates(data.data.states);
      }
    } catch (err) {
      console.error("Error fetching states:", err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (stateName) => {
    setLoadingCities(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: "India", state: stateName })
      });
      const data = await response.json();
      if (!data.error) {
        setCities(data.data.map(city => ({ name: city })));
      } else {
        setCities([]);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchFilterCities = async (stateName) => {
    if (!stateName) {
      setFilterCities([]);
      return;
    }
    setLoadingFilterCities(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: "India", state: stateName })
      });
      const data = await response.json();
      if (!data.error) {
        setFilterCities(data.data.map(city => ({ name: city })));
      } else {
        setFilterCities([]);
      }
    } catch (err) {
      console.error("Error fetching filter cities:", err);
      setFilterCities([]);
    } finally {
      setLoadingFilterCities(false);
    }
  };

  const fetchExportCities = async (stateName) => {
    if (!stateName) {
      setExportCities([]);
      return;
    }
    setLoadingExportCities(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: "India", state: stateName })
      });
      const data = await response.json();
      if (!data.error) {
        setExportCities(data.data.map(city => ({ name: city })));
      } else {
        setExportCities([]);
      }
    } catch (err) {
      console.error("Error fetching export cities:", err);
      setExportCities([]);
    } finally {
      setLoadingExportCities(false);
    }
  };

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

  const handleInputChangeSimple = (e) => {
    handleInputChange(e);

    const { name, value } = e.target;
    if (name === 'state') {
      setNewVendor(prev => ({ ...prev, city: '' }));
      fetchCities(value);
    }
  };

  // handleAddSubmit is now handled by useOfflineForm

  const handleEditClick = (vendor) => {
    setEditingVendor({ ...vendor, plan: vendor.plan?._id || vendor.plan });
    if (vendor.state) {
      fetchCities(vendor.state);
    } else {
      setCities([]);
    }
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingVendor(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'state') {
      setEditingVendor(prev => ({ ...prev, city: '' }));
      fetchCities(value);
    }
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

      await updateVendor(editingVendor._id || editingVendor.id, formData);
      setIsEditModalOpen(false);
      setEditingVendor(null);
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


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));

    if (name === 'state') {
      setFilters(prev => ({ ...prev, city: '' }));
      fetchFilterCities(value);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      state: '',
      city: '',
      status: '',
      plan: ''
    });
    setFilterCities([]);
  };

  const handleExportDownload = async () => {
    setExportLoading(true);
    try {
      const exportData = {
        state: exportParams.state,
        city: exportParams.city,
        status: exportParams.status,
        plan: exportParams.plan,
        from: exportParams.startDate,
        to: exportParams.endDate,
        search: searchQuery
      };
      
      const response = await exportVendors(exportData);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendors_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting data");
    } finally {
      setExportLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchQuery ||
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.phone.includes(searchQuery);

    const matchesState = !filters.state || vendor.state === filters.state;
    const matchesCity = !filters.city || vendor.city === filters.city;
    const matchesStatus = !filters.status || vendor.status === filters.status;
    const matchesPlan = !filters.plan || (vendor.plan?._id || vendor.plan) === filters.plan;

    return matchesSearch && matchesState && matchesCity && matchesStatus && matchesPlan;
  });

  return (
    <div className="fade-in relative">
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

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="saas-modal-overlay" onClick={() => setIsExportModalOpen(false)}>
          <div className="saas-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h3 className="saas-text-xl saas-font-semibold">Export Vendor Data</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="saas-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="saas-modal-content">
              {/* <p className="saas-text-muted saas-mb-15">Configure report filters and date range for Excel export.</p> */}
              

               <div className="mb-1 full-width">
                  <label className="saas-label">Date Range (Joined Date)</label>
                  <DatePicker
                    selectsRange={true}
                    startDate={exportParams.startDate}
                    endDate={exportParams.endDate}
                    onChange={(update) => {
                      const [start, end] = update;
                      setExportParams(prev => ({ ...prev, startDate: start, endDate: end }));
                    }}
                    isClearable={true}
                    placeholderText="Select range (From - To)"
                    className="saas-input"
                  />
                </div>

              <div className="inner-grid-2">
                <div className="">
                  <label className="saas-label">State</label>
                  <select
                    className="saas-select"
                    value={exportParams.state}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExportParams(prev => ({ ...prev, state: val, city: '' }));
                      fetchExportCities(val);
                    }}
                  >
                    <option value="">All States</option>
                    {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div className="">
                  <label className="saas-label">City</label>
                  <select
                    className="saas-select"
                    value={exportParams.city}
                    onChange={(e) => setExportParams(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!exportParams.state || loadingExportCities}
                  >
                    <option value="">{loadingExportCities ? 'Loading...' : 'All Cities'}</option>
                    {exportCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="">
                  <label className="saas-label">Status</label>
                  <select
                    className="saas-select"
                    value={exportParams.status}
                    onChange={(e) => setExportParams(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="">
                  <label className="saas-label">Plan</label>
                  <select
                    className="saas-select"
                    value={exportParams.plan}
                    onChange={(e) => setExportParams(prev => ({ ...prev, plan: e.target.value }))}
                  >
                    <option value="">All Plans</option>
                    {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="saas-modal-footer">
              <button className="saas-btn btn-secondary" onClick={() => setIsExportModalOpen(false)}>Cancel</button>
              <button 
                className="saas-btn btn-primary" 
                onClick={handleExportDownload}
                disabled={exportLoading}
              >
                {exportLoading ? <><Loader className="saas-spinner" size={16} /> Exporting...</> : 'Download Excel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="saas-card">
        <div className="saas-card-header saas-flex-col saas-align-start saas-gap-10">
          <div className="saas-flex-between saas-w-full">
            <h3 className="saas-text-lg saas-font-semibold">Manage Vendors</h3>
            <div className="saas-flex saas-gap-05 flex-wrap">
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
              {/* <div className="saas-relative">
                
              </div> */}
              <button
                  className={`saas-btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={18} /> Filter
                </button>

                <button
                  className="saas-btn btn-outline"
                  onClick={() => setIsExportModalOpen(true)}
                >
                  <Download size={18} /> Export
                </button>

                {showFilters && (
                  <div className="saas-filter-popover">
                    <div className="filter-header">
                      <h4 className="saas-font-semibold">Filters</h4>
                      <button onClick={() => setShowFilters(false)} className="saas-text-muted">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="">
                      <label className="saas-label">State</label>
                      <select
                        name="state"
                        className="saas-select"
                        value={filters.state}
                        onChange={handleFilterChange}
                      >
                        <option value="">All States</option>
                        {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="">
                      <label className="saas-label">City</label>
                      <select
                        name="city"
                        className="saas-select"
                        value={filters.city}
                        onChange={handleFilterChange}
                        disabled={!filters.state || loadingFilterCities}
                      >
                        <option value="">{loadingFilterCities ? 'Loading...' : 'All Cities'}</option>
                        {filterCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="">
                      <label className="saas-label">Status</label>
                      <select
                        name="status"
                        className="saas-select"
                        value={filters.status}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="">
                      <label className="saas-label">Plan</label>
                      <select
                        name="plan"
                        className="saas-select"
                        value={filters.plan}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Plans</option>
                        {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="saas-flex saas-gap-05 saas-mt-05">
                      <button className="saas-btn btn-primary btn-sm saas-w-full" onClick={() => setShowFilters(false)}>
                        Apply Filters
                      </button>
                      <button className="saas-btn btn-outline btn-sm saas-w-full" onClick={() => {
                        resetFilters();
                        setShowFilters(false);
                      }}>
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              {canManageVendors && (
                <button className="saas-btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                  <Plus size={18} /> Add Vendor
                </button>
              )}
            </div>
          </div>

        </div>

        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Current Plan</th>
                <th>Status</th>
                {canManageVendors && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr
                  key={vendor._id || vendor.id}
                  onClick={() => handleRowClick(vendor)}
                  className="vendor-row"
                >
                  <td className="saas-font-medium">
                    {vendor.name}
                  </td>
                  <td>{vendor.email}</td>
                  <td>{vendor.city || 'N/A'}, {vendor.state || 'N/A'}</td>
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
                      onChange={handleInputChangeSimple}
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
                      onChange={handleInputChangeSimple}
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
                      onChange={handleInputChangeSimple}
                      className="saas-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="saas-label">Plan</label>
                    <select
                      name="plan"
                      value={newVendor.plan}
                      onChange={handleInputChangeSimple}
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
                      onChange={handleInputChangeSimple}
                      className="saas-textarea"
                      rows="2"
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label className="saas-label">State *</label>
                    <select
                      name="state"
                      value={newVendor.state}
                      onChange={handleInputChangeSimple}
                      className="saas-select"
                      required
                      disabled={loadingStates}
                    >
                      <option value="">Select State</option>
                      {states.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="saas-label">City *</label>
                    <select
                      name="city"
                      value={newVendor.city}
                      onChange={handleInputChangeSimple}
                      className="saas-select"
                      required
                      disabled={!newVendor.state || loadingCities}
                    >
                      <option value="">Select City</option>
                      {cities.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary" disabled={isSaving}>
                  {isSavingAdd ? <><Loader className="saas-spinner" size={16} /> Saving...</> : 'Add Vendor'}
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
                  <div className="form-group">
                    <label className="saas-label">State *</label>
                    <select
                      name="state"
                      value={editingVendor.state}
                      onChange={handleEditChange}
                      className="saas-select"
                      required
                      disabled={loadingStates}
                    >
                      <option value="">Select State</option>
                      {states.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="saas-label">City *</label>
                    <select
                      name="city"
                      value={editingVendor.city}
                      onChange={handleEditChange}
                      className="saas-select"
                      required
                      disabled={!editingVendor.state || loadingCities}
                    >
                      <option value="">Select City</option>
                      {cities.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
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
                  <div>
                    <label className="saas-label saas-text-muted">City</label>
                    <div className="saas-font-medium">{selectedVendor.city}</div>
                  </div>
                  <div>
                    <label className="saas-label saas-text-muted">State</label>
                    <div className="saas-font-medium">{selectedVendor.state}</div>
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
