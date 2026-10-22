"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { CashierSwitcherModal } from "@/components/cashier-switcher-modal";
import { AICopilotDrawer } from "@/components/ai-copilot-drawer";
import { logoutAction } from "@/actions/auth";
import {
  Monitor,
  LayoutDashboard,
  Package,
  Receipt,
  Clock,
  Users,
  Settings,
  KeyRound,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

interface WorkspaceNavProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "OWNER" | "MANAGER" | "CASHIER";
    pinCodeHash?: string | null;
  };
  tenant: {
    id: string;
    name: string;
    currency: string;
    businessType?: string;
  };
  activeShift?: {
    id: string;
    openingFloat: string;
    expectedCash: string;
    status: string;
  } | null;
}

export function WorkspaceNav({ user, tenant, activeShift }: WorkspaceNavProps) {
  const pathname = usePathname();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);

  const isPos = pathname.startsWith("/pos");
  const isBackOfficeUser = user.role === "OWNER" || user.role === "MANAGER";

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 transition-colors duration-150">
        {/* Left: Store identity & Module switch */}
        <div className="flex items-center gap-4 sm:gap-6">
          <BrandLogo size="sm" />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">{tenant.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {tenant.businessType?.replace("_", " ") || "RETAIL"}
            </span>
          </div>
        </div>

        {/* Center: Shift status or quick link */}
        <div className="hidden md:flex items-center gap-3">
          {activeShift && activeShift.status === "OPEN" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Shift Active (Float: {tenant.currency} {parseFloat(activeShift.openingFloat).toFixed(0)})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
              <span>Register Drawer Closed</span>
            </div>
          )}

          {isPos && isBackOfficeUser && (
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Back-Office ERP
            </Link>
          )}

          {!isPos && (
            <Link
              href="/pos"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <Monitor className="w-3.5 h-3.5" />
              Launch POS Terminal
            </Link>
          )}
        </div>

        {/* Right: AI Copilot, Theme Toggle, Cashier Switcher & Auth actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* OmniAI Copilot Quick Launcher Button */}
          <button
            type="button"
            onClick={() => setShowCopilotDrawer(true)}
            title="Open OmniAI Copilot (Sheng / Swahili / English store query)"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 animate-pulse hover:animate-none"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Universal Theme Switcher */}
          <ThemeToggle size="sm" />

          {/* Cashier PIN Switcher */}
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            title="Lock terminal and switch cashier in 2 seconds"
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock / Switch Staff</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
              {user.fullName.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-white leading-none">{user.fullName}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">{user.role}</div>
            </div>
          </div>

          {/* Full Sign-Out */}
          <form action={logoutAction}>
            <button
              type="submit"
              title="Full account sign-out"
              className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800/60 dark:hover:bg-red-500/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/60 hover:border-red-200 dark:hover:border-red-500/30 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* OmniAI Multilingual Copilot Drawer */}
      <AICopilotDrawer
        isOpen={showCopilotDrawer}
        onClose={() => setShowCopilotDrawer(false)}
        currency={tenant.currency}
        storeName={tenant.name}
      />

      {/* Cashier 4-digit PIN switcher modal */}
      <CashierSwitcherModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        currentCashierName={user.fullName}
      />
    </>
  );
}
