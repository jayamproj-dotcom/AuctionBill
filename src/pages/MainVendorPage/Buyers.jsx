import React, { useState } from "react";
import { Phone, Mail, Pencil, Trash2 } from "lucide-react";
import ConfirmationModal from "../../components/Common/ConfirmationModal";
import SearchableSelect from "../../components/Common/SearchableSelect";

function Buyers() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "1", name: "Branch 1" },
    { id: "2", name: "Branch 2" },
    { id: "3", name: "Branch 3" },
  ];

  const branchOptions = branches.map((b) => ({ label: b.name, value: b.id }));

  const buyers = [
    {
      id: 1,
      name: "Frank Miller",
      email: "frank@example.com",
      phone: "123-456-7895",
      branch: "Branch 1",
      city: "Bangalore",
      state: "Karnataka",
      address: "123 Main St",
      status: "active",
      purchases: 5,
    },
    {
      id: 2,
      name: "Grace Lee",
      email: "grace@example.com",
      phone: "123-456-7896",
      branch: "Branch 1",
      city: "Mumbai",
      state: "Maharashtra",
      address: "456 Marine Drive",
      status: "inactive",
      purchases: 3,
    },
    {
      id: 3,
      name: "Henry Davis",
      email: "henry@example.com",
      phone: "123-456-7897",
      branch: "Branch 2",
      city: "Chennai",
      state: "Tamil Nadu",
      address: "789 Anna Salai",
      status: "active",
      purchases: 8,
    },
    {
      id: 4,
      name: "Ivy Chen",
      email: "ivy@example.com",
      phone: "123-456-7898",
      branch: "Branch 2",
      city: "Pune",
      state: "Maharashtra",
      address: "101 FC Road",
      status: "active",
      purchases: 2,
    },
    {
      id: 5,
      name: "Jack Wilson",
      email: "jack@example.com",
      phone: "123-456-7899",
      branch: "Branch 3",
      city: "Hyderabad",
      state: "Telangana",
      address: "202 Film Nagar",
      status: "inactive",
      purchases: 6,
    },
  ];

  const filteredBuyers = buyers
    .filter((buyer) => {
      if (selectedBranch === "all") return true;
      return (
        buyer.branch === branches.find((b) => b.id === selectedBranch)?.name
      );
    })
    .filter((buyer) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        buyer.name.toLowerCase().includes(q) ||
        (buyer.email || "").toLowerCase().includes(q)
      );
    });

  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, buyerId: null });

  const handleDeleteBuyer = (id) => {
    setBuyers(buyers.filter((b) => b.id !== id));
  };

  const confirmDeleteBuyer = (id) => {
    setConfirmInfo({ isOpen: true, buyerId: id });
  };

  const handleConfirmClose = () => {
    setConfirmInfo({ isOpen: false, buyerId: null });
  };

  const handleConfirm = () => {
    if (confirmInfo.buyerId != null) {
      handleDeleteBuyer(confirmInfo.buyerId);
    }
    handleConfirmClose();
  };

  return (
    <div className="buyers">
      <div className="content-header">
        <div className="header-top">
          <h1>Buyers Management</h1>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span>Buyers</span>
        </div>
      </div>

      <div className="content-body">
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Select Branch</label>
          <SearchableSelect
            name="branch"
            options={branchOptions}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            placeholder="All Branches"
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search buyers…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="card-list">
          {filteredBuyers.map((buyer) => (
            <div key={buyer.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">{buyer.name}</div>
                  <div className="data-card-subtitle">{buyer.branch}</div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="icon-btn edit"
                    title="Edit Buyer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete Buyer"
                    onClick={() => confirmDeleteBuyer(buyer.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="data-card-body">
           
                <div className="data-row">
                  <span className="data-label">Location</span>
                  <span className="data-value">
                    {[buyer.city, buyer.state]
                      .filter(Boolean)
                      .join(", ") || buyer.address || "N/A"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Login Access</span>
                  <span
                    className={`data-value badge ${
                      buyer.status === "inactive" ? "badge-error" : "badge-success"
                    }`}
                  >
                    {buyer.status === "inactive" ? "Disabled" : "Enabled"}
                  </span>
                </div>
              
              </div>
            </div>
          ))}
        </div>

        {filteredBuyers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p>No buyers found for the selected branch.</p>
          </div>
        )}
        <ConfirmationModal
          isOpen={confirmInfo.isOpen}
          onClose={handleConfirmClose}
          title="Delete Buyer"
          message="Are you sure you want to delete this buyer?"
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

export default Buyers;
