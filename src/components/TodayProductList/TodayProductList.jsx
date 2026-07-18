import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Search, PackageSearch } from "lucide-react";
import { toast } from "react-toastify";
import LoadingSpinner from "../Common/LoadingSpinner";
import * as auctionApi from "../../api/auctionApi";
import { getSellers } from "../../api/sellerApi";

function TodayProductList() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const vendorId =
    useSelector((state) => state.vendorAuth.vendorId) ||
    sessionStorage.getItem("vendorId");

  const loadData = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch today's auction products
      const productResponse = await auctionApi.getAuctionProducts(vendorId, {
        date: today,
      });

      // Fetch sellers
      const sellerResponse = await getSellers(vendorId);

      if (sellerResponse.success) {
        setSellers(sellerResponse.data);
      }

      if (productResponse.success) {
        setProducts(productResponse.data);
      }
    } catch (error) {
      console.error("Failed to load today's product list:", error);
      toast.error("Failed to load today's products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorId]);

  const getSellerName = (sellerId) => {
    const seller = sellers.find((s) => (s._id || s.id) === sellerId);
    return seller ? seller.name : "Unknown Seller";
  };

  const getQualityLabel = (quality) => {
    switch (quality) {
      case "quality1":
        return "Quality 1";
      case "quality2":
        return "Quality 2";
      case "quality3":
        return "Quality 3";
      default:
        return quality;
    }
  };

  // Flatten products into variant rows for details & quantities
  const flatVariants = [];
  products.forEach((product) => {
    const sellerName = getSellerName(product.sellerId);
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        const remaining = (v.quantity || 0) - (v.sellQuantity || 0);
        flatVariants.push({
          productId: product._id || product.id,
          productName: product.name,
          sellerName,
          sellerId: product.sellerId,
          variantId: v._id || v.id,
          variety: v.variety,
          quality: v.quality,
          totalQty: v.quantity || 0,
          soldQty: v.sellQuantity || 0,
          remainingQty: remaining < 0 ? 0 : remaining,
          unit: v.unit || "kg",
          status: product.status,
        });
      });
    }
  });

  // Filter based on search query
  const filteredVariants = flatVariants.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.productName.toLowerCase().includes(query) ||
      item.sellerName.toLowerCase().includes(query) ||
      item.variety.toLowerCase().includes(query)
    );
  });

  // Aggregate quantities by Product Name + Variety
  const aggregatedSummary = {};
  flatVariants.forEach((item) => {
    const key = `${item.productName.toLowerCase()}|||${item.variety.toLowerCase()}`;
    if (!aggregatedSummary[key]) {
      aggregatedSummary[key] = {
        productName: item.productName,
        variety: item.variety,
        totalQty: 0,
        soldQty: 0,
        remainingQty: 0,
        unit: item.unit,
      };
    }
    aggregatedSummary[key].totalQty += item.totalQty;
    aggregatedSummary[key].soldQty += item.soldQty;
    aggregatedSummary[key].remainingQty += item.remainingQty;
  });

  const aggregatedList = Object.values(aggregatedSummary);

  const filteredAggregated = aggregatedList.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.productName.toLowerCase().includes(query) ||
      item.variety.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="content-header">
        <div className="header-top">
          <h1>Today's Product List</h1>
        </div>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Today's Product List</span>
        </div>
      </div>

      <div className="content-body">
        {/* Standardized Search Bar */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted, #888)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by product, variety..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{
              width: "100%",
              paddingLeft: "38px",
              paddingRight: "12px",
              borderRadius: "8px",
              background: "transparent",
              boxSizing: "border-box",
            }}
          />
        </div>

        {loading ? (
          <LoadingSpinner message="Loading product quantities..." />
        ) : flatVariants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <PackageSearch />
            </div>
            <p>No products or variants available today</p>
          </div>
        ) : (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            {/* Section 1: Variety-wise Summary (Aggregated) */}
            <div>
              <div className="section-header" style={{ marginBottom: "12px" }}>
                <h3 className="section-title">
                  Variety Summary (Total Stock: {filteredAggregated.length})
                </h3>
              </div>
              <div className="table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper">
                <table className="data-table custom-data-table">
                  <thead className="bg-tertiary">
                    <tr>
                      <th className="custom-th">Product</th>
                      <th className="custom-th">Variety</th>
                      <th className="custom-th">Total Qty</th>
                      <th className="custom-th">Sold Qty</th>
                      <th className="custom-th">Remaining Qty</th>
                      <th className="custom-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAggregated.map((item, index) => {
                      const isSoldOut = item.remainingQty <= 0;
                      return (
                        <tr key={`agg-${item.productName}-${item.variety}-${index}`} className="custom-tr">
                          <td className="custom-td">
                            <strong>{item.productName.charAt(0).toUpperCase() + item.productName.slice(1)}</strong>
                          </td>
                          <td className="custom-td">
                            {item.variety.charAt(0).toUpperCase() + item.variety.slice(1)}
                          </td>
                          <td className="custom-td">
                            {item.totalQty} {item.unit}
                          </td>
                          <td className="custom-td">
                            {item.soldQty} {item.unit}
                          </td>
                          <td className="custom-td">
                            <strong style={{ color: isSoldOut ? "var(--error-color, #ef4444)" : "var(--success-color, #10b981)" }}>
                              {item.remainingQty} {item.unit}
                            </strong>
                          </td>
                          <td className="custom-td">
                            {isSoldOut ? (
                              <span className="badge badge-error">Sold Out</span>
                            ) : (
                              <span className="badge badge-success">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Seller-wise Breakdown */}
            {/* <div>
              <div className="section-header" style={{ marginBottom: "12px" }}>
                <h3 className="section-title">
                  Seller-wise Breakdown ({filteredVariants.length})
                </h3>
              </div>
              <div className="table-responsive bg-card rounded-lg shadow-sm custom-table-wrapper">
                <table className="data-table custom-data-table">
                  <thead className="bg-tertiary">
                    <tr>
                      <th className="custom-th">Seller</th>
                      <th className="custom-th">Product</th>
                      <th className="custom-th">Variety</th>
                      <th className="custom-th">Quality</th>
                      <th className="custom-th">Total Qty</th>
                      <th className="custom-th">Sold Qty</th>
                      <th className="custom-th">Remaining Qty</th>
                      <th className="custom-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVariants.map((item, index) => {
                      const isSoldOut = item.remainingQty <= 0;
                      return (
                        <tr key={`det-${item.productId}-${item.variantId}-${index}`} className="custom-tr">
                          <td className="custom-td">
                            <strong>{item.sellerName}</strong>
                          </td>
                          <td className="custom-td">
                            {item.productName.charAt(0).toUpperCase() + item.productName.slice(1)}
                          </td>
                          <td className="custom-td">
                            {item.variety.charAt(0).toUpperCase() + item.variety.slice(1)}
                          </td>
                          <td className="custom-td">
                            <span
                              className={`badge badge-sm ${
                                item.quality === "quality1"
                                  ? "badge-success"
                                  : item.quality === "quality2"
                                    ? "badge-warning"
                                    : "badge-error"
                              }`}
                            >
                              {getQualityLabel(item.quality)}
                            </span>
                          </td>
                          <td className="custom-td">
                            {item.totalQty} {item.unit}
                          </td>
                          <td className="custom-td">
                            {item.soldQty} {item.unit}
                          </td>
                          <td className="custom-td">
                            <strong style={{ color: isSoldOut ? "var(--error-color, #ef4444)" : "var(--success-color, #10b981)" }}>
                              {item.remainingQty} {item.unit}
                            </strong>
                          </td>
                          <td className="custom-td">
                            {isSoldOut ? (
                              <span className="badge badge-error">Sold Out</span>
                            ) : (
                              <span className="badge badge-success">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div> */}
          </div>
        )}
      </div>
    </>
  );
}

export default TodayProductList;
