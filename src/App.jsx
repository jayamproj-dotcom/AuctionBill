import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import AdminLogin from "./pages/AdminPage/Login/Login.jsx";
import AdminLayout from "./pages/AdminPage/AdminLayout.jsx";
import Dashboard from "./components/Dashboard/Dashboard.jsx";
import TodayAuction from "./components/TodayAuction/TodayAuction.jsx";
import History from "./components/History/History.jsx";
import SellerDetails from "./components/SellerDetails/SellerDetails.jsx";
import BuyerDetails from "./components/BuyerDetails/BuyerDetails.jsx";
import CommissionRecord from "./components/CommissionRecord/CommissionRecord.jsx";
import Manage from "./components/Manage/Manage.jsx";
import Subscription from "./components/Subscription/Subscription.jsx";
import PendingProducts from "./components/PendingProducts/PendingProducts.jsx";
import SaaSLayout from "./pages/SaaSAdmin/SaaSLayout.jsx";
import SaaSDashboard from "./pages/SaaSAdmin/SaaSDashboard.jsx";
import VendorManagement from "./pages/SaaSAdmin/VendorManagement.jsx";
import Purchases from "./pages/SaaSAdmin/Purchases.jsx";
import SubscriptionManagement from "./pages/SaaSAdmin/SubscriptionManagement.jsx";
import GlobalSettings from "./pages/SaaSAdmin/GlobalSettings.jsx";
import SaaSLogin from "./pages/SaaSAdmin/SaaSLogin.jsx";
import { getAuctionData } from "./utils/localStorage";

function App() {
  // Global safety check for corrupted localStorage data
  useEffect(() => {
    getAuctionData(); // This will trigger the healing/fallback logic in the utility
  }, []);

  return (
    <BrowserRouter basename="/auctionbilling">
      <Routes>
        {/* Admin Login */}
        <Route path="/" element={<AdminLogin />} />

        {/* Admin area with nested routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="today-auction" element={<TodayAuction />} />
          <Route path="pending-products" element={<PendingProducts />} />
          <Route path="history" element={<History />} />
          <Route path="seller-details" element={<SellerDetails />} />
          <Route path="buyer-details" element={<BuyerDetails />} />
          <Route path="commission" element={<CommissionRecord />} />
          <Route path="manage" element={<Manage />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        {/* SaaS Admin Login */}
        <Route path="/saas-admin" element={<SaaSLogin />} />

        {/* SaaS Admin Area */}
        <Route path="/saas" element={<SaaSLayout />}>
          <Route index element={<SaaSDashboard />} />
          <Route path="dashboard" element={<SaaSDashboard />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="vendors" element={<VendorManagement />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route path="settings" element={<GlobalSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
