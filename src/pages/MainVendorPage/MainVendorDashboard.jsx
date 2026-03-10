import React from "react";
import { Link } from "react-router-dom";
import {
  Building,
  Users,
  ShoppingCart,
  HandCoins,
  BadgeIndianRupee,
  History,
} from "lucide-react";

function MainVendorDashboard() {
  // Static data for demonstration
  const stats = [
    {
      title: "Total Branches",
      value: "5",
      icon: <Building />,
      color: "bg-blue-500",
      link: "/mainvendor/branches",
    },
    {
      title: "Total Sellers",
      value: "25",
      icon: <Users />,
      color: "bg-green-500",
      link: "/mainvendor/sellers",
    },
    {
      title: "Total Buyers",
      value: "150",
      icon: <ShoppingCart />,
      color: "bg-purple-500",
      link: "/mainvendor/buyers",
    },
    {
      title: "Total Commission",
      value: "₹50,000",
      icon: <HandCoins />,
      color: "bg-yellow-500",
      link: "/mainvendor/commission",
    },
    {
      title: "Total Sales",
      value: "₹2,50,000",
      icon: <BadgeIndianRupee />,
      color: "bg-red-500",
      link: "/mainvendor/history",
    },
    {
      title: "Active Auctions",
      value: "12",
      icon: <History />,
      color: "bg-indigo-500",
      link: "/mainvendor/history",
    },
  ];

  return (
    <div className="dashboard">
      <div className="content-header">
        <div className="header-top">
          <h1>Main Vendor Dashboard</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="content-body">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <div className="stat-card">
                <div className="stat-header">
                  <div className={`stat-icon ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className="stat-value">{stat.value}</div>
                </div>
                <div className="stat-label">{stat.title}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
        </div>

        <div className="card-list">
          <div className="data-card">
            <div className="data-card-header">
              <div>
                <div className="data-card-title">Branch 1 - New Auction Started</div>
                <div className="data-card-subtitle">2 hours ago</div>
              </div>
            </div>
            <div className="data-card-body">
              <div className="data-row">
                <span className="data-label">Items:</span>
                <span className="data-value">15</span>
              </div>
              <div className="data-row">
                <span className="data-label">Starting Bid:</span>
                <span className="data-value">₹10,000</span>
              </div>
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <div>
                <div className="data-card-title">Commission Collected</div>
                <div className="data-card-subtitle">1 day ago</div>
              </div>
            </div>
            <div className="data-card-body">
              <div className="data-row">
                <span className="data-label">Amount:</span>
                <span className="data-value">₹5,000</span>
              </div>
              <div className="data-row">
                <span className="data-label">Branch:</span>
                <span className="data-value">Branch 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainVendorDashboard;
