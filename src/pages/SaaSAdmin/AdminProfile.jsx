import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSaasAuthData } from '../../redux/slices/saasAuthSlice';
import { User, Camera, Edit, X, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateAdminProfile } from '../../api/adminApi';
import './SaaSAdmin.css';

const AdminProfile = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { saasAdminName, adminData, saasAdminPhoto } = useSelector((state) => state.saasAuth);

  const [settings, setSettings] = useState({
    adminName: saasAdminName || adminData?.username || "Super Admin",
    adminEmail: adminData?.email || "admin@auctionbill.com",
    adminPhoto: saasAdminPhoto || null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        const updatePayload = {
          saasAdminName: response.admin.username,
          adminData: {
            ...adminData,
            username: response.admin.username,
            email: response.admin.email
          }
        };

        if (settings.adminPhoto) {
          sessionStorage.setItem('saas_admin_photo', settings.adminPhoto);
          updatePayload.saasAdminPhoto = settings.adminPhoto;
        }

        sessionStorage.setItem('saas_admin_name', response.admin.username);
        sessionStorage.setItem('saas_admin_email', response.admin.email);
        sessionStorage.setItem('admin_data', JSON.stringify(updatePayload.adminData));
        
        dispatch(setSaasAuthData(updatePayload));

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
    
    setSettings({
      adminName: saasAdminName || adminData?.username || "Super Admin",
      adminEmail: adminData?.email || "admin@auctionbill.com",
      adminPhoto: saasAdminPhoto || null
    });
  };

  return (
    <div className="fade-in">
      <div className="saas-card saas-profile-container">
        <div className="saas-card-header saas-profile-header-wrap">
          <div className="saas-profile-header-title">
            <User size={24} className="saas-text-primary" />
            <h3 className="saas-text-lg saas-font-semibold">Admin Profile</h3>
          </div>
          {!isEditing && (
            <button className="saas-btn btn-outline saas-profile-action-btn" onClick={handleEditClick}>
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
              <div className="saas-profile-readonly">
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
              <div className="saas-profile-readonly">
                {settings.adminEmail}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="saas-profile-actions">
              <button className="saas-btn btn-outline saas-profile-action-btn" onClick={handleCancelClick} disabled={isLoading}>
                <X size={16} /> Cancel
              </button>
              <button className="saas-btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isLoading}>
                {isLoading ? <><Loader className="saas-spinner" size={16} /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
