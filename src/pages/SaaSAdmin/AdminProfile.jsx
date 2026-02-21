import { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, Camera, Eye, EyeOff } from 'lucide-react';
import './SaaSAdmin.css';

const AdminProfile = () => {
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    adminName: localStorage.getItem('saas_admin_name') || "Super Admin",
    adminEmail: localStorage.getItem('saas_admin_email') || "admin@auctionbill.com",
    adminPhoto: localStorage.getItem('saas_admin_photo') || null,
    adminPassword: "",
    subadminPassword: "",
    currentVerifyPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    currentVerifyPassword: false,
    adminPassword: false,
    subadminPassword: false
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

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

  const handleSave = () => {
    // Handle Password Updates
    if (settings.adminPassword || settings.subadminPassword) {
        const storedAdminPass = localStorage.getItem('saas_admin_password') || "admin@123";
        
        if (settings.currentVerifyPassword !== storedAdminPass) {
            alert("Error: Incorrect Current Admin Password. Password changes were not saved.");
            return;
        }

        // Save passwords if verified
        if (settings.adminPassword) {
            localStorage.setItem('saas_admin_password', settings.adminPassword);
        }
        if (settings.subadminPassword) {
            localStorage.setItem('saas_subadmin_password', settings.subadminPassword);
        }
    }

    if (settings.adminPhoto) {
        localStorage.setItem('saas_admin_photo', settings.adminPhoto);
    }
    
    localStorage.setItem('saas_admin_name', settings.adminName);
    localStorage.setItem('saas_admin_email', settings.adminEmail);
    
    // Dispatch event to update Layout
    window.dispatchEvent(new Event('saas_profile_updated'));

    alert("Profile configurations saved successfully!");
    
    // Clear password fields after save
    setSettings(prev => ({ 
        ...prev, 
        adminPassword: "", 
        subadminPassword: "",
        currentVerifyPassword: "" 
    }));
  };

  return (
    <div className="fade-in">
      <div className="saas-card saas-container-narrow" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="saas-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={24} className="saas-text-primary" />
          <h3 className="saas-text-lg saas-font-semibold">Admin Profile</h3>
        </div>
        <div className="saas-modal-content">
          
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
             <div 
               className="saas-settings-profile-photo"
               style={{ backgroundImage: settings.adminPhoto ? `url(${settings.adminPhoto})` : 'none' }}
               onClick={triggerFileInput}
             >
                {!settings.adminPhoto && "SA"}
                
                <div className="saas-settings-camera-icon">
                  <Camera size={14} />
                </div>
             </div>
             
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
            <input 
              type="text" 
              name="adminName"
              className="saas-input" 
              value={settings.adminName}
              onChange={handleChange}
            />
          </div>
          
          <div className="saas-form-group">
            <label className="saas-label">Admin Email</label>
            <input 
              type="email" 
              name="adminEmail"
              className="saas-input" 
              value={settings.adminEmail}
              onChange={handleChange}
            />
          </div>

          {role === 'admin' && (
            <>
              <hr className="saas-separator" style={{ margin: "30px 0" }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <ShieldCheck size={20} className="saas-text-primary" />
                <h4 className="saas-font-semibold">Change Passwords</h4>
              </div>
              
              <div className="saas-form-group">
                  <label className="saas-label">Current Admin Password (Required for changes)</label>
                  <div className="saas-input-container">
                      <input 
                        type={showPasswords.currentVerifyPassword ? "text" : "password"} 
                        name="currentVerifyPassword"
                        className="saas-input saas-input-with-toggle" 
                        placeholder="Enter Current Super Admin Password" 
                        value={settings.currentVerifyPassword}
                        onChange={handleChange}
                      />
                      <button 
                        type="button"
                        className="saas-password-toggle"
                        onClick={() => togglePasswordVisibility('currentVerifyPassword')}
                        tabIndex="-1"
                      >
                         {showPasswords.currentVerifyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
              </div>

              <div className="saas-form-group">
                  <label className="saas-label">New Super Admin Password</label>
                  <div className="saas-input-container">
                      <input 
                        type={showPasswords.adminPassword ? "text" : "password"} 
                        name="adminPassword"
                        title="Leave blank to keep current password" 
                        className="saas-input saas-input-with-toggle" 
                        placeholder="New Super Admin Password" 
                        value={settings.adminPassword}
                        onChange={handleChange}
                      />
                      <button 
                        type="button"
                        className="saas-password-toggle"
                        onClick={() => togglePasswordVisibility('adminPassword')}
                        tabIndex="-1"
                      >
                         {showPasswords.adminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
              </div>
                
              <div className="saas-form-group">
                  <label className="saas-label">New Sub Admin Password</label>
                  <div className="saas-input-container">
                      <input 
                        type={showPasswords.subadminPassword ? "text" : "password"} 
                        name="subadminPassword"
                        title="Leave blank to keep current password" 
                        className="saas-input saas-input-with-toggle" 
                        placeholder="New Sub Admin Password" 
                        value={settings.subadminPassword}
                        onChange={handleChange}
                      />
                      <button 
                        type="button"
                        className="saas-password-toggle"
                        onClick={() => togglePasswordVisibility('subadminPassword')}
                        tabIndex="-1"
                      >
                         {showPasswords.subadminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
              </div>
            </>
          )}
          
          <button className="saas-btn btn-primary" style={{ width: "100%", marginTop: "15px" }} onClick={handleSave}>
             Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
