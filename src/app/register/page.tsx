"use client";

import React, { useState } from "react";
import { registerSME } from "@/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { SMESlideshow } from "@/components/sme-slideshow";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

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
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Left Column: Bank-Grade SME Slideshow Hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-8 xl:p-12 bg-slate-100/70 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
        <div className="relative z-10 mb-4">
          <BrandLogo size="lg" />
        </div>

        {/* Banking-App Style Interactive SME Carousel */}
        <div className="flex-1 my-2 min-h-[500px]">
          <SMESlideshow />
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800/80 pt-4">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Multi-Tenant Neon PostgreSQL
          </span>
          <span>© 2026 OmniPOS Cloud</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative bg-white dark:bg-slate-900/40">
        {/* Floating Theme Toggle in top-right */}
        <div className="absolute top-6 right-6">
          <ThemeToggle size="sm" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <BrandLogo size="md" className="mb-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Create your SME Workspace
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Set up your store in seconds. No credit card required.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm flex items-start gap-3">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Business / Store Name
              </label>
              <input
                type="text"
                name="businessName"
                required
                placeholder="e.g. Apex Supermarket & Fresh Mart"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Owner Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Reuben Wanjiku"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="owner@yourstore.co.ke"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-sm"
              />
            </div>

            {/* Merchant Privacy & Data Consent Form */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 shadow-sm">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Merchant Data Protection & Privacy Notice
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    By creating an SME workspace, you confirm you are authorized to bind this business. Your transactions, inventory ledger, and cashier PINs will be encrypted in your isolated tenant partition.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-200 dark:border-slate-800/80 group">
                <input
                  type="checkbox"
                  required
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-tight select-none">
                  <strong className="text-emerald-600 dark:text-emerald-400">I Understand & Agree</strong> to the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    OmniPOS Privacy Policy
                  </Link>{" "}
                  and SME Merchant Terms of Service.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !consentAccepted}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

          <div className="flex flex-col items-center gap-2 pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
            <p>
              Already have an active register?{" "}
              <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Sign In
              </Link>
            </p>
            <Link
              href="/privacy"
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1 mt-1 font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> View Privacy Policy & Merchant Rights
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
