import React, { useState } from "react";
import { History as HistoryIcon, Calendar } from "lucide-react";

function History() {
  const [selectedBranch, setSelectedBranch] = useState("all");

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];

  const history = [
    { id: 1, branch: "Branch 1", type: "Auction", description: "Auction completed for 15 items", amount: 25000, date: "2024-01-15" },
    { id: 2, branch: "Branch 1", type: "Sale", description: "Product sold to Frank Miller", amount: 5000, date: "2024-01-14" },
    { id: 3, branch: "Branch 2", type: "Auction", description: "Auction completed for 8 items", amount: 18000, date: "2024-01-13" },
    { id: 4, branch: "Branch 2", type: "Sale", description: "Product sold to Henry Davis", amount: 3200, date: "2024-01-12" },
    { id: 5, branch: "Branch 3", type: "Auction", description: "Auction completed for 12 items", amount: 22000, date: "2024-01-11" },
  ];

  const filteredHistory = selectedBranch === "all"
    ? history
    : history.filter(item => item.branch === branches.find(b => b.id === selectedBranch)?.name);

  return (
    <div className="history">
      <div className="content-header">
        <div className="header-top">
          <h1>Transaction History</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">></span>
          <span>History</span>
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
          {filteredHistory.map((item) => (
            <div key={item.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">{item.description}</div>
                  <div className="data-card-subtitle">{item.branch} - {item.type}</div>
                </div>
                <HistoryIcon size={24} />
              </div>
              <div className="data-card-body">
                <div className="data-row">
                  <span className="data-label">Amount:</span>
                  <span className="data-value">₹{item.amount.toLocaleString()}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">
                    <Calendar size={14} /> Date:
                  </span>
                  <span className="data-value">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <p>No history records found for the selected branch.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
