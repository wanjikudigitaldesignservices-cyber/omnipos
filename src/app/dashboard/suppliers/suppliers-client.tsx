"use client";

import React, { useState } from "react";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  recordSupplierPaymentAction,
} from "@/actions/suppliers";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  CreditCard,
  FileText,
  Camera,
  Layers,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { VisionInvoiceModal } from "@/components/vision-invoice-modal";

interface SuppliersClientProps {
  data: {
    tenant: {
      name: string;
      currency: string;
    };
    suppliers: any[];
    invoices: any[];
    metrics: {
      totalSuppliers: number;
      totalBalanceOwed: number;
      recentInvoicesCount: number;
    };
  };
}

export function SuppliersManagementClient({ data }: SuppliersClientProps) {
  const { tenant, suppliers, invoices, metrics } = data;

  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "INVOICES">("DIRECTORY");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [paymentNote, setPaymentNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q))
    );
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    setIsSubmitting(true);
    await recordSupplierPaymentAction(selectedSupplier.id, amount, paymentMethod, paymentNote);
    setIsSubmitting(false);
    setIsPaymentModalOpen(false);
    setSelectedSupplier(null);
    setPaymentAmount("");
    setPaymentNote("");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Suppliers & Procurement
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Manage FMCG distributors, wholesale delivery notes, M-Pesa paybills, and credit balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsVisionModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Delivery Docket</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Registered Suppliers
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalSuppliers}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Active FMCG distributors</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Total Balance Owed
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">
            {tenant.currency} {metrics.totalBalanceOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Outstanding accounts payable</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Procurement Dockets
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {metrics.recentInvoicesCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Scanned delivery receipts</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("DIRECTORY")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "DIRECTORY"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-black"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Supplier Directory ({suppliers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("INVOICES")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "INVOICES"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-black"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Delivery Dockets ({invoices.length})</span>
        </button>
      </div>

      {/* TAB 1: DIRECTORY */}
      {activeTab === "DIRECTORY" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers by company name, contact person, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
              <Truck className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">No suppliers found</h4>
              <p className="text-xs mt-1">Add your FMCG distributors or wholesalers to track paybills and dockets.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 py-3.5">Supplier / Company</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Payment Terms</th>
                    <th className="px-5 py-3.5">Paybill / Banking</th>
                    <th className="px-5 py-3.5">Balance Owed</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredSuppliers.map((s) => {
                    const bal = parseFloat(s.outstandingBalance) || 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</div>
                          {s.contactPerson && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Attn: {s.contactPerson}
                            </div>
                          )}
                          {s.address && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {s.address}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {s.phone && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${s.phone}`}
                                className="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                              >
                                {s.phone}
                              </a>
                              <a
                                href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="text-emerald-500 hover:text-emerald-600"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                          {s.email && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {s.email}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {s.paymentTerms.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {s.mpesaPaybillNumber ? (
                            <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-white">
                              Paybill: {s.mpesaPaybillNumber}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Cash / Direct</span>
                          )}
                          {s.bankDetails && (
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">{s.bankDetails}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold">
                          {bal > 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-black">
                              {tenant.currency} {bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              Settled (0.00)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {bal > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSupplier(s);
                                  setPaymentAmount(bal.toString());
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold transition cursor-pointer"
                              >
                                Record Payout
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSupplier(s);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Delete supplier "${s.name}"?`)) {
                                  await deleteSupplierAction(s.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition"
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
      )}

      {/* TAB 2: INVOICES & DOCKETS */}
      {activeTab === "INVOICES" && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">No delivery dockets recorded</h4>
              <p className="text-xs mt-1">Use the "Scan Delivery Docket" button to ingest receipts with AI.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Items Count</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber || "N/A"}
                      </td>
                      <td className="px-5 py-4 font-bold">{inv.supplierName}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "Today"}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {tenant.currency} {parseFloat(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        {Array.isArray(inv.extractedItemsJson) ? `${inv.extractedItemsJson.length} items` : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Supplier Payout Modal */}
      {isPaymentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Record Supplier Payment</h3>
            <p className="text-xs text-slate-500">
              Payee: <strong className="text-slate-900 dark:text-white">{selectedSupplier.name}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Amount ({tenant.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="MPESA">M-Pesa Paybill / Till</option>
                  <option value="CASH">Cash Register Drawer</option>
                  <option value="BANK">Bank Electronic Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Reference / Note</label>
                <input
                  type="text"
                  placeholder="e.g. M-Pesa Ref QJD81992"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all mt-4"
              >
                {isSubmitting ? "Processing Payout..." : "Confirm & Reduce Balance"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Add New Supplier</h3>

            <form
              action={async (formData) => {
                await createSupplierAction(formData);
                setIsAddModalOpen(false);
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Bidco Africa Ltd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    placeholder="e.g. John Mwangi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. 0712345678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    defaultValue="CASH_ON_DELIVERY"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    <option value="NET_7">Net 7 Days</option>
                    <option value="NET_14">Net 14 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">M-Pesa Paybill #</label>
                  <input
                    type="text"
                    name="mpesaPaybillNumber"
                    placeholder="e.g. 400200"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Delivery Address / Depot</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Industrial Area, Nairobi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all mt-4"
              >
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vision Invoice Scanner Modal */}
      <VisionInvoiceModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        currency={tenant.currency}
        onSuccess={() => {
          setIsVisionModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
