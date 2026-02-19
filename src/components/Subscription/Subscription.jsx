import { useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { jsPDF } from 'jspdf';
import './Subscription.css';
import { CreditCard, CheckCircle2, TrendingUp, Check, Plus, FileText, Download } from 'lucide-react';

const Subscription = () => {
    // Define available plans
    const plans = [
        {
            id: 'basic',
            name: "Basic",
            price: 4999,
            features: [
                "Up to 50 Auctions",
                "Basic Analytics",
                "Email Support",
                "Single User Access"
            ]
        },
        {
            id: 'premium',
            name: "Premium",
            price: 9999,
            features: [
                "Unlimited Auctions",
                "Advanced Analytics",
                "Priority Support",
                "Multi-User Access",
                "Export to PDF/Excel"
            ]
        },
        {
            id: 'enterprise',
            name: "Enterprise",
            price: 19999,
            features: [
                "Everything in Premium",
                "Dedicated Account Manager",
                "Custom API Access",
                "White Labeling",
                "24/7 Phone Support"
            ]
        }
    ];

    // Current subscription state - Change plan here to test different scenarios
    const [currentPlanId, setCurrentPlanId] = useState('basic');

    // Mock Subscription Data based on currentPlanId
    const currentPlanDetails = plans.find(p => p.id === currentPlanId);

    const [subscription, setSubscription] = useState({
        plan: currentPlanDetails.name,
        planId: currentPlanId,
        status: "Active",
        startDate: "2025-01-01",
        expiryDate: "2026-01-01",
        price: currentPlanDetails.price,
        features: currentPlanDetails.features
    });

    const [invoices, setInvoices] = useState([
        { id: "INV-2025-001", date: "2025-01-01", amount: 4999, status: "Paid", description: "Basic Plan - Yearly" },
        { id: "INV-2024-001", date: "2024-01-01", amount: 4999, status: "Paid", description: "Basic Plan - Yearly" }
    ]);

    const calculateDaysRemaining = () => {
        const today = new Date();
        const expiry = new Date(subscription.expiryDate);
        const diffTime = Math.abs(expiry - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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

    // Filter plans that are higher price than current plan for upgrade options
    const upgradeOptions = plans.filter(p => p.price > subscription.price);

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
                                    <span>Days Remaining</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${(calculateDaysRemaining() / 365) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="plan-features">
                                <h4>Included Features:</h4>
                                <ul>
                                    {subscription.features.map((feature, index) => (
                                        <li key={index}><CheckCircle2 size={16} className="text-success" /> {feature}</li>
                                    ))}
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
                                                <div className="upgrade-price">₹{plan.price.toLocaleString()}<span>/yr</span></div>
                                            </div>
                                            <ul className="upgrade-features">
                                                {plan.features.slice(0, 3).map((f, i) => (
                                                    <li key={i}><Check size={14} /> {f}</li>
                                                ))}
                                                {plan.features.length > 3 && <li><Plus size={14} /> {plan.features.length - 3} more...</li>}
                                            </ul>
                                            <button className="btn btn-primary upgrade-btn">Upgrade to {plan.name}</button>
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
