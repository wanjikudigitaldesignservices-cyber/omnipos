"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShieldCheck,
  Lock,
  Database,
  CreditCard,
  FileText,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Eye,
  Server,
  RefreshCw,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [ackTimestamp, setAckTimestamp] = useState<string | null>(null);

  const handleAcknowledge = () => {
    const now = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    setHasAcknowledged(true);
    setAckTimestamp(now);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white dark:selection:text-slate-950 transition-colors duration-150">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/register" className="flex items-center gap-2 group">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Register
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 transition-all shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-10">
        {/* Banner */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>SME Data Protection & Confidentiality Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            OmniPOS Privacy Policy & Data Consent
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Effective Date: October 2026 • Version 2.4 • Compliant with Kenya Data Protection Act 2019, GDPR, and African SME Fair-Trading Frameworks.
          </p>
        </div>

        {/* Interactive "I Understand" Consent Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-900/60 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0 mt-0.5 font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Merchant Consent Declaration</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                By operating OmniPOS, you entrust your store’s financial ledgers, staff shifts, and customer accounts to our encrypted cloud partition. Please review our data protection commitments below and confirm your acknowledgment.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
            {hasAcknowledged ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Consent Acknowledged on {ackTimestamp}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Click below to record your formal understanding and acceptance.
              </div>
            )}

            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={hasAcknowledged}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hasAcknowledged
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 shadow-lg shadow-emerald-600/20"
              }`}
            >
              {hasAcknowledged ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>I Understand & Consent (Accepted)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>I Understand & Accept Privacy Policy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>1. Multi-Tenant Architecture & Data Isolation</h2>
            </div>
            <p className="leading-relaxed">
              OmniPOS is architected on Neon Serverless PostgreSQL with tenant-level boundary isolation. Every business created on OmniPOS receives a distinct tenant identifier (`tenant_id`). All SQL queries, inventory ledgers, staff credentials, and transaction receipts are strictly isolated and cryptographically scoped to your tenant. No competitor or other store can view, query, or infer your sales volumes, margins, or customer records.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>2. Information We Collect and Process</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Store Profile</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">Business legal name, currency (`KES`, `USD`, `UGX`, `TZS`), VAT rates, store contact email, and receipt header/footer details.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Cashier & Staff Credentials</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">Owner login email, salted bcrypt password hashes, cashier roles, and 4-digit POS quick-switching PIN hashes.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Inventory & Catalog</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">Products, barcodes, cost and selling prices, batches, expiry alerts (pharmacy/agrovets), and stock quantity movements.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Customer CRM & Deni Ledger</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">Customer names, phone numbers, loyalty points balances, and store credit (Deni) debt repayment records.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>3. Payment Records & Financial Integrity</h2>
            </div>
            <p className="leading-relaxed">
              When processing point-of-sale transactions across Split Tender, Cash, Mobile Money (M-Pesa Till & Paybill numbers), Cards, or Customer Credit Tab:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><strong className="text-slate-800 dark:text-slate-200">Zero Raw Card Storage:</strong> OmniPOS does not store full 16-digit credit/debit card numbers or CVV codes, in adherence to PCI-DSS standards.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">Mobile Money Audit Trail:</strong> M-Pesa transaction reference codes and cashier shift reconciliations are recorded solely for your store’s end-of-day drawer balancing and tax accounting.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">No Third-Party Monetization:</strong> We do not sell, rent, or monetize your store’s financial transactions or basket size metrics to third-party ad networks or brokers.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>4. Security Safeguards & Encryption Standards</h2>
            </div>
            <p className="leading-relaxed">
              We employ defense-in-depth protection across every layer of the platform:
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
                <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Encryption in Transit & At Rest:</strong> All database queries are routed over TLS/SSL to Neon PostgreSQL servers. Data disks are encrypted with AES-256.</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">HttpOnly JWT Sessions:</strong> Staff authentication tokens use encrypted, HttpOnly session cookies via `jose` to defend against XSS token harvesting.</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Cashier PIN Salted Hashing:</strong> Cashier switching PINs are salted and hashed via `bcryptjs` before storage; raw PIN numbers are never logged in plaintext.</span>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>5. Merchant Rights & Data Ownership</h2>
            </div>
            <p className="leading-relaxed">
              As the store owner and data controller of your enterprise:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><strong className="text-slate-800 dark:text-slate-200">Data Portability:</strong> You may at any time export your inventory catalogs, shift Z-Reports, sales ledger, and customer balances.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">Right to Deletion:</strong> Upon closing your account, you can request permanent deletion of your tenant workspace, which cascades across all associated tables and transactions.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">Staff Access Audits:</strong> You control cashier and manager permissions, and can revoke staff access or reset PINs at any moment from the Back-Office Settings.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2>6. Contact & Data Protection Officer</h2>
            </div>
            <p className="leading-relaxed text-xs text-slate-600 dark:text-slate-400">
              If you have any questions regarding your store’s data security, compliance with regional data privacy laws, or wish to exercise your data subject rights, contact our Data Security Office at{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">privacy@omnipos.cloud</span>.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© 2026 OmniPOS Cloud Systems. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/register" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
              Create SME Workspace
            </Link>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-slate-200">
              Staff Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
