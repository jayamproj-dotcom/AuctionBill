import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { formatDate } from '../../utils/dateUtils';
import { jsPDF } from 'jspdf';
import './Subscription.css';
import { CreditCard, CheckCircle2, TrendingUp, Check, Plus, FileText, Download } from 'lucide-react';
import { getSubscriptions, getVendors, updateVendor, getVendorPurchasesById } from '../../api/adminApi';

const Subscription = () => {
    const { vendorId } = useSelector((state) => state.vendorAuth);

    const fallbackVendorId = sessionStorage.getItem('vendorId');
    const currentVendorId = vendorId || fallbackVendorId;

    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
    const [showAllInvoices, setShowAllInvoices] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all plans and billing history concurrently with vendors
                const [plansRes, vendorsRes, purchasesRes] = await Promise.all([
                    getSubscriptions(),
                    getVendors(),
                    getVendorPurchasesById(currentVendorId)
                ]);
                
                const fetchedPlans = plansRes.subscriptions || [];
                setPlans(fetchedPlans);

                if (purchasesRes && purchasesRes.purchases) {
                    setInvoices(purchasesRes.purchases);
                }

                // Fetch current vendor
                const vendors = vendorsRes.vendors || [];
                const currentVendor = vendors.find(v => v._id === currentVendorId);

                if (currentVendor) {
                    const activeSub = currentVendor.activeSubscription;
                    const vendorPlan = currentVendor.plan || {};
                    const vendorPlanId = typeof vendorPlan === 'object' ? vendorPlan._id : vendorPlan;
                    const planName = vendorPlan.name || 'Current Plan';

                    if (activeSub || vendorPlanId) {
                        let featuresToSet = activeSub?.featuresAtPurchase || vendorPlan.features || [];
                        if (!Array.isArray(featuresToSet)) {
                            featuresToSet = typeof featuresToSet === 'object' && featuresToSet !== null ? Object.values(featuresToSet) : [];
                        }

                        setSubscription({
                            id: currentVendor._id,
                            plan: planName,
                            planId: activeSub?.subscriptionId || vendorPlanId,
                            status: currentVendor.status || 'Active',
                            startDate: activeSub?.startDate || currentVendor.joinedDate || currentVendor.createdAt || new Date().toISOString(),
                            expiryDate: activeSub?.endDate || currentVendor.planEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                            price: activeSub?.priceAtPurchase ?? vendorPlan.price ?? 0,
                            features: featuresToSet,
                            durationType: vendorPlan.durationType,
                            durationValue: vendorPlan.durationValue
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching subscription data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentVendorId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [currentVendorId]);

    const calculateDaysRemaining = () => {
        if (!subscription) return 0;
        const today = new Date();
        const expiry = new Date(subscription.expiryDate);
        const diffTime = expiry - today;
        if (diffTime < 0) return 0;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateTotalDays = () => {
        if (!subscription) return 365;
        const start = new Date(subscription.startDate);
        const expiry = new Date(subscription.expiryDate);
        const diffTime = expiry - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 365;
    };

    const handleUpgrade = (planToUpgradeTo) => {
        setSelectedUpgradePlan(planToUpgradeTo);
        setIsUpgradeModalOpen(true);
    };

    const confirmUpgrade = async (upgradeType) => {
        if (!selectedUpgradePlan) return;
        setIsUpgradeModalOpen(false);

        try {
            const dataToUpdate = { 
                requestedPlan: selectedUpgradePlan._id,
                upgradeType: upgradeType 
            };
            const res = await updateVendor(currentVendorId, dataToUpdate);
            if (res.status) {
                alert(`Upgrade request for ${selectedUpgradePlan.name} has been sent to the admin. Upgrade will be active ${upgradeType === 'from_today' ? 'from today for 30 days' : 'after the current plan ends'}. Please await approval.`);
                window.location.reload();
            } else {
                alert(res.message || "Failed to upgrade plan.");
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            alert("Error upgrading subscription. Please try again.");
        }
    };

    const handleDownloadInvoice = (invoice) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("INVOICE", 20, 20);
        doc.setFontSize(10);
        doc.text("Auction Billing SaaS", 20, 30);
        doc.text("123 Tech Park, Chennai", 20, 35);
        doc.text("support@auctionbill.com", 20, 40);
        doc.setFontSize(12);
        doc.text(`Invoice ID: ${invoice.id}`, 140, 30);
        doc.text(`Date: ${invoice.date}`, 140, 36);
        doc.text(`Status: ${invoice.status}`, 140, 42);
        doc.setLineWidth(0.5);
        doc.line(20, 50, 190, 50);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Description", 20, 65);
        doc.text("Amount", 160, 65);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.description, 20, 75);
        doc.text(`INR ${invoice.amount.toLocaleString()}`, 160, 75);
        doc.line(20, 85, 190, 85);
        doc.setFont("helvetica", "bold");
        doc.text("Total", 120, 95);
        doc.text(`INR ${invoice.amount.toLocaleString()}`, 160, 95);
        doc.save(`Invoice_${invoice.id}.pdf`);
    };

    // Filter out inactive plans, but keep all active ones so users can renew their current plan or upgrade
    const upgradeOptions = subscription
        ? plans.filter(p => p.status === 'Active')
        : [];

    if (loading) {
        return (
            <div className="subscription-container fade-in">
                <div className="content-header">
                    <div className="header-top">
                        <h1><CreditCard className="header-icon" /> Subscription & Billing</h1>
                    </div>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading subscription details...</div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="subscription-container fade-in">
                <div className="content-header">
                    <div className="header-top">
                        <h1><CreditCard className="header-icon" /> Subscription & Billing</h1>
                    </div>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center' }}>No active subscription found. Please contact support.</div>
            </div>
        );
    }

    return (
        <div className="subscription-container fade-in">
            <div className="content-header">
                <div className="header-top">
                    <h1><CreditCard className="header-icon" /> Subscription & Billing</h1>
                    <div className="header-actions">
                        <span className="plan-badge">{subscription.plan} Member</span>
                    </div>
                </div>
            </div>

            <div className="subscription-scroll-area">
                <div className="subscription-grid-layout">
                    {/* Left Column: Current Plan & Upgrade Options */}
                    <div className="left-column">
                        {/* Current Plan Card */}
                        <div className="subs-card plan-card">
                            <div className="plan-header">
                                <div className="plan-title">
                                    <h3>Current Plan</h3>
                                    <span className={`status-badge ${subscription.status.toLowerCase()}`}>
                                        {subscription.status}
                                    </span>
                                </div>
                                <div className="plan-price">
                                    ₹{subscription.price?.toLocaleString()} <span>/ {subscription.durationType === 'year' ? 'year' : '30 Days'}</span>
                                </div>
                            </div>

                            <div className="plan-details">
                                <div className="detail-item">
                                    <span className="detail-label">Start Date</span>
                                    <span className="detail-value">{formatDate(subscription.startDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Expiry Date</span>
                                    <span className="detail-value">{formatDate(subscription.expiryDate)}</span>
                                </div>
                                <div className="days-remaining">
                                    <span className="days-count">{calculateDaysRemaining()}</span>
                                    <span> Days Remaining</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${Math.min((calculateDaysRemaining() / calculateTotalDays()) * 100, 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="plan-features">
                                <h4>Included Features:</h4>
                                <ul>
                                    {subscription.features && subscription.features.map((feature, index) => (
                                        <li key={index}><CheckCircle2 size={16} className="text-success" /> {feature}</li>
                                    ))}
                                    {(!subscription.features || subscription.features.length === 0) && (
                                        <li><CheckCircle2 size={16} className="text-success" /> Standard Features Included</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Available Upgrades Section */}
                        {upgradeOptions.length > 0 && (
                            <div className="upgrade-section">
                                <h3 className="section-subtitle"><TrendingUp size={18} /> Available Upgrades & Renewals</h3>
                                <div className="upgrade-grid">
                                    {upgradeOptions.map((plan, index) => (
                                        <div key={index} className="subs-card upgrade-card">
                                            <div className="upgrade-header">
                                                <h4>{plan.name}</h4>
                                                <div className="upgrade-price">₹{plan.price.toLocaleString()}<span>/{plan.durationType === 'year' ? 'yr' : '30 days'}</span></div>
                                            </div>
                                            <ul className="upgrade-features">
                                                {plan.features?.slice(0, 3).map((f, i) => (
                                                    <li key={i}><Check size={14} /> {f}</li>
                                                ))}
                                                {plan.features?.length > 3 && <li><Plus size={14} /> {plan.features.length - 3} more...</li>}
                                            </ul>
                                            <button
                                                className="btn btn-primary upgrade-btn"
                                                onClick={() => handleUpgrade(plan)}
                                            >
                                                {String(plan._id) === String(subscription.planId) ? `Renew ${plan.name}` : `Upgrade to ${plan.name}`}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Invoices */}
                    <div className="right-column">
                        <div className="subs-card invoice-card">
                            <h3><FileText size={18} /> Billing History</h3>
                            <div className="invoice-list">
                                <div className="invoice-header-row">
                                    <span>Invoice ID</span>
                                    <span>Date</span>
                                    <span>Amount</span>
                                    <span>Status</span>
                                    <span>Action</span>
                                </div>
                                <div className={`invoice-rows-container ${showAllInvoices ? 'expanded' : ''}`}>
                                    {(showAllInvoices ? invoices : invoices.slice(0, 5)).map((invoice, index) => (
                                        <div key={index} className="invoice-row">
                                            <span className="inv-id">{invoice.id}</span>
                                            <span className="inv-date">{formatDate(invoice.date)}</span>
                                            <span className="inv-amount">₹{invoice.amount.toLocaleString()}</span>
                                            <span className="inv-status"><span className="badge-paid">{invoice.status}</span></span>
                                            <button
                                                className="btn-download icon-btn"
                                                onClick={() => handleDownloadInvoice(invoice)}
                                                title="Download Invoice"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {invoices.length > 5 && (
                                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                        <button 
                                            className="btn btn-outline" 
                                            onClick={() => setShowAllInvoices(!showAllInvoices)}
                                            style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                                        >
                                            {showAllInvoices ? 'Show Less' : 'Show All History'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Modal */}
            {isUpgradeModalOpen && selectedUpgradePlan && (
                <div className="upgrade-modal-overlay">
                    <div className="upgrade-modal-content">
                        <h3>{String(selectedUpgradePlan._id) === String(subscription.planId) ? 'Renew Plan' : 'Upgrade Plan'}</h3>
                        <p>Do you want to {String(selectedUpgradePlan._id) === String(subscription.planId) ? 'renew' : 'upgrade to'} <strong>{selectedUpgradePlan.name}</strong> from today or after your current plan ends?</p>
                        <div className="upgrade-modal-actions">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => confirmUpgrade('from_today')}
                            >
                                From Today (30 Days)
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => confirmUpgrade('after_current')}
                            >
                                After Current Plan Ends
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={() => {
                                    setIsUpgradeModalOpen(false);
                                    setSelectedUpgradePlan(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscription;

