import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import VentorLogin from "./pages/VentorPage/Login/Login.jsx";
import VentorLayout from "./pages/VentorPage/VentorLayout.jsx";
import Signup from "./pages/VentorPage/Signup/Signup.jsx";
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  // Global safety check for corrupted localStorage data
  useEffect(() => {
    getAuctionData(); // This will trigger the healing/fallback logic in the utility

   
    const handleWheel = () => {
      if (document.activeElement.type === "number") {
        document.activeElement.blur();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Loaded from .env

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter basename="/auctionbilling">
        <Routes>
          {/* Ventor Login */}
          <Route path="/" element={<VentorLogin />} />
          <Route path="/signup" element={<Signup />} />

          {/* Ventor area with nested routes */}
          <Route path="/ventor" element={<VentorLayout />}>
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
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
