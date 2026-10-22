"use client";

import React, { useState } from "react";
import {
  createCustomerAction,
  recordCustomerRepaymentAction,
} from "@/actions/customers";
import {
  Users,
  Search,
  Plus,
  BookOpen,
  DollarSign,
  Award,
  Phone,
  Mail,
  Receipt,
  X,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  UserCheck,
} from "lucide-react";

interface CustomersClientProps {
  data: {
    tenant: {
      name: string;
      currency: string;
    };
    customers: any[];
    metrics: {
      totalCustomers: number;
      totalDebt: number;
      totalLoyalty: number;
      debtorsCount: number;
    };
  };
}

export function CustomersManagementClient({ data }: CustomersClientProps) {
  const { tenant, customers: initialCustomers, metrics } = data;

  const [customers, setCustomers] = useState(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Repayment form
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [repayNotes, setRepayNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const bal = parseFloat(c.creditBalance || "0");
    if (filterDebtOnly && bal <= 0) return false;
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Handle Repayment
  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amt = parseFloat(repayAmount) || 0;
    if (amt <= 0) return;

    setSubmitting(true);
    const res = await recordCustomerRepaymentAction(
      selectedCustomer.id,
      amt,
      repayMethod,
      null,
      repayNotes
    );

    if (res.success && res.newBalance !== undefined) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? { ...c, creditBalance: res.newBalance!.toFixed(2) }
            : c
        )
      );
      setIsRepayModalOpen(false);
      setSelectedCustomer(null);
      setRepayAmount("");
      setRepayNotes("");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer CRM & Credit (Deni) Book
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Manage customer credit limits, track tab debt, log repayments, and award loyalty points.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Total Outstanding Debt
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {tenant.currency} {metrics.totalDebt.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Across {metrics.debtorsCount} customer tabs
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Active Debtors
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.debtorsCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Customers with uncollected tabs</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Registered CRM Profiles
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalCustomers}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Total customer accounts</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Loyalty Points Issued
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.totalLoyalty} pts
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Redeemable by regulars</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterDebtOnly(!filterDebtOnly)}
          className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
            filterDebtOnly
              ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs"
          }`}
        >
          {filterDebtOnly ? "Showing Debtors Only (Tab > 0)" : "Show All Customers"}
        </button>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {searchQuery ? "No matching customers found" : "Clean Customer Directory"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {searchQuery
                ? `No profiles matching "${searchQuery}". Try a different name or phone number.`
                : "All demo customer accounts have been cleared. Add customers during POS checkout or create a profile directly."}
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register New Customer</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Loyalty Points</th>
                  <th className="px-5 py-3.5">Credit / Deni Tab</th>
                  <th className="px-5 py-3.5">Credit Limit</th>
                  <th className="px-5 py-3.5">Recent Orders</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredCustomers.map((c) => {
                  const debt = parseFloat(c.creditBalance || "0");
                  const limit = parseFloat(c.creditLimit || "50000");
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm">
                        {c.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{c.phone || "No phone"}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          {c.loyaltyPoints || 0} pts
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {debt > 0 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                            {tenant.currency} {debt.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Zero Balance</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {tenant.currency} {limit.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                        {c.orders?.length || 0} purchases
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {debt > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setRepayAmount(debt.toString());
                              setIsRepayModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Pay Debt</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">Clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Record Debt Repayment Modal                     */}
      {/* ======================================================== */}
      {isRepayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsRepayModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Settle Customer Debt
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedCustomer.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Outstanding Tab Balance: {tenant.currency} {parseFloat(selectedCustomer.creditBalance).toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleRecordRepayment} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Repayment Amount ({tenant.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayMethod("CASH")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                      repayMethod === "CASH"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Cash Drawer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod("MOBILE_MONEY")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                      repayMethod === "MOBILE_MONEY"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> M-Pesa / Mobile
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Repayment Reference Note
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Cleared via M-Pesa ref #QK89210 or cash receipt"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {submitting ? "Recording Repayment..." : "Confirm & Reduce Customer Debt"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Create Customer Modal                           */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Customer to CRM</h3>

            <form
              action={async (formData) => {
                await createCustomerAction(formData);
                setIsAddModalOpen(false);
                window.location.reload();
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Sarah Mwangi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. +254 712 345 678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Credit Limit ({tenant.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="creditLimit"
                  defaultValue="50000.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Create Customer Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
