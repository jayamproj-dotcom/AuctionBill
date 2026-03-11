import React, { useState, useEffect } from "react";
import { HandCoins, Search, Filter, Calendar } from "lucide-react";
import SearchableSelect from "../../components/Common/SearchableSelect";
import {
  getMainVendorBranches,
  getMainVendorCommissionRecords,
} from "../../api/mainVendorApi";

function Commission() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  
  const [branches, setBranches] = useState([
    { id: "all", name: "All Branches" },
  ]);
  const [commissions, setCommissions] = useState([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommissions();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedBranch, searchTerm, dateFilter, customDate]);

  const fetchBranches = async () => {
    try {
      const res = await getMainVendorBranches();
      if (res.status) {
        const branchList = res.vendors.map((v) => ({
          id: v._id,
          name: v.name,
        }));
        setBranches([{ id: "all", name: "All Branches" }, ...branchList]);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      let startDate = null;
      let endDate = null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const next = (d) => new Date(d.getTime() + 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case "today":
          startDate = today.toISOString().split("T")[0];
          endDate = next(today).toISOString().split("T")[0];
          break;
        case "yesterday":
          const y = new Date(today);
          y.setDate(y.getDate() - 1);
          startDate = y.toISOString().split("T")[0];
          endDate = today.toISOString().split("T")[0];
          break;
        case "week":
          const w = new Date(today);
          w.setDate(w.getDate() - 7);
          startDate = w.toISOString().split("T")[0];
          endDate = next(today).toISOString().split("T")[0];
          break;
        case "month":
          const m = new Date(today);
          m.setDate(1);
          startDate = m.toISOString().split("T")[0];
          endDate = next(today).toISOString().split("T")[0];
          break;
        case "year":
          startDate = new Date(today.getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0];
          endDate = next(today).toISOString().split("T")[0];
          break;
        case "custom":
          const c = new Date(customDate);
          c.setHours(0, 0, 0, 0);
          startDate = c.toISOString().split("T")[0];
          endDate = next(c).toISOString().split("T")[0];
          break;
      }

      const params = {};
      if (selectedBranch !== "all") params.branchId = selectedBranch;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      // Search term filtering will be done frontend-side similar to buyers/sellers
      // since the current backend endpoint doesn't support a search term directly.

      const res = await getMainVendorCommissionRecords(params);

      if (res.status) {
        setCommissions(res.commissions || []);
        setTotalCommission(res.totalCommission || 0);
      }
    } catch (error) {
      console.error("Error fetching commission records:", error);
    } finally {
      setLoading(false);
    }
  };

  const branchOptions = branches.map((b) => ({ label: b.name, value: b.id }));

  const filteredCommissions = commissions.filter((comm) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (comm.productName || "").toLowerCase().includes(q) ||
      (comm.seller || "").toLowerCase().includes(q) ||
      (comm.buyer || "").toLowerCase().includes(q) ||
      (comm.branch || "").toLowerCase().includes(q)
    );
  });

  // Calculate searched total
  const displayTotalCommission = searchTerm 
      ? filteredCommissions.reduce((sum, comm) => sum + (comm.amount || 0), 0)
      : totalCommission;


  // Use same date formatter as history
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    // Formatting matches cr-date-badge style "15 Feb 2024"
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
  };

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
        {/* Branch Selection */}
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

        {/* Global Commission Stats */}
        <div className="stats-grid" style={{ marginBottom: "1rem" }}>
          <div className="stat-card" style={{ borderLeftColor: '#eab308', borderLeftStyle: 'solid', borderLeftWidth: '3px' }}>
            <div className="stat-header">
              <div 
                className="stat-icon flex items-center justify-center p-2 rounded" 
                style={{ backgroundColor: "rgba(234, 179, 8, 0.12)", color: "#eab308" }}
              >
                <HandCoins size={24} />
              </div>
              <div>
                <div className="stat-value">
                  ₹{displayTotalCommission.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="stat-label">Total Commission</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters (Search + Date) - using the solid layout from History.jsx */}
        <div className="mvh-filter-bar" style={{ marginBottom: '1.5rem' }}>
          {/* Search */}
          <div className="mvh-search-wrap">
            <Search size={16} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              className="mvh-search-input"
              placeholder="Search product, seller, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mvh-divider" />

          {/* Date Filter */}
          <div className="mvh-date-wrap">
            <Filter size={14} style={{ color: "var(--primary-amber)" }} />
            <select
              className="mvh-date-select"
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

        <div className="section-header cr-section-header" style={{ marginBottom: "1rem", marginTop: "1rem" }}>
          <h3 className="section-title">
            Commission Details 
            {loading && <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px'}}>Loading...</span>}
          </h3>
          <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--primary-amber)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {filteredCommissions.length} records
          </span>
        </div>

        {loading ? (
           <div className="empty-state">
              <div className="empty-state-icon" style={{ opacity: 0.5 }}>⏳</div>
              <p>Fetching commission data...</p>
           </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p>No commission records found for the selected filters.</p>
          </div>
        ) : (
          <div className="mvh-table-wrapper card">
            <table className="mvh-table">
              <thead className="bg-tertiary">
                <tr>
                  <th className="mvh-th">Date</th>
                  <th className="mvh-th">Product</th>
                  <th className="mvh-th">Seller</th>
                  <th className="mvh-th">Branch</th>
                  <th className="mvh-th mvh-num-col">Sale Amt</th>
                  <th className="mvh-th mvh-num-col">Comm %</th>
                  <th className="mvh-th mvh-num-col" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>Earned</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((comm, idx) => (
                  <tr key={comm.id} className="mvh-tr">
                    <td className="mvh-td">
                      <span className="cr-date-badge" style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {formatDate(comm.date)}
                      </span>
                    </td>
                    <td className="mvh-td">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'inline-block' }}>
                        {comm.productName}
                      </span>
                    </td>
                    <td className="mvh-td">
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {comm.seller}
                      </span>
                    </td>
                    <td className="mvh-td">
                      <span className="badge" style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {comm.branch}
                      </span>
                    </td>
                    <td className="mvh-td mvh-num-col">
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        ₹{(comm.saleAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="mvh-td mvh-num-col">
                      <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--primary-amber)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        {comm.commissionPercent}%
                      </span>
                    </td>
                    <td className="mvh-td mvh-num-col" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-amber)' }}>
                        ₹{(comm.amount || 0).toLocaleString()}
                      </span>
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
