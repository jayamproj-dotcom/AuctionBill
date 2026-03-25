import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Building,
  Users,
  UsersRound,
  HandCoins,
  BadgeIndianRupee,
  Filter,
  Calendar,
} from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import { getMainVendorDashboard, getMainVendorBranches } from "../../api/mainVendorApi";

// Reuse standard Dashboard styling for consistency
import "../../components/Dashboard/Dashboard.css";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

function MainVendorDashboard() {
  const { vendorId, branchCount } = useSelector((state) => state.vendorAuth);
  const currentMainVendorId = vendorId || sessionStorage.getItem("vendorId");

  const [stats, setStats] = useState({
    totalBranches: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalSales: 0,
    totalCommission: 0,
    todayAuctions: 0,
  });
  
  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  
  const [branches, setBranches] = useState([
    { id: "all", name: "All Branches" },
    { id: currentMainVendorId, name: "My Details" }
  ]);
  const [selectedBranch, setSelectedBranch] = useState(branchCount > 0 ? "all" : currentMainVendorId);

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, [currentMainVendorId]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, customDate, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const res = await getMainVendorBranches();
      if (res.status) {
        const branchList = res.vendors.map((v) => ({
          id: v._id,
          name: v.name,
        }));
        setBranches([
          { id: "all", name: "All Branches" },
          { id: currentMainVendorId, name: "My Details" },
          ...branchList
        ]);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextTime = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (filter) {
      case "today":
        return { start: today, end: nextTime };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return { start: weekStart, end: nextTime };
      case "month":
        const monthStart = new Date(today);
        monthStart.setDate(1);
        return { start: monthStart, end: nextTime };
      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart, end: nextTime };
      case "custom":
        const custom = new Date(customDate);
        custom.setHours(0, 0, 0, 0);
        return {
          start: custom,
          end: new Date(custom.getTime() + 24 * 60 * 60 * 1000),
        };
      default:
        return { start: today, end: nextTime };
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let params = {};
      if (selectedBranch !== "all") {
        params.branchId = selectedBranch;
      }
      
      if (dateFilter === "today") {
        params.date = new Date().toISOString().split("T")[0];
      } else if (dateFilter !== "all") {
        const range = getDateRange(dateFilter);
        if (range) {
          params.startDate = range.start.toISOString().split("T")[0];
          params.endDate = range.end.toISOString().split("T")[0];
        }
      }

      const res = await getMainVendorDashboard(params);
      if (res.success && res.data) {
        setStats({
          totalBranches: res.data.totalBranches || 0,
          totalSellers: res.data.totalSellers || 0,
          totalBuyers: res.data.totalBuyers || 0,
          totalSales: res.data.totalSales || 0,
          totalCommission: res.data.totalCommission || 0,
          todayAuctions: res.data.todayAuctions || 0,
        });
        setFilteredTransactions(res.data.recentTransactions || []);
      }
    } catch (error) {
      console.error("Error fetching main vendor dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "week": return "This Week";
      case "month": return "This Month";
      case "year": return "This Year";
      case "custom": return formatDate(customDate);
      case "all": return "All Time";
      default: return "Today";
    }
  };

  return (
    <>
      <div className="content-header">
        <div className="header-top">
          <h1>Main Vendor Dashboard</h1>
          <div className="header-actions">
            <div className="dashboard-filter-container">
              
              {/* Branch Filter */}
              {branchCount > 0 && (
                <div className="filter-dropdown-wrapper">
                  <Building className="filter-icon" size={16} />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="dashboard-filter-select"
                    style={{ minWidth: '130px' }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Filter */}
              <div className="filter-dropdown-wrapper">
                <Filter className="filter-icon" size={16} />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="dashboard-filter-select"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Date</option>
                </select>
              </div>

              {dateFilter === "custom" && (
                <div className="custom-date-wrapper fade-in">
                  <Calendar className="calendar-icon" size={16} />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="dashboard-date-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="content-body">
        {/* Stats Grid - 5 Cards (Branches, Sellers, Buyers, Sales, Commission) */}
        <div className="stats-grid dashboard-stats-grid fade-in">
          
          {branchCount > 0 && (
            <div className="stat-card db-stat-card db-stat-purple" style={{ cursor: 'default' }}>
              <div className="stat-header">
                <div className="stat-icon db-stat-icon-purple">
                  <Building size={20} />
                </div>
                <div>
                  <div className="stat-value">{stats.totalBranches}</div>
                  <div className="stat-label">Branches</div>
                </div>
              </div>
            </div>
          )}

          <Link to="/mainvendor/sellers" className="db-stat-link">
            <div className="stat-card db-stat-card db-stat-blue">
              <div className="stat-header">
                <div className="stat-icon db-stat-icon-blue">
                  <Users size={20} />
                </div>
                <div>
                  <div className="stat-value">{stats.totalSellers}</div>
                  <div className="stat-label">Sellers</div>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/mainvendor/buyers" className="db-stat-link">
            <div className="stat-card db-stat-card db-stat-indigo">
              <div className="stat-header">
                <div className="stat-icon db-stat-icon-indigo">
                  <UsersRound size={20} />
                </div>
                <div>
                  <div className="stat-value">{stats.totalBuyers}</div>
                  <div className="stat-label">Buyers</div>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/mainvendor/history" className="db-stat-link">
            <div className="stat-card db-stat-card db-stat-green">
              <div className="stat-header">
                <div className="stat-icon db-stat-icon-green">
                  <BadgeIndianRupee size={20} />
                </div>
                <div>
                  <div className="stat-value">
                    ₹{stats.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="stat-label">Total Sales</div>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/mainvendor/commission" className="db-stat-link">
            <div className="stat-card db-stat-card db-stat-amber">
              <div className="stat-header">
                <div className="stat-icon db-stat-icon-amber">
                  <HandCoins size={20} />
                </div>
                <div>
                  <div className="stat-value">
                    ₹{stats.totalCommission.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </div>
                  <div className="stat-label">Total Commission</div>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Recent Transactions - Mirroring vendor dashboard UI */}
        <div className="section-header section-margin-top">
          <h3 className="section-title">
            {selectedBranch === "all" 
              ? "" 
              : selectedBranch === currentMainVendorId 
                ? "My Operational " 
                : `${branches.find(b => b.id === selectedBranch)?.name || 'Branch'} `}
            Transactions ({getFilterLabel()})
          </h3>
        </div>

        <div className="card-list fade-in">
          {loading ? (
            <LoadingSpinner message="Fetching dashboard data..." />
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>No transactions found for {getFilterLabel().toLowerCase()}</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction._id || Math.random()} className="data-card">
                <div className="data-card-header">
                  <div>
                    <div className="data-card-title">
                      {transaction.productName}
                    </div>
                    <div className="data-card-subtitle">
                      {transaction.branchName} • {formatDate(transaction.date)}
                    </div>
                  </div>
                  <div className="badge badge-success">Completed</div>
                </div>

                <div className="data-card-body">
                  <div className="data-row">
                    <span className="data-label">Seller</span>
                    <span className="data-value">{transaction.sellerName}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Buyer</span>
                    <span className="data-value">{transaction.buyerName}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Qty / Unit</span>
                    <span className="data-value">
                      {transaction.quantity} {transaction.unit || "qty"}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Price</span>
                    <span className="data-value" style={{fontWeight: 600}}>
                      ₹{(transaction.finalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Commission</span>
                    <span className="data-value text-amber" style={{fontWeight: 600}}>
                      ₹{(transaction.commissionAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default MainVendorDashboard;