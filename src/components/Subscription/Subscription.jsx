import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { formatDate } from '../../utils/dateUtils';
import { jsPDF } from 'jspdf';
import './Subscription.css';
import { CreditCard, CheckCircle2, TrendingUp, Check, Plus, FileText, Download } from 'lucide-react';
import { getSubscriptions, getVendors, updateVendor } from '../../api/adminApi';

const Subscription = () => {
    const { vendorId } = useSelector((state) => state.vendorAuth);
    console.log("vendorId", vendorId);

    const fallbackVendorId = sessionStorage.getItem('vendorId');
    const currentVendorId = vendorId || fallbackVendorId;

    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [invoices, setInvoices] = useState([
        { id: "INV-2025-001", date: "2025-01-01", amount: 4999, status: "Paid", description: "Basic Plan - Yearly" },
        { id: "INV-2024-001", date: "2024-01-01", amount: 4999, status: "Paid", description: "Basic Plan - Yearly" }
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all plans
                const plansRes = await getSubscriptions();
                const fetchedPlans = plansRes.subscriptions || [];
                setPlans(fetchedPlans);

                // Fetch current vendor
                const vendorsRes = await getVendors();
                const vendors = vendorsRes.vendors || [];
                const currentVendor = vendors.find(v => v._id === currentVendorId);

                if (currentVendor) {
                    const vendorPlanId = typeof currentVendor.plan === 'object' ? currentVendor.plan?._id : currentVendor.plan;
                    const currentPlanDetails = fetchedPlans.find(p => p._id === vendorPlanId);

                    if (currentPlanDetails) {
                        setSubscription({
                            id: currentVendor._id,
                            plan: currentPlanDetails.name,
                            planId: currentPlanDetails._id,
                            status: currentVendor.status || 'Active',
                            startDate: currentVendor.createdAt || new Date().toISOString(),
                            expiryDate: currentVendor.planEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                            price: currentPlanDetails.price || 0,
                            features: currentPlanDetails.features || []
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

    const handleUpgrade = async (planToUpgradeTo) => {
        if (!window.confirm(`Are you sure you want to upgrade to ${planToUpgradeTo.name}?`)) return;

        try {
            const dataToUpdate = { requestedPlan: planToUpgradeTo._id };
            const res = await updateVendor(currentVendorId, dataToUpdate);
            if (res.status) {
                alert(`Upgrade request for ${planToUpgradeTo.name} has been sent to the admin. Please await approval.`);
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

    // Filter out the current plan to show other available plans for upgrade/change
    const upgradeOptions = subscription
        ? plans.filter(p => p._id !== subscription.planId && p.status === 'Active')
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
                                    ₹{subscription.price.toLocaleString()} <span>/ year</span>
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
                                <h3 className="section-subtitle"><TrendingUp size={18} /> Available Upgrades</h3>
                                <div className="upgrade-grid">
                                    {upgradeOptions.map((plan, index) => (
                                        <div key={index} className="subs-card upgrade-card">
                                            <div className="upgrade-header">
                                                <h4>{plan.name}</h4>
                                                <div className="upgrade-price">₹{plan.price.toLocaleString()}<span>/{plan.durationType === 'year' ? 'yr' : 'mo'}</span></div>
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
                                                Upgrade to {plan.name}
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
                                {invoices.map((invoice, index) => (
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;

