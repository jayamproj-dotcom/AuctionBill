import React, { useState } from "react";
import { HandCoins, Calendar } from "lucide-react";

function Commission() {
  const [selectedBranch, setSelectedBranch] = useState("all");

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];

  const commissions = [
    {
      id: 1,
      branch: "Branch 1",
      amount: 2500,
      date: "2024-01-15",
      seller: "Alice Johnson",
      buyer: "Frank Miller",
    },
    {
      id: 2,
      branch: "Branch 1",
      amount: 1800,
      date: "2024-01-14",
      seller: "Bob Smith",
      buyer: "Grace Lee",
    },
    {
      id: 3,
      branch: "Branch 2",
      amount: 3200,
      date: "2024-01-13",
      seller: "Charlie Brown",
      buyer: "Henry Davis",
    },
    {
      id: 4,
      branch: "Branch 2",
      amount: 1500,
      date: "2024-01-12",
      seller: "Diana Prince",
      buyer: "Ivy Chen",
    },
    {
      id: 5,
      branch: "Branch 3",
      amount: 2800,
      date: "2024-01-11",
      seller: "Eve Wilson",
      buyer: "Jack Wilson",
    },
  ];

  const filteredCommissions =
    selectedBranch === "all"
      ? commissions
      : commissions.filter(
          (comm) =>
            comm.branch === branches.find((b) => b.id === selectedBranch)?.name,
        );

  const totalCommission = filteredCommissions.reduce(
    (sum, comm) => sum + comm.amount,
    0,
  );

  return (
    <div className="commission">
      <div className="content-header">
        <div className="header-top">
          <h1>Commission Records</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span>Commission</span>
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

        <div className="stats-grid" style={{ marginBottom: "1rem" }}>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon bg-yellow-500">
                <HandCoins />
              </div>
              <div className="stat-value">
                ₹{totalCommission.toLocaleString()}
              </div>
            </div>
            <div className="stat-label">Total Commission</div>
          </div>
        </div>

        <div className="card-list">
          {filteredCommissions.map((comm) => (
            <div key={comm.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">
                    ₹{comm.amount.toLocaleString()}
                  </div>
                  <div className="data-card-subtitle">{comm.branch}</div>
                </div>
                <Calendar size={24} />
              </div>
              <div className="data-card-body">
                <div className="data-row">
                  <span className="data-label">Date:</span>
                  <span className="data-value">{comm.date}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Seller:</span>
                  <span className="data-value">{comm.seller}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Buyer:</span>
                  <span className="data-value">{comm.buyer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCommissions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p>No commission records found for the selected branch.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Commission;
