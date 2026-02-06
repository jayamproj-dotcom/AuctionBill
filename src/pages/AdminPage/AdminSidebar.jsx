import React from "react";
import { NavLink } from "react-router-dom";

const AdminSidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🔨</div>
          <div className="logo-text">
            <h2>Auction Billing</h2>
            <p>Management System</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/today-auction"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">🔨</span>
          <span>Today Auction</span>
        </NavLink>

        <NavLink
          to="/admin/history"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">📜</span>
          <span>History</span>
        </NavLink>

        <NavLink
          to="/admin/seller-details"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">👤</span>
          <span>Seller Details</span>
        </NavLink>

        <NavLink
          to="/admin/buyer-details"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">🛒</span>
          <span>Buyer Details</span>
        </NavLink>

        <NavLink
          to="/admin/commission"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">💰</span>
          <span>Commission Record</span>
        </NavLink>

        <NavLink
          to="/admin/manage"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">⚙️</span>
          <span>Manage</span>
        </NavLink>
      </nav>
    </aside>

  );
};

export default AdminSidebar;
