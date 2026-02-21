import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import VentorSidebar from "./VentorSidebar.jsx";
import "./Ventor.css";
import logo from "../../assets/images/logo.png";
import user from "../../assets/images/user.png";
import { LogOut, User, KeyRound } from "lucide-react";
import { googleLogout } from '@react-oauth/google';

const VentorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("ventorLoggedIn") === "true";

  useEffect(() => {
    if (!isLoggedIn) {
      window.location.href = "/auctionbilling";
    }
  }, [isLoggedIn, navigate]);

  // If not logged in, don't render anything (prevents flash of content)
  if (!isLoggedIn) return null;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Profile dropdown toggles
  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const handleLogout = () => {
    googleLogout(); // Sign out from Google
    localStorage.removeItem("ventorLoggedIn");
    localStorage.removeItem("ventorCredentials"); 
    localStorage.removeItem("ventorUserEmail");
    localStorage.removeItem("ventorUserName");
    localStorage.removeItem("ventorUserPhoto");
    
    setProfileOpen(false);
    window.location.href = "/auctionbilling";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Retrieve user info
  const userName = localStorage.getItem("ventorUserName") || "Ventor";
  const userPhoto = localStorage.getItem("ventorUserPhoto") || user;

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={toggleSidebar}>
          ☰
        </button>

        <div className="header-logo">
          <img src={logo} alt="Logo" />
          <h2>Auction Billing</h2>
        </div>

        <div className="header-profile-container" ref={profileRef}>
          <div className="header-profile" onClick={toggleProfile}>
            <p>{userName}</p>
            <img 
              src={userPhoto} 
              alt="User" 
              referrerPolicy="no-referrer"
              className="header-profile-img"
              onError={(e) => {e.target.src = user}} 
            />
          </div>

          {profileOpen && (
            <div className="profile-dropdown">
              {/* Dropdown Header with Profile Info */}
              <div className="profile-dropdown-header">
                  <img 
                      src={userPhoto} 
                      alt="Profile" 
                      className="profile-dropdown-img"
                      onError={(e) => {e.target.src = user}}
                  />
                  <div className="profile-dropdown-name">{userName}</div>
                  <div className="profile-dropdown-email">{localStorage.getItem('ventorUserEmail')}</div>
              </div>

              <div className="dropdown-item" onClick={() => {
                  navigate('/ventor/manage');
                  setProfileOpen(false);
              }}>
                <User size={16} /> {/* Changed icon to User */}
                <span>My Profile</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item text-danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <VentorSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default VentorLayout;
