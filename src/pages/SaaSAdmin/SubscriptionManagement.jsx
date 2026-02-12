import { useState } from 'react';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal';

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([
    { id: 1, name: 'Free', price: '₹0', duration: 'Forever', features: ['Up to 100 transactions/mo', 'Basic reports', '1 User'], status: 'Active' },
    { id: 2, name: 'Basic', price: '₹999', duration: '/month', features: ['Unlimited transactions', 'Advanced Analytics', '3 Users', 'Email Support'], status: 'Active' },
    { id: 3, name: 'Premium', price: '₹2,499', duration: '/month', features: ['All Basic features', 'Custom Branding', 'Unlimited Users', 'Priority 24/7 Support', 'Data Export'], status: 'Active' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);

  const handleEdit = (plan) => {
    setEditingPlan({ ...plan, featuresString: plan.features.join('\n') });
    setIsModalOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan({
      id: null, // Indicates new plan
      name: '',
      price: '',
      duration: '/month',
      features: [],
      featuresString: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setPlanToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      const updatedPlans = plans.filter(plan => plan.id !== planToDelete);
      setPlans(updatedPlans);
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    }
  };


  const handleSave = () => {
    const updatedFeatures = editingPlan.featuresString.split('\n').filter(f => f.trim() !== '');
    
    if (editingPlan.id) {
      // Update existing plan
      const updatedPlans = plans.map(p => 
        p.id === editingPlan.id ? { ...editingPlan, features: updatedFeatures } : p
      );
      setPlans(updatedPlans);
    } else {
      // Add new plan
      const newId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;
      const newPlan = {
        ...editingPlan,
        id: newId,
        features: updatedFeatures
      };
      setPlans([...plans, newPlan]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="fade-in">
      <div className="saas-flex-end saas-mb-15">
        <button className="saas-btn btn-primary" onClick={handleAddPlan}>
          + Add New Plan
        </button>
      </div>

      <div className="saas-grid-responsive">
        {plans.map((plan) => (
          <div key={plan.id} className="saas-card saas-flex-col">
            <div className="saas-card-header saas-flex-col saas-align-start saas-gap-05">
              <div className="saas-flex-between saas-w-full">
                <h3 className="saas-text-xl saas-font-bold">{plan.name} Plan</h3>
                <span className={`saas-badge ${plan.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{plan.status}</span>
              </div>
              <div className="saas-align-baseline saas-gap-025">
                <span className="saas-plan-price">{plan.price}</span>
                <span className="saas-text-muted saas-text-sm">{plan.duration}</span>
              </div>
            </div>
            <div className="saas-content saas-flex-1">
              <ul className="saas-feature-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="saas-feature-item">
                    <span className="saas-text-success">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>
          <div className="saas-card-footer-actions">
  
  <button 
    className="saas-btn btn-outline saas-flex-1" 
    onClick={() => handleEdit(plan)}
  >
    Edit
  </button>

  <button 
    className="saas-btn btn-danger saas-flex-1" 
    onClick={() => handleDelete(plan.id)}
  >
    Delete
  </button>

</div>

          </div>
        ))}
      </div>

      {/* Edit/Add Plan Modal */}
      {isModalOpen && (
        <div className="saas-modal-overlay">
          <div className="saas-modal">
            <div className="saas-modal-header">
              <h3 className="saas-text-xl saas-font-semibold">
                {editingPlan?.id ? `Edit Plan: ${editingPlan.name}` : 'Add New Plan'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="saas-modal-close-btn"
              >
                ×
              </button>
            </div>
            <div className="saas-modal-content">
              <div className="inner-grid-2">
                <div className="saas-form-group">
                  <label className="saas-label">Plan Name</label>
                  <input 
                    type="text" 
                    className="saas-input"
                    value={editingPlan?.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    placeholder="e.g. Enterprise"
                  />
                </div>
                <div className="saas-form-group">
                  <label className="saas-label">Status</label>
                  <select 
                    className="saas-select"
                    value={editingPlan?.status}
                    onChange={(e) => setEditingPlan({...editingPlan, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="inner-grid-2">
                <div className="saas-form-group">
                  <label className="saas-label">Price (with symbol)</label>
                  <input 
                    type="text" 
                    className="saas-input"
                    value={ editingPlan?.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                    placeholder="e.g. ₹4,999"
                  /> 
                </div>
                <div className="saas-form-group">
                  <label className="saas-label">Duration</label>
                  <input 
                    type="text" 
                    className="saas-input"
                    value={editingPlan?.duration}
                    onChange={(e) => setEditingPlan({...editingPlan, duration: e.target.value})}
                    placeholder="e.g. /month"
                  />
                </div>
              </div>

              <div className="saas-form-group">
                <label className="saas-label">Features (one per line)</label>
                <textarea 
                  className="saas-textarea"
                  rows="5"
                  value={editingPlan?.featuresString}
                  onChange={(e) => setEditingPlan({...editingPlan, featuresString: e.target.value})}
                  placeholder="Enter features..."
                ></textarea>
              </div>
            </div>
            <div className="saas-modal-footer">
              <button className="saas-btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="saas-btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this plan?"
        subMessage="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      <div className="saas-card">
        <div className="saas-card-header">
           <h3 className="saas-text-lg saas-font-semibold">Recent Subscription Payments</h3>
           <button className="saas-btn btn-sm btn-outline">Export Report</button>
        </div>
        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Royal Auctions</td>
                <td>Premium</td>
                <td>₹2,499</td>
                <td>2026-02-01  </td>
                <td><span className="saas-badge badge-success">Success</span></td>
              </tr>
              <tr>
                <td>Heritage Bids</td>
                <td>Basic</td>
                <td>₹999</td>
                <td>2026-02-05</td>
                <td><span className="saas-badge badge-success">Success</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SubscriptionManagement;