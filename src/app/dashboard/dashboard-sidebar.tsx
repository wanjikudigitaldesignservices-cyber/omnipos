"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { AICopilotDrawer } from "@/components/ai-copilot-drawer";
import { logoutAction } from "@/actions/auth";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Clock,
  Users,
  Settings,
  Monitor,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Truck,
  DollarSign,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardSidebarProps {
  tenant: {
    id: string;
    name: string;
    currency: string;
    businessType?: string;
  };
  user: {
    id: string;
    fullName: string;
    role: "OWNER" | "MANAGER" | "CASHIER";
  };
}

export function DashboardSidebar({ tenant, user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [showCopilot, setShowCopilot] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Executive Analytics", icon: TrendingUp },
    { href: "/dashboard/inventory", label: "Inventory & Stock", icon: Package },
    { href: "/dashboard/suppliers", label: "Suppliers & Vendors", icon: Truck },
    { href: "/dashboard/orders", label: "Sales & Orders", icon: Receipt },
    { href: "/dashboard/expenses", label: "Expenses & Petty Cash", icon: DollarSign },
    { href: "/dashboard/shifts", label: "Shifts & Z-Reports", icon: Clock },
    { href: "/dashboard/customers", label: "Customers & Debts", icon: Users },
    { href: "/dashboard/settings", label: "Business Settings", icon: Settings },
    { href: "/dashboard/help", label: "Help & Diagnostics", icon: HelpCircle },
  ];

  return (
    <>
      <aside className="w-64 xl:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full shrink-0 select-none transition-colors duration-150">
        {/* Brand & Store Header */}
        <div>
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <BrandLogo size="md" />
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate leading-tight">
                  {tenant.name}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {tenant.currency} • {tenant.businessType?.replace("_", " ")}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                Active
              </span>
            </div>
          </div>

          {/* AI Copilot Quick Launcher Bar */}
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={() => setShowCopilot(true)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-violet-600 hover:from-emerald-500 hover:to-violet-500 text-white font-extrabold text-xs flex items-center justify-between shadow-md shadow-emerald-500/20 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse group-hover:rotate-12 transition-transform" />
                <span>AI Business Copilot</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
                Sheng / EN
              </span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md shadow-emerald-600/20 dark:shadow-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Theme Switcher, Launch POS Terminal & User Badge */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Universal Theme Mode Switcher */}
          <ThemeToggle showLabel className="w-full justify-center py-2.5" />

          {/* Launch POS */}
          <Link
            href="/pos"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white dark:text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Monitor className="w-4 h-4" />
            <span>Launch POS Terminal</span>
          </Link>

          {/* User Card */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{user.role}</div>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* OmniAI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        currency={tenant.currency}
        storeName={tenant.name}
      />
    </>
  );
}
