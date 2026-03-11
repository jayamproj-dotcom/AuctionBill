import React, { useState, useEffect } from "react";
import { Phone, Mail, Pencil, Trash2, Loader2 } from "lucide-react";
import ConfirmationModal from "../../components/Common/ConfirmationModal";
import SearchableSelect from "../../components/Common/SearchableSelect";
import { getMainVendorSellers, getMainVendorBranches } from "../../api/mainVendorApi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function Sellers() {
  const { vendorId, vendorLoggedIn } = useSelector((state) => state.vendorAuth);
  // Re-check sessionStorage if Redux is lagging or after refresh
  const currentMainVendorId = vendorId || sessionStorage.getItem("vendorId");

  console.log("currentMainVendorId", currentMainVendorId);

  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellers, setSellers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    setFetchingBranches(true);
    try {
      const res = await getMainVendorBranches();
      if (res.status) {
        setBranches([{ _id: "all", name: "All Branches" }, ...(res.vendors || [])]);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setFetchingBranches(false);
    }
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await getMainVendorSellers({ branchId: selectedBranch });
      if (res.status) {
        setSellers(res.sellers || []);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  const branchOptions = branches.map((b) => ({ label: b.name, value: b._id || b.id }));

  const filteredSellers = sellers.filter((seller) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      seller.name.toLowerCase().includes(q) ||
      (seller.email || "").toLowerCase().includes(q) ||
      (seller.phone || "").toLowerCase().includes(q)
    );
  });

  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, sellerId: null });

  const confirmDeleteSeller = (id) => {
    setConfirmInfo({ isOpen: true, sellerId: id });
  };

  const handleConfirmClose = () => {
    setConfirmInfo({ isOpen: false, sellerId: null });
  };

  const handleConfirm = () => {
    // Current delete logic is placeholder since it's only "list view" requested
    // But we could implement delete if needed later
    toast.info("Delete functionality not implemented yet");
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
          <SearchableSelect
            name="branch"
            options={branchOptions}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            placeholder={fetchingBranches ? "Loading branches..." : "All Branches"}
            disabled={fetchingBranches}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search sellers by name, email or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-state" style={{ textAlign: "center", padding: "3rem" }}>
            <Loader2 className="animate-spin" size={40} style={{ margin: "0 auto", color: "#F39C12" }} />
            <p style={{ marginTop: "1rem" }}>Fetching sellers...</p>
          </div>
        ) : (
          <>
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
                        disabled
                        style={{ opacity: 0.5, cursor: "not-allowed" }}
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
                    <div className="data-row">
                      <span className="data-label">Contact</span>
                      <span className="data-value">{seller.phone || "N/A"}</span>
                    </div>
                    {seller.email && (
                      <div className="data-row">
                        <span className="data-label">Email</span>
                        <span className="data-value">{seller.email}</span>
                      </div>
                    )}
                    <div className="data-row">
                      <span className="data-label">Location</span>
                      <span className="data-value">
                        {[seller.city, seller.state]
                          .filter(Boolean)
                          .join(", ") || seller.address || "N/A"}
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Status</span>
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
              <div className="empty-state" style={{ textAlign: "center", padding: "3rem" }}>
                <div className="empty-state-icon" style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                <p>No sellers found.</p>
              </div>
            )}
          </>
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
