import React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";

function Subscription() {
  const currentPlan = {
    name: "Premium Plan",
    price: 5000,
    features: ["Unlimited Branches", "Advanced Analytics", "Priority Support"],
    expiryDate: "2024-12-31",
    status: "Active",
  };

  const plans = [
    {
      name: "Basic Plan",
      price: 2000,
      features: ["Up to 3 Branches", "Basic Analytics", "Email Support"],
    },
    {
      name: "Premium Plan",
      price: 5000,
      features: [
        "Unlimited Branches",
        "Advanced Analytics",
        "Priority Support",
      ],
    },
    {
      name: "Enterprise Plan",
      price: 10000,
      features: ["All Features", "Dedicated Support", "Custom Integration"],
    },
  ];

  return (
    <div className="subscription">
      <div className="content-header">
        <div className="header-top">
          <h1>Subscription Management</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span>Subscription</span>
        </div>
      </div>

      <div className="content-body">
        <div className="section-header">
          <h2 className="section-title">Current Plan</h2>
        </div>

        <div className="data-card" style={{ marginBottom: "2rem" }}>
          <div className="data-card-header">
            <div>
              <div className="data-card-title">{currentPlan.name}</div>
              <div className="data-card-subtitle">
                ₹{currentPlan.price}/month
              </div>
            </div>
            <span
              className={`status-badge ${currentPlan.status.toLowerCase()}`}
            >
              {currentPlan.status}
            </span>
          </div>
          <div className="data-card-body">
            <div className="data-row">
              <span className="data-label">Expiry Date:</span>
              <span className="data-value">{currentPlan.expiryDate}</span>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <h4>Features:</h4>
              <ul>
                {currentPlan.features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle2 size={16} color="green" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">Available Plans</h2>
        </div>

        <div className="card-list">
          {plans.map((plan, index) => (
            <div key={index} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">{plan.name}</div>
                  <div className="data-card-subtitle">₹{plan.price}/month</div>
                </div>
                <CreditCard size={24} />
              </div>
              <div className="data-card-body">
                <ul>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <CheckCircle2 size={16} color="green" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="data-card-footer">
                <button className="btn btn-primary">
                  {plan.name === currentPlan.name ? "Current Plan" : "Upgrade"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Subscription;
