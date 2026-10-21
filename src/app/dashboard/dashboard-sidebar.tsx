"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
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
} from "lucide-react";

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

  const navItems = [
    { href: "/dashboard", label: "Executive Analytics", icon: LayoutDashboard },
    { href: "/dashboard/inventory", label: "Inventory & Stock", icon: Package },
    { href: "/dashboard/orders", label: "Sales & Refunds", icon: Receipt },
    { href: "/dashboard/shifts", label: "Shifts & Z-Reports", icon: Clock },
    { href: "/dashboard/customers", label: "CRM & Debt Manager", icon: Users },
    { href: "/dashboard/settings", label: "Business & Staff", icon: Settings },
  ];

  return (
    <aside className="w-64 xl:w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full shrink-0 select-none">
      {/* Brand & Store Header */}
      <div>
        <div className="p-6 border-b border-slate-800">
          <BrandLogo size="md" />
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <h4 className="font-extrabold text-white text-xs truncate leading-tight">
                {tenant.name}
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                {tenant.currency} • {tenant.businessType?.replace("_", " ")}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              Active
            </span>
          </div>
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
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Launch POS Terminal & User Badge */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Launch POS */}
        <Link
          href="/pos"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Monitor className="w-4 h-4" />
          <span>Launch POS Terminal</span>
        </Link>

        {/* User Card */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-white text-xs truncate leading-tight">
                {user.fullName}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">{user.role}</div>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
