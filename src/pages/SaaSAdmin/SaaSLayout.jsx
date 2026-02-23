import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { House, ShoppingCart, Users, Gem, Settings, LogOut, Menu, X, Bell, User, Lock } from 'lucide-react';
import './SaaSAdmin.css';

const SaaSLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminPhoto, setAdminPhoto] = useState(localStorage.getItem('saas_admin_photo') || null);
  const [adminName, setAdminName] = useState(localStorage.getItem('saas_admin_name') || 'Super Admin');
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown when clicking outside and handle profile photo updates
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    
    const handleProfileUpdate = () => {
      setAdminPhoto(localStorage.getItem('saas_admin_photo') || null);
      setAdminName(localStorage.getItem('saas_admin_name') || 'Super Admin');
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("saas_profile_updated", handleProfileUpdate);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("saas_profile_updated", handleProfileUpdate);
    };
  }, []);

  // Add a class to body when in SaaS Admin to allow full-width override
  useEffect(() => {
    document.body.classList.add('saas-admin-active');
    
    // Check for auth token
    const is_admin_login = localStorage.getItem('is_admin');
    if (!is_admin_login) {
        navigate('/saas-admin');
    }

    return () => {
      document.body.classList.remove('saas-admin-active');
    };
  }, [navigate]);

  const handleLogout = () => {
      localStorage.removeItem('is_admin');
      navigate('/saas-admin');
  };

  const saasRole = localStorage.getItem('saas_role') || 'admin';
  const saasPermissionsStr = localStorage.getItem('saas_permissions');
  const saasPermissions = saasPermissionsStr && saasPermissionsStr !== "undefined" ? JSON.parse(saasPermissionsStr) : {};

  let navItems = [
    { path: '/saas', label: 'Dashboard', icon: <House size={20} /> },
    { path: '/saas/purchases', label: 'Purchases', icon: <ShoppingCart size={20} /> },
    { path: '/saas/vendors', label: 'Vendors', icon: <Users size={20} /> },
    { path: '/saas/subscriptions', label: 'Subscriptions', icon: <Gem size={20} /> },
    { path: '/saas/subadmins', label: 'Sub-Admins', icon: <Users size={20} /> },
    { path: '/saas/settings', label: 'Profile', icon: <User size={20} /> },
    { path: '/saas/change-password', label: 'Change Password', icon: <Lock size={20} /> },
  ];

  if (saasRole === 'sub-admin') {
      navItems = navItems.filter(item => {
          if (item.path === '/saas/settings') return false; 
          if (item.path === '/saas/subadmins') return false; 
          if (item.path === '/saas/change-password') return saasPermissions.passwordChange === true;
          if (item.path === '/saas/subscriptions') return saasPermissions.subscriptionAccess === true;
          return true;
      });
  }

  return (
    <div className="saas-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`saas-overlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`saas-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="saas-sidebar-header">
          <div className="saas-logo">SaaS Admin</div>
          <button 
            className="saas-close-sidebar"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="saas-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`saas-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="saas-sidebar-footer">
          <div className="saas-nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={20} /></span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="saas-main">
        <header className="saas-header">
          <div className="saas-header-left">
            <button 
              className="saas-mobile-toggle"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="saas-header-title-text">
              {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
            </h2>
          </div>
          <div className="saas-header-right">
            <div className="saas-header-right-content">
              <button className="saas-btn btn-sm btn-outline icon-only">
                  <Bell size={20} />
              </button>
              
              <div className="saas-header-profile-container" ref={profileRef}>
                <div 
                  className="saas-header-profile" 
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  {adminPhoto ? (
                      <img src={adminPhoto} alt="SA" className="saas-header-avatar" />
                  ) : (
                    <div className="saas-header-avatar-fallback">
                       {adminName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {profileOpen && (
                  <div className="saas-profile-dropdown">
                    <div className="saas-dropdown-header">
                        {adminPhoto ? (
                            <img src={adminPhoto} alt="SA" className="saas-dropdown-avatar" />
                        ) : (
                          <div className="saas-dropdown-avatar-fallback">
                             {adminName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="saas-dropdown-name">{adminName}</div>
                    </div>
                    
                    {saasRole !== 'sub-admin' && (
                        <div className="saas-dropdown-item" onClick={() => {
                            navigate('/saas/settings');
                            setProfileOpen(false);
                        }}>
                          <User size={16} /> 
                          <span className="saas-dropdown-item-text">Profile</span>
                        </div>
                    )}
                    {saasRole !== 'sub-admin' && <div className="saas-dropdown-divider"></div>}
                    <div className="saas-dropdown-item text-danger" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span className="saas-dropdown-item-text">Logout</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="saas-scroll-wrapper">
          <section className="saas-content">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  );
};

export default SaaSLayout;
