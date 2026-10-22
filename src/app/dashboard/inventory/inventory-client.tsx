"use client";

import React, { useState } from "react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  receiveStockAction,
  createCategoryAction,
} from "@/actions/inventory";
import {
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Store,
} from "lucide-react";

interface InventoryClientProps {
  data: {
    tenant: {
      name: string;
      currency: string;
      businessType: string;
    };
    categories: any[];
    products: any[];
    recentLedger: any[];
    metrics: {
      totalItems: number;
      totalCostValuation: number;
      totalRetailValuation: number;
      lowStockCount: number;
      outOfStockCount: number;
    };
  };
}

export function InventoryManagementClient({ data }: InventoryClientProps) {
  const { tenant, categories, products, recentLedger, metrics } = data;

  const [activeTab, setActiveTab] = useState<"CATALOG" | "LEDGER">("CATALOG");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Selected Product for Edit / Restock
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Form states
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [restockNotes, setRestockNotes] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#10b981");

  // Loading state
  const [submitting, setSubmitting] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseFloat(restockQty) || 0;
    if (qty <= 0) return;

    setSubmitting(true);
    const newCost = restockCost ? parseFloat(restockCost) : undefined;
    await receiveStockAction(selectedProduct.id, qty, newCost, restockNotes);
    setSubmitting(false);
    setIsRestockModalOpen(false);
    setRestockQty("");
    setRestockCost("");
    setRestockNotes("");
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setSubmitting(true);
    await createCategoryAction(newCatName, newCatColor);
    setSubmitting(false);
    setIsAddCategoryModalOpen(false);
    setNewCatName("");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Inventory & Stock Valuation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Full product catalog CRUD, supplier restock shipments, and strict audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>New Category</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Valuation & Stock Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Total Cost Valuation
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {tenant.currency} {metrics.totalCostValuation.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Cost of inventory at purchase</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Retail Sales Value
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {tenant.currency} {metrics.totalRetailValuation.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Projected revenue at current prices</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Potential Gross Profit
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {tenant.currency} {(metrics.totalRetailValuation - metrics.totalCostValuation).toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Total unrealized store profit</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Low / Out-of-Stock Items
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {metrics.lowStockCount + metrics.outOfStockCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {metrics.outOfStockCount} out of stock • {metrics.lowStockCount} below threshold
          </span>
        </div>
      </div>

      {/* Tabs Switcher: Products vs Ledger */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("CATALOG")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "CATALOG"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-black"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("LEDGER")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "LEDGER"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-black"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Inventory Audit Ledger ({recentLedger.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRODUCT CATALOG                                   */}
      {/* ======================================================== */}
      {activeTab === "CATALOG" && (
        <div className="space-y-4">
          {/* Controls: Category Pills & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, barcode, or SKU..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    selectedCategory === c.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Table or Empty State */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-xs">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {searchQuery ? "No matching products found" : "Clean Catalog — Ready for Your Products"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {searchQuery
                    ? `No items found matching "${searchQuery}". Try a different search term or add a new product.`
                    : "All demo products have been cleared. Click below to add your first store item or shipment."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add First Product</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Product Name & Barcode</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Cost Price</th>
                      <th className="px-5 py-3.5">Selling Price</th>
                      <th className="px-5 py-3.5">Gross Margin</th>
                      <th className="px-5 py-3.5">Stock Level</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredProducts.map((p) => {
                      const cost = parseFloat(p.costPrice) || 0;
                      const price = parseFloat(p.sellingPrice) || 0;
                      const stock = parseFloat(p.stockQuantity) || 0;
                      const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
                      const isLow = stock <= parseFloat(p.lowStockThreshold || "5");

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {p.barcode && <span>Bar: {p.barcode}</span>}
                              {p.sku && <span>SKU: {p.sku}</span>}
                              {p.batchNumber && <span className="text-amber-500">Lot: {p.batchNumber}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                            {p.category?.name || "General"}
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">
                            {tenant.currency} {cost.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                            {tenant.currency} {price.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            +{margin}%
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-mono font-bold inline-flex items-center gap-1 ${
                                stock <= 0
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                  : isLow
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {stock} {p.unit || "pcs"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setIsRestockModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold cursor-pointer transition-all"
                              >
                                Receive Stock
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Delete "${p.name}"?`)) {
                                    await deleteProductAction(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 cursor-pointer transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: INVENTORY AUDIT LEDGER                            */}
      {/* ======================================================== */}
      {activeTab === "LEDGER" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-xs">
          {recentLedger.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold">No inventory movements recorded yet.</p>
              <p className="text-xs mt-1">Stock updates, purchases, and sales will appear in this audit log.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Movement Type</th>
                    <th className="px-5 py-3.5">Qty Change</th>
                    <th className="px-5 py-3.5">Previous &rarr; New Stock</th>
                    <th className="px-5 py-3.5">Logged By</th>
                    <th className="px-5 py-3.5">Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium font-mono text-[11px]">
                  {recentLedger.map((row) => {
                    const isPositive = parseFloat(row.quantityChange) > 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                          {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white font-sans text-xs">
                          {row.product?.name || "Deleted Product"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              row.type === "SALE"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : row.type === "RESTOCK"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : row.type === "RETURN"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {isPositive ? `+${row.quantityChange}` : row.quantityChange}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                          {row.previousStock} &rarr; <span className="text-slate-900 dark:text-white font-bold">{row.newStock}</span>
                        </td>
                        <td className="px-5 py-3.5 font-sans text-slate-500 dark:text-slate-400">
                          {row.user?.fullName || "System Engine"}
                        </td>
                        <td className="px-5 py-3.5 font-sans text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {row.referenceNote || "Automated transaction log"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: Receive Stock / Restock Modal                   */}
      {/* ======================================================== */}
      {isRestockModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsRestockModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                Supplier Stock Inflow
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current Stock: {selectedProduct.stockQuantity} {selectedProduct.unit || "pcs"}
              </p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Quantity Received ({selectedProduct.unit || "pcs"})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  New Unit Cost Price ({tenant.currency}) - Optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  placeholder={selectedProduct.costPrice}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Delivery / Supplier Reference Note
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Invoice #PO-9812 from Premier Distributors"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" /> Receive & Update Inventory Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Add New Product Modal                           */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative my-6">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add New Product to Catalog</h3>

            <form
              action={async (formData) => {
                await createProductAction(formData);
                setIsAddModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Paracetamol 500mg or 2kg Cane Sugar"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <select
                    name="categoryId"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue="pcs"
                    placeholder="pcs, kg, ltr, portion"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    placeholder="e.g. 616110123456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SKU Code</label>
                  <input
                    type="text"
                    name="sku"
                    placeholder="e.g. MED-PAR-01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Cost Price ({tenant.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    defaultValue="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Selling Price ({tenant.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    name="sellingPrice"
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Opening Stock Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stockQuantity"
                    defaultValue="10.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Low-Stock Alert Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    name="lowStockThreshold"
                    defaultValue="5.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Batch & Expiry for Pharma/Agrovet */}
              {tenant.businessType === "PHARMACY_AGROVET" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block font-bold text-amber-600 dark:text-amber-400 mb-1">Batch / Lot #</label>
                    <input
                      type="text"
                      name="batchNumber"
                      placeholder="e.g. B-9941"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-600 dark:text-amber-400 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
              >
                Create Product & Initialize Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Edit Product Modal                              */}
      {/* ======================================================== */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative my-6">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Product</h3>

            <form
              action={async (formData) => {
                await updateProductAction(selectedProduct.id, formData);
                setIsEditModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={selectedProduct.name}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Cost Price ({tenant.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    defaultValue={selectedProduct.costPrice}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Selling Price ({tenant.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    name="sellingPrice"
                    defaultValue={selectedProduct.sellingPrice}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={selectedProduct.sku || ""}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    defaultValue={selectedProduct.barcode || ""}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Create Category Modal                           */}
      {/* ======================================================== */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Create New Category</h3>

            <form onSubmit={handleAddCategory} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Dairy & Frozen"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Color Tag</label>
                <div className="flex gap-2">
                  {["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#ef4444"].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewCatColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all ${
                        newCatColor === hex ? "border-slate-900 dark:border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
