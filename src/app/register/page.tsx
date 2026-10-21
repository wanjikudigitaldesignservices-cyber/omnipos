"use client";

import React, { useState } from "react";
import { registerSME } from "@/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Receipt, Users, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await registerSME(formData);

    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
    } else {
      setError(result.error || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-slate-950 text-slate-100">
      {/* Left Column: Brand Hero & Value Proposition */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        
        <div className="relative z-10">
          <BrandLogo size="lg" />
          <div className="mt-16 space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5" /> Next-Gen Point of Sale & ERP for African SMEs
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              One Unified Engine for Retail, Chemist, Agrovet & Dining.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Experience the speed of an offline register with the intelligence of cloud ERP. Zero fake mock data, 100% powered by Neon Serverless PostgreSQL.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 grid grid-cols-2 gap-4 my-8">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Receipt className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="font-semibold text-sm text-white">Split Payments</h3>
            <p className="text-xs text-slate-400 mt-1">Split seamlessly across Cash, M-Pesa Till & Customer Credit.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Users className="w-5 h-5 text-teal-400 mb-2" />
            <h3 className="font-semibold text-sm text-white">Deni / Credit Ledger</h3>
            <p className="text-xs text-slate-400 mt-1">Never lose track of customer balances with real-time repayment logging.</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Multi-Tenant Neon PostgreSQL
          </span>
          <span>© 2026 OmniPOS Cloud</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <BrandLogo size="md" className="mb-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Create your SME Workspace
            </h2>
            <p className="text-sm text-slate-400">
              Set up your store in seconds. No credit card required.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business / Store Name
              </label>
              <input
                type="text"
                name="businessName"
                required
                placeholder="e.g. Apex Supermarket & Fresh Mart"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Owner Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Reuben Wanjiku"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="owner@yourstore.co.ke"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Launch Setup Wizard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an active register?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
