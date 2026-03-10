import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import SearchableSelect from "../../components/Common/SearchableSelect";
import ConfirmationModal from "../../components/Common/ConfirmationModal";

function Branches() {
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Branch 1",
      state: "Karnataka",
      city: "Bangalore",
      address: "123 Main St",
      status: "Active",
    },
    {
      id: 2,
      name: "Branch 2",
      state: "Maharashtra",
      city: "Mumbai",
      address: "456 Marine Drive",
      status: "Active",
    },
    {
      id: 3,
      name: "Branch 3",
      state: "Tamil Nadu",
      city: "Chennai",
      address: "789 Anna Salai",
      status: "Inactive",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    city: "",
    address: "",
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, branchId: null });

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({ name: "", state: "", city: "", address: "" });
    setCities([]);
    setShowModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      state: branch.state || "",
      city: branch.city || "",
      address: branch.address || "",
    });
    // load cities for that state
    if (branch.state) fetchCities(branch.state);
    setShowModal(true);
  };

  // load states once on mount
  useEffect(() => {
    fetchStates();
  }, []);

  const toggleStatus = (id) => {
    setBranches(
      branches.map((b) =>
        b.id === id
          ? { ...b, status: b.status === "Active" ? "Inactive" : "Active" }
          : b,
      ),
    );
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const { data } = await axios.post(
        "https://countriesnow.space/api/v0.1/countries/states",
        { country: "India" },
      );
      if (!data.error) setStates(data.data.states);
    } catch (err) {
      console.error("Error fetching states:", err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (stateName) => {
    setLoadingCities(true);
    try {
      const { data } = await axios.post(
        "https://countriesnow.space/api/v0.1/countries/state/cities",
        { country: "India", state: stateName },
      );
      if (!data.error) {
        setCities(data.data.map((city) => ({ name: city })));
      } else {
        setCities([]);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleDelete = (id) => {
    setBranches(branches.filter((b) => b.id !== id));
  };

  const confirmDelete = (id) => {
    setConfirmInfo({ isOpen: true, branchId: id });
  };

  const handleConfirmClose = () => {
    setConfirmInfo({ isOpen: false, branchId: null });
  };

  const handleConfirm = () => {
    if (confirmInfo.branchId != null) {
      handleDelete(confirmInfo.branchId);
    }
    handleConfirmClose();
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
        <div className="table-responsive custom-table-wrapper">
          <table className="data-table custom-data-table branch-table">
          <thead>
            <tr>
              <th className="custom-th">Branch Name</th>
              <th className="custom-th">State / City / Address</th>
              <th className="custom-th">Status</th>
              <th className="custom-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id}>
                <td className="custom-td">{branch.name}</td>
                <td className="custom-td">
                  {branch.state}, {branch.city}
                  {branch.address && ` - ${branch.address}`}
                </td>
                <td className="custom-td">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={branch.status === "Active"}
                      onChange={() => toggleStatus(branch.id)}
                    />
                    <span className="slider"></span>
                    <span className="toggle-label">{branch.status}</span>
                  </label>
                </td>
                <td className="custom-td" onClick={(e) => e.stopPropagation()}>
                  <div className="saas-flex saas-gap-075">
                    <button
                      className="icon-btn edit"
                      onClick={() => handleEdit(branch)}
                      title="Edit Branch"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => confirmDelete(branch.id)}
                      title="Delete Branch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                    <label className="form-label">State</label>
                    <SearchableSelect
                      name="state"
                      value={formData.state}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          state: val,
                          city: "",
                        }));
                        fetchCities(val);
                      }}
                      placeholder={loadingStates ? "Loading..." : "Select state"}
                      options={states.map((s) => ({
                        label: s.name,
                        value: s.name,
                      }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <SearchableSelect
                      name="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      disabled={!formData.state || loadingCities}
                      placeholder={
                        loadingCities ? "Loading..." : "Select city"
                      }
                      options={cities.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
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

        <ConfirmationModal
          isOpen={confirmInfo.isOpen}
          onClose={handleConfirmClose}
          title="Delete Branch"
          message="Are you sure you want to delete this branch?"
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

export default Branches;
