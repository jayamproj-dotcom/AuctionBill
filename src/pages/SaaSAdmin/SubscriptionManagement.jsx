import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import './SaaSAdmin.css';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { getSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../../api/adminApi';
import { useSelector } from 'react-redux';

const SubscriptionManagement = () => {
  const { saasRole, saasPermissions } = useSelector((state) => state.saasAuth);
  
  const isSubAdmin = saasRole === 'sub-admin' || saasRole === 'subadmin';
  const canManageSubscriptions = !isSubAdmin || saasPermissions?.subscriptionAccess === true || String(saasPermissions?.subscriptionAccess).toLowerCase() === 'true';
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await getSubscriptions();
      setPlans(data.subscriptions || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch subscriptions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan({
      ...plan,
      price: plan.price?.toString() || '',
      durationValue: plan.durationValue || 1,
      durationType: plan.durationType || 'month',
      status: plan.status || 'Active',
      featuresString: plan.features?.join('\n') || ''
    });
    setIsModalOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan({
      _id: null,
      name: '',
      price: '',
      durationValue: 1,
      durationType: 'month',
      status: 'Active',
      features: [],
      featuresString: '',
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
        await deleteSubscription(planToDelete);
        toast.success("Plan deleted successfully");
        fetchPlans();
      } catch (error) {
        toast.error(error.message || "Failed to delete plan");
      } finally {
        setIsDeleteModalOpen(false);
        setPlanToDelete(null);
      }
    }
  };


  const handleSave = async () => {
    if (!editingPlan.name || !editingPlan.price || !editingPlan.durationValue) {
      return toast.error("Name, price, and duration are required");
    }

    const updatedFeatures = editingPlan.featuresString.split('\n').filter(f => f.trim() !== '');
    const numericPrice = Number(editingPlan.price.toString().replace(/[^0-9]/g, ''));
    const numericDuration = Number(editingPlan.durationValue);

    const payload = {
      name: editingPlan.name,
      price: numericPrice,
      durationValue: numericDuration,
      durationType: editingPlan.durationType || 'month',
      status: editingPlan.status || 'Active',
      features: updatedFeatures,
      slug: editingPlan.name.toLowerCase().replace(/\s+/g, '-')
    };

    try {
      if (editingPlan._id) {
        await updateSubscription(editingPlan._id, payload);
        toast.success("Plan updated successfully");
      } else {
        await createSubscription(payload);
        toast.success("Plan created successfully");
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.message || "Failed to save plan");
    }
  };

  // Helper function to format duration display
  const formatDurationDisplay = (val, type) => {
    if (!val || !type) return '/month';
    return `/${val} ${type}${val > 1 ? 's' : ''}`;
  };

  return (
    <div className="fade-in">
      <div className="saas-flex-end saas-mb-15">
        {canManageSubscriptions && (
          <button className="saas-btn btn-primary" onClick={handleAddPlan} disabled={isLoading}>
            <span><Plus /></span> Add New Plan
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="saas-loading">Loading plans...</div>
      ) : (
        <div className="saas-grid-responsive">
          {plans.map((plan) => (
            <div key={plan._id || plan.planId} className="saas-card saas-flex-col">
              <div className="saas-card-header saas-flex-col saas-align-start saas-gap-05">
                <div className="saas-flex-between saas-w-full">
                  <h3 className="saas-text-xl saas-font-bold">{plan.name} Plan</h3>
                  <span className={`saas-badge ${(!plan.status || plan.status === 'Active') ? 'badge-success' : 'badge-danger'}`}>
                    {plan.status || 'Active'}
                  </span>
                </div>
                <div className="saas-align-baseline saas-gap-025">
                  <span className="saas-plan-price">₹{plan.price?.toLocaleString()}</span>
                  <span className="saas-text-muted saas-text-sm">
                    {formatDurationDisplay(plan.durationValue, plan.durationType)}
                  </span>
                </div>
              </div>
              <div className="saas-content saas-flex-1">
                <ul className="saas-feature-list">
                  {(plan.features || []).map((feature, index) => (
                    <li key={index} className="saas-feature-item">
                      <span className="saas-text-success">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {canManageSubscriptions && (
                <div className="saas-card-footer-actions">
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
                </div>
              )}
            </div>
          ))}
          {plans.length === 0 && !isLoading && (
            <div className="saas-text-muted">No plans available. Add a new plan!</div>
          )}
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
            <div className="saas-modal-content">
              <div className="inner-grid-2">
                <div className="saas-form-group">
                  <label className="saas-label">Plan Name</label>
                  <input
                    type="text"
                    className="saas-input"
                    value={editingPlan?.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="e.g. Enterprise"
                  />
                </div>

                <div className="saas-form-group">
                  <label className="saas-label">Status</label>
                  <select
                    className="saas-select"
                    value={editingPlan?.status}
                    onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="inner-grid-2">
                <div className="saas-form-group">
                  <label className="saas-label">Price</label>
                  <input
                    type="number"
                    className="saas-input"
                    value={editingPlan?.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                    placeholder="e.g. 4999"
                  />
                </div>

                <div className="saas-form-group">
                  <label className="saas-label">Duration</label>
                  <div className="saas-flex saas-gap-05" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      className="saas-input"
                      style={{ flex: 1 }}
                      value={editingPlan?.durationValue}
                      onChange={(e) => setEditingPlan({ ...editingPlan, durationValue: e.target.value })}
                      placeholder="e.g. 1"
                    />
                    <select
                      className="saas-select"
                      style={{ flex: 1 }}
                      value={editingPlan?.durationType}
                      onChange={(e) => setEditingPlan({ ...editingPlan, durationType: e.target.value })}
                    >
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="saas-form-group">
                <label className="saas-label">Features (one per line)</label>
                <textarea
                  className="saas-textarea"
                  rows="5"
                  value={editingPlan?.featuresString}
                  onChange={(e) => setEditingPlan({ ...editingPlan, featuresString: e.target.value })}
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

      {/* <div className="saas-card saas-mt-15">
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
      </div> */}
    </div>
  );
};
export default SubscriptionManagement;