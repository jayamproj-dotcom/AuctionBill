import { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, Camera, Eye, EyeOff, Edit, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminProfile, updateAdminProfile } from '../../api/adminApi';
import './SaaSAdmin.css';

const AdminProfile = () => {
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    adminName: localStorage.getItem('saas_admin_name') || "Super Admin",
    adminEmail: localStorage.getItem('saas_admin_email') || "admin@auctionbill.com",
    adminPhoto: localStorage.getItem('saas_admin_photo') || null
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getAdminProfile();
        if (response && response.status && response.data) {
          setSettings(prev => ({
            ...prev,
            adminName: response.data.username,
            adminEmail: response.data.email
          }));
          localStorage.setItem('saas_admin_name', response.data.username);
          localStorage.setItem('saas_admin_email', response.data.email);
          window.dispatchEvent(new Event('saas_profile_updated'));
        }
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

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
    setLoading(true);
    try {
      if (settings.adminPhoto) {
          localStorage.setItem('saas_admin_photo', settings.adminPhoto);
      }

      const response = await updateAdminProfile({
        username: settings.adminName,
        email: settings.adminEmail
      });

      if (response && response.status) {
        localStorage.setItem('saas_admin_name', settings.adminName);
        localStorage.setItem('saas_admin_email', settings.adminEmail);
        
        // Dispatch event to update Layout
        window.dispatchEvent(new Event('saas_profile_updated'));

        setIsEditing(false);
        toast.success("Profile configurations saved successfully!");
      } else {
        toast.error(response?.message || "Failed to save profile");
      }
    } catch(err) {
      console.error("Save profile error:", err);
      toast.error(err.message || "An error occurred while saving profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Reset to local storage on cancel
    setSettings({
      adminName: localStorage.getItem('saas_admin_name') || "Super Admin",
      adminEmail: localStorage.getItem('saas_admin_email') || "admin@auctionbill.com",
      adminPhoto: localStorage.getItem('saas_admin_photo') || null
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
          
          <div className="saas-profile-photo-wrap">
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
               className="saas-profile-photo-hide"
               onChange={handlePhotoChange} 
             />

             <h4 className="saas-profile-name">{settings.adminName}</h4>
             <p className="saas-profile-email">{settings.adminEmail}</p>
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
              <button className="saas-btn btn-outline saas-profile-action-btn" onClick={handleCancelClick} disabled={loading}>
                <X size={16} /> Cancel
              </button>
              <button className="saas-btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                 {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
