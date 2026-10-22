"use client";

import React, { useState } from "react";
import { createExpenseAction, deleteExpenseAction } from "@/actions/expenses";
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  TrendingDown,
  Calendar,
  Trash2,
  X,
  CreditCard,
  Zap,
  Tag,
  Building,
  User,
  CheckCircle2,
} from "lucide-react";

interface ExpensesClientProps {
  data: {
    tenant: {
      name: string;
      currency: string;
    };
    expenses: any[];
    categoryBreakdown: Array<{ category: string; total: number }>;
    metrics: {
      totalCount: number;
      totalExpensesAmount: number;
      todayExpensesAmount: number;
    };
  };
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  RENT: { label: "Premises Rent", color: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300" },
  UTILITIES_KPLC: { label: "KPLC Electricity & Power", color: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
  WATER: { label: "Water & Sanitation", color: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" },
  WAGES: { label: "Staff Daily Wages & Casuals", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" },
  TRANSPORT_BODA: { label: "Transport & Boda Delivery", color: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300" },
  PACKAGING: { label: "Packaging Bags & Boxes", color: "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300" },
  STOCK_PURCHASE: { label: "Direct Stock Purchase", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300" },
  TAXES_LICENSES: { label: "County Single Business Permit & Tax", color: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" },
  MAINTENANCE: { label: "Repairs & Maintenance", color: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200" },
  OTHER: { label: "Sundry & Miscellaneous", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
};

export function ExpensesManagementClient({ data }: ExpensesClientProps) {
  const { tenant, expenses, categoryBreakdown, metrics } = data;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory =
      selectedCategoryFilter === "ALL" || exp.category === selectedCategoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      exp.description.toLowerCase().includes(q) ||
      (exp.recipientName && exp.recipientName.toLowerCase().includes(q)) ||
      (exp.referenceNumber && exp.referenceNumber.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Expenses & Petty Cash
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Log shop utilities, rent, wages, transport, and register drawer petty cash outflows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Total Logged Expenses
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {tenant.currency} {metrics.totalExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Cumulative operational outflows</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Today's Petty Cash Outflow
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {tenant.currency} {metrics.todayExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Disbursed today</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Expense Records
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Itemized disbursement entries</span>
        </div>
      </div>

      {/* Category Breakdown Chips */}
      {categoryBreakdown.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Expense Categories Breakdown
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map((item) => {
              const meta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.OTHER;
              return (
                <div
                  key={item.category}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs"
                >
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${meta.color}`}>
                    {meta.label}
                  </span>
                  <strong className="font-mono text-slate-900 dark:text-white">
                    {tenant.currency} {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses by description, payee recipient, or reference #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs"
        >
          <option value="ALL">All Expense Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">No expense records found</h4>
          <p className="text-xs mt-1">Record daily business expenses to track true net operating profit.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Description & Payee</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Logged By</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredExpenses.map((exp) => {
                const meta = CATEGORY_LABELS[exp.category] || CATEGORY_LABELS.OTHER;
                return (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{exp.description}</div>
                      {exp.recipientName && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Paid to: <strong>{exp.recipientName}</strong>
                        </div>
                      )}
                      {exp.referenceNumber && (
                        <div className="font-mono text-[10px] text-slate-400">Ref: {exp.referenceNumber}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {exp.user?.fullName || "Staff"}
                    </td>
                    <td className="px-5 py-4 font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                      {tenant.currency} {parseFloat(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete expense "${exp.description}"?`)) {
                            await deleteExpenseAction(exp.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Record Operating Expense</h3>

            <form
              action={async (formData) => {
                setIsSubmitting(true);
                await createExpenseAction(formData);
                setIsSubmitting(false);
                setIsAddModalOpen(false);
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. KPLC Token Purchase or Boda Delivery"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Amount ({tenant.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Method</label>
                  <select
                    name="paymentMethod"
                    defaultValue="CASH"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="CASH">Cash Register Drawer</option>
                    <option value="MPESA">M-Pesa Till / Paybill</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue="OTHER"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Payee / Recipient</label>
                  <input
                    type="text"
                    name="recipientName"
                    placeholder="e.g. Kenya Power / Landlord"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Reference #</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    placeholder="e.g. KPLC Account 49201"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    name="expenseDate"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all mt-4"
              >
                {isSubmitting ? "Logging Outflow..." : "Record Expense Outflow"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
