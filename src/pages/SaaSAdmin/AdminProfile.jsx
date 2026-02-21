import { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, Camera, Eye, EyeOff } from 'lucide-react';
import './SaaSAdmin.css';

const AdminProfile = () => {
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    adminName: localStorage.getItem('saas_admin_name') || "Super Admin",
    adminEmail: localStorage.getItem('saas_admin_email') || "admin@auctionbill.com",
    adminPhoto: localStorage.getItem('saas_admin_photo') || null
  });

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

    if (settings.adminPhoto) {
        localStorage.setItem('saas_admin_photo', settings.adminPhoto);
    }
    
    localStorage.setItem('saas_admin_name', settings.adminName);
    localStorage.setItem('saas_admin_email', settings.adminEmail);
    
    // Dispatch event to update Layout
    window.dispatchEvent(new Event('saas_profile_updated'));

    alert("Profile configurations saved successfully!");
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

          <button className="saas-btn btn-primary" style={{ width: "100%", marginTop: "15px" }} onClick={handleSave}>
             Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
