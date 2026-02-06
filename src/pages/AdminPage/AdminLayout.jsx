import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";
import "./Admin.css";

const AdminLayout = () => {
  return (
    <div className="app-container">
      <AdminSidebar />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
