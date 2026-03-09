import React, { useState } from "react";
import { History as HistoryIcon, Calendar, PackageSearch } from "lucide-react";

function History() {
  const [selectedBranch, setSelectedBranch] = useState("all");

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];

  const history = [
    {
      id: 1,
      branch: "Branch 1",
      type: "Auction",
      productName: "Product A",
      sellerName: "Alice Johnson",
      buyerName: "Frank Miller",
      quantity: 15,
      unit: "pcs",
      finalAmount: 25000,
      commissionAmount: 2500,
      commissionPercent: 10,
      netAmount: 22500,
      date: "2024-01-15",
    },
    {
      id: 2,
      branch: "Branch 1",
      type: "Sale",
      productName: "Product B",
      sellerName: "Bob Smith",
      buyerName: "Grace Lee",
      quantity: 5,
      unit: "pcs",
      finalAmount: 5000,
      commissionAmount: 500,
      commissionPercent: 10,
      netAmount: 4500,
      date: "2024-01-14",
    },
    {
      id: 3,
      branch: "Branch 2",
      type: "Auction",
      productName: "Product C",
      sellerName: "Charlie Brown",
      buyerName: "Henry Davis",
      quantity: 8,
      unit: "pcs",
      finalAmount: 18000,
      commissionAmount: 1800,
      commissionPercent: 10,
      netAmount: 16200,
      date: "2024-01-13",
    },
    {
      id: 4,
      branch: "Branch 2",
      type: "Sale",
      productName: "Product D",
      sellerName: "Diana Prince",
      buyerName: "Ivy Chen",
      quantity: 2,
      unit: "pcs",
      finalAmount: 3200,
      commissionAmount: 320,
      commissionPercent: 10,
      netAmount: 2880,
      date: "2024-01-12",
    },
    {
      id: 5,
      branch: "Branch 3",
      type: "Auction",
      productName: "Product E",
      sellerName: "Eve Wilson",
      buyerName: "Jack Wilson",
      quantity: 12,
      unit: "pcs",
      finalAmount: 22000,
      commissionAmount: 2200,
      commissionPercent: 10,
      netAmount: 19800,
      date: "2024-01-11",
    },
  ];

  const filteredHistory =
    selectedBranch === "all"
      ? history
      : history.filter(
          (item) =>
            item.branch === branches.find((b) => b.id === selectedBranch)?.name,
        );

  return (
    <div className="history">
      <div className="content-header">
        <div className="header-top">
          <h1>Transaction History</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
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

        <div className="section-header section-header-margin">
          <h3 className="section-title">
            Recordings ({filteredHistory.length})
          </h3>
        </div>

        <div className="fade-in" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="data-table hs-data-table hs-table">
              <thead className="bg-tertiary">
                <tr>
                  <th className="hs-th">Date</th>
                  <th className="hs-th">Product</th>
                  <th className="hs-th">Seller</th>
                  <th className="hs-th">Buyer</th>
                  <th className="hs-th hs-num-col">Qty</th>
                  <th className="hs-th hs-num-col">Total</th>
                  <th className="hs-th hs-num-col">Comm.</th>
                  <th className="hs-th hs-num-col">Net</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-td">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <PackageSearch />
                        </div>
                        <p>No history records found for the selected branch.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((t) => (
                    <tr key={t.id} className="hs-tr">
                      <td className="hs-td">
                        <span className="cr-date-badge">{t.date}</span>
                      </td>
                      <td className="hs-td">
                        <div className="font-semibold text-primary">{t.productName}</div>
                      </td>
                      <td className="hs-td">{t.sellerName}</td>
                      <td className="hs-td">{t.buyerName}</td>
                      <td className="hs-td hs-num-col">
                        <span className="hs-qty-text">{t.quantity}</span>
                        <small className="text-muted ml-1">{t.unit}</small>
                      </td>
                      <td className="hs-td hs-num-col">
                        <span className="font-bold">₹{t.finalAmount.toLocaleString()}</span>
                      </td>
                      <td className="hs-td hs-num-col">
                        <span className="text-amber">₹{t.commissionAmount.toLocaleString()}</span>
                        <div style={{ fontSize: "0.7rem" }} className="text-muted">({t.commissionPercent}%)</div>
                      </td>
                      <td className="hs-td hs-num-col">
                        <span className="text-success font-bold">₹{t.netAmount.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
