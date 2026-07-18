import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import ConfirmationModal from "../Common/ConfirmationModal";
import "./SellerDetails.css";
import {
  Plus,
  Trash2,
  X,
  Eye,
  Search,
  Loader,
  Pencil,
  Download,
  Edit2,
  Check,
  CreditCard,
} from "lucide-react";
import SearchableSelect from "../Common/SearchableSelect";
import LoadingSpinner from "../Common/LoadingSpinner";
import VoiceSearch from "../Common/VoiceSearch";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { getBillingData } from "../../api/billingApi";
import {
  getSellers,
  createSeller,
  updateSeller,
  deleteSeller,
  toggleSellerStatus,
  recordSellerPayment,
  getSellerPayments,
  getSellerSummary,
} from "../../api/sellerApi";
import { getCommission } from "../../api/commissionApi";
import { getProducts } from "../../api/vendorApi";
import { addAuctionProduct } from "../../api/auctionApi";
import { getSellerCommission } from "../../utils/commissionUtils";

function SellerDetails() {
  // ── Auth ─────────────────────────────────────────────
  const { vendorId } = useSelector((state) => state.vendorAuth);
  const currentVendorId = vendorId || sessionStorage.getItem("vendorId");
  const navigate = useNavigate();

  // ── Sellers list ──────────────────────────────────────
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allSellerPayments, setAllSellerPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  // ── Add Seller modal ──────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [newSeller, setNewSeller] = useState({
    name: "",
    contact: "",
    address: "",
    state: "",
    city: "",
    email: "",
  });

  // ── Validation helper ────────────────────────────────
  const validateSellerForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.contact?.trim()) errors.contact = "Contact number is required";
    if (data.email?.trim() && !/^[^@]+@gmail\.com$/i.test(data.email.trim()))
      errors.email = "Email must end with @gmail.com";
    return errors;
  };

  // ── Add Product modal ─────────────────────────────────
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isProductSaving, setIsProductSaving] = useState(false);
  const [masterProducts, setMasterProducts] = useState([]);
  const [globalVendorCommission, setGlobalVendorCommission] = useState("");
  const [defaultCommission, setDefaultCommission] = useState("");
  const [editingGlobalComm, setEditingGlobalComm] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    variants: [],
    masterProduct: null,
  });

  const [variantData, setVariantData] = useState({
    variety: "",
    quality: "quality1",
    quantity: "",
    sellQuantity: 0,
    unit: "kg",
    commission: "",
    commissionAmountForSellQuantity: 0,
    priceAmountForSellQuantity: 0,
    balance: 0,
  });

  // ── Edit Seller modal ─────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [editCities, setEditCities] = useState([]);
  const [loadingEditCities, setLoadingEditCities] = useState(false);

  // ── State / City (countriesnow) ───────────────────────
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // ── Delete confirm ───────────────────────────────────
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Payment modal ─────────────────────────────────────
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);

  // ── Product view modal ────────────────────────────────
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showProductViewModal, setShowProductViewModal] = useState(false);

  // -- Date Filter --
  const [dateFilter, setDateFilter] = useState("all"); // today, selected, range, all
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fetchingPdf, setFetchingPdf] = useState(false);

  // ── Custom Commission Modal ────────────────────────────
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionData, setCommissionData] = useState({
    customCommission: false,
    commissionPercent: "",
    commissionStartDate: "",
    commissionEndDate: "",
    forever: true,
  });
  const [isCommissionSaving, setIsCommissionSaving] = useState(false);

  // ── Billing Modal ──────────────────────────────────────
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billType, setBillType] = useState("selling_product");
  const [billDateFilter, setBillDateFilter] = useState("all");
  const [billStartDate, setBillStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [billEndDate, setBillEndDate] = useState(new Date().toISOString().split("T")[0]);

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

  useEffect(() => {
    if (currentVendorId) {
      loadSellers();
      fetchMasterProductsAndCommission();
    }
    fetchStates();
  }, [currentVendorId]);

  const fetchMasterProductsAndCommission = async () => {
    try {
      const masterData = await getProducts({ vendorId: currentVendorId });
      setMasterProducts(masterData || []);

      const commData = await getCommission(currentVendorId);
      if (commData && commData.success) {
        setGlobalVendorCommission(commData.data);
      }
    } catch (err) {
      console.error("Error loading products/commission:", err);
    }
  };

  // ─────────────────────────────────────────────────────
  //  State / City API
  // ─────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────
  //  Load Sellers from DB
  // ─────────────────────────────────────────────────────
  const loadSellers = async () => {
    setLoading(true);
    try {
      const res = await getSellers(currentVendorId);
      setSellers(res.data || []);
    } catch (err) {
      console.error("Error loading sellers:", err);
      toast.error(err?.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  Open seller detail view – fetch summary from API
  // ─────────────────────────────────────────────────────
  const openDetailsModal = async (seller) => {
    setActiveTab("products");
    const sid = seller._id?.toString() || seller.id;
    try {
      const res = await getSellerSummary(sid);
      if (res.success) {
        const {
          seller: profile,
          products,
          ledger,
          transactions,
          payments,
        } = res.data;
        setSelectedSeller({
          ...profile,
          products,
          transactions,
          payments,
        });
        setLedger(ledger);
      }
    } catch (err) {
      console.error("Failed to load seller summary:", err);
      toast.error("Failed to load seller details");
      setSelectedSeller({
        ...seller,
        id: sid,
        products: [],
        payments: [],
        balance: seller.balance,
      });
      setLedger([]);
    }
  };

  const handleBackToSellers = () => setSelectedSeller(null);

  // ─────────────────────────────────────────────────────
  //  Add Seller
  // ─────────────────────────────────────────────────────
  const handleAddSeller = async (e) => {
    e.preventDefault();
    if (!currentVendorId) {
      toast.error("Vendor not authenticated");
      return;
    }
    const errors = validateSellerForm(newSeller);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSaving(true);
    try {
      const payload = { ...newSeller, vendorId: currentVendorId };
      await createSeller(payload);
      toast.success("Seller added successfully!");
      setNewSeller({
        name: "",
        contact: "",
        address: "",
        state: "",
        city: "",
        email: "",
      });
      setCities([]);
      setShowAddModal(false);
      loadSellers();
    } catch (err) {
      toast.error(err?.message || "Failed to add seller");
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  Edit Seller
  // ─────────────────────────────────────────────────────
  const openEditModal = (seller) => {
    setEditingSeller({ ...seller });
    setEditCities([]);
    if (seller.state) fetchEditCities(seller.state);
    setShowEditModal(true);
  };

  const fetchEditCities = async (stateName) => {
    if (!stateName) {
      setEditCities([]);
      return;
    }
    setLoadingEditCities(true);
    try {
      const { data } = await axios.post(
        "https://countriesnow.space/api/v0.1/countries/state/cities",
        { country: "India", state: stateName },
      );
      setEditCities(data.error ? [] : data.data.map((c) => ({ name: c })));
    } catch (err) {
      console.error("Error fetching edit cities:", err);
    } finally {
      setLoadingEditCities(false);
    }
  };

  const handleEditSeller = async (e) => {
    e.preventDefault();
    if (!editingSeller) return;
    const errors = validateSellerForm(editingSeller);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSaving(true);
    try {
      await updateSeller(editingSeller._id || editingSeller.id, {
        name: editingSeller.name,
        contact: editingSeller.contact,
        email: editingSeller.email,
        state: editingSeller.state,
        city: editingSeller.city,
        address: editingSeller.address,
      });
      toast.success("Seller updated successfully!");
      setShowEditModal(false);
      setEditingSeller(null);
      if (
        selectedSeller &&
        (selectedSeller._id || selectedSeller.id) ===
        (editingSeller._id || editingSeller.id)
      ) {
        setSelectedSeller((prev) => ({ ...prev, ...editingSeller }));
      }
      loadSellers();
    } catch (err) {
      toast.error(err?.message || "Failed to update seller");
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  Delete Seller
  // ─────────────────────────────────────────────────────
  const handleDeleteClick = (seller) => {
    setSellerToDelete(seller);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteSeller = async () => {
    if (!sellerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSeller(sellerToDelete._id || sellerToDelete.id);
      toast.success("Seller deleted successfully");
      setIsDeleteConfirmOpen(false);
      setSellerToDelete(null);
      loadSellers();
    } catch (err) {
      toast.error(err?.message || "Failed to delete seller");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  Toggle Status
  // ─────────────────────────────────────────────────────
  const handleToggleStatus = async (id) => {
    const seller = sellers.find((s) => s.id === id) || selectedSeller;
    if (!seller) return;
    const newStatus = seller.status === "inactive" ? "active" : "inactive";
    try {
      await toggleSellerStatus(id, newStatus);
      toast.success(`Login ${newStatus === "active" ? "enabled" : "disabled"}`);
      if (selectedSeller?.id === id) {
        setSelectedSeller((prev) => ({ ...prev, status: newStatus }));
      }
      loadSellers();
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const openAddProductModal = () => {
    if (!selectedSeller) return;
    const sellDate = new Date().toISOString().split("T")[0];
    const comm = getSellerCommission(selectedSeller, globalVendorCommission, sellDate);

    setNewProduct({
      name: "",
      date: sellDate,
      variants: [],
      masterProduct: null,
    });
    setDefaultCommission(comm);
    setVariantData({
      variety: "",
      quality: "quality1",
      quantity: "",
      sellQuantity: 0,
      unit: "kg",
      commission: comm,
      commissionAmountForSellQuantity: 0,
      priceAmountForSellQuantity: 0,
      balance: 0,
    });
    setShowAddProduct(true);
  };

  const resetVariantData = (comm = defaultCommission) => {
    setVariantData({
      variety: "",
      quality: "quality1",
      quantity: "",
      sellQuantity: 0,
      unit: "kg",
      commission: comm,
      commissionAmountForSellQuantity: 0,
      priceAmountForSellQuantity: 0,
      balance: 0,
    });
  };

  const resetProductForm = () => {
    const sellDate = new Date().toISOString().split("T")[0];
    const comm = getSellerCommission(selectedSeller, globalVendorCommission, sellDate);
    setNewProduct({
      name: "",
      date: sellDate,
      variants: [],
      masterProduct: null,
    });
    resetVariantData(comm);
  };

  const handleAddVariant = () => {
    if (!variantData.variety || !variantData.quantity) {
      toast.error("Please add at least Variety and Quantity");
      return;
    }

    const newVariant = {
      id: Date.now(),
      ...variantData,
      quantity: parseFloat(variantData.quantity),
    };

    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, newVariant],
    });

    toast.success("Variant added successfully");

    resetVariantData();
  };

  const handleDeleteVariant = (id) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((v) => v.id !== id),
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!newProduct.name) {
      toast.error("Product name is required");
      return;
    }

    if (!newProduct.variants || newProduct.variants.length === 0) {
      toast.error("Add at least one variant before saving product");
      return;
    }

    setIsProductSaving(true);
    try {
      const productData = {
        vendorId: currentVendorId,
        sellerId: selectedSeller._id || selectedSeller.id,
        name: newProduct.name,
        date: newProduct.date || new Date().toISOString().split("T")[0],
        commissionPercent: parseFloat(defaultCommission) || 0,
        variants: newProduct.variants.map(({ id, ...rest }) => rest),
      };

      const response = await addAuctionProduct(productData);

      if (response.success) {
        toast.success("Product added successfully");
        resetProductForm();
        setShowAddProduct(false);
        await openDetailsModal(selectedSeller);
      }
    } catch (error) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setIsProductSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  Payment modal helpers
  // ─────────────────────────────────────────────────────
  const openGlobalPaymentModal = () => {
    setPaymentConfig({
      type: "global",
      targetName: "Global Account",
      isGlobalPay: true,
    });
    setPaymentAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Cash");
    setPaymentNote("");
    setShowRecordPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsPaymentSaving(true);
    try {
      const payload = {
        vendorId: currentVendorId,
        sellerId: selectedSeller._id || selectedSeller.id,
        productId: null,
        isGlobalPay: true,
        date: paymentDate,
        amount,
        method: paymentMethod,
        type: "Payment",
        note: paymentNote || "Global Payment",
        reference: `PAY-${Date.now()}`,
      };

      await recordSellerPayment(payload);
      toast.success(
        `Payment of ₹${amount.toLocaleString()} recorded successfully.`,
      );
      setShowRecordPaymentModal(false);
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentConfig(null);
      // Refresh seller list then re-open detail view
      await loadSellers();
      // Re-fetch payments and rebuild ledger for the currently selected seller
      await openDetailsModal(selectedSeller);
    } catch (err) {
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedSeller) return;
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
        type: "seller",
        subType:
          activeTab === "products" ? "selling_product" : "payments_history",
        id: selectedSeller._id || selectedSeller.id,
        startDate: finalStart,
        endDate: finalEnd,
        vendorId: currentVendorId,
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

  const openBillingModal = () => {
    if (!selectedSeller) return;
    setBillType(activeTab === "products" ? "selling_product" : "payments_history");
    setBillDateFilter(dateFilter);
    setBillStartDate(startDate);
    setBillEndDate(endDate);
    setShowBillingModal(true);
  };

  const handleGenerateBillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return;
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
        type: "seller",
        subType: billType,
        id: selectedSeller._id || selectedSeller.id,
        startDate: finalStart,
        endDate: finalEnd,
        vendorId: currentVendorId,
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

  // ─────────────────────────────────────────────────────
  //  Custom Commission
  // ─────────────────────────────────────────────────────
  const openCommissionModal = () => {
    if (!selectedSeller) return;
    setCommissionData({
      commissionPercent: selectedSeller.customCommission ? (selectedSeller.commissionPercent || "") : "",
      commissionStartDate: selectedSeller.commissionStartDate ? new Date(selectedSeller.commissionStartDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      commissionEndDate: selectedSeller.commissionEndDate ? new Date(selectedSeller.commissionEndDate).toISOString().split("T")[0] : "",
      forever: !selectedSeller.commissionEndDate,
    });
    setShowCommissionModal(true);
  };

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return;

    const isCustom = commissionData.commissionPercent !== "" && commissionData.commissionPercent !== null && commissionData.commissionPercent !== undefined;

    if (isCustom && !commissionData.commissionStartDate) {
      toast.error("Please provide a start date.");
      return;
    }

    if (isCustom && !commissionData.forever && !commissionData.commissionEndDate) {
      toast.error("Please provide an end date, or check 'Forever'.");
      return;
    }

    setIsCommissionSaving(true);
    try {
      const payload = {
        customCommission: isCustom,
        commissionPercent: isCustom ? Number(commissionData.commissionPercent) : 0,
        commissionStartDate: isCustom && commissionData.commissionStartDate ? new Date(commissionData.commissionStartDate).toISOString() : null,
        commissionEndDate: isCustom && !commissionData.forever && commissionData.commissionEndDate ? new Date(commissionData.commissionEndDate).toISOString() : null,
      };

      await updateSeller(selectedSeller._id || selectedSeller.id, payload);
      toast.success(isCustom ? "Commission configured successfully" : "Custom commission removed, tracking global commission");
      setShowCommissionModal(false);

      // Update local state
      setSelectedSeller((prev) => ({
        ...prev,
        ...payload
      }));
      setSellers((prev) => prev.map(s =>
        (s._id || s.id) === (selectedSeller._id || selectedSeller.id) ? { ...s, ...payload } : s
      ));
    } catch (err) {
      toast.error(err?.message || "Failed to update commission configuration");
    } finally {
      setIsCommissionSaving(false);
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

    const isReceiptFormat = subOption === "selling_product";

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
      if (data.seller) {
        doc.text(`Seller: ${data.seller.name}`, 5, yPos);
        yPos += 5;
      }
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${formatDateStr(finalStart || new Date())}`, 5, yPos);
      yPos += 6;

      doc.text("-------------------------------------------", centerX, yPos, {
        align: "center",
      });
      yPos += 6;

      // Items header — plain words, more space
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Item", 5, yPos);
      doc.text("Qty", 32, yPos);
      doc.text("Rate", 44, yPos);
      doc.text("Amount", 77, yPos, { align: "right" });

      yPos += 4;
      doc.text("--------------------------------", centerX, yPos, { align: "center" });
      yPos += 5;

      doc.setFont("helvetica", "normal");

      const records = data.records || [];
      let totalGross = 0;
      let totalComm = 0;
      let totalNet = 0;
      let totalPaid = 0;
      let allMethods = new Set();

      records.forEach((rec) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 10;
        }

        const getVariantInfo = (r) => {
          if (!r.productId?.variants || !r.variantId) return { name: "N/A", unit: "" };
          const v = r.productId.variants.find(
            (varnt) => (varnt._id || varnt.id).toString() === r.variantId.toString(),
          );
          const qualityLabel = { quality1: "Q1", quality2: "Q2", quality3: "Q3" }[v?.quality] || "";
          return v ? { name: `${v.variety || ""} ${qualityLabel}`.trim(), unit: v.unit || "" } : { name: "N/A", unit: "" };
        };

        const vInfo = getVariantInfo(rec);
        const itemName = (vInfo.name && vInfo.name !== "N/A") ? vInfo.name : (rec.productId?.name || "N/A");
        const displayItemName = truncate(itemName, 18); // slightly shorter to leave room

        const qty = rec.quantity || 0;
        const selling = rec.finalAmount || 0;
        const comm = rec.commissionAmount || 0;
        const price = rec.netAmount || 0;
        const paid = rec.paidAmount || 0;
        if (rec.method && rec.method !== "N/A") {
          rec.method.split(", ").forEach((m) => allMethods.add(m));
        }

        totalGross += selling;
        totalComm += comm;
        totalNet += price;
        totalPaid += paid;

        // Two-line layout per item: name on its own line, numbers below — never touch
        doc.text(displayItemName, 5, yPos);
        yPos += 4;
        doc.text(`${qty} ${vInfo.unit || ""} x Rs.${rec.rate || 0}`, 8, yPos);
        doc.text(`Rs.${price}`, 77, yPos, { align: "right" });
        yPos += 6;
      });

      // Total
      yPos += 2;
      doc.text("--------------------------------", centerX, yPos, {
        align: "center",
      });
      yPos += 6;

      const methodsStr = Array.from(allMethods).join(", ") || "Cash";
      const balanceValue = Math.max(0, totalNet - totalPaid);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Market Fee (Comm)", 5, yPos);
      doc.text(`Rs.${totalComm}`, 75, yPos, { align: "right" });
      yPos += 5;

      doc.text("Total Sales", 5, yPos);
      doc.text(`Rs.${totalNet}`, 75, yPos, { align: "right" });
      yPos += 5;

      doc.text("Already Paid", 5, yPos);
      doc.text(`Rs.${totalPaid}`, 75, yPos, { align: "right" });
      yPos += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("AMOUNT TO PAY", 5, yPos);
      doc.text(`Rs.${balanceValue}`, 75, yPos, { align: "right" });
      yPos += 7;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
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

      // Payment details listing at bottom
      const paymentsList = data.payments || [];
      if (paymentsList.length > 0) {
        yPos += 2;
        doc.text("--------------------------------", centerX, yPos, {
          align: "center",
        });
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("PAYMENTS:", 5, yPos);
        yPos += 4;
        doc.setFont("helvetica", "normal");
        paymentsList.forEach((p) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 10;
          }
          const pDate = formatDateStr(p.date);
          const pDesc = p.note ? `${p.method} (${p.note})` : p.method;
          doc.text(`${pDate} - ${pDesc}`, 5, yPos);
          doc.text(`Rs.${p.amount}`, 75, yPos, { align: "right" });
          yPos += 5;
        });
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
      doc.text("Seller Report", 105, 26, { align: "center" });
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

      // --- Seller Details ---
      let yPos = vYPos + 6;
      doc.setFontSize(14);
      doc.text("SELLER DETAILS", 10, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`Name: ${data.seller.name}`, 10, yPos);
      yPos += 5;
      doc.text(`Contact: ${data.seller.contact}`, 10, yPos);
      yPos += 5;
      const sellerAddressLines = doc.splitTextToSize(`Address: ${data.seller.address || "N/A"}`, 180);
      sellerAddressLines.forEach((line) => {
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
      const headers = ["Date", "Description", "Credit", "Debit", "Balance"];

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
          `Rs. ${rec.credit || 0}`,
          `Rs. ${rec.debit || 0}`,
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

    doc.save(`Seller_Report_${data.seller.name}_${Date.now()}.pdf`);
    toast.success("PDF Downloaded successfully");
  };

  // ─────────────────────────────────────────────────────
  //  Product View
  // ─────────────────────────────────────────────────────
  const handleViewProduct = (productId) => {
    const product = selectedSeller.products.find((p) => p.id === productId);
    if (!product) return;

    setViewingProduct({
      ...product,
      stats: {
        price: (product.totalNet || 0) + (product.totalCommission || 0),
        commission: product.totalCommission || 0,
        net: product.totalNet || 0,
        paid: product.totalPaid || 0,
        balance: product.totalBalance || 0,
      },
      relatedTransactions: (selectedSeller.transactions || []).filter((t) => {
        const tid = t.productId?._id?.toString() || t.productId?.toString();
        return tid === productId;
      }),
    });
    setShowProductViewModal(true);
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
    selectedSeller?.products?.filter((p) => isMatchDate(p.date)) || [];
  const filteredLedger =
    ledger?.filter((entry) => isMatchDate(entry.date)) || [];

  const totalSales = filteredProducts.reduce(
    (sum, p) => sum + (p.totalNet || 0),
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

  // ─────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────
  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteSeller}
        title="Delete Seller"
        message="Are you sure you want to delete this seller?"
        subMessage="This action will remove the seller and their history."
        confirmText="Yes, Delete Seller"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* ── Page Header ── */}
      <div className="content-header">
        <div className="header-top">
          <h1>{selectedSeller ? "Seller Details" : "Sellers"}</h1>
          <div className="header-actions">
            {selectedSeller ? (
              <button
                className="btn btn-secondary"
                onClick={handleBackToSellers}
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
                Add Seller
              </button>
            )}
          </div>
        </div>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span
            onClick={selectedSeller ? handleBackToSellers : undefined}
            style={{
              cursor: selectedSeller ? "pointer" : "default",
              textDecoration: selectedSeller ? "underline" : "none",
            }}
          >
            Sellers
          </span>
          {selectedSeller && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span>{selectedSeller.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="content-body">
        {!selectedSeller ? (
          <>
            <div className="section-header">
              <h3 className="section-title">All Sellers ({sellers.length})</h3>
            </div>

            {/* Search */}
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
                placeholder="Search seller by name..."
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
              {/* <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                <VoiceSearch onSearch={(text) => setSearchQuery(text)} minimal={true} />
              </div> */}
            </div>

            {/* Seller Cards */}
            <div className="card-list fade-in">
              {loading ? (
                <LoadingSpinner message="Loading sellers..." />
              ) : sellers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <p>No sellers registered yet</p>
                </div>
              ) : (
                sellers
                  .filter((s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((seller) => (
                    <div
                      key={seller.id}
                      className="data-card clickable-card"
                    // onClick={() => openDetailsModal(seller)}
                    >
                      <div className="data-card-header">
                        <div>
                          <div className="data-card-title">{seller.name}</div>
                          <div className="data-card-subtitle">
                            {seller.contact}
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", gap: "6px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="icon-btn view"
                            onClick={() => openDetailsModal(seller)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="icon-btn edit"
                            onClick={() => openEditModal(seller)}
                            title="Edit Seller"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDeleteClick(seller)}
                            title="Delete Seller"
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
          /* Detail View */
          <div className="fade-in">
            <div
              className="card profile-container"
              style={{ marginBottom: "2rem" }}
            >
              <div className="profile-layout-vertical">
                <div className="profile-header">
                  <div className="profile-name-section">
                    <span className="profile-detail-label">Seller Name</span>
                    <h2 className="profile-name">{selectedSeller.name}</h2>
                  </div>
                  <button
                    className="icon-btn edit"
                    onClick={() => openEditModal(selectedSeller)}
                    title="Edit Seller"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="profile-info-grid">
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Contact</span>
                    <span className="profile-detail-value">{selectedSeller.contact}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Mail Id</span>
                    <span className="profile-detail-value">{selectedSeller.email || "N/A"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">State</span>
                    <span className="profile-detail-value">{selectedSeller.state || "N/A"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">City</span>
                    <span className="profile-detail-value">{selectedSeller.city || "N/A"}</span>
                  </div>
                  <div className="profile-detail-item span-2">
                    <span className="profile-detail-label">Address</span>
                    <span className="profile-detail-value">{selectedSeller.address || "N/A"}</span>
                  </div>
                  {/* <div className="profile-detail-item">
                    <span className="profile-detail-label">Advance Amount</span>
                    <span className="profile-detail-value text-success">
                      ₹{(selectedSeller.advanceAmount || 0).toLocaleString()}
                    </span>
                  </div> */}
                  {/* <div className="profile-detail-item">
                    <span className="profile-detail-label">Commission Rate</span>
                    <span className="profile-detail-value text-success">
                      {selectedSeller.customCommission ? `${selectedSeller.commissionPercent}% (Custom)` : "Global Default"}
                    </span>
                  </div> */}
                  {/* <div className="profile-detail-item">
                    <span className="profile-detail-label" style={{ marginBottom: "0.25rem" }}>Login Access</span>
                    <span className="profile-detail-value">
                      <span
                        onClick={() =>
                          handleToggleStatus(
                            selectedSeller._id || selectedSeller.id,
                          )
                        }
                        className={`cursor-pointer badge btn ${selectedSeller.status === "inactive" ? "btn-success" : "btn-error"} status-toggle-btn`}
                        style={{ display: "inline-flex", padding: "0.4rem 1rem", fontSize: "0.8rem", width: "auto", minWidth: "120px", justifyContent: "center" }}
                      >
                        {selectedSeller.status === "inactive"
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

              <button
                className="btn btn-secondary"
                onClick={openCommissionModal}
              >
                <Edit2 size={16} style={{ marginRight: "5px" }} />Commission
              </button>
            </div>

            <div className="detail-actions-row-2">
              <button
                className="btn btn-primary"
                onClick={openAddProductModal}
              >
                <Plus size={16} style={{ marginRight: "5px" }} /> Add Product
              </button>

              <button
                className="btn btn-primary"
                onClick={openGlobalPaymentModal}
              >
                <Plus size={16} style={{ marginRight: "5px" }} /> Pay Out
              </button>

              <button
                className="btn btn-secondary"
                onClick={openBillingModal}
              >
                <Download size={16} style={{ marginRight: "5px" }} /> Bill
              </button>
            </div>

            {/* Tabs */}
            <div className="history-tabs">
              <button
                className={`tab-button ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                Selling Products
              </button>
              <button
                className={`tab-button ${activeTab === "payments" ? "active" : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                Payment History
              </button>
            </div>

            {activeTab === "products" ? (
              <div className="table-wrapper history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      {/* <th>Quality</th> */}
                      <th>Quantity</th>
                      <th>Sales</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-td">
                          No items submitted for this date
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.date)}</td>
                          <td className="product-name-bold">{capitalizeFirst(p.name)}</td>
                          {/* <td>
                            {p.variants && p.variants.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {p.variants.map((v) => (
                                  <div
                                    key={v._id || v.id || Math.random()}
                                    style={{ fontSize: "0.85rem" }}
                                  >
                                    {capitalizeFirst(v.variety)} - {getQualityLabel(v.quality)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td> */}
                          <td>
                            {p.variants && p.variants.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {p.variants.map((v) => (
                                  <div
                                    key={v._id || v.id || Math.random()}
                                    style={{ fontSize: "0.85rem" }}
                                  >
                                    {v.quantity} {v.unit}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            {p.variants && p.variants.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {p.variants.map((v) => (
                                  <div
                                    key={v._id || v.id || Math.random()}
                                    style={{ fontSize: "0.85rem", fontWeight: "bold" }}
                                  >
                                    ₹{(v.stats?.price || 0).toLocaleString()}
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
                  {/* {filteredProducts.length > 0 && (
                    <tfoot
                      style={{ background: "#f8f9fa", fontWeight: "bold" }}
                    >
                      <tr>
                        <td colSpan="3">TOTAL</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )} */}
                </table>
              </div>
            ) : (
              <div className="payment-history-section">
                <div className="table-wrapper history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Credit (Sale)</th>
                        <th>Debit (Pay)</th>
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
                        filteredLedger.map((entry, idx) => (
                          <tr key={entry.id || idx}>
                            <td>
                              {formatDateTime(entry.createdAt || entry.date)}
                            </td>
                            <td>{entry.description}</td>
                            <td className="text-success">
                              {entry.credit > 0
                                ? `₹${entry.credit.toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="text-error">
                              {entry.debit > 0
                                ? `₹${entry.debit.toLocaleString()}`
                                : "-"}
                            </td>
                            <td style={{ fontWeight: "bold", color: "black" }}>
                              {entry.balance < 0
                                ? `Advance ₹${Math.abs(entry.balance).toLocaleString()}`
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
                            {filteredLedger[filteredLedger.length - 1].balance <
                              0
                              ? `Advance ₹${Math.abs(filteredLedger[filteredLedger.length - 1].balance).toLocaleString()}`
                              : `₹${filteredLedger[filteredLedger.length - 1].balance.toLocaleString()}`}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Seller Modal ── */}
      {showEditModal && editingSeller && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowEditModal(false);
            setFormErrors({});
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Seller</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setFormErrors({});
                }}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleEditSeller}>
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
                      value={editingSeller.name}
                      onChange={(e) => {
                        setEditingSeller({
                          ...editingSeller,
                          name: e.target.value,
                        });
                        setFormErrors((p) => ({ ...p, name: "" }));
                      }}
                      placeholder="Full Name"
                      className={formErrors.name ? "input-error" : ""}
                    />
                    {formErrors.name && (
                      <small className="field-error">{formErrors.name}</small>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      value={editingSeller.contact}
                      onChange={(e) => {
                        setEditingSeller({
                          ...editingSeller,
                          contact: e.target.value,
                        });
                        setFormErrors((p) => ({ ...p, contact: "" }));
                      }}
                      placeholder="10-digit Mobile Number"
                      maxLength={15}
                      className={formErrors.contact ? "input-error" : ""}
                    />
                    {formErrors.contact && (
                      <small className="field-error">{formErrors.contact}</small>
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
                    value={editingSeller.email || ""}
                    onChange={(e) => {
                      setEditingSeller({
                        ...editingSeller,
                        email: e.target.value,
                      });
                      setFormErrors((p) => ({ ...p, email: "" }));
                    }}
                    placeholder="example@gmail.com"
                    className={formErrors.email ? "input-error" : ""}
                  />
                  {formErrors.email && (
                    <small className="field-error">{formErrors.email}</small>
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
                      value={editingSeller.state || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingSeller((prev) => ({
                          ...prev,
                          state: val,
                          city: "",
                        }));
                        fetchEditCities(val);
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
                      value={editingSeller.city || ""}
                      onChange={(e) =>
                        setEditingSeller((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder={
                        loadingEditCities
                          ? "Loading cities..."
                          : !editingSeller.state
                            ? "Select state first"
                            : "Select City"
                      }
                      options={editCities.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                      disabled={!editingSeller.state || loadingEditCities}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    value={editingSeller.address || ""}
                    onChange={(e) =>
                      setEditingSeller({
                        ...editingSeller,
                        address: e.target.value,
                      })
                    }
                    rows="2"
                    placeholder="Street / Village / District details"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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
              <h3 className="modal-title">Product Details </h3>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >

                <button
                  className="modal-close"
                  onClick={() => setShowProductViewModal(false)}
                >
                  <X />
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
                        Total Sales:{" "}
                        <b>
                          ₹{(viewingProduct.stats?.price || 0).toLocaleString()}
                        </b>
                      </div>
                      <div>
                        Commission:{" "}
                        <b>
                          ₹
                          {(
                            viewingProduct.stats?.commission || 0
                          ).toLocaleString()}
                        </b>
                      </div>
                      <div>
                        Total To Amount:{" "}
                        <b>
                          ₹{(viewingProduct.stats?.net || 0).toLocaleString()}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
                <h4 style={{ margin: "0 0 10px 0" }}>Variant Details</h4>
                <div className="table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Variety</th>
                        <th>Qty</th>
                        <th>Sold Qty</th>
                        <th>Sales</th>

                      </tr>
                    </thead>
                    <tbody>
                      {viewingProduct.variants.map((v, idx) => (
                        <tr key={idx}>
                          <td>{v.variety}</td>
                          <td>
                            {v.quantity} {v.unit}
                          </td>
                          <td>
                            {v.sellQuantity || 0} {v.unit}
                          </td>
                          <td>₹{(v.stats?.price || 0).toLocaleString()}</td>

                        </tr>
                      ))}
                      {viewingProduct.variants.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No variants found
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

      {/* ── Commission Modal ── */}
      {showCommissionModal && selectedSeller && (
        <div
          className="modal-overlay"
          onClick={() => setShowCommissionModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Customize Seller Commission</h3>
              <button
                className="modal-close"
                onClick={() => setShowCommissionModal(false)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveCommission}>
              <div className="modal-body">
                <div className="fade-in" style={{ padding: '0 5px' }}>
                  <div className="form-group">
                    <label className="form-label">Commission Percentage (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={commissionData.commissionPercent}
                      onChange={(e) => setCommissionData({ ...commissionData, commissionPercent: e.target.value })}
                      min="0"
                      max="100"
                      step="any"
                      placeholder="e.g. 5 (Leave empty to use Global Commission)"
                    />
                  </div>

                  <div className="commission-date-row">
                    <div className="form-group">
                      <label className="form-label">Valid From</label>
                      <input
                        type="date"
                        className="form-control"
                        value={commissionData.commissionStartDate}
                        onChange={(e) => setCommissionData({ ...commissionData, commissionStartDate: e.target.value })}
                        disabled={commissionData.commissionPercent === ""}
                      />
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Valid Until</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            type="checkbox"
                            id="foreverToggle"
                            checked={commissionData.forever}
                            onChange={(e) => setCommissionData({ ...commissionData, forever: e.target.checked })}
                            disabled={commissionData.commissionPercent === ""}
                          />
                          <label htmlFor="foreverToggle" style={{ fontSize: '13px', margin: 0 }}>Forever</label>
                        </div>
                      </div>
                      <input
                        type="date"
                        className="form-control"
                        value={commissionData.commissionEndDate}
                        onChange={(e) => setCommissionData({ ...commissionData, commissionEndDate: e.target.value })}
                        disabled={commissionData.forever || commissionData.commissionPercent === ""}
                        title={commissionData.forever ? "Disable 'Forever' to set an end date" : ""}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Tip: To remove a seller's custom commission and fallback to the global rate, simply clear the percentage field.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCommissionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCommissionSaving}
                >
                  {isCommissionSaving ? (
                    <>
                      <Loader size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    "Save Commission"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showRecordPaymentModal && selectedSeller && (
        <div
          className="modal-overlay"
          onClick={() => setShowRecordPaymentModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Pay Out</h3>
              <button
                className="modal-close"
                onClick={() => setShowRecordPaymentModal(false)}
              >
                ×
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
                    <span className="data-label">Seller Name</span>
                    <span className="data-value">{selectedSeller.name}</span>
                  </div>
                  <div className="data-row payment-modal-row">
                    <span className="data-label">Pay Amount To</span>
                    <span className="data-value text-error">
                      ₹{selectedSeller.balance?.toLocaleString() || 0}
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
                      placeholder="e.g. Note"
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPaymentSaving}
                >
                  {isPaymentSaving ? (
                    <>
                      <Loader size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    "Save Payment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Seller Modal ── */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            setFormErrors({});
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Seller</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleAddSeller}>
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
                      value={newSeller.name}
                      onChange={(e) => {
                        setNewSeller({ ...newSeller, name: e.target.value });
                        setFormErrors((p) => ({ ...p, name: "" }));
                      }}
                      placeholder="Full Name"
                      className={formErrors.name ? "input-error" : ""}
                    />
                    {formErrors.name && (
                      <small className="field-error">{formErrors.name}</small>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      value={newSeller.contact}
                      onChange={(e) => {
                        setNewSeller({ ...newSeller, contact: e.target.value });
                        setFormErrors((p) => ({ ...p, contact: "" }));
                      }}
                      placeholder="10-digit Mobile Number"
                      maxLength={15}
                      className={formErrors.contact ? "input-error" : ""}
                    />
                    {formErrors.contact && (
                      <small className="field-error">{formErrors.contact}</small>
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
                    value={newSeller.email}
                    onChange={(e) => {
                      setNewSeller({ ...newSeller, email: e.target.value });
                      setFormErrors((p) => ({ ...p, email: "" }));
                    }}
                    placeholder="example@gmail.com"
                    className={formErrors.email ? "input-error" : ""}
                  />
                  {formErrors.email && (
                    <small className="field-error">{formErrors.email}</small>
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
                      value={newSeller.state}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSeller((prev) => ({
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
                      value={newSeller.city}
                      onChange={(e) =>
                        setNewSeller((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder={
                        loadingCities
                          ? "Loading cities..."
                          : !newSeller.state
                            ? "Select state first"
                            : "Select City"
                      }
                      options={cities.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                      disabled={!newSeller.state || loadingCities}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    value={newSeller.address}
                    onChange={(e) =>
                      setNewSeller({ ...newSeller, address: e.target.value })
                    }
                    rows="2"
                    placeholder="Street / Village / District details"
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader size={14} className="spin" /> Adding...
                    </>
                  ) : (
                    "Add Seller"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Product Modal ── */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Product - {selectedSeller.name}</h3>
              <button className="modal-close" onClick={() => setShowAddProduct(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <SearchableSelect
                    name="productName"
                    options={masterProducts.map((p) => ({
                      label: p.name,
                      value: p.name,
                    }))}
                    value={newProduct.name || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selectedOpt = val
                        ? masterProducts.find((p) => p.name === val)
                        : null;
                      if (!selectedOpt) {
                        setNewProduct({
                          ...newProduct,
                          name: "",
                          masterProduct: null,
                        });
                        setVariantData((prev) => ({
                          ...prev,
                          variety: "",
                          unit: "",
                        }));
                        return;
                      }
                      const defaultUnit =
                        selectedOpt.units && selectedOpt.units.length > 0
                          ? selectedOpt.units[0]
                          : "";
                      const defaultVariety = "";

                      setNewProduct((prev) => ({
                        ...prev,
                        name: selectedOpt.name,
                        masterProduct: selectedOpt,
                      }));
                      setVariantData((prev) => ({
                        ...prev,
                        variety: defaultVariety,
                        unit: defaultUnit,
                      }));
                    }}
                    placeholder="Search product..."
                    required
                  />
                </div>

                <div className="form-group form-group-mt-15">
                  <div className="variants-header-row">
                    <label className="form-label form-label-no-mb">
                      Variants
                    </label>
                    <div className="global-comm-wrapper">
                      <span className="global-comm-text">
                        Commission:
                      </span>
                      {editingGlobalComm ? (
                        <div className="global-comm-edit-row">
                          <input
                            type="number"
                            value={defaultCommission}
                            onChange={(e) => {
                              setDefaultCommission(e.target.value);
                              setVariantData((prev) => ({
                                ...prev,
                                commission: e.target.value,
                              }));
                            }}
                            className="variant-comm-input variant-comm-input-inline"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="icon-btn edit"
                            onClick={() => setEditingGlobalComm(false)}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="global-comm-edit-row">
                          <strong className="text-primary-color">
                            {defaultCommission}%
                          </strong>
                          <button
                            type="button"
                            className="icon-btn edit"
                            onClick={() => setEditingGlobalComm(true)}
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="variant-row">
                    <SearchableSelect
                      name="variety"
                      options={
                        newProduct.masterProduct &&
                          newProduct.masterProduct.varieties &&
                          newProduct.masterProduct.varieties.length > 0
                          ? newProduct.masterProduct.varieties.map((v) => ({
                            label: v,
                            value: v,
                          }))
                          : []
                      }
                      value={variantData.variety || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVariantData((prev) => ({
                          ...prev,
                          variety: val || "",
                        }));
                      }}
                      placeholder="Variety"
                      disabled={!newProduct.masterProduct}
                    />

                    <select
                      value={variantData.quality}
                      onChange={(e) =>
                        setVariantData({
                          ...variantData,
                          quality: e.target.value,
                        })
                      }
                      className="form-control"
                    >
                      <option value="quality1">Quality 1</option>
                      <option value="quality2">Quality 2</option>
                      <option value="quality3">Quality 3</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Qty"
                      value={variantData.quantity}
                      min={1}
                      onChange={(e) =>
                        setVariantData({
                          ...variantData,
                          quantity: e.target.value,
                        })
                      }
                      className="form-control"
                    />

                    <select
                      value={variantData.unit}
                      onChange={(e) =>
                        setVariantData({ ...variantData, unit: e.target.value })
                      }
                      required
                      placeholder="Unit"
                      className="form-control"
                    >
                      <option value="" disabled>
                        Select Unit
                      </option>
                      {newProduct.masterProduct &&
                        newProduct.masterProduct.units &&
                        newProduct.masterProduct.units.length > 0 ? (
                        newProduct.masterProduct.units.map((u, i) => (
                          <option key={i} value={u}>
                            {u}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No Units
                        </option>
                      )}
                    </select>

                    <button
                      type="button"
                      className="btn btn-primary add-variant-btn"
                      onClick={handleAddVariant}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {newProduct.variants && newProduct.variants.length > 0 && (
                  <div className="table-responsive table-responsive-variants">
                    <table className="variant-table">
                      <thead>
                        <tr className="variant-table-th">
                          <th className="variant-table-th">Variety</th>
                          <th className="variant-table-th">Quality</th>
                          <th className="variant-table-th">Qty</th>
                          <th className="variant-table-th">Unit</th>
                          <th className="variant-table-th">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newProduct.variants.map((v) => (
                          <tr key={v.id} className="variant-table-tr">
                            <td className="variant-table-td">{v.variety}</td>
                            <td className="variant-table-td">{v.quality}</td>
                            <td className="variant-table-td">{v.quantity}</td>
                            <td className="variant-table-td">{v.unit}</td>
                            <td className="variant-table-td">
                              <button
                                type="button"
                                className="icon-btn delete"
                                onClick={() => handleDeleteVariant(v.id)}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddProduct(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isProductSaving}>
                  {isProductSaving ? <Loader size={14} className="spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Billing Modal ── */}
      {showBillingModal && selectedSeller && (
        <div
          className="modal-overlay"
          onClick={() => setShowBillingModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Bill - {selectedSeller.name}</h3>
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
                      <option value="selling_product">Selling Products Bill</option>
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

export default SellerDetails;