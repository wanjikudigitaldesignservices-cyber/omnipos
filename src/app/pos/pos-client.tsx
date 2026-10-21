"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  openShiftAction,
  closeShiftAction,
  processCheckoutAction,
  CheckoutPayload,
} from "@/actions/pos";
import { recordCustomerRepaymentAction, createCustomerAction } from "@/actions/customers";
import { useCartStore, CartItem } from "@/stores/cart-store";
import { ThermalReceiptModal } from "@/components/thermal-receipt";
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  ArrowRight,
  Printer,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
  Calendar,
  Percent,
  Coins,
  UtensilsCrossed,
  Pill,
  Store,
  Scissors,
  PauseCircle,
  PlayCircle,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PosClientProps {
  tenant: {
    id: string;
    name: string;
    currency: string;
    taxRate: string;
    businessType: "RETAIL" | "RESTAURANT" | "PHARMACY_AGROVET" | "SERVICE";
    receiptHeader?: string | null;
    receiptFooter?: string | null;
  };
  user: {
    id: string;
    fullName: string;
    role: "OWNER" | "MANAGER" | "CASHIER";
  };
  initialActiveShift: any;
  categories: any[];
  initialProducts: any[];
  initialCustomers: any[];
}

export function PosTerminalClient({
  tenant,
  user,
  initialActiveShift,
  categories,
  initialProducts,
  initialCustomers,
}: PosClientProps) {
  const router = useRouter();

  // Zustand Store
  const {
    items: cart,
    customer,
    orderType,
    tableNumber,
    overallDiscount,
    parkedCarts,
    addItem,
    removeItem,
    updateQuantity,
    updateDiscount,
    updateNotes,
    setStaffMember,
    setCustomer,
    setOrderType,
    setTableNumber,
    setOverallDiscount,
    clearCart,
    parkCurrentCart,
    recallParkedCart,
    deleteParkedCart,
    getSubtotal,
    getTotalDiscount,
    getTaxAmount,
    getTotalAmount,
  } = useCartStore();

  // Shift Control
  const [activeShift, setActiveShift] = useState(initialActiveShift);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(!initialActiveShift);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState("1000");
  const [actualClosingCashInput, setActualClosingCashInput] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");
  const [zReport, setZReport] = useState<any | null>(null);

  // Catalog & Search State
  const [productsList, setProductsList] = useState(initialProducts);
  const [customersList, setCustomersList] = useState(initialCustomers);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Multi-Cart / Parked Carts Drawer
  const [isParkedDrawerOpen, setIsParkedDrawerOpen] = useState(false);
  const [parkLabelInput, setParkLabelInput] = useState("");

  // Customer Modal
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState("20000");

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "CASH" | "MOBILE_MONEY" | "CARD" | "CREDIT_TAB" | "SPLIT"
  >("CASH");
  const [tenderCash, setTenderCash] = useState<string>("");
  const [tenderMpesa, setTenderMpesa] = useState<string>("");
  const [mpesaRefCode, setMpesaRefCode] = useState<string>("");
  const [tenderCard, setTenderCard] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const taxRateNum = parseFloat(tenant.taxRate || "16.00");
  const subtotal = getSubtotal();
  const taxAmount = getTaxAmount(taxRateNum);
  const totalAmount = getTotalAmount(taxRateNum);

  // Auto-focus barcode scanner
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart.length]);

  // Handle direct barcode scanner enter key
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const matched = productsList.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        (p.sku && p.sku.toLowerCase() === query) ||
        p.name.toLowerCase() === query
    );

    if (matched) {
      addItem(matched, 1);
      setSearchQuery("");
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [productsList, selectedCategory, searchQuery]);

  // Open Shift Handler
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatNum = parseFloat(openingFloatInput) || 0;
    const res = await openShiftAction(floatNum, shiftNotes);
    if (res.success && res.shift) {
      setActiveShift(res.shift);
      setIsOpenShiftModalOpen(false);
      setShiftNotes("");
      router.refresh();
    }
  };

  // Close Shift Handler
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const countedNum = parseFloat(actualClosingCashInput) || 0;
    const res = await closeShiftAction(activeShift.id, countedNum, shiftNotes);
    if (res.success) {
      setZReport(res);
      setActiveShift(null);
      setIsCloseShiftModalOpen(false);
      router.refresh();
    }
  };

  // Add Customer Quick Action
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;

    const fd = new FormData();
    fd.append("name", newCustomerName);
    fd.append("phone", newCustomerPhone);
    fd.append("creditLimit", newCustomerCreditLimit);

    const res = await createCustomerAction(fd);
    if (res.success && res.customer) {
      setCustomersList([res.customer, ...customersList]);
      setCustomer({
        id: res.customer.id,
        name: res.customer.name,
        phone: res.customer.phone,
        creditBalance: parseFloat(res.customer.creditBalance || "0"),
        creditLimit: parseFloat(res.customer.creditLimit || "50000"),
        loyaltyPoints: res.customer.loyaltyPoints || 0,
      });
      setIsAddCustomerModalOpen(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    }
  };

  // Quick cash denominations
  const quickDenominations = [50, 100, 200, 500, 1000, 2000];

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    if (!activeShift) {
      setIsOpenShiftModalOpen(true);
      return;
    }
    setTenderCash(totalAmount.toString());
    setTenderMpesa("");
    setMpesaRefCode("");
    setTenderCard("");
    setCheckoutError(null);
    setIsCheckoutModalOpen(true);
  };

  // Execute Checkout (Atomic Server Action)
  const handleProcessCheckout = async () => {
    if (!activeShift) {
      setCheckoutError("No active register shift. Please open a shift first.");
      return;
    }

    setIsProcessingSale(true);
    setCheckoutError(null);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitCost: item.costPrice || 0,
        unitPrice: item.price,
        discount: item.discount || 0,
        subtotal: item.price * item.quantity - (item.discount || 0),
      }));

      let paymentSplitJson: any = null;
      let calculatedChange = 0;

      if (selectedPaymentMethod === "CASH") {
        const cashTendered = parseFloat(tenderCash) || 0;
        if (cashTendered < totalAmount) {
          setCheckoutError(`Tendered cash (${tenant.currency} ${cashTendered}) is less than total due (${tenant.currency} ${totalAmount}).`);
          setIsProcessingSale(false);
          return;
        }
        calculatedChange = cashTendered - totalAmount;
      } else if (selectedPaymentMethod === "MOBILE_MONEY") {
        paymentSplitJson = { referenceCode: mpesaRefCode || "MPESA-CONFIRMED" };
      } else if (selectedPaymentMethod === "CREDIT_TAB") {
        if (!customer) {
          setCheckoutError("Please select a customer before charging to Credit / Deni Tab.");
          setIsProcessingSale(false);
          return;
        }
        if (customer.creditBalance + totalAmount > customer.creditLimit) {
          setCheckoutError(`Order exceeds customer's credit limit (${tenant.currency} ${customer.creditLimit}). Current debt: ${tenant.currency} ${customer.creditBalance}.`);
          setIsProcessingSale(false);
          return;
        }
      } else if (selectedPaymentMethod === "SPLIT") {
        const cashVal = parseFloat(tenderCash) || 0;
        const mpesaVal = parseFloat(tenderMpesa) || 0;
        const cardVal = parseFloat(tenderCard) || 0;
        const totalSplit = cashVal + mpesaVal + cardVal;

        if (totalSplit < totalAmount) {
          setCheckoutError(`Total split tenders (${tenant.currency} ${totalSplit}) do not cover order total (${tenant.currency} ${totalAmount}).`);
          setIsProcessingSale(false);
          return;
        }

        paymentSplitJson = [
          { method: "CASH", amount: cashVal },
          { method: "MOBILE_MONEY", amount: mpesaVal, referenceCode: mpesaRefCode },
          { method: "CARD", amount: cardVal },
        ].filter((p) => p.amount > 0);

        if (cashVal > 0 && totalSplit > totalAmount) {
          calculatedChange = totalSplit - totalAmount;
        }
      }

      const payload: CheckoutPayload = {
        shiftId: activeShift.id,
        customerId: customer?.id || null,
        orderType: orderType || "WALK_IN",
        tableNumber: tableNumber || null,
        subtotal,
        taxAmount,
        discountAmount: getTotalDiscount(),
        totalAmount,
        paymentMethod: selectedPaymentMethod,
        paymentSplitJson,
        items: itemsPayload,
      };

      const result = await processCheckoutAction(payload);

      if (result.success && result.order) {
        setChangeAmount(calculatedChange);
        setCompletedSale({
          receiptNumber: result.receiptNumber,
          totalAmount,
          subtotal,
          discountAmount: getTotalDiscount(),
          taxAmount,
          createdAt: new Date(),
          items: cart.map((i) => ({
            productName: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            subtotal: i.price * i.quantity - (i.discount || 0),
          })),
          payments: [
            {
              method: selectedPaymentMethod,
              amount: totalAmount,
              referenceCode: mpesaRefCode,
            },
          ],
        });

        // Update local stock quantities
        setProductsList((prev) =>
          prev.map((p) => {
            const purchased = cart.find((c) => c.id === p.id);
            if (purchased) {
              const currentStock = parseFloat(p.stockQuantity);
              return {
                ...p,
                stockQuantity: Math.max(0, currentStock - purchased.quantity).toFixed(2),
              };
            }
            return p;
          })
        );

        // Clear cart
        clearCart();
        setIsCheckoutModalOpen(false);
      } else {
        setCheckoutError(result.error || "Failed to finalize checkout.");
      }
    } catch (err: any) {
      setCheckoutError(err.message || "An unexpected error occurred during sale processing.");
    } finally {
      setIsProcessingSale(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-slate-950 select-none">
      {/* ======================================================== */}
      {/* LEFT COLUMN: Catalog, Categories & Barcode Scanner      */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
        {/* Top Control Bar: Search & Adaptive Badges */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center gap-3">
          {/* Barcode Search Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                tenant.businessType === "RETAIL"
                  ? "Scan barcode or enter SKU / product name (Press Enter)..."
                  : tenant.businessType === "RESTAURANT"
                  ? "Search menu items, grills, beverages..."
                  : tenant.businessType === "PHARMACY_AGROVET"
                  ? "Search pharmaceuticals, batches, dewormers..."
                  : "Search services, treatments, packages..."
              }
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
              <Barcode className="w-3.5 h-3.5 text-emerald-400" />
              <span>SCANNER</span>
            </div>
          </form>

          {/* Industry Adaptive Selector for Restaurant: Order Type & Tables */}
          {tenant.businessType === "RESTAURANT" && (
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                {(["WALK_IN", "DINE_IN", "TAKEAWAY"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                      orderType === t
                        ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t === "DINE_IN" ? "Dine-In" : t === "TAKEAWAY" ? "Takeaway" : "Walk-In"}
                  </button>
                ))}
              </div>

              {orderType === "DINE_IN" && (
                <select
                  value={tableNumber || ""}
                  onChange={(e) => setTableNumber(e.target.value || null)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Table #</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, "VIP 1", "Patio 1", "Bar Counter"].map((tbl) => (
                    <option key={tbl.toString()} value={tbl.toString()}>
                      Table {tbl}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Shift Status Pill & Close Shift button */}
          <div className="flex items-center gap-2 ml-auto">
            {activeShift ? (
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>End Shift / Z-Report</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpenShiftModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Open Register Drawer</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Items ({productsList.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-slate-100 text-slate-950 font-black shadow-md"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map((p) => {
            const stock = parseFloat(p.stockQuantity) || 0;
            const threshold = parseFloat(p.lowStockThreshold) || 5;
            const isOutOfStock = stock <= 0 && tenant.businessType !== "SERVICE";
            const isLowStock = stock > 0 && stock <= threshold;

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (!isOutOfStock) {
                    addItem(p, 1);
                  }
                }}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all duration-150 select-none ${
                  isOutOfStock
                    ? "bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed"
                    : "bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 active:scale-[0.98] cursor-pointer shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {p.sku || p.barcode || "ITEM"}
                    </span>

                    {/* Stock Status Badges */}
                    {tenant.businessType !== "SERVICE" && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isOutOfStock
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : isLowStock
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isOutOfStock ? "Out" : `${stock} ${p.unit || "pcs"}`}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight">
                    {p.name}
                  </h4>

                  {/* Pharmacy / Agrovet Expiry & Batch badges */}
                  {tenant.businessType === "PHARMACY_AGROVET" && (
                    <div className="mt-2 space-y-0.5 text-[10px]">
                      {p.batchNumber && (
                        <div className="text-slate-400 font-mono">Lot: {p.batchNumber}</div>
                      )}
                      {p.expiryDate && (
                        <div className="text-amber-400/90 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Exp: {new Date(p.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Restaurant Modifiers Hint */}
                  {tenant.businessType === "RESTAURANT" && p.modifiersJson && (
                    <div className="mt-1 text-[10px] text-amber-400/80 flex items-center gap-1">
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Custom modifiers available</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{p.unit || "pcs"}</span>
                  <span className="font-black text-white text-sm">
                    {tenant.currency} {parseFloat(p.sellingPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Active Cart, Multi-Cart & Tender Modal    */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col h-full bg-slate-900/60 border-l border-slate-800 shrink-0">
        {/* Cart Top Bar: Customer Selector & Parked Carts */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          {/* Customer Selector / Deni Tab */}
          <div className="flex-1 flex items-center gap-2">
            <select
              value={customer?.id || ""}
              onChange={(e) => {
                const found = customersList.find((c) => c.id === e.target.value);
                if (found) {
                  setCustomer({
                    id: found.id,
                    name: found.name,
                    phone: found.phone,
                    creditBalance: parseFloat(found.creditBalance || "0"),
                    creditLimit: parseFloat(found.creditLimit || "50000"),
                    loyaltyPoints: found.loyaltyPoints || 0,
                  });
                } else {
                  setCustomer(null);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Walk-in Customer (Standard)</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {parseFloat(c.creditBalance || "0") > 0 ? `(Deni: ${tenant.currency} ${c.creditBalance})` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsAddCustomerModalOpen(true)}
              title="Add New Customer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Parked Carts Trigger Button */}
          <button
            type="button"
            onClick={() => setIsParkedDrawerOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer relative transition-all"
          >
            <PauseCircle className="w-4 h-4 text-amber-400" />
            <span>Held</span>
            {parkedCarts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {parkedCarts.length}
              </span>
            )}
          </button>
        </div>

        {/* Customer Info Card if Selected */}
        {customer && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{customer.name}</span>
              <span className="text-[10px] text-emerald-400">({customer.loyaltyPoints} Loyalty Pts)</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Deni Balance: </span>
              <span className={`font-mono font-bold ${customer.creditBalance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {tenant.currency} {customer.creditBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-slate-300 text-sm">Register Cart Empty</p>
                <p className="text-xs text-slate-500 mt-1">Scan a barcode or tap items in the catalog to add to order.</p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-white text-sm leading-tight">{item.name}</h5>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {tenant.currency} {item.price.toFixed(2)} / {item.unit}
                    </div>
                  </div>
                  <div className="text-right font-black text-white text-sm font-mono">
                    {tenant.currency} {(item.price * item.quantity - (item.discount || 0)).toFixed(2)}
                  </div>
                </div>

                {/* Adaptive Inputs: Notes for Restaurant, Staff for Service */}
                {tenant.businessType === "RESTAURANT" && (
                  <input
                    type="text"
                    value={item.notes || ""}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    placeholder="Kitchen note (e.g. no onions, well done)..."
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                )}

                {tenant.businessType === "SERVICE" && (
                  <input
                    type="text"
                    value={item.staffMember || ""}
                    onChange={(e) => setStaffMember(item.id, e.target.value)}
                    placeholder="Staff performing service (e.g. Reuben)..."
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                )}

                {/* Quantity Controls & Line Discount */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - (tenant.businessType === "PHARMACY_AGROVET" && item.unit === "kg" ? 0.25 : 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      step={tenant.businessType === "PHARMACY_AGROVET" ? "0.01" : "1"}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 1)}
                      className="w-14 text-center font-bold text-xs bg-slate-950 border border-slate-800 rounded-lg py-1 text-white focus:outline-none focus:border-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + (tenant.businessType === "PHARMACY_AGROVET" && item.unit === "kg" ? 0.25 : 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick decimal buttons for Pharmacy/Agrovet bulk goods */}
                    {tenant.businessType === "PHARMACY_AGROVET" && (
                      <div className="flex gap-1 ml-1">
                        {[0.25, 0.5].map((dec) => (
                          <button
                            key={dec}
                            type="button"
                            onClick={() => updateQuantity(item.id, dec)}
                            className="px-1.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                          >
                            {dec}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-white">
                {tenant.currency} {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({taxRateNum}%):</span>
              <span className="font-mono text-white">
                {tenant.currency} {taxAmount.toFixed(2)}
              </span>
            </div>
            {getTotalDiscount() > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">
                  -{tenant.currency} {getTotalDiscount().toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>TOTAL DUE:</span>
              <span className="font-mono text-emerald-400 text-xl">
                {tenant.currency} {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => parkCurrentCart()}
              className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              <span>Hold Cart</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Pay {tenant.currency} {totalAmount.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Open Register Session Modal (Shift Enforcement) */}
      {/* ======================================================== */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Open Register Session</h3>
                <p className="text-xs text-slate-400">Cash drawer float enforcement</p>
              </div>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Opening Cash Float ({tenant.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="e.g. Morning Shift - Cashier Desk 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check className="w-4 h-4" /> Start Shift & Unlock Terminal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Close Register Session Modal (Z-Report)         */}
      {/* ======================================================== */}
      {isCloseShiftModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsCloseShiftModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Close Shift & Z-Report</h3>
                <p className="text-xs text-slate-400">Cash drawer count reconciliation</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Opening Float:</span>
                <span className="font-mono text-white">{tenant.currency} {parseFloat(activeShift.openingFloat).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Drawer Cash:</span>
                <span className="font-mono font-bold text-emerald-400">{tenant.currency} {parseFloat(activeShift.expectedCash).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Actual Counted Cash ({tenant.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actualClosingCashInput}
                  onChange={(e) => setActualClosingCashInput(e.target.value)}
                  placeholder="Enter physical cash counted in drawer..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {actualClosingCashInput && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                  <span className="text-slate-400">Calculated Variance:</span>
                  <span
                    className={`font-mono font-bold ${
                      parseFloat(actualClosingCashInput) - parseFloat(activeShift.expectedCash) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {tenant.currency} {(parseFloat(actualClosingCashInput) - parseFloat(activeShift.expectedCash)).toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
              >
                Close Register & Generate Z-Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Smart Checkout Modal (Cash, M-Pesa, Card, Deni) */}
      {/* ======================================================== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6 relative my-6">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Universal Checkout</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select tender method to record sale</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Due</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {tenant.currency} {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {checkoutError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Payment Method Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "MOBILE_MONEY", label: "M-Pesa", icon: Smartphone },
                { id: "CARD", label: "Card", icon: CreditCard },
                { id: "CREDIT_TAB", label: "Credit (Deni)", icon: BookOpen },
                { id: "SPLIT", label: "Split", icon: Coins },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedPaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* PAYMENT TYPE SPECIFIC INPUTS */}

            {/* 1. Cash Tender Form */}
            {selectedPaymentMethod === "CASH" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tendered Cash Amount ({tenant.currency})
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Change: {tenant.currency} {Math.max(0, (parseFloat(tenderCash) || 0) - totalAmount).toFixed(2)}
                  </span>
                </div>

                <input
                  type="number"
                  step="0.01"
                  value={tenderCash}
                  onChange={(e) => setTenderCash(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xl font-black focus:outline-none focus:border-emerald-500"
                />

                {/* Quick Denomination Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTenderCash(totalAmount.toString())}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30"
                  >
                    Exact ({totalAmount.toFixed(0)})
                  </button>
                  {quickDenominations.map((den) => (
                    <button
                      key={den}
                      type="button"
                      onClick={() => setTenderCash(den.toString())}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
                    >
                      +{den}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Mobile Money / M-Pesa Form */}
            {selectedPaymentMethod === "MOBILE_MONEY" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    M-Pesa / Mobile Money Confirmation Code
                  </label>
                  <input
                    type="text"
                    value={mpesaRefCode}
                    onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QHX8923L01"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono uppercase text-base font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Customer pays via Till / Paybill. Enter code from confirmation SMS.
                  </span>
                </div>
              </div>
            )}

            {/* 3. Card Tender Form */}
            {selectedPaymentMethod === "CARD" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Card Approval / Reference Code
                  </label>
                  <input
                    type="text"
                    value={mpesaRefCode}
                    onChange={(e) => setMpesaRefCode(e.target.value)}
                    placeholder="e.g. AUTH-49120"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 4. Customer Credit (Deni / Tab) */}
            {selectedPaymentMethod === "CREDIT_TAB" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                {customer ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-bold text-white">{customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Debt:</span>
                      <span className="font-mono text-amber-400">{tenant.currency} {customer.creditBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credit Limit:</span>
                      <span className="font-mono text-slate-300">{tenant.currency} {customer.creditLimit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                      <span className="text-slate-300">Debt After Sale:</span>
                      <span className="font-mono text-emerald-400">
                        {tenant.currency} {(customer.creditBalance + totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Please select a customer on the cart screen first to charge to their Tab.</span>
                  </div>
                )}
              </div>
            )}

            {/* 5. Split Tender Form */}
            {selectedPaymentMethod === "SPLIT" && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Cash Tendered ({tenant.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tenderCash}
                    onChange={(e) => setTenderCash(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">M-Pesa Amount ({tenant.currency})</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={tenderMpesa}
                      onChange={(e) => setTenderMpesa(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={mpesaRefCode}
                      onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                      placeholder="Ref Code"
                      className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono uppercase font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Card Amount ({tenant.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tenderCard}
                    onChange={(e) => setTenderCard(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessingSale}
              onClick={handleProcessCheckout}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {isProcessingSale ? (
                <>Recording Sale & Printing...</>
              ) : (
                <>Complete Sale & Generate Receipt <Check className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: Parked / Held Carts                              */}
      {/* ======================================================== */}
      {isParkedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 h-full border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Held Orders ({parkedCarts.length})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParkedDrawerOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh]">
                {parkedCarts.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No held orders in queue.</p>
                ) : (
                  parkedCarts.map((p) => {
                    const cartTotal = p.items.reduce(
                      (acc, i) => acc + i.price * i.quantity - (i.discount || 0),
                      0
                    );
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-white text-sm block">{p.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {p.items.length} items
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {tenant.currency} {cartTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              recallParkedCart(p.id);
                              setIsParkedDrawerOpen(false);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20"
                          >
                            Recall Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteParkedCart(p.id)}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Quick Add Customer Modal                        */}
      {/* ======================================================== */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddCustomerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-white text-base">Register New Customer</h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Sarah Ochieng"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. +254 700 000 000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Credit Limit ({tenant.currency})</label>
                <input
                  type="number"
                  value={newCustomerCreditLimit}
                  onChange={(e) => setNewCustomerCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Save & Select Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 80mm Thermal Receipt View (Modal on Sale Completion)     */}
      {/* ======================================================== */}
      {completedSale && (
        <ThermalReceiptModal
          sale={completedSale}
          cashierName={user.fullName}
          customerName={customer?.name}
          changeAmount={changeAmount}
          organization={{
            name: tenant.name,
            currency: tenant.currency,
            taxRate: tenant.taxRate,
            taxInclusive: true,
            receiptHeader: tenant.receiptHeader,
            receiptFooter: tenant.receiptFooter,
          }}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
