import { useState, useEffect } from 'react';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { Plus, X } from 'lucide-react';
import api from '../../api/api';

const SubscriptionManagement = () => {
  const role = localStorage.getItem('saas_role');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/subscription-plans');
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);

  const handleEdit = (plan) => {
    let durationNumber = '1';
    let durationUnit = 'Month';
    
    if (plan.duration === "Forever") {
        durationNumber = '';
        durationUnit = 'Forever';
    } else {
        const match = plan.duration?.match(/^(\d+)\s*(Month|Year)s?$/i);
        if (match) {
            durationNumber = match[1];
            durationUnit = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
        } else if (plan.duration?.toLowerCase().includes('year')) {
            durationUnit = 'Year';
        }
    }

    setEditingPlan({ 
        ...plan, 
        featuresString: plan.features.join('\n'),
        durationNumber,
        durationUnit
    });
    setIsModalOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan({
      _id: null, // Indicates new plan
      name: '',
      price: '',
      durationNumber: '1',
      durationUnit: 'Month',
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

  const confirmDelete = async () => {
    if (planToDelete) {
      try {
        await api.delete(`/api/subscription-plans/${planToDelete}`);
        setPlans(plans.filter(plan => plan._id !== planToDelete));
      } catch (error) {
         console.error("Error deleting plan:", error);
      } finally {
         setIsDeleteModalOpen(false);
         setPlanToDelete(null);
      }
    }
  };


  const handleSave = async () => {
    const updatedFeatures = editingPlan.featuresString.split('\n').filter(f => f.trim() !== '');
    
    const durationStr = editingPlan.durationUnit === 'Forever' 
        ? 'Forever' 
        : `${editingPlan.durationNumber} ${editingPlan.durationUnit}`;

    const payload = {
        name: editingPlan.name,
        price: Number(editingPlan.price),
        duration: durationStr,
        status: editingPlan.status,
        features: updatedFeatures
    };

    try {
        if (editingPlan._id) {
          // Update existing plan
          const response = await api.put(`/api/subscription-plans/${editingPlan._id}`, payload);
          if (response.data.success) {
            setPlans(plans.map(p => p._id === editingPlan._id ? response.data.plan : p));
          }
        } else {
          // Add new plan
          const response = await api.post('/api/subscription-plans', payload);
          if (response.data.success) {
             setPlans([...plans, response.data.plan]);
          }
        }
    } catch (error) {
       console.error("Error saving plan:", error);
    } finally {
       setIsModalOpen(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="saas-flex-end saas-mb-15">
        {role !== 'subadmin' && (
          <button className="saas-btn btn-primary" onClick={handleAddPlan}>
            <span><Plus /></span> Add New Plan
          </button>
        )}
      </div>

      {loading ? (
        <div className="saas-flex-center saas-p-4">Loading plans...</div>
      ) : (
      <div className="saas-grid-responsive">
        {plans.map((plan) => (
          <div key={plan._id} className="saas-card saas-flex-col">
            <div className="saas-card-header saas-flex-col saas-align-start saas-gap-05">
              <div className="saas-flex-between saas-w-full">
                <h3 className="saas-text-xl saas-font-bold">{plan.name} Plan</h3>
                <span className={`saas-badge ${plan.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{plan.status}</span>
              </div>
              <div className="saas-align-baseline saas-gap-025">
                <span className="saas-plan-price">₹{Number(plan.price || 0).toLocaleString('en-IN')}</span>
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
  
  {role !== 'subadmin' && (
    <>
      <button 
        className="saas-btn btn-outline saas-flex-1" 
        onClick={() => handleEdit(plan)}
      >
        Edit
      </button>

      <button 
        className="saas-btn btn-danger saas-flex-1" 
        onClick={() => handleDelete(plan._id)}
      >
        Delete
      </button>
    </>
  )}

</div>

          </div>
        ))}
      </div>
      )}

      {/* Edit/Add Plan Modal */}
      {isModalOpen && (
        <div className="saas-modal-overlay">
          <div className="saas-modal">
            <div className="saas-modal-header">
              <h3 className="saas-text-xl saas-font-semibold">
                {editingPlan?._id ? `Edit Plan: ${editingPlan.name}` : 'Add New Plan'}
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
                    <label className="saas-label">Plan Name *</label>
                    <input 
                      type="text" 
                      className="saas-input"
                      value={editingPlan?.name || ''}
                      onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                      placeholder="e.g. Enterprise"
                      required
                    />
                  </div>
                  <div className="saas-form-group">
                    <label className="saas-label">Status *</label>
                    <select 
                      className="saas-select"
                      value={editingPlan?.status || 'Active'}
                      onChange={(e) => setEditingPlan({...editingPlan, status: e.target.value})}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="inner-grid-2">
                  <div className="saas-form-group">
                    <label className="saas-label">Price *</label>
                    <div className="saas-input-container" style={{ position: 'relative' }}>
                       <span style={{ position: 'absolute', left: '15px', color: '#6b7280', fontWeight: '500', zIndex: 10 }}>₹</span>
                       <input 
                         type="number" 
                         min="0"
                         className="saas-input"
                         style={{ paddingLeft: '32px' }}
                         value={editingPlan?.price || ''}
                         onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                         placeholder="e.g. 4999"
                         required
                       /> 
                    </div>
                  </div>
                  <div className="saas-form-group">
                    <label className="saas-label">Duration *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="number" 
                        min="1"
                        className="saas-input"
                        style={{ flex: 1 }}
                        value={editingPlan?.durationNumber || ''}
                        onChange={(e) => setEditingPlan({...editingPlan, durationNumber: e.target.value})}
                        placeholder="Qty"
                        disabled={editingPlan?.durationUnit === 'Forever'}
                        required={editingPlan?.durationUnit !== 'Forever'}
                      />
                      <select 
                        className="saas-select"
                        style={{ flex: 1 }}
                        value={editingPlan?.durationUnit || 'Month'}
                        onChange={(e) => setEditingPlan({...editingPlan, durationUnit: e.target.value})}
                      >
                        <option value="Month">Month(s)</option>
                        <option value="Year">Year(s)</option>
                        <option value="Forever">Forever</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="saas-form-group">
                  <label className="saas-label">Features (one per line) *</label>
                  <textarea 
                    className="saas-textarea"
                    rows="5"
                    value={editingPlan?.featuresString || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, featuresString: e.target.value})}
                    placeholder="Enter features..."
                    required
                  ></textarea>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="saas-btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="saas-btn btn-primary">Save Changes</button>
              </div>
            </form>
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