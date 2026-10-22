"use client";

import React, { useState } from "react";
import {
  updateBusinessProfileAction,
  addStaffMemberAction,
  toggleStaffStatusAction,
  clearAllDemoDataAction,
} from "@/actions/settings";
import { setCashierPin } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Building2,
  Users,
  ShieldCheck,
  KeyRound,
  Plus,
  Save,
  Check,
  X,
  AlertCircle,
  Receipt,
  Trash2,
  Palette,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface SettingsClientProps {
  data: {
    tenant: {
      id: string;
      name: string;
      businessType: "RETAIL" | "RESTAURANT" | "PHARMACY_AGROVET" | "SERVICE";
      currency: string;
      taxRate: string;
      receiptHeader?: string | null;
      receiptFooter?: string | null;
    };
    currentUser: {
      id: string;
      role: string;
    };
    staff: Array<{
      id: string;
      fullName: string;
      email: string;
      role: string;
      isActive: boolean;
      hasPin: boolean;
      createdAt: any;
    }>;
  };
}

export function SettingsManagementClient({ data }: SettingsClientProps) {
  const { tenant, currentUser, staff: initialStaff } = data;

  const [activeTab, setActiveTab] = useState<"BUSINESS" | "STAFF" | "APPEARANCE_DATA">("BUSINESS");
  const [staff, setStaff] = useState(initialStaff);

  // Business form state
  const [bName, setBName] = useState(tenant.name);
  const [bType, setBType] = useState(tenant.businessType);
  const [bCurrency, setBCurrency] = useState(tenant.currency);
  const [bTaxRate, setBTaxRate] = useState(tenant.taxRate);
  const [bHeader, setBHeader] = useState(tenant.receiptHeader || "");
  const [bFooter, setBFooter] = useState(tenant.receiptFooter || "");
  const [profileSaved, setProfileSaved] = useState(false);

  // Add Staff Modal
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<"OWNER" | "MANAGER" | "CASHIER">("CASHIER");
  const [staffPin, setStaffPin] = useState("");
  const [staffError, setStaffError] = useState<string | null>(null);

  // Update PIN Modal
  const [pinTargetUser, setPinTargetUser] = useState<any | null>(null);
  const [newPinCode, setNewPinCode] = useState("");

  // Clear Demo Data Modal & State
  const [isClearDemoModalOpen, setIsClearDemoModalOpen] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [demoClearedMsg, setDemoClearedMsg] = useState(false);

  // Handle Save Business Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", bName);
    fd.append("businessType", bType);
    fd.append("currency", bCurrency);
    fd.append("taxRate", bTaxRate);
    fd.append("receiptHeader", bHeader);
    fd.append("receiptFooter", bFooter);

    const res = await updateBusinessProfileAction(fd);
    if (res.success) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  // Handle Add Staff
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);

    const fd = new FormData();
    fd.append("fullName", staffName);
    fd.append("email", staffEmail);
    fd.append("password", staffPassword);
    fd.append("role", staffRole);
    fd.append("pin", staffPin);

    const res = await addStaffMemberAction(fd);
    if (res.success && res.user) {
      setStaff([
        {
          id: res.user.id,
          fullName: res.user.fullName,
          email: res.user.email,
          role: res.user.role,
          isActive: res.user.isActive,
          hasPin: !!res.user.pinCodeHash,
          createdAt: new Date(),
        },
        ...staff,
      ]);
      setIsAddStaffModalOpen(false);
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffPin("");
    } else {
      setStaffError(res.error || "Failed to add staff member.");
    }
  };

  // Toggle Staff status
  const handleToggleStaff = async (userId: string, currentStatus: boolean) => {
    const res = await toggleStaffStatusAction(userId, !currentStatus);
    if (res.success) {
      setStaff((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, isActive: !currentStatus } : s))
      );
    }
  };

  // Set PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTargetUser || newPinCode.length !== 4) return;

    const res = await setCashierPin(pinTargetUser.id, newPinCode);
    if (res.success) {
      setStaff((prev) =>
        prev.map((s) => (s.id === pinTargetUser.id ? { ...s, hasPin: true } : s))
      );
      setPinTargetUser(null);
      setNewPinCode("");
    }
  };

  // Purge Demo Data
  const handleClearDemoData = async () => {
    setClearingDemo(true);
    const res = await clearAllDemoDataAction();
    setClearingDemo(false);
    if (res.success) {
      setIsClearDemoModalOpen(false);
      setDemoClearedMsg(true);
      setTimeout(() => setDemoClearedMsg(false), 4000);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-150">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Business Profile & Store Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
          Configure multi-tenant store settings, tax rates, thermal receipt branding, themes, and staff PINs.
        </p>
      </div>

      {demoClearedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>All demo data successfully cleared! Your store now has a 100% clean catalog and empty ledger.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("BUSINESS")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "BUSINESS"
              ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Store & Receipt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("STAFF")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "STAFF"
              ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & PINs ({staff.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("APPEARANCE_DATA")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "APPEARANCE_DATA"
              ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance & Data Purge</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BUSINESS PROFILE                                  */}
      {/* ======================================================== */}
      {activeTab === "BUSINESS" && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
          {profileSaved && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm">
              <Check className="w-4 h-4" />
              <span>Business settings updated successfully!</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Store Identity</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                Store / Company Name
              </label>
              <input
                type="text"
                required
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                  Business / Industry Engine
                </label>
                <select
                  value={bType}
                  onChange={(e) => setBType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value="RETAIL">Retail & Supermarket</option>
                  <option value="RESTAURANT">Restaurant, Cafe & Dining</option>
                  <option value="PHARMACY_AGROVET">Pharmacy, Chemist & Agrovet</option>
                  <option value="SERVICE">Salon, Spa & Professional Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                  Store Currency
                </label>
                <select
                  value={bCurrency}
                  onChange={(e) => setBCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="TZS">TZS - Tanzanian Shilling</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                Sales Tax / VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={bTaxRate}
                onChange={(e) => setBTaxRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>

          {/* 80mm ESC/POS Thermal Receipt Formatting */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>80mm Thermal Receipt Header & Footer</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                Receipt Header Text
              </label>
              <input
                type="text"
                value={bHeader}
                onChange={(e) => setBHeader(e.target.value)}
                placeholder="e.g. Apex Hypermarket - Nairobi CBD - PIN: P051234567Z"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                Receipt Footer Text
              </label>
              <input
                type="text"
                value={bFooter}
                onChange={(e) => setBFooter(e.target.value)}
                placeholder="e.g. Goods once sold in good order are appreciated. Karibu tena!"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Configuration</span>
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STAFF & CASHIER PINS                              */}
      {/* ======================================================== */}
      {activeTab === "STAFF" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Staff members can log in with email/password or switch quickly at the POS using their 4-digit PIN.
            </p>
            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cashier / Staff</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Full Name</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">System Role</th>
                    <th className="px-5 py-3.5">POS Quick PIN</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-900 dark:text-slate-100">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm">
                        {s.fullName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                        {s.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.role === "OWNER"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20"
                              : s.role === "MANAGER"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                          }`}
                        >
                          {s.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {s.hasPin ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1 w-fit">
                            <KeyRound className="w-3 h-3" /> Configured (••••)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No PIN Set</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                              : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                          }`}
                        >
                          {s.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPinTargetUser(s);
                              setNewPinCode("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
                          >
                            Set PIN
                          </button>
                          {s.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleStaff(s.id, s.isActive)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                s.isActive
                                  ? "bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                              }`}
                            >
                              {s.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: APPEARANCE & DATA PURGE                           */}
      {/* ======================================================== */}
      {activeTab === "APPEARANCE_DATA" && (
        <div className="space-y-6 max-w-3xl">
          {/* Appearance Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Store Theme & Visual Mode</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Choose between Light Mode (optimal for daylight counter registers) and Dark Mode.
                </p>
              </div>
              <ThemeToggle showLabel size="md" />
            </div>
          </div>

          {/* Danger Zone: Clear Demo Records */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Data Reset & Demo Data Purge</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                  Remove all demo inventory products, categories, sample customer profiles, and test sales orders for <strong>{tenant.name}</strong>. Your store will start with a 100% clean slate, while your staff logins and business settings are safely preserved.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsClearDemoModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-red-600/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Purge All Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Clear Demo Confirmation                           */}
      {/* ======================================================== */}
      {isClearDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsClearDemoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Demo Data Purge</h3>
                <p className="text-xs text-slate-500">Irreversible action for {tenant.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete all sample inventory items, test orders, and dummy customer debts? Your store catalog will be completely reset so you can add your real products.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearDemoModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearingDemo}
                onClick={handleClearDemoData}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {clearingDemo ? "Clearing..." : "Yes, Purge Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: Add New Staff Member                            */}
      {/* ======================================================== */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddStaffModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Staff / Cashier Account</h3>

            {staffError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Kevin Maina"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. kevin@apex.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-400 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-400 mb-1">Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="CASHIER">CASHIER (POS Only)</option>
                    <option value="MANAGER">MANAGER (Full ERP)</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-400 mb-1">4-Digit Terminal PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Set / Update Quick PIN Modal                    */}
      {/* ======================================================== */}
      {pinTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setPinTargetUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Set 4-Digit Quick PIN</h3>
              <p className="text-xs text-slate-500">{pinTargetUser.fullName}</p>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                  Enter 4-Digit Numeric PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPinCode}
                  onChange={(e) => setNewPinCode(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-2xl font-black tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={newPinCode.length !== 4}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                Save PIN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
