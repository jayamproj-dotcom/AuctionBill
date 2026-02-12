import './SaaSAdmin.css';

const GlobalSettings = () => {
  return (
    <div className="fade-in">
      <div className="saas-card saas-container-narrow">
        <div className="saas-card-header">
          <h3 className="saas-text-lg saas-font-semibold">Platform Configuration</h3>
        </div>
        <div className="saas-modal-content">
          <div className="saas-form-group">
            <label className="saas-label">Platform Name</label>
            <input type="text" className="saas-input" defaultValue="AuctionBill SaaS" />
          </div>
          
          <div className="saas-form-group">
            <label className="saas-label">Support Email</label>
            <input type="email" className="saas-input" defaultValue="support@auctionbill.com" />
          </div>

          <div className="inner-grid-2">
            <div className="saas-form-group">
              <label className="saas-label">Currency Symbol</label>
              <input type="text" className="saas-input" defaultValue="₹" />
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Tax Rate (%)</label>
              <input type="number" className="saas-input" defaultValue="18" />
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Global Maintenance Mode</label>
            <label className="saas-checkbox-label">
              <input type="checkbox" /> Offline for all vendors
            </label>
          </div>

          <hr className="saas-separator" />
          
          <h4 className="saas-font-semibold saas-mb-1">Admin Account</h4>
          <div className="saas-form-group">
            <label className="saas-label">Change Super Admin Password</label>
            <input type="password" title="password" className="saas-input" placeholder="New Password" />
          </div>
          
          <button className="saas-btn btn-primary">Save Platform Settings</button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
