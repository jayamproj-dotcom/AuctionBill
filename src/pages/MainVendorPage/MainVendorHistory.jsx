import React, { useState } from "react";
import { History as HistoryIcon, Calendar, PackageSearch } from "lucide-react";
import SearchableSelect from "../../components/Common/SearchableSelect";

function History() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];
  const branchOptions = branches.map((b) => ({ label: b.name, value: b.id }));

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

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = (d) => new Date(d.getTime() + 24 * 60 * 60 * 1000);

    switch (filter) {
      case "today":
        return { start: today, end: next(today) };
      case "yesterday":
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { start: y, end: today };
      case "week":
        const w = new Date(today);
        w.setDate(w.getDate() - 7);
        return { start: w, end: next(today) };
      case "month":
        const m = new Date(today);
        m.setDate(1);
        return { start: m, end: next(today) };
      case "year":
        return { start: new Date(today.getFullYear(), 0, 1), end: next(today) };
      case "custom":
        const c = new Date(customDate);
        c.setHours(0, 0, 0, 0);
        return { start: c, end: next(c) };
      default:
        return null;
    }
  };

  const filteredHistory = history
    .filter((item) => {
      if (selectedBranch === "all") return true;
      return (
        item.branch === branches.find((b) => b.id === selectedBranch)?.name
      );
    })
    .filter((item) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sellerName.toLowerCase().includes(q) ||
        item.buyerName.toLowerCase().includes(q)
      );
    })
    .filter((item) => {
      if (dateFilter === "all") return true;
      const range = getDateRange(dateFilter);
      if (!range) return true;
      const d = new Date(item.date);
      return d >= range.start && d < range.end;
    });

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
          <SearchableSelect
            name="branch"
            options={branchOptions}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            placeholder="All Branches"
          />
        </div>
       <div style={{
  display: "flex",
  alignItems: "center",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-md)",
  overflow: "hidden",
  marginBottom: "1rem",
  background: "var(--bg-card)",
}}>
  {/* Search */}
  <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "0 0.75rem", gap: "0.5rem" }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input
      type="text"
      style={{
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: "0.875rem",
        color: "var(--text-primary)",
        width: "100%",
        padding: "0.75rem 0",
      }}
      placeholder="Search product, seller, buyer..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* Divider */}
  <div style={{ width: "1px", height: "36px", background: "var(--border-color)" }} />

  {/* Date Filter */}
  <div style={{ display: "flex", alignItems: "center", padding: "0 0.75rem", gap: "0.5rem", flexShrink: 0 }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary-amber)" }}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
    <select
      style={{
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: "0.875rem",
        color: "var(--text-primary)",
        cursor: "pointer",
        padding: "0.75rem 0",
      }}
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
    >
      <option value="all">All Time</option>
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="year">This Year</option>
      <option value="custom">Custom Date</option>
    </select>
  </div>
</div>

{dateFilter === "custom" && (
  <div className="form-group" style={{ marginBottom: "1rem" }}>
    <input
      type="date"
      className="form-control"
      value={customDate}
      onChange={(e) => setCustomDate(e.target.value)}
      max={new Date().toISOString().split("T")[0]}
    />
  </div>
)}

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
