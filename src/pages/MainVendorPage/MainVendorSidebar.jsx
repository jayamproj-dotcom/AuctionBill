import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  House,
  Building,
  UserCog,
  ShoppingCart,
  Handshake,
  History,
  User,
  Gem,
  LogOut,
  X,
} from "lucide-react";
import logo from "../../assets/images/logo-sidebar.png";
import { useDispatch } from "react-redux";
import { clearVendorAuthData } from "../../redux/slices/vendorAuthSlice";

const MainVendorSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(clearVendorAuthData());
    onClose();
    navigate("/");
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src={logo} alt="logo" />
          </div>
          <div className="logo-text">
            <h2>Auction Billing</h2>
            <p>Main Vendor</p>
          </div>
        </div>
        <button className="close-sidebar" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/mainvendor/dashboard"
          className={({ isActive }) => `nav-item ${isActive || location.pathname === "/mainvendor" || location.pathname === "/mainvendor/" ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <House />
          </span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/mainvendor/branches"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <Building />
          </span>
          <span>Branches</span>
        </NavLink>

        <NavLink
          to="/mainvendor/sellers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <UserCog />
          </span>
          <span>Sellers</span>
        </NavLink>

        <NavLink
          to="/mainvendor/buyers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <ShoppingCart />
          </span>
          <span>Buyers</span>
        </NavLink>

        <NavLink
          to="/mainvendor/commission"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <Handshake />
          </span>
          <span>Commission</span>
        </NavLink>

        <NavLink
          to="/mainvendor/history"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <History />
          </span>
          <span>History</span>
        </NavLink>

        <NavLink
          to="/mainvendor/subscription"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <Gem />
          </span>
          <span>Subscription</span>
        </NavLink>

        <NavLink
          to="/mainvendor/manage"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <span className="nav-icon">
            <User />
          </span>
          <span>Profile</span>
        </NavLink>

        <a href="/" className="nav-item text-danger" onClick={handleLogout}>
          <span className="nav-icon">
            <LogOut />
          </span>
          <span>Logout</span>
        </a>
      </nav>
    </aside>
  );
};

export default MainVendorSidebar;
