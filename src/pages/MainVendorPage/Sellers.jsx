import React, { useState } from "react";
import { User, Phone, Mail } from "lucide-react";

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
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      phone: "123-456-7891",
      branch: "Branch 1",
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      phone: "123-456-7892",
      branch: "Branch 2",
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana@example.com",
      phone: "123-456-7893",
      branch: "Branch 2",
    },
    {
      id: 5,
      name: "Eve Wilson",
      email: "eve@example.com",
      phone: "123-456-7894",
      branch: "Branch 3",
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
                <User size={24} />
              </div>
              <div className="data-card-body">
                <div className="data-row">
                  <span className="data-label">
                    <Mail size={14} /> Email:
                  </span>
                  <span className="data-value">{seller.email}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">
                    <Phone size={14} /> Phone:
                  </span>
                  <span className="data-value">{seller.phone}</span>
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
      </div>
    </div>
  );
}

export default Sellers;
