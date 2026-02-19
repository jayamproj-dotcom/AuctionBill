import { useState, useEffect } from 'react';
import './SaaSAdmin.css';

const GlobalSettings = () => {
  const [settings, setSettings] = useState({
    platformName: "AuctionBill SaaS",
    supportEmail: "support@auctionbill.com",
    currencySymbol: "₹",
    taxRate: 18,
    maintenanceMode: false,
    adminPassword: "",
    subadminPassword: "",
    currentVerifyPassword: ""
  });

  useEffect(() => {
    // Load saved settings if they exist
    const savedSettings = JSON.parse(localStorage.getItem('saas_platform_settings'));
    if (savedSettings) {
      setSettings(prev => ({
        ...prev,
        ...savedSettings,
        adminPassword: "", // Don't verify/load passwords for security
        subadminPassword: "",
        currentVerifyPassword: ""
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    // Save general settings
    const settingsToSave = {
      platformName: settings.platformName,
      supportEmail: settings.supportEmail,
      currencySymbol: settings.currencySymbol,
      taxRate: settings.taxRate,
      maintenanceMode: settings.maintenanceMode
    };
    localStorage.setItem('saas_platform_settings', JSON.stringify(settingsToSave));

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

    alert("Settings saved successfully!");
    // Clear password fields after save
    setSettings(prev => ({ 
        ...prev, 
        adminPassword: "", 
        subadminPassword: "",
        currentVerifyPassword: "" 
    }));
  };

  const role = localStorage.getItem('saas_role');

  return (
    <div className="fade-in">
      <div className="saas-card saas-container-narrow">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Platform Configuration</h3>
        </div>
        <div className="saas-modal-content">
          <div className="saas-form-group">
            <label className="saas-label">Platform Name</label>
            <input 
              type="text" 
              name="platformName"
              className="saas-input" 
              value={settings.platformName}
              onChange={handleChange}
            />
          </div>
          
          <div className="saas-form-group">
            <label className="saas-label">Support Email</label>
            <input 
              type="email" 
              name="supportEmail"
              className="saas-input" 
              value={settings.supportEmail}
              onChange={handleChange}
            />
          </div>

          <div className="inner-grid-2">
            <div className="saas-form-group">
              <label className="saas-label">Currency Symbol</label>
              <input 
                type="text" 
                name="currencySymbol"
                className="saas-input" 
                value={settings.currencySymbol}
                onChange={handleChange}
              />
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Tax Rate (%)</label>
              <input 
                type="number" 
                name="taxRate"
                className="saas-input" 
                value={settings.taxRate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* <div className="saas-form-group">
            <label className="saas-label">Global Maintenance Mode</label>
            <label className="saas-checkbox-label">
              <input 
                type="checkbox" 
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
              /> Offline for all vendors
            </label>
          </div> */}

          {role === 'admin' && (
            <>
              <hr className="saas-separator" />
              
              <h4 className="saas-font-semibold saas-mb-1">Admin Account Management</h4>
              
              <div className="saas-form-group">
                  <label className="saas-label">Current Admin Password (Required for changes)</label>
                  <input 
                    type="password" 
                    name="currentVerifyPassword"
                    className="saas-input" 
                    placeholder="Enter Current Super Admin Password" 
                    value={settings.currentVerifyPassword}
                    onChange={handleChange}
                  />
              </div>

              <div className="inner-grid-2">
                <div className="saas-form-group">
                  <label className="saas-label">New Super Admin Password</label>
                  <input 
                    type="password" 
                    name="adminPassword"
                    title="Leave blank to keep current password" 
                    className="saas-input" 
                    placeholder="New Super Admin Password" 
                    value={settings.adminPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className="saas-form-group">
                  <label className="saas-label">New Sub Admin Password</label>
                  <input 
                    type="password" 
                    name="subadminPassword"
                    title="Leave blank to keep current password" 
                    className="saas-input" 
                    placeholder="New Sub Admin Password" 
                    value={settings.subadminPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}
          
          <button className="saas-btn btn-primary" onClick={handleSave}>Save Platform Settings</button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
