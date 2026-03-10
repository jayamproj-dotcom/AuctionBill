import React, { useState } from "react";
import { ShoppingCart, Phone, Mail } from "lucide-react";

function Buyers() {
  const [selectedBranch, setSelectedBranch] = useState("all");

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];

  const buyers = [
    { id: 1, name: "Frank Miller", email: "frank@example.com", phone: "123-456-7895", branch: "Branch 1", purchases: 5 },
    { id: 2, name: "Grace Lee", email: "grace@example.com", phone: "123-456-7896", branch: "Branch 1", purchases: 3 },
    { id: 3, name: "Henry Davis", email: "henry@example.com", phone: "123-456-7897", branch: "Branch 2", purchases: 8 },
    { id: 4, name: "Ivy Chen", email: "ivy@example.com", phone: "123-456-7898", branch: "Branch 2", purchases: 2 },
    { id: 5, name: "Jack Wilson", email: "jack@example.com", phone: "123-456-7899", branch: "Branch 3", purchases: 6 },
  ];

  const filteredBuyers = selectedBranch === "all"
    ? buyers
    : buyers.filter(buyer => buyer.branch === branches.find(b => b.id === selectedBranch)?.name);

  return (
    <div className="buyers">
      <div className="content-header">
        <div className="header-top">
          <h1>Buyers Management</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">></span>
          <span>Buyers</span>
        </div>
      </div>

      <div className="content-body">
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Select Branch</label>
          <select
            className="form-control"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="card-list">
          {filteredBuyers.map((buyer) => (
            <div key={buyer.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">{buyer.name}</div>
                  <div className="data-card-subtitle">{buyer.branch}</div>
                </div>
                <ShoppingCart size={24} />
              </div>
              <div className="data-card-body">
                <div className="data-row">
                  <span className="data-label">
                    <Mail size={14} /> Email:
                  </span>
                  <span className="data-value">{buyer.email}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">
                    <Phone size={14} /> Phone:
                  </span>
                  <span className="data-value">{buyer.phone}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Total Purchases:</span>
                  <span className="data-value">{buyer.purchases}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBuyers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p>No buyers found for the selected branch.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Buyers;
