import React, { useState } from "react";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";

function Branches() {
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Branch 1",
      location: "Downtown",
      manager: "John Doe",
      status: "Active",
    },
    {
      id: 2,
      name: "Branch 2",
      location: "Uptown",
      manager: "Jane Smith",
      status: "Active",
    },
    {
      id: 3,
      name: "Branch 3",
      location: "Suburb",
      manager: "Bob Johnson",
      status: "Inactive",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    manager: "",
  });

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({ name: "", location: "", manager: "" });
    setShowModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      manager: branch.manager,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      setBranches(branches.filter((b) => b.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBranch) {
      setBranches(
        branches.map((b) =>
          b.id === editingBranch.id ? { ...b, ...formData } : b,
        ),
      );
    } else {
      const newBranch = {
        id: Date.now(),
        ...formData,
        status: "Active",
      };
      setBranches([...branches, newBranch]);
    }
    setShowModal(false);
  };

  return (
    <div className="branches">
      <div className="content-header">
        <div className="header-top">
          <h1>Branches Management</h1>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} />
            Add Branch
          </button>
        </div>
        <div className="breadcrumb">
          <span>Main Vendor</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span>Branches</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card-list">
          {branches.map((branch) => (
            <div key={branch.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <div className="data-card-title">{branch.name}</div>
                  <div className="data-card-subtitle">
                    <MapPin size={14} /> {branch.location}
                  </div>
                </div>
                <span className={`status-badge ${branch.status.toLowerCase()}`}>
                  {branch.status}
                </span>
              </div>
              <div className="data-card-body">
                <div className="data-row">
                  <span className="data-label">Manager:</span>
                  <span className="data-value">{branch.manager}</span>
                </div>
              </div>
              <div className="data-card-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEdit(branch)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(branch.id)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Branch Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manager</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.manager}
                      onChange={(e) =>
                        setFormData({ ...formData, manager: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingBranch ? "Update" : "Add"} Branch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Branches;
