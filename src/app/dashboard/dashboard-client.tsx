"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowRight,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ExecutiveAnalyticsProps {
  data: {
    tenant: {
      name: string;
      currency: string;
      taxRate: string;
      businessType: string;
    };
    user: {
      fullName: string;
      role: string;
    };
    metrics: {
      todayRevenue: number;
      todayGrossProfit: number;
      todayOrdersCount: number;
      profitMarginPercent: string;
      totalOutstandingDebt: number;
      lowStockCount: number;
      expiringCount: number;
      hasActiveShift: boolean;
      activeShift?: any;
    };
    paymentBreakdown: Array<{
      method: string;
      key: string;
      count: number;
      total: number;
    }>;
    salesTrend: Array<{
      date: string;
      revenue: number;
      profit: number;
      orders: number;
    }>;
    lowStockAlerts: any[];
    expiringAlerts: any[];
    recentOrders: any[];
  };
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

export function DashboardExecutiveClient({ data }: ExecutiveAnalyticsProps) {
  const { tenant, metrics, paymentBreakdown, salesTrend, lowStockAlerts, expiringAlerts, recentOrders } = data;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Executive Cockpit & Real-Time Aggregates
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {tenant.name} Back-Office
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time financial performance, inventory valuation, and multi-tender breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Open Register Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Today's Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {tenant.currency} {metrics.todayRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="font-bold text-emerald-400">{metrics.todayOrdersCount} orders</span>
            <span>completed today</span>
          </div>
        </div>

        {/* Net Gross Profit */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Net Gross Profit</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            {tenant.currency} {metrics.todayGrossProfit.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="font-bold text-white">{metrics.profitMarginPercent}% margin</span>
            <span>(Sales minus Cost Price)</span>
          </div>
        </div>

        {/* Outstanding Deni / Tabs */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Customer Debt (Deni)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {tenant.currency} {metrics.totalOutstandingDebt.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <Link href="/dashboard/customers" className="text-emerald-400 font-bold hover:underline">
              View CRM Ledger &rarr;
            </Link>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Urgent Stock Alerts</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            {metrics.lowStockCount + metrics.expiringCount}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span className="text-amber-400 font-bold">{metrics.lowStockCount} low</span>
            <span>•</span>
            <span className="text-red-400 font-bold">{metrics.expiringCount} expiring</span>
          </div>
        </div>
      </div>

      {/* Charts Section: 7-Day Trend & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue & Profit Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">7-Day Sales & Profit Performance</h3>
              <p className="text-xs text-slate-400">Daily gross revenue vs. cost of goods margin</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-3 rounded-md bg-indigo-500" />
                <span>Gross Profit</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="#6366f1" radius={[6, 6, 0, 0]} name="Gross Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Split Pie Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Payment Method Split</h3>
            <p className="text-xs text-slate-400">Tender breakdown of today's sales</p>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown.filter((p) => p.total > 0)}
                  dataKey="total"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            {paymentBreakdown.map((item, idx) => (
              <div key={item.key} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span>{item.method}</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {tenant.currency} {item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Alerts & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock & Expiry Alerts */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low-Stock & Expiry Alarms</span>
            </h3>
            <Link
              href="/dashboard/inventory"
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              Inventory Management <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockAlerts.length === 0 && expiringAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">All inventory is at healthy stock levels.</p>
            ) : (
              <>
                {lowStockAlerts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">SKU: {p.sku || "N/A"}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                      {p.stockQuantity} {p.unit || "pcs"} left
                    </span>
                  </div>
                ))}

                {expiringAlerts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{p.name}</div>
                      <div className="text-[10px] text-red-400 font-medium">
                        Expires: {new Date(p.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                      Expiring Soon
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Today's Recent Sales Activity */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Today's Transactions</span>
            </h3>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              All Orders & Refunds <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded yet today.</p>
            ) : (
              recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-xs font-mono">{o.receiptNumber}</div>
                    <div className="text-[10px] text-slate-400">
                      {o.paymentMethod.replace("_", " ")} • {o.items?.length || 0} items
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-xs block">
                      {tenant.currency} {parseFloat(o.totalAmount).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
