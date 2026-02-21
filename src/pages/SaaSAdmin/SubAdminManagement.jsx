import { useState, useEffect } from 'react';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { Plus, X, Download, Trash2, Search, Check } from 'lucide-react';

const SubAdminManagement = () => {
  const [subAdmins, setSubAdmins] = useState(() => {
    const saved = localStorage.getItem('saas_subadmins');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: 53,
        name: 'JayamProj',
        email: 'jayamproj@gmail.com',
        password: 'password123',
        status: 'Active',
        permissions: {
          vendorAdd: true,
          subscriptionAccess: true,
          passwordChange: false
        }
      },
      {
        id: 52,
        name: 'project',
        email: 'projects@jayamwebsolutions.com',
        password: 'password123',
        status: 'Active',
        permissions: {
          vendorAdd: true,
          subscriptionAccess: false,
          passwordChange: false
        }
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);

  useEffect(() => {
    localStorage.setItem('saas_subadmins', JSON.stringify(subAdmins));
  }, [subAdmins]);

  const handleAddSubAdmin = () => {
    setEditingSubAdmin({
      id: null,
      name: '',
      email: '',
      password: '',
      status: 'Active',
      permissions: {
        vendorAdd: false,
        subscriptionAccess: false,
        passwordChange: false
      }
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setAdminToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (adminToDelete) {
      setSubAdmins(subAdmins.filter(sa => sa.id !== adminToDelete));
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    }
  };

  const handleSave = () => {
    if (editingSubAdmin.id) {
      setSubAdmins(subAdmins.map(sa => sa.id === editingSubAdmin.id ? editingSubAdmin : sa));
    } else {
      const newId = subAdmins.length > 0 ? Math.max(...subAdmins.map(s => s.id)) + 1 : 1;
      setSubAdmins([...subAdmins, { ...editingSubAdmin, id: newId }]);
    }
    setIsModalOpen(false);
  };

  const handlePermissionChange = (field, checked, subAdminId) => {
    setSubAdmins(subAdmins.map(sa => {
      if (sa.id === subAdminId) {
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
  };

  const handleStatusToggle = (subAdminId) => {
    setSubAdmins(subAdmins.map(sa => {
      if (sa.id === subAdminId) {
        return { ...sa, status: sa.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return sa;
    }));
  };

  const filteredSubAdmins = subAdmins.filter(sa => 
    sa.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sa.email.toLowerCase().includes(searchQuery.toLowerCase())
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
             <button className="saas-btn btn-primary btnSubAdminDownload">
                <Download size={16} /> Download Sub-Admins List
             </button>
          </div>
        </div>
      </div>

      <div className="saas-card subAdminTableCard">
        <div className="saas-table-container">
          <table className="saas-table subAdminTable">
            <thead className="subAdminTableHeader">
              <tr>
                <th>S.NO</th>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Sub Admin Access</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubAdmins.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No sub-admins found</td></tr>
              ) : (
                filteredSubAdmins.map((subAdmin, index) => (
                  <tr key={subAdmin.id} className="subAdminTableRow">
                    <td>{index + 1}</td>
                    <td className="saas-text-muted">{subAdmin.id}</td>
                    <td className="saas-font-medium saas-text-main">{subAdmin.name}</td>
                    <td className="saas-text-muted">{subAdmin.email}</td>
                    <td>
                        <div className="saasStatusToggleContainer" onClick={() => handleStatusToggle(subAdmin.id)}>
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
                             onToggle={() => handlePermissionChange('vendorAdd', !subAdmin.permissions?.vendorAdd, subAdmin.id)}
                           />
                           <PermissionToggle 
                             label="Subscription Access" 
                             isActive={subAdmin.permissions?.subscriptionAccess} 
                             onToggle={() => handlePermissionChange('subscriptionAccess', !subAdmin.permissions?.subscriptionAccess, subAdmin.id)}
                           />
                           <PermissionToggle 
                             label="Password Change Option" 
                             isActive={subAdmin.permissions?.passwordChange} 
                             onToggle={() => handlePermissionChange('passwordChange', !subAdmin.permissions?.passwordChange, subAdmin.id)}
                           />
                        </div>
                    </td>
                    <td className="text-center align-top">
                        <button 
                            className="icon-btn delete btnSubAdminDelete" 
                            title="Delete Sub-Admin"
                            onClick={() => handleDelete(subAdmin.id)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Edit/Add Modal */}
       {isModalOpen && (
        <div className="saas-modal-overlay">
          <div className="saas-modal">
            <div className="saas-modal-header subAdminModalHeader">
              <h3 className="saas-text-xl saas-font-semibold subAdminModalTitle">
                {editingSubAdmin?.id ? `Edit Sub-Admin` : 'Add Sub-Admin'}
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
                      value={editingSubAdmin?.name || ''}
                      onChange={(e) => setEditingSubAdmin({...editingSubAdmin, name: e.target.value})}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="saas-form-group">
                    <label className="saas-label">Status</label>
                    <select 
                      className="saas-select"
                      value={editingSubAdmin?.status || 'Active'}
                      onChange={(e) => setEditingSubAdmin({...editingSubAdmin, status: e.target.value})}
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
                      onChange={(e) => setEditingSubAdmin({...editingSubAdmin, email: e.target.value})}
                      placeholder="e.g. email@example.com"
                      required
                    />
                </div>
                
                <div className="saas-form-group">
                    <label className="saas-label">Password *</label>
                    <input 
                      type="password" 
                      className="saas-input"
                      value={editingSubAdmin?.password || ''}
                      onChange={(e) => setEditingSubAdmin({...editingSubAdmin, password: e.target.value})}
                      placeholder="Enter password"
                      required
                    />
                </div>

              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary btnSubAdminModalSave">Save Sub-Admin</button>
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
