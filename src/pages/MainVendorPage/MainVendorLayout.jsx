import React, { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import MainVendorSidebar from "./MainVendorSidebar.jsx";
import "./MainVendor.css";
import logo from "../../assets/images/logo.png";
import user from "../../assets/images/user.png";
import { LogOut, User, KeyRound } from "lucide-react";
import { googleLogout } from "@react-oauth/google";
import { useSelector, useDispatch } from "react-redux";
import { clearVendorAuthData, setVendorBranchCount } from "../../redux/slices/vendorAuthSlice.js";
import { resolveImageUrl } from "../../utils/imageUtils.js";
import { getMainVendorProfile, mainVendorLogout } from "../../api/mainVendorApi.js";
import Notification from "../../components/Common/Notification.jsx";

const MainVendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [isExpired, setIsExpired] = useState(
    sessionStorage.getItem("vendorSubExpired") === "true"
  );

  useEffect(() => {
    if (isExpired && location.pathname !== "/mainvendor/subscription") {
      navigate("/mainvendor/subscription");
    }
  }, [isExpired, location.pathname, navigate]);

  // Assuming reuse vendor auth for now, or create mainVendor slice later
  const {
    vendorLoggedIn,
    vendorUserName,
    vendorUserEmail,
    vendorUserPhoto,
    vendorId,
  } = useSelector((state) => state.vendorAuth);

  const isSessionActive =
    sessionStorage.getItem("vendorLoggedIn") === "true" ||
    localStorage.getItem("vendorLoggedIn") === "true";

  const isLoggedIn = vendorLoggedIn || isSessionActive;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const fallbackVendorId = sessionStorage.getItem("vendorId");
  const currentVendorId = vendorId || fallbackVendorId;

  const handleLogout = async () => {
    try {
      googleLogout();
      await mainVendorLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
    dispatch(clearVendorAuthData());
    setProfileOpen(false);
    navigate("/");
  };

  // Subscription check - adjust for mainVendor
  useEffect(() => {
    const checkSubscription = async () => {
      if (isLoggedIn && currentVendorId) {
        try {
          const res = await getMainVendorProfile(currentVendorId);
          if (res.status && res.vendor) {
            const currentVendor = res.vendor;

            const activeSub = currentVendor.activeSubscription;
            const latestBranchCount = activeSub?.branchCount ?? currentVendor.plan?.branchCount ?? 0;
            
            dispatch(setVendorBranchCount(latestBranchCount));

            const expiryDate = activeSub?.endDate || currentVendor.planEndDate;

            if (expiryDate) {
              if (new Date() > new Date(expiryDate)) {
                console.log("Subscription expired");
                setIsExpired(true);
                sessionStorage.setItem("vendorSubExpired", "true");
              } else {
                setIsExpired(false);
                sessionStorage.setItem("vendorSubExpired", "false");
              }
            } else {
              setIsExpired(false);
              sessionStorage.setItem("vendorSubExpired", "false");
            }
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }
    };

    checkSubscription();
  }, [isLoggedIn, currentVendorId]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

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

  if (!isLoggedIn) return null;

  const userName =
    vendorUserName || sessionStorage.getItem("vendorUserName") || "Vendor";
  const userPhoto =
    vendorUserPhoto || sessionStorage.getItem("vendorUserPhoto") || user;
  const userEmail =
    vendorUserEmail || sessionStorage.getItem("vendorUserEmail");

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

        <div className="header-actions">
          <Notification />

          <div className="header-profile-container" ref={profileRef}>
            <div className="header-profile" onClick={toggleProfile}>
              <p>{userName}</p>
              <img
                src={resolveImageUrl(userPhoto, user)}
                alt="User"
                referrerPolicy="no-referrer"
                className="header-profile-img"
                onError={(e) => {
                  e.target.src = user;
                }}
              />
            </div>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <img
                    src={resolveImageUrl(userPhoto, user)}
                    alt="Profile"
                    className="profile-dropdown-img"
                    onError={(e) => {
                      e.target.src = user;
                    }}
                  />
                  <div className="profile-dropdown-name">{userName}</div>
                  <div className="profile-dropdown-email">{userEmail}</div>
                </div>

                {!isExpired && (
                  <>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/mainvendor/manage");
                        setProfileOpen(false);
                      }}
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/mainvendor/change-password");
                        setProfileOpen(false);
                      }}
                    >
                      <KeyRound size={16} />
                      <span>Change Password</span>
                    </div>
                  </>
                )}
                <div
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <MainVendorSidebar isOpen={sidebarOpen} onClose={closeSidebar} isExpired={isExpired} />

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainVendorLayout;
