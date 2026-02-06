import { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TodayAuction from './components/TodayAuction';
import History from './components/History';
import SellerDetails from './components/SellerDetails';
import BuyerDetails from './components/BuyerDetails';
import CommissionRecord from './components/CommissionRecord';
import Manage from './components/Manage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'today-auction':
        return <TodayAuction />;
      case 'history':
        return <History />;
      case 'seller-details':
        return <SellerDetails />;
      case 'buyer-details':
        return <BuyerDetails />;
      case 'commission':
        return <CommissionRecord />;
      case 'manage':
        return <Manage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🔨</div>
            <div className="logo-text">
              <h2>git init</h2>
              <p>Management System</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${currentPage === 'today-auction' ? 'active' : ''}`}
            onClick={() => setCurrentPage('today-auction')}
          >
            <span className="nav-icon">🔨</span>
            <span>Today Auction</span>
          </div>

          <div
            className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentPage('history')}
          >
            <span className="nav-icon">📜</span>
            <span>History</span>
          </div>

          <div
            className={`nav-item ${currentPage === 'seller-details' ? 'active' : ''}`}
            onClick={() => setCurrentPage('seller-details')}
          >
            <span className="nav-icon">👤</span>
            <span>Seller Details</span>
          </div>

          <div
            className={`nav-item ${currentPage === 'buyer-details' ? 'active' : ''}`}
            onClick={() => setCurrentPage('buyer-details')}
          >
            <span className="nav-icon">🛒</span>
            <span>Buyer Details</span>
          </div>

          <div
            className={`nav-item ${currentPage === 'commission' ? 'active' : ''}`}
            onClick={() => setCurrentPage('commission')}
          >
            <span className="nav-icon">💰</span>
            <span>Commission Record</span>
          </div>

          <div
            className={`nav-item ${currentPage === 'manage' ? 'active' : ''}`}
            onClick={() => setCurrentPage('manage')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Manage</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
