"use client";

import React, { useState } from "react";
import { processRefundAction } from "@/actions/orders";
import { ThermalReceiptModal } from "@/components/thermal-receipt";
import {
  Receipt,
  Search,
  Filter,
  RotateCcw,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Eye,
  ArrowRight,
} from "lucide-react";

interface OrdersClientProps {
  data: {
    tenant: {
      name: string;
      currency: string;
      taxRate: string;
      receiptHeader?: string | null;
      receiptFooter?: string | null;
    };
    orders: any[];
  };
}

export function OrdersManagementClient({ data }: OrdersClientProps) {
  const { tenant, orders: initialOrders } = data;

  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "REFUNDED">("ALL");

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<any | null>(null);
  const [restoreStock, setRestoreStock] = useState(true);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Thermal Receipt Modal
  const [previewReceiptSale, setPreviewReceiptSale] = useState<any | null>(null);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.receiptNumber.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.cashier?.fullName && o.cashier.fullName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Handle Process Refund
  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRefund) return;

    setIsRefunding(true);
    const res = await processRefundAction(
      selectedOrderForRefund.id,
      restoreStock,
      refundReason
    );

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderForRefund.id ? { ...o, status: "REFUNDED" } : o
        )
      );
      setIsRefundModalOpen(false);
      setSelectedOrderForRefund(null);
      setRefundReason("");
    }
    setIsRefunding(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Sales Orders & Returns
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Audit receipt history, re-print 80mm ESC/POS receipts, and process inventory-restoring refunds.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt # (e.g. RCP-2026...), customer, or cashier..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold self-start sm:self-auto">
          {(["ALL", "COMPLETED", "REFUNDED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                statusFilter === st
                  ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Orders" : st === "COMPLETED" ? "Paid" : "Refunded"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Receipt # & Date</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5">Customer / Table</th>
                <th className="px-5 py-3.5">Items Count</th>
                <th className="px-5 py-3.5">Tender Method</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500 text-xs">
                    No sales matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isRefunded = o.status === "REFUNDED";
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white font-mono text-xs">{o.receiptNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {o.cashier?.fullName || "Staff"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {o.tableNumber ? (
                          <span className="text-amber-400 font-bold">Table {o.tableNumber}</span>
                        ) : o.customer ? (
                          <span className="font-bold text-white">{o.customer.name}</span>
                        ) : (
                          <span className="text-slate-500">Walk-in</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-mono">
                        {o.items?.length || 0} lines
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                          {o.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-black text-white text-sm">
                        {tenant.currency} {parseFloat(o.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isRefunded
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewReceiptSale({
                                receiptNumber: o.receiptNumber,
                                totalAmount: parseFloat(o.totalAmount),
                                subtotal: parseFloat(o.subtotal),
                                discountAmount: parseFloat(o.discountAmount || "0"),
                                taxAmount: parseFloat(o.taxAmount || "0"),
                                createdAt: o.createdAt,
                                items: (o.items || []).map((it: any) => ({
                                  productName: it.productName,
                                  quantity: parseFloat(it.quantity),
                                  unitPrice: parseFloat(it.unitPrice),
                                  subtotal: parseFloat(it.subtotal),
                                })),
                                payments: [
                                  {
                                    method: o.paymentMethod,
                                    amount: parseFloat(o.totalAmount),
                                    referenceCode: o.paymentSplitJson?.referenceCode,
                                  },
                                ],
                              });
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
                            title="Print / View Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isRefunded && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForRefund(o);
                                setIsRefundModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Process Refund Modal                            */}
      {/* ======================================================== */}
      {isRefundModalOpen && selectedOrderForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsRefundModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Process Order Return / Refund
              </div>
              <h3 className="text-lg font-bold text-white font-mono">
                {selectedOrderForRefund.receiptNumber}
              </h3>
              <p className="text-xs text-slate-400">
                Amount to refund: {tenant.currency} {parseFloat(selectedOrderForRefund.totalAmount).toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleExecuteRefund} className="space-y-4 pt-2 text-xs">
              {/* Items to be returned */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                  Order Items:
                </span>
                {selectedOrderForRefund.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between text-slate-300">
                    <span>{it.quantity}x {it.productName}</span>
                    <span className="font-mono text-white">{tenant.currency} {parseFloat(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Restore stock checkbox */}
              <div
                onClick={() => setRestoreStock(!restoreStock)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white">Restore Stock Quantities</div>
                  <div className="text-[11px] text-slate-400">
                    Automatically returns items to catalog and logs "RETURN" in audit ledger.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restoreStock}
                  onChange={() => {}}
                  className="accent-emerald-500 w-4 h-4"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer returned damaged packaging or incorrect order"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isRefunding}
                className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
              >
                {isRefunding ? "Processing Refund..." : "Confirm & Execute Return"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: 80mm ESC/POS Receipt View                       */}
      {/* ======================================================== */}
      {previewReceiptSale && (
        <ThermalReceiptModal
          sale={previewReceiptSale}
          cashierName={previewReceiptSale.cashierName || "Staff"}
          organization={{
            name: tenant.name,
            currency: tenant.currency,
            taxRate: tenant.taxRate,
            taxInclusive: true,
            receiptHeader: tenant.receiptHeader,
            receiptFooter: tenant.receiptFooter,
          }}
          onClose={() => setPreviewReceiptSale(null)}
        />
      )}
    </div>
  );
}
