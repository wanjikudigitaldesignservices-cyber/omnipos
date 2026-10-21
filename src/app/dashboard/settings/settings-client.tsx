"use client";

import React, { useState } from "react";
import {
  updateBusinessProfileAction,
  addStaffMemberAction,
  toggleStaffStatusAction,
} from "@/actions/settings";
import { setCashierPin } from "@/actions/auth";
import {
  Settings,
  Building2,
  Users,
  ShieldCheck,
  KeyRound,
  Plus,
  Lock,
  Save,
  Check,
  X,
  AlertCircle,
  Receipt,
  Store,
  UtensilsCrossed,
  Pill,
  Scissors,
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

  const [activeTab, setActiveTab] = useState<"BUSINESS" | "STAFF">("BUSINESS");
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Business Profile & Staff Management
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Configure multi-tenant store settings, tax rates, receipt formatting, and staff cashier PINs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("BUSINESS")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "BUSINESS"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business Identity & Receipts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("STAFF")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
            activeTab === "STAFF"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Cashier PINs ({staff.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BUSINESS PROFILE                                  */}
      {/* ======================================================== */}
      {activeTab === "BUSINESS" && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
          {profileSaved && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Business settings updated successfully!</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base">Store Identity</h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Store / Company Name
              </label>
              <input
                type="text"
                required
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Business / Industry Engine
                </label>
                <select
                  value={bType}
                  onChange={(e) => setBType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold"
                >
                  <option value="RETAIL">Retail & Supermarket</option>
                  <option value="RESTAURANT">Restaurant, Cafe & Dining</option>
                  <option value="PHARMACY_AGROVET">Pharmacy, Chemist & Agrovet</option>
                  <option value="SERVICE">Salon, Spa & Professional Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Store Currency
                </label>
                <select
                  value={bCurrency}
                  onChange={(e) => setBCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold"
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
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Sales Tax / VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={bTaxRate}
                onChange={(e) => setBTaxRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
              />
            </div>
          </div>

          {/* 80mm ESC/POS Thermal Receipt Formatting */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>80mm Thermal Receipt Header & Footer</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Receipt Header Text
              </label>
              <input
                type="text"
                value={bHeader}
                onChange={(e) => setBHeader(e.target.value)}
                placeholder="e.g. Apex Hypermarket - Nairobi CBD - PIN: P051234567Z"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Receipt Footer Text
              </label>
              <input
                type="text"
                value={bFooter}
                onChange={(e) => setBFooter(e.target.value)}
                placeholder="e.g. Goods once sold in good order are appreciated. Karibu tena!"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
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
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Staff members can log in with email/password or switch quickly at the POS using their 4-digit PIN.
            </p>
            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cashier / Staff</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Full Name</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">System Role</th>
                    <th className="px-5 py-3.5">POS Quick PIN</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white text-sm">
                        {s.fullName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono">
                        {s.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.role === "OWNER"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : s.role === "MANAGER"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {s.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {s.hasPin ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1 w-fit">
                            <KeyRound className="w-3 h-3" /> Configured (••••)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">No PIN Set</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
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
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                          >
                            Set PIN
                          </button>
                          {s.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleStaff(s.id, s.isActive)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                s.isActive
                                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
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
      {/* MODAL 1: Add New Staff Member                            */}
      {/* ======================================================== */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAddStaffModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white">Add Staff / Cashier Account</h3>

            {staffError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Kevin Maina"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. kevin@apex.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="CASHIER">CASHIER (POS Only)</option>
                    <option value="MANAGER">MANAGER (Full ERP)</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">4-Digit Terminal PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-emerald-500/20"
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
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setPinTargetUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">Set 4-Digit Quick PIN</h3>
              <p className="text-xs text-slate-400">{pinTargetUser.fullName}</p>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Enter 4-Digit Numeric PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPinCode}
                  onChange={(e) => setNewPinCode(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-2xl font-black tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={newPinCode.length !== 4}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50"
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
