import { useState } from 'react';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import './SaaSAdmin.css';

const SaaSChangePassword = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const storedAdminPass = localStorage.getItem('saas_admin_password') || "admin@123";

    if (passwords.currentPassword !== storedAdminPass) {
        alert("Error: Incorrect Current Password.");
        return;
    }

    if (passwords.newPassword.length < 6) {
        alert("Error: Password must be at least 6 characters.");
        return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
        alert("Error: New Password and Confirm Password do not match.");
        return;
    }

    localStorage.setItem('saas_admin_password', passwords.newPassword);
    alert("Password changed successfully!");
    
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="fade-in">
      <div className="saas-card saas-container-narrow" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 className="saas-text-2xl saas-font-bold" style={{ color: '#1f2937', marginBottom: '10px' }}>Change Password</h2>
          <p className="saas-text-muted">Update your account password</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="saas-form-group" style={{ marginBottom: "25px" }}>
              <label className="saas-label" style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Current Password</label>
              <div className="saas-input-container" style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#9ca3af' }} />
                  <input 
                    type={showPasswords.currentPassword ? "text" : "password"} 
                    name="currentPassword"
                    className="saas-input saas-input-with-toggle" 
                    placeholder="Enter current password" 
                    value={passwords.currentPassword}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '45px', paddingRight: '45px', height: '44px', borderRadius: '8px' }}
                  />
                  <button 
                    type="button"
                    className="saas-password-toggle"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    tabIndex="-1"
                    style={{ position: 'absolute', right: '15px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                     {showPasswords.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
          </div>

          <div className="saas-form-group" style={{ marginBottom: "15px" }}>
              <label className="saas-label" style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '8px', display: 'block' }}>New Password</label>
              <div className="saas-input-container" style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#9ca3af' }} />
                  <input 
                    type={showPasswords.newPassword ? "text" : "password"} 
                    name="newPassword"
                    className="saas-input saas-input-with-toggle" 
                    placeholder="Enter new password" 
                    value={passwords.newPassword}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '45px', paddingRight: '45px', height: '44px', borderRadius: '8px' }}
                  />
                  <button 
                    type="button"
                    className="saas-password-toggle"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    tabIndex="-1"
                    style={{ position: 'absolute', right: '15px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                     {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Password must be at least 6 characters</p>
          </div>
            
          <div className="saas-form-group" style={{ marginBottom: "30px" }}>
              <label className="saas-label" style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Confirm New Password</label>
              <div className="saas-input-container" style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#9ca3af' }} />
                  <input 
                    type={showPasswords.confirmPassword ? "text" : "password"} 
                    name="confirmPassword"
                    className="saas-input saas-input-with-toggle" 
                    placeholder="Confirm new password" 
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '45px', paddingRight: '45px', height: '44px', borderRadius: '8px' }}
                  />
                  <button 
                    type="button"
                    className="saas-password-toggle"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    tabIndex="-1"
                    style={{ position: 'absolute', right: '15px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                     {showPasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
          </div>
          
          <button type="submit" className="saas-btn btn-primary" style={{ width: "100%", height: "48px", borderRadius: "8px", backgroundColor: "#3b82f6", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "600" }}>
             <Check size={20} /> Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default SaaSChangePassword;
