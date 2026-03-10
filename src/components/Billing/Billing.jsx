import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  FileText,
  Download,
  User,
  ShoppingCart,
  History,
  Handshake,
  Calendar,
  ChevronRight,
  Printer,
  Loader,
} from "lucide-react";
import { getSellers } from "../../api/sellerApi";
import { getBuyers } from "../../api/buyerApi";
import { getBillingData } from "../../api/billingApi";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import SearchableSelect from "../Common/SearchableSelect";
import "./Billing.css";

const Billing = () => {
  const { vendorId } = useSelector((state) => state.vendorAuth);
  const currentVendorId = vendorId || sessionStorage.getItem("vendorId");

  const [mainOption, setMainOption] = useState("seller");
  const [subOption, setSubOption] = useState("selling_product");
  const [selectedId, setSelectedId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dateFilter, setDateFilter] = useState("range"); // today, selected, range

  const [sellers, setSellers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (currentVendorId) {
      loadSellers();
      loadBuyers();
    }
  }, [currentVendorId]);

  const loadSellers = async () => {
    try {
      const res = await getSellers(currentVendorId);
      setSellers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBuyers = async () => {
    try {
      const res = await getBuyers(currentVendorId);
      setBuyers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = async () => {
    if ((mainOption === "seller" || mainOption === "buyer") && !selectedId) {
      toast.warn(`Please select a ${mainOption}`);
      return;
    }

    setFetchingData(true);
    try {
      let finalStart = startDate;
      let finalEnd = endDate;

      if (dateFilter === "today") {
        finalStart = new Date().toISOString().split("T")[0];
        finalEnd = finalStart;
      } else if (dateFilter === "selected") {
        finalEnd = startDate;
      }

      const params = {
        type: mainOption,
        subType: subOption,
        id: selectedId,
        startDate: finalStart,
        endDate: finalEnd,
        vendorId: currentVendorId,
      };

      const response = await getBillingData(params);
      if (response.success) {
        generatePDF({ ...response, finalStart, finalEnd });
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch billing data");
    } finally {
      setFetchingData(false);
    }
  };

  const generatePDF = (response) => {
    const { vendor, data, finalStart, finalEnd } = response;
    const doc = jsPDF();

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text("AUCTION BILLING SYSTEM", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generated Invoice / Report", 105, 26, { align: "center" });

    doc.setDrawColor(200);
    doc.line(10, 32, 200, 32);

    // --- Vendor Details ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("VENDOR DETAILS", 10, 42);

    doc.setFontSize(10);
    doc.text(`Name: ${vendor.name}`, 10, 48);
    doc.text(`Contact: ${vendor.phone || "N/A"}`, 10, 53);
    doc.text(
      `Address: ${vendor.address || "N/A"}, ${vendor.city || ""}, ${vendor.state || ""}`,
      10,
      58,
    );

    // --- Target Details ---
    let yPos = 75;
    if (mainOption === "seller" && data.seller) {
      doc.setFontSize(14);
      doc.text("SELLER DETAILS", 10, yPos);
      doc.setFontSize(10);
      doc.text(`Name: ${data.seller.name}`, 10, yPos + 6);
      doc.text(`Contact: ${data.seller.contact}`, 10, yPos + 11);
      doc.text(`Address: ${data.seller.address || "N/A"}`, 10, yPos + 16);
      yPos += 25;
    } else if (mainOption === "buyer" && data.buyer) {
      doc.setFontSize(14);
      doc.text("BUYER DETAILS", 10, yPos);
      doc.setFontSize(10);
      doc.text(`Name: ${data.buyer.name}`, 10, yPos + 6);
      doc.text(`Contact: ${data.buyer.contact}`, 10, yPos + 11);
      doc.text(`Address: ${data.buyer.address || "N/A"}`, 10, yPos + 16);
      yPos += 25;
    } else {
      doc.setFontSize(14);
      doc.text(`${mainOption.toUpperCase()} REPORT`, 10, yPos);
      yPos += 10;
    }

    const formatDate = (dateInput) => {
      if (!dateInput) return "N/A";
      // Handle YYYY-MM-DD string format directly to avoid timezone issues
      if (
        typeof dateInput === "string" &&
        dateInput.includes("-") &&
        dateInput.length === 10
      ) {
        const [y, m, d] = dateInput.split("-");
        return `${d}-${m}-${y}`;
      }
      const date = new Date(dateInput);
      if (isNaN(date)) return "N/A";
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    };

    doc.setFontSize(10);
    doc.text(
      `Report Period: ${formatDate(finalStart)} to ${formatDate(finalEnd)}`,
      10,
      yPos,
    );
    yPos += 10;

    // --- Table Data ---
    const records = data.records || [];

    doc.setDrawColor(220);
    doc.line(10, yPos, 200, yPos);
    yPos += 7;

    const headers = {
      seller_selling: [
        "Date",
        "Product",
        "Variant",
        "Qty",
        "Unit",
        "Rate",
        "Amount",
      ],
      buyer_purchase: [
        "Date",
        "Product",
        "Variant",
        "Qty",
        "Unit",
        "Rate",
        "Amount",
      ],
      history: ["Date", "Product", "Variant", "Seller", "Buyer", "Amount"],
      commission: [
        "Date",
        "Product",
        "Variant",
        "Seller",
        "Sell Amt",
        "Comm %",
        "Comm Amt",
      ],
      ledger: ["Date", "Description", "Credit", "Debit", "Balance"],
    };

    let activeHeader = [];
    if (mainOption === "seller")
      activeHeader =
        subOption === "selling_product"
          ? headers.seller_selling
          : headers.ledger;
    else if (mainOption === "buyer")
      activeHeader =
        subOption === "purchase_history"
          ? headers.buyer_purchase
          : headers.ledger;
    else if (mainOption === "history") activeHeader = headers.history;
    else if (mainOption === "commission") activeHeader = headers.commission;

    // Table Header
    doc.setFont("helvetica", "bold");
    let xOffsets = [10, 30, 60, 85, 115, 140, 170]; // Default for 7 cols
    if (activeHeader.length === 5) xOffsets = [10, 35, 85, 120, 160];
    else if (activeHeader.length === 6) xOffsets = [10, 32, 70, 105, 140, 170];
    else if (activeHeader.length === 8)
      xOffsets = [10, 30, 55, 75, 95, 120, 145, 175];

    activeHeader.forEach((h, i) => {
      doc.text(h, xOffsets[i], yPos);
    });

    yPos += 5;
    doc.line(10, yPos, 200, yPos);
    yPos += 7;

    doc.setFont("helvetica", "normal");

    if (records.length === 0) {
      doc.text("No records found for the selected period.", 105, yPos + 10, {
        align: "center",
      });
    } else {
      records.forEach((rec, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        let row = [];
        const formattedDate = formatDate(rec.date);

        const getVariantInfo = (r) => {
          if (!r.productId?.variants || !r.variantId)
            return { name: "N/A", unit: "" };
          const v = r.productId.variants.find(
            (varnt) =>
              (varnt._id || varnt.id).toString() === r.variantId.toString(),
          );
          return v
            ? {
                name: `${v.variety || ""} ${v.quality || ""}`.trim(),
                unit: v.unit || "",
              }
            : { name: "N/A", unit: "" };
        };

        const vInfo = getVariantInfo(rec);

        if (mainOption === "seller" && subOption === "selling_product") {
          row = [
            formattedDate,
            rec.productId?.name || "N/A",
            vInfo.name,
            rec.quantity?.toString() || "0",
            vInfo.unit,
            `Rs. ${rec.rate || 0}`,
            `Rs. ${rec.finalAmount || 0}`,
          ];
        } else if (
          mainOption === "seller" &&
          subOption === "payments_history"
        ) {
          row = [
            formattedDate,
            rec.description || "N/A",
            `Rs. ${rec.credit || 0}`,
            `Rs. ${rec.debit || 0}`,
            `Rs. ${rec.balance || 0}`,
          ];
        } else if (mainOption === "buyer" && subOption === "purchase_history") {
          row = [
            formattedDate,
            rec.productId?.name || "N/A",
            vInfo.name,
            rec.quantity?.toString() || "0",
            vInfo.unit,
            `Rs. ${rec.rate || 0}`,
            `Rs. ${rec.finalAmount || 0}`,
          ];
        } else if (mainOption === "buyer" && subOption === "payments_history") {
          row = [
            formattedDate,
            rec.description || "N/A",
            `Rs. ${rec.credit || 0}`,
            `Rs. ${rec.debit || 0}`,
            `Rs. ${rec.balance || 0}`,
          ];
        } else if (mainOption === "history") {
          row = [
            formattedDate,
            rec.productId?.name || "N/A",
            vInfo.name,
            rec.sellerId?.name || "N/A",
            rec.buyerId?.name || rec.buyerName || "N/A",
            `Rs. ${rec.finalAmount || 0}`,
          ];
        } else if (mainOption === "commission") {
          row = [
            formattedDate,
            rec.productId?.name || "N/A",
            vInfo.name,
            rec.sellerId?.name || "N/A",
            `Rs. ${rec.finalAmount || 0}`,
            `${rec.commissionPercent || 0}%`,
            `Rs. ${rec.commissionAmount || 0}`,
          ];
        }

        row.forEach((cell, i) => {
          doc.text(truncate(cell, 25), xOffsets[i], yPos);
        });
        yPos += 8;
      });

      // --- Total Amount Row ---
      doc.setDrawColor(200);
      doc.line(10, yPos, 200, yPos);
      yPos += 7;
      doc.setFont("helvetica", "bold");

      const totalLabel = data.totalLabel || "TOTAL";
      const totalValue = data.totalValue || 0;

      doc.text(totalLabel, xOffsets[0], yPos);
      doc.text(`Rs. ${totalValue}`, xOffsets[xOffsets.length - 1], yPos);
    }

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150);
    const dateNow = new Date().toLocaleString();
    doc.text(
      `Generated on ${dateNow} | Auction Billing Management System`,
      105,
      290,
      { align: "center" },
    );

    doc.save(`Invoice_${mainOption}_${new Date().getTime()}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const truncate = (str, n) => {
    if (!str) return "";
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (

    <>
     {/* <div className="billing-container fade-in">
      <div className="billing-header">
        <div className="header-icon">
          <FileText size={32} />
        </div>
        <div className="header-text">
          <h1>Billing & Invoices</h1>
          <p>Generate and export PDF invoices for your records</p>
        </div>
      </div> */}

       <div className="content-header">
        <div className="header-top">
          <h1>Billing & Invoices</h1>
        </div>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span>Billing & Invoices</span>
        </div>
      </div>

      <div className="content-body">
        <div className="billing-card main-config">
          <div className="config-section">
            <h3 className="section-title">Select Category</h3>
            <div className="options-grid">
              <button
                className={`option-btn ${mainOption === "seller" ? "active" : ""}`}
                onClick={() => {
                  setMainOption("seller");
                  setSubOption("selling_product");
                  setSelectedId("");
                }}
              >
                <div className="icon-badge">
                  <User size={20} />
                </div>
                <span>Seller</span>
              </button>
              <button
                className={`option-btn ${mainOption === "buyer" ? "active" : ""}`}
                onClick={() => {
                  setMainOption("buyer");
                  setSubOption("purchase_history");
                  setSelectedId("");
                }}
              >
                <div className="icon-badge">
                  <ShoppingCart size={20} />
                </div>
                <span>Buyer</span>
              </button>
              <button
                className={`option-btn ${mainOption === "history" ? "active" : ""}`}
                onClick={() => {
                  setMainOption("history");
                  setSelectedId("");
                }}
              >
                <div className="icon-badge">
                  <History size={20} />
                </div>
                <span>History</span>
              </button>
              <button
                className={`option-btn ${mainOption === "commission" ? "active" : ""}`}
                onClick={() => {
                  setMainOption("commission");
                  setSelectedId("");
                }}
              >
                <div className="icon-badge">
                  <Handshake size={20} />
                </div>
                <span>Commission</span>
              </button>
            </div>
          </div>

          {(mainOption === "seller" || mainOption === "buyer") && (
            <div className="config-section fade-in">
              <h3 className="section-title">
                Select {mainOption === "seller" ? "Seller" : "Buyer"}
              </h3>
              <SearchableSelect
                name="selectedId"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                placeholder={`Choose ${mainOption === "seller" ? "Seller" : "Buyer"}...`}
                options={(mainOption === "seller" ? sellers : buyers).map(item => ({
                  label: `${item.name} (${item.contact})`,
                  value: item.id || item._id
                }))}
              />
            </div>
          )}

          {mainOption === "seller" && (
            <div className="config-section fade-in">
              <h3 className="section-title">Export Type</h3>
              <div className="radio-group">
                <label
                  className={`radio-label ${subOption === "selling_product" ? "checked" : ""}`}
                >
                  <input
                    type="radio"
                    name="sellerSub"
                    value="selling_product"
                    checked={subOption === "selling_product"}
                    onChange={(e) => setSubOption(e.target.value)}
                  />
                  <span className="text-nowrap">Selling Products</span>
                </label>
                <label
                  className={`radio-label ${subOption === "payments_history" ? "checked" : ""}`}
                >
                  <input
                    type="radio"
                    name="sellerSub"
                    value="payments_history"
                    checked={subOption === "payments_history"}
                    onChange={(e) => setSubOption(e.target.value)}
                  />
                  <span className="text-nowrap">Payments History</span>
                </label>
              </div>
            </div>
          )}

          {mainOption === "buyer" && (
            <div className="config-section fade-in">
              <h3 className="section-title">Export Type</h3>
              <div className="radio-group">
                <label
                  className={`radio-label ${subOption === "purchase_history" ? "checked" : ""}`}
                >
                  <input
                    type="radio"
                    name="buyerSub"
                    value="purchase_history"
                    checked={subOption === "purchase_history"}
                    onChange={(e) => setSubOption(e.target.value)}
                  />
                  <span className="text-nowrap">Buying Products</span>
                </label>
                <label
                  className={`radio-label ${subOption === "payments_history" ? "checked" : ""}`}
                >
                  <input
                    type="radio"
                    name="buyerSub"
                    value="payments_history"
                    checked={subOption === "payments_history"}
                    onChange={(e) => setSubOption(e.target.value)}
                  />
                  <span className="text-nowrap">Payments History</span>
                </label>
              </div>
            </div>
          )}

          <div className="config-section">
            <h3 className="section-title">Select Date Filter</h3>
            <div className="radio-group" style={{ marginBottom: "1.5rem" }}>
              <label
                className={`radio-label ${dateFilter === "today" ? "checked" : ""}`}
              >
                <input
                  type="radio"
                  name="dateFilter"
                  value="today"
                  checked={dateFilter === "today"}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <span className="text-nowrap">Today</span>
              </label>
              <label
                className={`radio-label ${dateFilter === "selected" ? "checked" : ""}`}
              >
                <input
                  type="radio"
                  name="dateFilter"
                  value="selected"
                  checked={dateFilter === "selected"}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <span className="text-nowrap">Selected Date</span>
              </label>
              <label
                className={`radio-label ${dateFilter === "range" ? "checked" : ""}`}
              >
                <input
                  type="radio"
                  name="dateFilter"
                  value="range"
                  checked={dateFilter === "range"}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <span className="text-nowrap">Choose Range</span>
              </label>
            </div>

            {dateFilter !== "today" && (
              <div className="date-inputs fade-in">
                <div className="date-field">
                  <label>{dateFilter === "selected" ? "Date" : "From"}</label>
                  <div className="input-with-icon">
                    <Calendar size={16} />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                {dateFilter === "range" && (
                  <div className="date-field">
                    <label>To</label>
                    <div className="input-with-icon">
                      <Calendar size={16} />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="billing-footer">
            <button
              className="download-btn"
              onClick={handleDownloadPDF}
              disabled={fetchingData}
            >
              {fetchingData ? (
                <>
                  <Loader className="spin" size={20} /> Generating PDF...
                </>
              ) : (
                <>
                  <Download size={20} /> Download PDF Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
   
    </> 
  );
};

export default Billing;
