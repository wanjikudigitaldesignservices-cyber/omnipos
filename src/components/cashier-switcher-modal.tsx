"use client";

import React, { useState } from "react";
import { switchCashierByPin } from "@/actions/auth";
import { KeyRound, X, Check, Delete, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface CashierSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCashierName: string;
}

export function CashierSwitcherModal({
  isOpen,
  onClose,
  currentCashierName,
}: CashierSwitcherModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin("");
    setError(null);
  };

  const submitPin = async (inputPin: string) => {
    setLoading(true);
    setError(null);

    const res = await switchCashierByPin(inputPin);
    if (res.success && res.cashier) {
      setSuccessName(res.cashier.fullName);
      setTimeout(() => {
        setSuccessName(null);
        setPin("");
        setLoading(false);
        onClose();
        router.refresh();
      }, 700);
    } else {
      setError(res.error || "Invalid PIN. Try again.");
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Switch Cashier Terminal</h3>
          <p className="text-xs text-slate-400">
            Active: <span className="font-semibold text-emerald-400">{currentCashierName}</span>
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border transition-all ${
                pin.length > index
                  ? "bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50"
                  : "bg-slate-800 border-slate-700"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 text-center text-xs font-semibold text-rose-400 bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">
            {error}
          </div>
        )}

        {successName && (
          <div className="mb-4 text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2">
            <UserCheck className="w-4 h-4" /> Switched to {successName}!
          </div>
        )}

        {/* Touch / Click Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={loading}
              onClick={() => handleDigit(digit)}
              className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg border border-slate-700/50 shadow-sm cursor-pointer transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={handleClear}
            className="py-3.5 rounded-2xl bg-slate-950 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigit("0")}
            className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg border border-slate-700/50 cursor-pointer transition-all"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleBackspace}
            className="py-3.5 rounded-2xl bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-500">
          Enter your 4-digit staff PIN configured by store management.
        </p>
      </div>
    </div>
  );
}
