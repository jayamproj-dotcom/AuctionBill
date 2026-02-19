import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { House, ChartSpline,UserCog, PackageSearch, History, User, ShoppingCart, Settings, Handshake, Gem, LogOut, X } from "lucide-react";
import logo from "../../assets/images/logo-sidebar.png"

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminCredentials");
    onClose();
    navigate("/");
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src={logo} alt="logo" />
          </div>
          <div className="logo-text">
            <h2>Auction Billing</h2>
            <p>Management System</p>
          </div>
        </div>
        <button className="close-sidebar" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><House /></span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/today-auction"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><ChartSpline /></span>
          <span>Today Auction</span>
        </NavLink>

        <NavLink
          to="/admin/pending-products"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><PackageSearch /></span>
          <span>Pending Products</span>
        </NavLink>

        <NavLink
          to="/admin/history"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><History /></span>
          <span>History</span>
        </NavLink>

        <NavLink
          to="/admin/seller-details"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><UserCog /></span>
          <span>Seller Details</span>
        </NavLink>

        <NavLink
          to="/admin/buyer-details"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><ShoppingCart /></span>
          <span>Buyer Details</span>
        </NavLink>

        <NavLink
          to="/admin/commission"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><Handshake /></span>
          <span>Commission Record</span>
        </NavLink>

        <NavLink
          to="/admin/manage"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><User /></span>
          <span>Profile</span>
        </NavLink>
        <NavLink
          to="/admin/subscription"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon"><Gem /></span>
          <span>Subscription Plan</span>
        </NavLink>

        <a
          href="/"
          className="nav-item text-danger"
          onClick={handleLogout}
        >
          <span className="nav-icon"><LogOut /></span>
          <span>Logout</span>
        </a>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
