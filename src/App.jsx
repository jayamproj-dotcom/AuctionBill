import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminPage/Login/Login.jsx";
import AdminLayout from "./pages/AdminPage/AdminLayout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import TodayAuction from "./components/TodayAuction.jsx";
import History from "./components/History.jsx";
import SellerDetails from "./components/SellerDetails.jsx";
import BuyerDetails from "./components/BuyerDetails.jsx";
import CommissionRecord from "./components/CommissionRecord.jsx";
import Manage from "./components/Manage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login */}
        <Route path="/" element={<AdminLogin />} />

        {/* Admin area with nested routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="today-auction" element={<TodayAuction />} />
          <Route path="history" element={<History />} />
          <Route path="seller-details" element={<SellerDetails />} />
          <Route path="buyer-details" element={<BuyerDetails />} />
          <Route path="commission" element={<CommissionRecord />} />
          <Route path="manage" element={<Manage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
