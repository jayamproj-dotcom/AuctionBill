import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  getBuyers,
  getBuyerSummary,
  addBuyer,
  updateBuyer,
  deleteBuyer,
  addBuyerPayment,
} from "../../api/buyerApi";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import ConfirmationModal from "../Common/ConfirmationModal";
import jsPDF from "jspdf";
import { getBillingData } from "../../api/billingApi";
import "./BuyerDetails.css";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ShoppingCart,
  Search,
  Eye,
  Download,
  Loader,
  CreditCard,
} from "lucide-react";
import SearchableSelect from "../Common/SearchableSelect";
import LoadingSpinner from "../Common/LoadingSpinner";
import VoiceSearch from "../Common/VoiceSearch";
import { toast } from "react-toastify";

function BuyerDetails() {
  const vendorIdFromRedux = useSelector((state) => state.vendorAuth?.vendorId);
  const vendorId = vendorIdFromRedux || sessionStorage.getItem("vendorId");

  const capitalizeFirst = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const getQualityLabel = (quality) => {
    if (quality === "quality1") return "Quality 1";
    if (quality === "quality2") return "Quality 2";
    if (quality === "quality3") return "Quality 3";
    return quality;
  };

  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBuyer, setNewBuyer] = useState({
    name: "",
    contact: "",
    address: "",
    state: "",
    city: "",
    email: "",
  });

  // ── Edit Buyer modal ─────────────────────────────────
  const [showEditBuyerModal, setShowEditBuyerModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [editBuyerCities, setEditBuyerCities] = useState([]);
  const [loadingEditBuyerCities, setLoadingEditBuyerCities] = useState(false);

  // State / City for Add Buyer form
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [activeTab, setActiveTab] = useState("purchases");

  // Payment Modal State
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Transaction View Modal State
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // -- Date Filter --
  const [dateFilter, setDateFilter] = useState("all"); // today, selected, range, all
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fetchingPdf, setFetchingPdf] = useState(false);

  // ── Billing Modal ──
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billType, setBillType] = useState("purchase_history");
  const [billDateFilter, setBillDateFilter] = useState("all");
  const [billStartDate, setBillStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [billEndDate, setBillEndDate] = useState(new Date().toISOString().split("T")[0]);

  const handleViewTransaction = (transaction) => {
    const product = transaction.productId;
    if (product) {
      const variant = (product.variants || []).find(
        (v) =>
          v._id === transaction.variantId || v.id === transaction.variantId,
      );
      setViewingTransaction({
        ...transaction,
        productImage: product.image,
        productName: product.name,
        productDate: product.date,
        variantDetails: variant,
        price: transaction.rate,
        quantity: transaction.quantity,
      });
      setShowTransactionModal(true);
    }
  };

  useEffect(() => {
    if (vendorId) {
      loadBuyers();
      fetchStates();
    }
  }, [vendorId]);

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
    if (!stateName) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const { data } = await axios.post(
        "https://countriesnow.space/api/v0.1/countries/state/cities",
        { country: "India", state: stateName },
      );
      setCities(data.error ? [] : data.data.map((c) => ({ name: c })));
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadBuyers = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const response = await getBuyers(vendorId);
      const buyersData = response.data || [];
      setBuyers(buyersData);
      if (selectedBuyer) {
        handleViewBuyer(selectedBuyer);
      }
    } catch (error) {
      console.error("Error loading buyers:", error);
      toast.error("Failed to load buyers");
    } finally {
      setLoading(false);
    }
  };

  const handleViewBuyer = async (buyer) => {
    const bid = buyer._id || buyer.id;
    try {
      const response = await getBuyerSummary(bid);
      if (response.success) {
        const summaryData = response.data;
        setSelectedBuyer({
          ...summaryData.buyer,
          enrichedProducts: summaryData.products || [],
          transactions: summaryData.transactions || [],
          payments: summaryData.payments || [],
        });
        setLedger(summaryData.ledger || []);
      }
    } catch (error) {
      console.error("Error fetching buyer summary:", error);
      toast.error("Failed to load buyer details");
    }
  };

  const handleBackToBuyers = () => {
    setSelectedBuyer(null);
  };

  const handleToggleStatus = async (id) => {
    const buyer = buyers.find((b) => b._id === id);
    if (!buyer) return;
    try {
      const newStatus = buyer.status === "inactive" ? "active" : "inactive";
      await updateBuyer(id, { status: newStatus });
      toast.success(`Buyer ${newStatus === "active" ? "enabled" : "disabled"}`);
      loadBuyers();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAddBuyer = async (e) => {
    e.preventDefault();
    const errors = validateBuyerForm(newBuyer);
    if (Object.keys(errors).length > 0) {
      setBuyerFormErrors(errors);
      return;
    }
    setBuyerFormErrors({});
    try {
      await addBuyer({ vendorId, ...newBuyer, status: "active" });
      setNewBuyer({
        name: "",
        contact: "",
        address: "",
        state: "",
        city: "",
        email: "",
      });
      setCities([]);
      setShowAddModal(false);
      toast.success("Buyer added successfully");
      loadBuyers();
    } catch (error) {
      toast.error(error.message || "Failed to add buyer");
    }
  };

  const [buyerFormErrors, setBuyerFormErrors] = useState({});
  const validateBuyerForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.contact?.trim()) errors.contact = "Contact number is required";
    if (data.email?.trim() && !/^[^@]+@gmail\.com$/i.test(data.email.trim()))
      errors.email = "Email must end with @gmail.com";
    return errors;
  };

  const openEditBuyerModal = (buyer) => {
    setEditingBuyer({ ...buyer });
    setEditBuyerCities([]);
    if (buyer.state) fetchEditBuyerCities(buyer.state);
    setShowEditBuyerModal(true);
  };

  const fetchEditBuyerCities = async (stateName) => {
    if (!stateName) {
      setEditBuyerCities([]);
      return;
    }
    setLoadingEditBuyerCities(true);
    try {
      const { data } = await axios.post(
        "https://countriesnow.space/api/v0.1/countries/state/cities",
        { country: "India", state: stateName },
      );
      setEditBuyerCities(data.error ? [] : data.data.map((c) => ({ name: c })));
    } catch (err) {
      console.error("Error fetching edit cities:", err);
    } finally {
      setLoadingEditBuyerCities(false);
    }
  };

  const handleEditBuyer = async (e) => {
    e.preventDefault();
    if (!editingBuyer) return;
    const errors = validateBuyerForm(editingBuyer);
    if (Object.keys(errors).length > 0) {
      setBuyerFormErrors(errors);
      return;
    }
    setBuyerFormErrors({});
    try {
      await updateBuyer(editingBuyer._id || editingBuyer.id, {
        name: editingBuyer.name,
        contact: editingBuyer.contact,
        email: editingBuyer.email,
        state: editingBuyer.state,
        city: editingBuyer.city,
        address: editingBuyer.address,
      });
      toast.success("Buyer updated successfully!");
      setShowEditBuyerModal(false);
      setEditingBuyer(null);
      if (
        selectedBuyer &&
        (selectedBuyer._id || selectedBuyer.id) ===
          (editingBuyer._id || editingBuyer.id)
      ) {
        setSelectedBuyer((prev) => ({ ...prev, ...editingBuyer }));
      }
      loadBuyers();
    } catch (err) {
      toast.error(err?.message || "Failed to update buyer");
    }
  };

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setBuyerToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteBuyer = async () => {
    if (buyerToDelete) {
      try {
        await deleteBuyer(buyerToDelete);
        toast.success("Buyer deleted successfully");
        loadBuyers();
        setIsDeleteConfirmOpen(false);
        setBuyerToDelete(null);
      } catch (error) {
        toast.error("Failed to delete buyer");
      }
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    try {
      await addBuyerPayment({
        vendorId,
        buyerId: selectedBuyer._id || selectedBuyer.id,
        productId: null,
        isGlobalPay: true,
        date: paymentDate,
        amount: amount,
        method: paymentMethod,
        note: paymentNote || "Global Payment",
        reference: `PAY-${Date.now()}`,
      });
      loadBuyers();
      // Also need to refresh selected buyer details
      handleViewBuyer(selectedBuyer);
      setShowRecordPaymentModal(false);
      setPaymentAmount("");
      setPaymentNote("");
      toast.success(
        `Payment of ₹${amount.toLocaleString()} recorded successfully.`,
      );
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };
  const openPaymentModal = () => {
    setPaymentConfig({
      targetName: selectedBuyer.name,
      maxAmount: selectedBuyer.balance,
      isGlobalPay: true,
      type: "general",
    });
    setPaymentAmount(selectedBuyer.balance?.toString() || "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Cash");
    setPaymentNote("");
    setShowRecordPaymentModal(true);
  };

  // Product View modal state
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showProductViewModal, setShowProductViewModal] = useState(false);

  const handleViewProduct = (productId) => {
    const product = selectedBuyer.enrichedProducts.find(
      (p) => p.id === productId,
    );
    if (!product) return;

    setViewingProduct({
      ...product,
      stats: {
        amount: product.totalGross || 0,
        paid: product.totalPaid || 0,
        balance: product.totalBalance || 0,
      },
      relatedTransactions: (selectedBuyer.transactions || []).filter((t) => {
        const tid = t.productId?._id?.toString() || t.productId?.toString();
        return tid === productId;
      }),
    });
    setShowProductViewModal(true);
  };

  const openBillingModal = () => {
    setBillType(activeTab === "purchases" ? "purchase_history" : "payments_history");
    setBillDateFilter(dateFilter);
    setBillStartDate(startDate);
    setBillEndDate(endDate);
    setShowBillingModal(true);
  };

  const handleGenerateBillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuyer) return;
    setFetchingPdf(true);
    try {
      let finalStart = billStartDate;
      let finalEnd = billEndDate;

      if (billDateFilter === "today") {
        finalStart = new Date().toISOString().split("T")[0];
        finalEnd = finalStart;
      } else if (billDateFilter === "selected") {
        finalEnd = billStartDate;
      } else if (billDateFilter === "all") {
        finalStart = "";
        finalEnd = "";
      }

      const params = {
        type: "buyer",
        subType: billType,
        id: selectedBuyer._id || selectedBuyer.id,
        startDate: finalStart,
        endDate: finalEnd,
        vendorId: vendorId,
      };

      const response = await getBillingData(params);
      if (response.success) {
        generatePDF({
          ...response,
          finalStart,
          finalEnd,
          subOption: params.subType,
        });
        setShowBillingModal(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch PDF data");
    } finally {
      setFetchingPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedBuyer) return;
    setFetchingPdf(true);
    try {
      let finalStart = startDate;
      let finalEnd = endDate;

      if (dateFilter === "today") {
        finalStart = new Date().toISOString().split("T")[0];
        finalEnd = finalStart;
      } else if (dateFilter === "selected") {
        finalEnd = startDate;
      } else if (dateFilter === "all") {
        finalStart = "";
        finalEnd = "";
      }

      const params = {
        type: "buyer",
        subType:
          activeTab === "purchases" ? "purchase_history" : "payments_history",
        id: selectedBuyer._id || selectedBuyer.id,
        startDate: finalStart,
        endDate: finalEnd,
        vendorId: vendorId,
      };

      const response = await getBillingData(params);
      if (response.success) {
        generatePDF({
          ...response,
          finalStart,
          finalEnd,
          subOption: params.subType,
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch PDF data");
    } finally {
      setFetchingPdf(false);
    }
  };

  const generatePDF = (response) => {
    const { vendor, data, finalStart, finalEnd, subOption } = response;

    const truncate = (val, n) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (!str) return "";
      return str.length > n ? str.substr(0, n - 1) + "..." : str;
    };

    const isReceiptFormat = subOption === "purchase_history";

    let doc;
    if (isReceiptFormat) {
      // Receipt format: narrow width like POS bill
      doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 297], // 80mm width, A4 height for potential long receipts
      });
    } else {
      // Standard A4 report format
      doc = new jsPDF();
    }

    if (isReceiptFormat) {
      // Receipt-style layout
      let yPos = 10;
      const pageWidth = 80;
      const centerX = pageWidth / 2;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AUCTION MARKET", centerX, yPos, { align: "center" });
      yPos += 5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(vendor.name || "Market", centerX, yPos, { align: "center" });
      yPos += 5;
      if (vendor.phone) {
        doc.text(`Tel: ${vendor.phone}`, centerX, yPos, { align: "center" });
        yPos += 5;
      }
      doc.text("--------------------------------", centerX, yPos, {
        align: "center",
      });
      yPos += 6;

      // Date
      const formatDateStr = (dateInput) => {
        if (!dateInput) return "N/A";
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

      doc.setFont("helvetica", "bold");
      if (data.buyer) {
        doc.text(`Buyer: ${data.buyer.name}`, 5, yPos);
        yPos += 5;
      }
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${formatDateStr(finalStart || new Date())}`, 5, yPos);
      yPos += 6;

      doc.text("-------------------------------------------", centerX, yPos, {
        align: "center",
      });
      yPos += 6;

      // Items header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Item", 5, yPos);
      doc.text("Qty", 32, yPos);
      doc.text("Rate", 44, yPos);
      doc.text("Amount", 77, yPos, { align: "right" });

      yPos += 4;
      doc.text("--------------------------------", centerX, yPos, {
        align: "center",
      });
      yPos += 5;

      doc.setFont("helvetica", "normal");

      const records = data.records || [];
      let totalGross = 0;
      let totalPaid = 0;
      let allMethods = new Set();

      records.forEach((rec) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 10;
        }

        const getVariantInfo = (r) => {
          if (!r.productId?.variants || !r.variantId)
            return { name: "N/A", unit: "" };
          const v = r.productId.variants.find(
            (varnt) =>
              (varnt._id || varnt.id).toString() === r.variantId.toString(),
          );
          const qualityLabel = { quality1: "Q1", quality2: "Q2", quality3: "Q3" }[v?.quality] || "";
          return v
            ? {
                name: `${v.variety || ""} ${qualityLabel}`.trim(),
                unit: v.unit || "",
              }
            : { name: "N/A", unit: "" };
        };

        const vInfo = getVariantInfo(rec);
        const itemName = (vInfo.name && vInfo.name !== "N/A") ? vInfo.name : (rec.productId?.name || "N/A");
        const displayItemName = truncate(itemName, 22);

        const qty = rec.quantity || 0;
        const rate = rec.rate || 0;
        const price = rec.finalAmount || 0;
        const paid = rec.paidAmount || 0;
        if (rec.method && rec.method !== "N/A") {
          rec.method.split(", ").forEach((m) => allMethods.add(m));
        }

        totalGross += price;
        totalPaid += paid;

        // Two-line layout per item: name on its own line, numbers below
        doc.text(displayItemName, 5, yPos);
        yPos += 4;
        doc.text(`${qty} ${vInfo.unit || ""} x Rs.${rate}`, 8, yPos);
        doc.text(`Rs.${price}`, 77, yPos, { align: "right" });
        yPos += 6;
      });

      // Total
      yPos += 2;
      doc.text("--------------------------------", centerX, yPos, {
        align: "center",
      });
      yPos += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("TOTAL PURCHASE", 5, yPos);
      doc.text(`Rs.${totalGross}`, 75, yPos, { align: "right" });
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Total Paid", 5, yPos);
      doc.text(`Rs.${totalPaid}`, 75, yPos, { align: "right" });
      yPos += 6;

      const methodsStr = Array.from(allMethods).join(", ") || "Cash";
      const balanceValue = Math.max(0, totalGross - totalPaid);

      doc.text("Balance", 5, yPos);
      doc.text(`Rs.${balanceValue}`, 75, yPos, {
        align: "right",
      });
      yPos += 5;
      doc.text("Method", 5, yPos);
      doc.text(`${methodsStr}`, 75, yPos, { align: "right" });
      yPos += 5;

      if (data.totalAdvance > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Advance", 5, yPos);
        doc.text(`Rs.${data.totalAdvance}`, 75, yPos, { align: "right" });
        yPos += 5;
        doc.setFont("helvetica", "normal");
      }
      yPos += 10;

      // Footer
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("-----------THANK YOU-----------", centerX, yPos, {
        align: "center",
      });
    } else {
      // Standard A4 report layout
      const formatDateStr = (d) => {
        if (!d) return "All Time";
        return formatDate(d);
      };

      // --- Header ---
      doc.setFontSize(22);
      doc.setTextColor(40, 44, 52);
      doc.text("AUCTION BILLING SYSTEM", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Buyer Report", 105, 26, { align: "center" });
      doc.line(10, 32, 200, 32);

      // --- Vendor Details ---
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("VENDOR DETAILS", 10, 42);
      let vYPos = 48;
      doc.setFontSize(10);
      doc.text(`Name: ${vendor.name}`, 10, vYPos);
      vYPos += 5;
      doc.text(`Contact: ${vendor.phone || "N/A"}`, 10, vYPos);
      vYPos += 5;
      const vendorAddressLines = doc.splitTextToSize(`Address: ${vendor.address || "N/A"}`, 180);
      vendorAddressLines.forEach((line) => {
        doc.text(line, 10, vYPos);
        vYPos += 5;
      });

      // --- Buyer Details ---
      let yPos = vYPos + 6;
      doc.setFontSize(14);
      doc.text("BUYER DETAILS", 10, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`Name: ${data.buyer.name}`, 10, yPos);
      yPos += 5;
      doc.text(`Contact: ${data.buyer.contact}`, 10, yPos);
      yPos += 5;
      const buyerAddressLines = doc.splitTextToSize(`Address: ${data.buyer.address || "N/A"}`, 180);
      buyerAddressLines.forEach((line) => {
        doc.text(line, 10, yPos);
        yPos += 5;
      });

      yPos += 4;
      doc.text(
        `Report Period: ${formatDateStr(finalStart)} to ${formatDateStr(finalEnd)}`,
        10,
        yPos,
      );
      yPos += 10;

      const records = data.records || [];
      const headers = ["Date", "Description", "Debit", "Credit", "Balance"];

      doc.setFont("helvetica", "bold");
      let xOffsets = [10, 40, 90, 130, 170];

      headers.forEach((h, i) => doc.text(h, xOffsets[i], yPos));
      yPos += 5;
      doc.line(10, yPos, 200, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      records.forEach((rec) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        let row = [
          formatDate(rec.date),
          rec.description || "N/A",
          `Rs. ${rec.debit || 0}`,
          `Rs. ${rec.credit || 0}`,
          `Rs. ${rec.balance || 0}`,
        ];
        row.forEach((cell, i) => doc.text(String(cell), xOffsets[i], yPos));
        yPos += 8;
      });

      // Totals
      doc.line(10, yPos, 200, yPos);
      yPos += 7;
      doc.setFont("helvetica", "bold");
      doc.text(data.totalLabel || "TOTAL", xOffsets[0], yPos);
      doc.text(
        `Rs. ${data.totalValue || 0}`,
        xOffsets[xOffsets.length - 1],
        yPos,
      );
    }

    doc.save(`Buyer_Report_${data.buyer.name}_${Date.now()}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  const isMatchDate = (date) => {
    if (dateFilter === "all") return true;
    const dStr = date ? new Date(date).toISOString().split("T")[0] : "";
    if (dateFilter === "today") {
      const today = new Date().toISOString().split("T")[0];
      return dStr === today;
    }
    if (dateFilter === "selected") {
      return dStr === startDate;
    }
    if (dateFilter === "range") {
      return dStr >= startDate && dStr <= endDate;
    }
    return true;
  };

  const filteredProducts =
    selectedBuyer?.enrichedProducts?.filter((p) => isMatchDate(p.date)) || [];
  const filteredLedger =
    ledger?.filter((entry) => isMatchDate(entry.date)) || [];

  const totalBills = filteredProducts.reduce(
    (sum, p) => sum + (p.totalGross || 0),
    0,
  );
  const totalPaid = filteredProducts.reduce(
    (sum, p) => sum + (p.totalPaid || 0),
    0,
  );
  const totalBalance = filteredProducts.reduce(
    (sum, p) => sum + (p.totalBalance || 0),
    0,
  );

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteBuyer}
        title="Delete Buyer"
        message="Are you sure you want to delete this buyer?"
        subMessage="This action will remove the buyer and their entire purchase history."
        confirmText="Yes, Delete Buyer"
        cancelText="Cancel"
        variant="danger"
      />
      <div className="content-header">
        <div className="header-top">
          <h1>{selectedBuyer ? "Buyer Details" : "Buyers"}</h1>
          <div className="header-actions">
            {selectedBuyer ? (
              <button
                className="btn btn-secondary"
                onClick={handleBackToBuyers}
              >
                <span>←</span> Back to List
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <span>
                  <Plus />
                </span>
                Add Buyer
              </button>
            )}
          </div>
        </div>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span
            onClick={selectedBuyer ? handleBackToBuyers : undefined}
            style={{
              cursor: selectedBuyer ? "pointer" : "default",
              textDecoration: selectedBuyer ? "underline" : "none",
            }}
          >
            Buyers
          </span>
          {selectedBuyer && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span>{selectedBuyer.name}</span>
            </>
          )}
        </div>
      </div>
      <div className="content-body">
        {!selectedBuyer ? (
          <>
            <div className="section-header">
              <h3 className="section-title">All Buyers ({buyers.length})</h3>
            </div>

            <div style={{ position: "relative", marginBottom: "16px" }}>
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
                placeholder="Search buyer by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{
                  width: "100%",
                  paddingLeft: "38px",
                  paddingRight: "38px",
                  borderRadius: "8px",
                  background: "transparent",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                <VoiceSearch onSearch={(text) => setSearchQuery(text)} minimal={true} />
              </div>
            </div>
            <div className="card-list fade-in">
              {loading ? (
                <LoadingSpinner message="Loading buyers..." />
              ) : buyers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <ShoppingCart />
                  </div>
                  <p>No buyers registered yet</p>
                </div>
              ) : (
                buyers
                  .filter((buyer) =>
                    (buyer.name || "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                  )
                  .map((buyer) => (
                    <div
                      key={buyer._id || buyer.id}
                      className="data-card buyer-clickable-card"
                      onClick={() => handleViewBuyer(buyer)}
                    >
                      <div className="data-card-header">
                        <div>
                          <div className="data-card-title">{buyer.name}</div>
                          <div className="data-card-subtitle">
                            {buyer.contact}
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", gap: "6px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="icon-btn view"
                            onClick={() => handleViewBuyer(buyer)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="icon-btn edit"
                            onClick={() => openEditBuyerModal(buyer)}
                            title="Edit Buyer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() =>
                              handleDeleteClick(buyer._id || buyer.id)
                            }
                            title="Delete Buyer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </>
        ) : (
          /* Detailed View */
          <div className="fade-in">
            <div
              className="card profile-container"
              style={{ marginBottom: "2rem" }}
            >
              <div className="profile-layout-vertical">
                <div className="profile-header">
                  <div className="profile-name-section">
                    <span className="profile-detail-label">Buyer Name</span>
                    <h2 className="profile-name">{selectedBuyer.name}</h2>
                  </div>
                  <button
                    className="icon-btn edit"
                    onClick={() => openEditBuyerModal(selectedBuyer)}
                    title="Edit Buyer"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="profile-info-grid">
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Contact</span>
                    <span className="profile-detail-value">{selectedBuyer.contact}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Mail Id</span>
                    <span className="profile-detail-value">{selectedBuyer.email || "N/A"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">State</span>
                    <span className="profile-detail-value">{selectedBuyer.state || "N/A"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">City</span>
                    <span className="profile-detail-value">{selectedBuyer.city || "N/A"}</span>
                  </div>
                  <div className="profile-detail-item span-2">
                    <span className="profile-detail-label">Address</span>
                    <span className="profile-detail-value">{selectedBuyer.address || "N/A"}</span>
                  </div>
                  {/* <div className="profile-detail-item">
                    <span className="profile-detail-label">Total Outstanding</span>
                    <span
                      className={`profile-detail-value ${selectedBuyer.balance > 0 ? "text-error" : "text-success"}`}
                      style={{ fontWeight: "bold" }}
                    >
                      {selectedBuyer.balance <= 0
                        ? "Rs. 0"
                        : `₹${(selectedBuyer.balance || 0).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Advance / Excess</span>
                    <span
                      className="profile-detail-value text-success"
                      style={{ fontWeight: "bold" }}
                    >
                      ₹{(selectedBuyer.advanceAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label" style={{ marginBottom: "0.25rem" }}>Login Access</span>
                    <span className="profile-detail-value">
                      <span
                        onClick={() =>
                          handleToggleStatus(
                            selectedBuyer._id || selectedBuyer.id,
                          )
                        }
                        className={`cursor-pointer badge btn ${selectedBuyer.status === "inactive" ? "btn-success" : "btn-error"} buyer-status-toggle-btn`}
                        style={{ display: "inline-flex", padding: "0.4rem 1rem", fontSize: "0.8rem", width: "auto", minWidth: "120px", justifyContent: "center" }}
                      >
                        {selectedBuyer.status === "inactive"
                          ? "Enable Login"
                          : "Disable Login"}
                      </span>
                    </span>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="detail-actions-row-1">
              <div
                className="filter-controls"
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <select
                  className="form-control"
                  style={{ width: "150px", fontWeight: "500" }}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Date</option>
                  <option value="today">Today</option>
                  <option value="selected">Selected Date</option>
                  <option value="range">Date Range</option>
                </select>

                {dateFilter !== "all" && dateFilter !== "today" && (
                  <div
                    className="fade-in"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <input
                      type="date"
                      className="form-control"
                      style={{ width: "135px" }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    {dateFilter === "range" && (
                      <input
                        type="date"
                        className="form-control"
                        style={{ width: "135px" }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="detail-actions-row-2">
              <button
                className="btn btn-primary"
                onClick={openPaymentModal}
              >
                <Plus size={16} style={{ marginRight: "5px" }} /> Pay In
              </button>

              <button
                className="btn btn-secondary"
                onClick={openBillingModal}
              >
                <Download size={16} style={{ marginRight: "5px" }} /> Bill
              </button>
            </div>

            <div className="buyer-history-tabs">
              <button
                className={`buyer-tab-button ${activeTab === "purchases" ? "active" : ""}`}
                onClick={() => setActiveTab("purchases")}
              >
                Buying Products
              </button>
              <button
                className={`buyer-tab-button ${activeTab === "payments" ? "active" : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                Payment History
              </button>
            </div>

            {activeTab === "purchases" ? (
              <div className="table-wrapper buyer-history-table-wrapper">
                <table className="buyer-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Quality</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-td">
                          No purchases found for this date
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.date)}</td>
                          <td className="bold-product">
                            {capitalizeFirst(p.name)}
                          </td>
                          <td>
                            {p.variants && p.variants.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {p.variants
                                  .filter((v) => v.purchaseQuantity > 0 || (v.quantity > 0 && !v.hasOwnProperty('purchaseQuantity')))
                                  .map((v) => (
                                    <div
                                      key={v._id || v.id || Math.random()}
                                      style={{ fontSize: "0.85rem" }}
                                    >
                                      {capitalizeFirst(v.variety)} - {getQualityLabel(v.quality)} - {v.purchaseQuantity || v.quantity || 0} {v.unit}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "5px" }}>
                              <button
                                className="icon-btn view"
                                onClick={() => handleViewProduct(p.id)}
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrapper buyer-history-table-wrapper">
                <table className="buyer-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Debit (Buy)</th>
                      <th>Credit (Pay)</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-td">
                          No transactions found for this date
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td>
                            {formatDateTime(entry.createdAt || entry.date)}
                          </td>
                          <td>{entry.description}</td>
                          <td className="text-amber">
                            {entry.debit > 0
                              ? `₹${entry.debit.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="text-success">
                            {entry.credit > 0
                              ? `₹${entry.credit.toLocaleString()}`
                              : "-"}
                          </td>
                          <td style={{ fontWeight: "bold", color: "black" }}>
                            {entry.balance < 0
                              ? `Adv: ₹${Math.abs(entry.balance).toLocaleString()}`
                              : `₹${entry.balance.toLocaleString()}`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredLedger.length > 0 && (
                    <tfoot
                      style={{ background: "#f8f9fa", fontWeight: "bold" }}
                    >
                      <tr>
                        <td colSpan="4">CLOSING BALANCE</td>
                        <td>
                          {filteredLedger[filteredLedger.length - 1].balance < 0
                            ? `Adv: ₹${Math.abs(filteredLedger[filteredLedger.length - 1].balance).toLocaleString()}`
                            : `₹${filteredLedger[filteredLedger.length - 1].balance.toLocaleString()}`}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showRecordPaymentModal && selectedBuyer && (
        <div
          className="modal-overlay"
          onClick={() => setShowRecordPaymentModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Pay In</h3>
              <button
                className="modal-close"
                onClick={() => setShowRecordPaymentModal(false)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div className="data-row payment-modal-row">
                    <span className="data-label">Buyer Name</span>
                    <span className="data-value">{selectedBuyer.name}</span>
                  </div>
                  <div className="data-row payment-modal-row">
                    <span className="data-label">Outstanding Balance</span>
                    <span className="data-value text-error">
                      ₹{selectedBuyer.balance?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-control"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Gpay">Gpay</option>
                      <option value="UPI">UPI</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="1"
                      placeholder="Enter amount"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="e.g. Received via..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRecordPaymentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction View Modal */}
      {showTransactionModal && viewingTransaction && (
        <div
          className="modal-overlay"
          style={{ zIndex: 999 }}
          onClick={() => setShowTransactionModal(false)}
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Purchase Details</h3>
              <button
                className="modal-close"
                onClick={() => setShowTransactionModal(false)}
              >
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div
                className="product-view-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div style={{ display: "flex", gap: "20px" }}>
                  <div className="product-info-details" style={{ flex: 1 }}>
                    <div
                      className="stats-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "20px",
                        background: "#f8f9fa",
                        padding: "15px",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        Product Name: <b>{viewingTransaction.productName}</b>
                      </div>
                      <div>
                        Date: <b>{formatDate(viewingTransaction.date)}</b>
                      </div>
                      <div>
                        Bill Amount:{" "}
                        <b>
                          ₹{viewingTransaction.finalAmount?.toLocaleString()}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
                <h4 style={{ margin: "0 0 10px 0" }}>Item Details</h4>
                <div className="table-wrapper">
                  <table className="buyer-history-table">
                    <thead>
                      <tr>
                        <th>Variety</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingTransaction.variantDetails ? (
                        <tr>
                          <td>{viewingTransaction.variantDetails.variety}</td>
                          <td>
                            {viewingTransaction.quantity}{" "}
                            {viewingTransaction.variantDetails.unit}
                          </td>
                          <td>
                            ₹{viewingTransaction.price}/
                            {viewingTransaction.variantDetails.unit}
                          </td>
                          <td>
                            ₹{viewingTransaction.finalAmount?.toLocaleString()}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="4">
                            {viewingTransaction.details ? (
                              <span>{viewingTransaction.details}</span>
                            ) : (
                              <span>
                                Variant details not found (Legacy Record)
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowTransactionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Buyer Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            setBuyerFormErrors({});
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Buyer</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setBuyerFormErrors({});
                }}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleAddBuyer}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      value={newBuyer.name}
                      onChange={(e) => {
                        setNewBuyer({ ...newBuyer, name: e.target.value });
                        setBuyerFormErrors((p) => ({ ...p, name: "" }));
                      }}
                      placeholder="Full Name"
                      className={buyerFormErrors.name ? "input-error" : ""}
                    />
                    {buyerFormErrors.name && (
                      <small className="field-error">
                        {buyerFormErrors.name}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      value={newBuyer.contact}
                      onChange={(e) => {
                        setNewBuyer({ ...newBuyer, contact: e.target.value });
                        setBuyerFormErrors((p) => ({ ...p, contact: "" }));
                      }}
                      placeholder="Mobile Number"
                      maxLength={15}
                      className={buyerFormErrors.contact ? "input-error" : ""}
                    />
                    {buyerFormErrors.contact && (
                      <small className="field-error">
                        {buyerFormErrors.contact}
                      </small>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Mail Id (Email){" "}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newBuyer.email}
                    onChange={(e) => {
                      setNewBuyer({ ...newBuyer, email: e.target.value });
                      setBuyerFormErrors((p) => ({ ...p, email: "" }));
                    }}
                    placeholder="example@gmail.com"
                    className={buyerFormErrors.email ? "input-error" : ""}
                  />
                  {buyerFormErrors.email && (
                    <small className="field-error">
                      {buyerFormErrors.email}
                    </small>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <SearchableSelect
                      name="state"
                      value={newBuyer.state}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewBuyer((prev) => ({
                          ...prev,
                          state: val,
                          city: "",
                        }));
                        fetchCities(val);
                      }}
                      placeholder={
                        loadingStates ? "Loading..." : "Select State"
                      }
                      options={states.map((s) => ({
                        label: s.name,
                        value: s.name,
                      }))}
                      disabled={loadingStates}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <SearchableSelect
                      name="city"
                      value={newBuyer.city}
                      onChange={(e) =>
                        setNewBuyer((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder={
                        loadingCities
                          ? "Loading cities..."
                          : !newBuyer.state
                            ? "Select state first"
                            : "Select City"
                      }
                      options={cities.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                      disabled={!newBuyer.state || loadingCities}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    value={newBuyer.address}
                    onChange={(e) =>
                      setNewBuyer({ ...newBuyer, address: e.target.value })
                    }
                    rows="2"
                    placeholder="Street / Shop / Office details"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Buyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Buyer Modal ── */}
      {showEditBuyerModal && editingBuyer && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowEditBuyerModal(false);
            setBuyerFormErrors({});
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Buyer</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditBuyerModal(false);
                  setBuyerFormErrors({});
                }}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleEditBuyer}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      value={editingBuyer.name}
                      onChange={(e) => {
                        setEditingBuyer({
                          ...editingBuyer,
                          name: e.target.value,
                        });
                        setBuyerFormErrors((p) => ({ ...p, name: "" }));
                      }}
                      placeholder="Full Name"
                      className={buyerFormErrors.name ? "input-error" : ""}
                    />
                    {buyerFormErrors.name && (
                      <small className="field-error">
                        {buyerFormErrors.name}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      value={editingBuyer.contact}
                      onChange={(e) => {
                        setEditingBuyer({
                          ...editingBuyer,
                          contact: e.target.value,
                        });
                        setBuyerFormErrors((p) => ({ ...p, contact: "" }));
                      }}
                      placeholder="10-digit Mobile Number"
                      maxLength={10}
                      className={buyerFormErrors.contact ? "input-error" : ""}
                    />
                    {buyerFormErrors.contact && (
                      <small className="field-error">
                        {buyerFormErrors.contact}
                      </small>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email{" "}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editingBuyer.email || ""}
                    onChange={(e) => {
                      setEditingBuyer({
                        ...editingBuyer,
                        email: e.target.value,
                      });
                      setBuyerFormErrors((p) => ({ ...p, email: "" }));
                    }}
                    placeholder="example@gmail.com"
                    className={buyerFormErrors.email ? "input-error" : ""}
                  />
                  {buyerFormErrors.email && (
                    <small className="field-error">
                      {buyerFormErrors.email}
                    </small>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <SearchableSelect
                      name="state"
                      value={editingBuyer.state || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingBuyer((prev) => ({
                          ...prev,
                          state: val,
                          city: "",
                        }));
                        fetchEditBuyerCities(val);
                      }}
                      placeholder={
                        loadingStates ? "Loading..." : "Select State"
                      }
                      options={states.map((s) => ({
                        label: s.name,
                        value: s.name,
                      }))}
                      disabled={loadingStates}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <SearchableSelect
                      name="city"
                      value={editingBuyer.city || ""}
                      onChange={(e) =>
                        setEditingBuyer((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder={
                        loadingEditBuyerCities
                          ? "Loading cities..."
                          : !editingBuyer.state
                            ? "Select state first"
                            : "Select City"
                      }
                      options={editBuyerCities.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                      disabled={!editingBuyer.state || loadingEditBuyerCities}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    value={editingBuyer.address || ""}
                    onChange={(e) =>
                      setEditingBuyer({
                        ...editingBuyer,
                        address: e.target.value,
                      })
                    }
                    rows="2"
                    placeholder="Street / Shop / Office details"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditBuyerModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Product View Modal ── */}
      {showProductViewModal && viewingProduct && (
        <div
          className="modal-overlay"
          style={{ zIndex: 999 }}
          onClick={() => setShowProductViewModal(false)}
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Product Details</h3>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <button
                  className="modal-close"
                  onClick={() => setShowProductViewModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div
                className="product-view-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div style={{ display: "flex", gap: "20px" }}>
                  <div className="product-info-details" style={{ flex: 1 }}>
                    <div
                      className="stats-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "20px",
                        background: "#f8f9fa",
                        padding: "15px",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        Product Name: <b>{viewingProduct.name}</b>
                      </div>
                      <div>
                        Total Bill:{" "}
                        <b>
                          ₹
                          {(viewingProduct.stats?.amount || 0).toLocaleString()}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
                <h4 style={{ margin: "0 0 10px 0" }}>Variety Details</h4>
                <div className="table-wrapper">
                  <table className="buyer-history-table">
                    <thead>
                      <tr>
                        <th>Variety</th>
                        <th>Qty Purchased</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingProduct.variants
                        .filter((v) => v.purchaseQuantity > 0)
                        .map((v, idx) => (
                          <tr key={idx}>
                            <td>{v.variety}</td>
                            <td>
                              {v.purchaseQuantity || 0} {v.unit}
                            </td>
                            <td>₹{(v.stats?.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      {viewingProduct.variants.filter(
                        (v) => v.purchaseQuantity > 0,
                      ).length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center">
                            No purchased variants found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowProductViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Billing Modal ── */}
      {showBillingModal && selectedBuyer && (
        <div
          className="modal-overlay"
          onClick={() => setShowBillingModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Bill - {selectedBuyer.name}</h3>
              <button
                className="modal-close"
                onClick={() => setShowBillingModal(false)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleGenerateBillSubmit}>
              <div className="modal-body">
                <div className="fade-in" style={{ padding: '0 5px' }}>
                  <div className="form-group">
                    <label className="form-label">Bill Type</label>
                    <select
                      className="form-control"
                      value={billType}
                      onChange={(e) => setBillType(e.target.value)}
                    >
                      <option value="purchase_history">Purchase Products Bill</option>
                      <option value="payments_history">Ledger / Payments Statement</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label className="form-label">Date Filter</label>
                    <select
                      className="form-control"
                      value={billDateFilter}
                      onChange={(e) => setBillDateFilter(e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="selected">Selected Date</option>
                      <option value="range">Date Range</option>
                    </select>
                  </div>

                  {billDateFilter !== "all" && billDateFilter !== "today" && (
                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }} className="commission-date-row">
                      <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={billStartDate}
                          onChange={(e) => setBillStartDate(e.target.value)}
                        />
                      </div>
                      {billDateFilter === "range" && (
                        <div className="form-group">
                          <label className="form-label">End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={billEndDate}
                            onChange={(e) => setBillEndDate(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBillingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={fetchingPdf}
                >
                  {fetchingPdf ? (
                    <>
                      <Loader size={14} className="spin" style={{ marginRight: '5px' }} /> Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} style={{ marginRight: '5px' }} /> Download PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default BuyerDetails;
