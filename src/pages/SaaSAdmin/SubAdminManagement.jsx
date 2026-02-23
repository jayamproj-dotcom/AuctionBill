import { useState, useEffect } from 'react';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { Plus, X, Download, Trash2, Search, Check, Edit, Eye, EyeOff, Loader } from 'lucide-react';
import { getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin } from '../../api/adminApi';
import { toast } from 'react-toastify';

const SubAdminManagement = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await getSubAdmins();
      setSubAdmins(data.subAdmins || data.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch sub-admins.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubAdmin = () => {
    setEditingSubAdmin({
      _id: null,
      username: '',
      email: '',
      password: '',
      status: 'Active',
      permissions: {
        vendorAdd: false,
        subscriptionAccess: false,
        passwordChange: false
      }
    });
    setIsChangingPassword(true);
    setIsModalOpen(true);
  };

  const handleEdit = (subAdmin) => {
    setEditingSubAdmin({
      ...subAdmin,
      password: '' // empty so they don't see hashed
    });
    setIsChangingPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setAdminToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (adminToDelete) {
      try {
        await deleteSubAdmin(adminToDelete);
        toast.success('Sub-admin deleted successfully');
        fetchSubAdmins();
      } catch (error) {
        toast.error(error.message || 'Failed to delete sub-admin');
      } finally {
        setIsDeleteModalOpen(false);
        setAdminToDelete(null);
      }
    }
  };

  const handleSave = async () => {
    if (!editingSubAdmin.username || !editingSubAdmin.email) {
      return toast.error('Name and email are required');
    }
    if (!editingSubAdmin._id && !editingSubAdmin.password) {
      return toast.error('Password is required for new sub-admins');
    }

    setIsSaving(true);
    try {
      if (editingSubAdmin._id) {
        // Handle update
        const payload = { ...editingSubAdmin };
        if (!payload.password) delete payload.password; // Don't send empty password 
        await updateSubAdmin(editingSubAdmin._id, payload);
        toast.success('Sub-admin updated successfully');
      } else {
        // Handle create
        await createSubAdmin(editingSubAdmin);
        toast.success('Sub-admin created successfully');
      }
      setIsModalOpen(false);
      fetchSubAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to save sub-admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = async (field, checked, subAdminId) => {
    const subAdmin = subAdmins.find(sa => (sa._id || sa.id) === subAdminId);
    if (!subAdmin) return;

    // Optimistic update
    setSubAdmins(subAdmins.map(sa => {
      if ((sa._id || sa.id) === subAdminId) {
        return {
          ...sa,
          permissions: {
            ...sa.permissions,
            [field]: checked
          }
        };
      }
      return sa;
    }));

    try {
      const updatedPermissions = {
        ...subAdmin.permissions,
        [field]: checked
      };
      await updateSubAdmin(subAdminId, { permissions: updatedPermissions });
      toast.success('Permissions updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update permissions');
      fetchSubAdmins(); // Revert on fail
    }
  };

  const handleStatusToggle = async (subAdminId) => {
    const subAdmin = subAdmins.find(sa => (sa._id || sa.id) === subAdminId);
    if (!subAdmin) return;

    const newStatus = subAdmin.status === 'Active' ? 'Inactive' : 'Active';

    // Optimistic update
    setSubAdmins(subAdmins.map(sa => {
      if ((sa._id || sa.id) === subAdminId) {
        return { ...sa, status: newStatus };
      }
      return sa;
    }));

    try {
      await updateSubAdmin(subAdminId, { status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
      fetchSubAdmins(); // Revert on fail
    }
  };

  const filteredSubAdmins = subAdmins.filter(sa =>
    sa.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="saas-card saas-mb-15 subAdminCard">
        <h2 className="saas-text-2xl saas-font-bold subAdminCardTitle">Sub-Admin Management</h2>
        <p className="saas-text-muted saas-text-sm saas-mb-15">Manage and monitor all sub-admins in the system</p>

        <div className="saas-flex-between subAdminTopControls">
          <div className="saasSearchWrapperWide">
            <Search size={18} className="saasSearchIconPosition" />
            <input
              type="text"
              className="saas-input saasSearchInputWide"
              placeholder="Search sub-admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="saas-flex" style={{ gap: '10px' }}>
             <button className="saas-btn btn-outline btnSubAdminAdd" onClick={handleAddSubAdmin}>
                <Plus size={16} /> Add Sub-Admin
             </button>
             {/* <button className="saas-btn btn-primary btnSubAdminDownload">
                <Download size={16} /> Download Sub-Admins List
             </button> */}
          </div>
        </div>
      </div>

      <div className="saas-card subAdminTableCard">
        {isLoading ? (
          <div className="saas-loading" style={{ textAlign: 'center', padding: '20px' }}>Loading sub-admins...</div>
        ) : (
          <div className="saas-table-container">
            <table className="saas-table subAdminTable">
              <thead className="subAdminTableHeader">
                <tr>
                  <th>S.NO</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Sub Admin Access</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubAdmins.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No sub-admins found</td></tr>
                ) : (
                  filteredSubAdmins.map((subAdmin, index) => {
                    const id = subAdmin._id || subAdmin.id;
                    return (
                      <tr key={id} className="subAdminTableRow">
                        <td>{index + 1}</td>
                        <td className="saas-font-medium saas-text-main">{subAdmin.username}</td>
                        <td className="saas-text-muted">{subAdmin.email}</td>
                        <td>
                          <div className="saasStatusToggleContainer" onClick={() => handleStatusToggle(id)}>
                            <div className={`saasStatusToggleTrack ${subAdmin.status === 'Active' ? 'active' : 'inactive'}`}>
                              <div className={`saasStatusToggleThumb ${subAdmin.status === 'Active' ? 'active' : 'inactive'}`}>
                                {subAdmin.status === 'Active' && <Check size={12} color="#059669" />}
                                {subAdmin.status !== 'Active' && <X size={12} color="#f87171" />}
                              </div>
                            </div>
                            <span className="saasStatusLabel">
                              {subAdmin.status === 'Active' ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="subAdminPermissionsContainer">
                            <PermissionToggle
                              label="Vendor Add"
                              isActive={subAdmin.permissions?.vendorAdd}
                              onToggle={() => handlePermissionChange('vendorAdd', !subAdmin.permissions?.vendorAdd, id)}
                            />
                            <PermissionToggle
                              label="Subscription Access"
                              isActive={subAdmin.permissions?.subscriptionAccess}
                              onToggle={() => handlePermissionChange('subscriptionAccess', !subAdmin.permissions?.subscriptionAccess, id)}
                            />
                            {/* <PermissionToggle
                              label="Password Change Option"
                              isActive={subAdmin.permissions?.passwordChange}
                              onToggle={() => handlePermissionChange('passwordChange', !subAdmin.permissions?.passwordChange, id)}
                            /> */}
                          </div>
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              className="icon-btn"
                              title="Edit Sub-Admin"
                              onClick={() => handleEdit(subAdmin)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="icon-btn delete"
                              title="Delete Sub-Admin"
                              onClick={() => handleDelete(id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="saas-modal-overlay">
          <div className="saas-modal">
            <div className="saas-modal-header subAdminModalHeader">
              <h3 className="saas-text-xl saas-font-semibold subAdminModalTitle">
                {editingSubAdmin?._id ? `Edit Sub-Admin` : 'Add Sub-Admin'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="saas-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="saas-modal-content">
                <div className="inner-grid-2">
                  <div className="saas-form-group">
                    <label className="saas-label">Name *</label>
                    <input
                      type="text"
                      className="saas-input"
                      value={editingSubAdmin?.username || ''}
                      onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, username: e.target.value })}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="saas-form-group">
                    <label className="saas-label">Status</label>
                    <select
                      className="saas-select"
                      value={editingSubAdmin?.status || 'Active'}
                      onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="saas-form-group">
                  <label className="saas-label">Email *</label>
                  <input
                    type="email"
                    className="saas-input"
                    value={editingSubAdmin?.email || ''}
                    onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, email: e.target.value })}
                    placeholder="e.g. email@example.com"
                    required
                  />
                </div>

                <div className="saas-form-group">
                    <label className="saas-label">Password {editingSubAdmin?._id ? '' : '*'}</label>
                    
                    {!isChangingPassword && editingSubAdmin?._id ? (
                      <div style={{ marginTop: '8px' }}>
                        <a 
                          href="#!" 
                          onClick={(e) => { e.preventDefault(); setIsChangingPassword(true); }}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Change Password
                        </a>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="saas-input"
                          value={editingSubAdmin?.password || ''}
                          onChange={(e) => setEditingSubAdmin({...editingSubAdmin, password: e.target.value})}
                          placeholder={editingSubAdmin?._id ? "Enter new password" : "Enter password"}
                          required={!editingSubAdmin?._id}
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {editingSubAdmin?._id && (
                          <div style={{ marginTop: '8px', textAlign: 'right' }}>
                             <a 
                              href="#!" 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                setIsChangingPassword(false); 
                                setEditingSubAdmin({...editingSubAdmin, password: ''}); 
                              }}
                              style={{ color: '#ef4444', fontSize: '13px', textDecoration: 'none' }}
                             >
                               Cancel Change
                             </a>
                          </div>
                        )}
                      </div>
                    )}
                </div>

              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary btnSubAdminModalSave" disabled={isSaving}>
                  {isSaving ? <><Loader className="saas-spinner" size={16} /> Saving...</> : 'Save Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this sub-admin?"
        subMessage="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

const PermissionToggle = ({ label, isActive, onToggle }) => (
  <div className="permissionToggleWrapper">
    <span>{label}</span>
    <div className={`saasStatusToggleTrack ${isActive ? 'active' : 'inactive'}`} onClick={onToggle}>
      <div className={`saasStatusToggleThumb ${isActive ? 'active' : 'inactive'}`}>
        {isActive && <Check size={12} color="#059669" />}
        {!isActive && <X size={12} color="#f87171" />}
      </div>
    </div>
  </div>
);

export default SubAdminManagement;
