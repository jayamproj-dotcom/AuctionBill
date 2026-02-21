import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { House, ShoppingCart, Users, Gem, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import './SaaSAdmin.css';

const SaaSLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const navItems = [
    { path: '/saas', label: 'Dashboard', icon: <House size={20} /> },
    { path: '/saas/purchases', label: 'Purchases', icon: <ShoppingCart size={20} /> },
    { path: '/saas/vendors', label: 'Vendors', icon: <Users size={20} /> },
    { path: '/saas/subscriptions', label: 'Subscriptions', icon: <Gem size={20} /> },
    { path: '/saas/settings', label: 'Global Settings', icon: <Settings size={20} /> },
  ];

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
              {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                   SA
                </div>
                <span className="saas-admin-name" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Super Admin</span>
              </div> */}
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
