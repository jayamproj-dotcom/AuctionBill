import React, { useState } from "react";
import { Phone, Mail, Pencil, Trash2 } from "lucide-react";
import ConfirmationModal from "../../components/Common/ConfirmationModal";

function Sellers() {
  const [selectedBranch, setSelectedBranch] = useState("all");

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];

  const sellers = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      phone: "123-456-7890",
      branch: "Branch 1",
      city: "Bangalore",
      state: "Karnataka",
      address: "123 Main St",
      status: "active",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      phone: "123-456-7891",
      branch: "Branch 1",
      city: "Mumbai",
      state: "Maharashtra",
      address: "456 Marine Drive",
      status: "inactive",
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      phone: "123-456-7892",
      branch: "Branch 2",
      city: "Chennai",
      state: "Tamil Nadu",
      address: "789 Anna Salai",
      status: "active",
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana@example.com",
      phone: "123-456-7893",
      branch: "Branch 2",
      city: "Hyderabad",
      state: "Telangana",
      address: "101 Film Nagar",
      status: "active",
    },
    {
      id: 5,
      name: "Eve Wilson",
      email: "eve@example.com",
      phone: "123-456-7894",
      branch: "Branch 3",
      city: "Pune",
      state: "Maharashtra",
      address: "202 FC Road",
      status: "inactive",
    },
  ];

  const filteredSellers =
    selectedBranch === "all"
      ? sellers
      : sellers.filter(
          (seller) =>
            seller.branch ===
            branches.find((b) => b.id === selectedBranch)?.name,
        );

  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, sellerId: null });

  const handleDeleteSeller = (id) => {
    setSellers(sellers.filter((s) => s.id !== id));
  };

  const confirmDeleteSeller = (id) => {
    setConfirmInfo({ isOpen: true, sellerId: id });
  };

  const handleConfirmClose = () => {
    setConfirmInfo({ isOpen: false, sellerId: null });
  };

  const handleConfirm = () => {
    if (confirmInfo.sellerId != null) {
      handleDeleteSeller(confirmInfo.sellerId);
    }
    handleConfirmClose();
  };

  return (
    <div className="sellers">
      <div className="content-header">
        <div className="header-top">
          <h1>Sellers Management</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span>Sellers</span>
        </div>
      </div>

      <div className="content-body">
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Select Branch</label>
          <select
            className="form-control"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="card-list">
          {filteredSellers.map((seller) => (
            <div key={seller.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">{seller.name}</div>
                  <div className="data-card-subtitle">{seller.branch}</div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="icon-btn edit"
                    title="Edit Seller"
                    // onClick={() => handleEditSeller(seller)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete Seller"
                    onClick={() => confirmDeleteSeller(seller.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="data-card-body">
                {/* <div className="data-row">
                  <span className="data-label">
                   Email:
                  </span>
                  <span className="data-value">{seller.email}</span>
                </div> */}
               
                <div className="data-row">
                  <span className="data-label">Location</span>
                  <span className="data-value">
                    {[seller.city, seller.state]
                      .filter(Boolean)
                      .join(", ") || seller.address || "N/A"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Login Access</span>
                  <span
                    className={`data-value badge ${
                      seller.status === "inactive" ? "badge-error" : "badge-success"
                    }`}
                  >
                    {seller.status === "inactive" ? "Disabled" : "Enabled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSellers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No sellers found for the selected branch.</p>
          </div>
        )}
        <ConfirmationModal
          isOpen={confirmInfo.isOpen}
          onClose={handleConfirmClose}
          title="Delete Seller"
          message="Are you sure you want to delete this seller?"
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

export default Sellers;
