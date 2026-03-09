import React, { useState } from "react";
import { HandCoins } from "lucide-react";

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
      productName: "Product A",
      saleAmount: 25000,
      commissionPercent: 10,
    },
    {
      id: 2,
      branch: "Branch 1",
      amount: 1800,
      date: "2024-01-14",
      seller: "Bob Smith",
      buyer: "Grace Lee",
      productName: "Product B",
      saleAmount: 18000,
      commissionPercent: 10,
    },
    {
      id: 3,
      branch: "Branch 2",
      amount: 3200,
      date: "2024-01-13",
      seller: "Charlie Brown",
      buyer: "Henry Davis",
      productName: "Product C",
      saleAmount: 32000,
      commissionPercent: 10,
    },
    {
      id: 4,
      branch: "Branch 2",
      amount: 1500,
      date: "2024-01-12",
      seller: "Diana Prince",
      buyer: "Ivy Chen",
      productName: "Product D",
      saleAmount: 15000,
      commissionPercent: 10,
    },
    {
      id: 5,
      branch: "Branch 3",
      amount: 2800,
      date: "2024-01-11",
      seller: "Eve Wilson",
      buyer: "Jack Wilson",
      productName: "Product E",
      saleAmount: 28000,
      commissionPercent: 10,
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

        <div className="section-header cr-section-header">
          <h3 className="section-title">Commission Details</h3>
          <span className="cr-count-chip">{filteredCommissions.length} records</span>
        </div>

        {filteredCommissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p>No commission records found for the selected branch.</p>
          </div>
        ) : (
          <div className="table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper cr-table-wrapper">
            <table className="data-table custom-data-table commission-table">
              <thead className="bg-tertiary">
                <tr>
                  <th className="custom-th">Date</th>
                  <th className="custom-th">Product</th>
                  <th className="custom-th">Seller</th>
                  <th className="custom-th cr-num-col">Sale Amount</th>
                  <th className="custom-th cr-center-col">Comm %</th>
                  <th className="custom-th cr-num-col cr-highlight-col">Earned</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((comm, idx) => (
                  <tr key={comm.id} className={`custom-tr ${idx % 2 === 0 ? "cr-row-even" : ""}`}>
                    <td className="custom-td">
                      <span className="cr-date-badge">{comm.date}</span>
                    </td>
                    <td className="custom-td">
                      <span className="cr-product-name">{comm.productName}</span>
                    </td>
                    <td className="custom-td">
                      <span className="cr-seller-name">{comm.seller}</span>
                    </td>
                    <td className="custom-td cr-num-col">
                      <span className="cr-sale-amount">₹{(comm.saleAmount || 0).toLocaleString()}</span>
                    </td>
                    <td className="custom-td cr-center-col">
                      <span className="badge badge-warning cr-pct-badge">{comm.commissionPercent}%</span>
                    </td>
                    <td className="custom-td cr-num-col cr-highlight-col">
                      <span className="cr-earned">₹{(comm.amount || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Commission;
