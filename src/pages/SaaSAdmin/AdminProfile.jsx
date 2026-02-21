import { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, Camera, Eye, EyeOff, Edit, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateAdminProfile } from '../../api/adminApi';
import './SaaSAdmin.css';

const AdminProfile = () => {
  const fileInputRef = useRef(null);
  const adminDataString = localStorage.getItem('admin_data');
  const adminDataObj = adminDataString ? JSON.parse(adminDataString) : {};

  const [settings, setSettings] = useState({
    adminName: localStorage.getItem('saas_admin_name') || adminDataObj.username || "Super Admin",
    adminEmail: adminDataObj.email || "admin@auctionbill.com",
    adminPhoto: localStorage.getItem('saas_admin_photo') || null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const role = localStorage.getItem('saas_role');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, adminPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!settings.adminName || !settings.adminEmail) {
      return toast.error("Name and email are required");
    }

    setIsLoading(true);
    try {
      // Update via backend API
      const payload = {
        username: settings.adminName,
        email: settings.adminEmail
      };

      const response = await updateAdminProfile(payload);

      if (response.status && response.admin) {
        if (settings.adminPhoto) {
          localStorage.setItem('saas_admin_photo', settings.adminPhoto);
        }

        localStorage.setItem('saas_admin_name', response.admin.username);
        localStorage.setItem('saas_admin_email', response.admin.email);

        const currentAdminDataStr = localStorage.getItem('admin_data');
        if (currentAdminDataStr) {
          try {
            const currentAdminData = JSON.parse(currentAdminDataStr);
            currentAdminData.username = response.admin.username;
            currentAdminData.email = response.admin.email;
            localStorage.setItem('admin_data', JSON.stringify(currentAdminData));
          } catch (e) {
            console.error("Error updating admin_data in localStorage", e);
          }
        }

        // Update local state to match API response
        setSettings(prev => ({
          ...prev,
          adminName: response.admin.username,
          adminEmail: response.admin.email
        }));

        // Dispatch event to update Layout
        window.dispatchEvent(new Event('saas_profile_updated'));

        setIsEditing(false);
        toast.success(response.message || "Profile configurations saved successfully!");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while updating the profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    const adminDataStr = localStorage.getItem('admin_data');
    const adminData = adminDataStr ? JSON.parse(adminDataStr) : {};

    setSettings({
      adminName: localStorage.getItem('saas_admin_name') || adminData.username || "Super Admin",
      adminEmail: adminData.email || "admin@auctionbill.com",
      adminPhoto: localStorage.getItem('saas_admin_photo') || null
    });
  };

  return (
    <div className="fade-in">
      <div className="saas-card saas-container-narrow" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="saas-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={24} className="saas-text-primary" />
            <h3 className="saas-text-lg saas-font-semibold">Admin Profile</h3>
          </div>
          {!isEditing && (
            <button className="saas-btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={handleEditClick}>
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>
        <div className="saas-modal-content">

          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            {/* <div 
               className="saas-settings-profile-photo"
               style={{ backgroundImage: settings.adminPhoto ? `url(${settings.adminPhoto})` : 'none' }}
               onClick={triggerFileInput}
             >
                {!settings.adminPhoto && "SA"}
                
                <div className="saas-settings-camera-icon">
                  <Camera size={14} />
                </div>
             </div> */}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            <h4 style={{ fontSize: "1.2rem", fontWeight: "600" }}>{settings.adminName}</h4>
            <p style={{ color: "gray" }}>{settings.adminEmail}</p>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Admin Name</label>
            {isEditing ? (
              <input
                type="text"
                name="adminName"
                className="saas-input"
                value={settings.adminName}
                onChange={handleChange}
              />
            ) : (
              <div style={{ padding: '0.625rem 0.875rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                {settings.adminName}
              </div>
            )}
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Admin Email</label>
            {isEditing ? (
              <input
                type="email"
                name="adminEmail"
                className="saas-input"
                value={settings.adminEmail}
                onChange={handleChange}
              />
            ) : (
              <div style={{ padding: '0.625rem 0.875rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                {settings.adminEmail}
              </div>
            )}
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="saas-btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }} onClick={handleCancelClick}>
                <X size={16} /> Cancel
              </button>
              <button className="saas-btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
