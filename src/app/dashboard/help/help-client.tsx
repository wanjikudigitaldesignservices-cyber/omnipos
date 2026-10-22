"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Scale,
  CreditCard,
  Receipt,
  Wifi,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Bot,
} from "lucide-react";

interface HelpClientProps {
  tenant: {
    name: string;
    currency: string;
    businessType?: string;
  };
  user: {
    fullName: string;
    email: string;
    role: string;
  };
}

const FAQS = [
  {
    category: "TAX_ETIMS",
    icon: Receipt,
    title: "How does KRA eTIMS Tax Compliance work in OmniPOS?",
    summary:
      "OmniPOS automatically categorizes every product into Standard (16% VAT), Zero-Rated (0% maize/sugar), or Exempt. The system formats clean JSON payloads ready for fiscal signing, generates QR codes, and ensures offline transactions are queued safely until network restores.",
  },
  {
    category: "PAYMENTS_MPESA",
    icon: CreditCard,
    title: "How to prevent Fake M-Pesa SMS and verify payments?",
    summary:
      "Never accept buyer screenshots or SMS alone. OmniPOS uses direct Daraja C2B/STK Push webhooks to confirm the official MpesaReceiptNumber, sender name, and exact amount against the till balance. The AI reconciliation tool matches raw SMS text to pending checkouts instantly.",
  },
  {
    category: "KADOGO_ECONOMY",
    icon: Scale,
    title: "How to break a 50kg wholesale sack into retail packets?",
    summary:
      "Go to Inventory -> Click 'Kadogo Units' on any bulk product (Sugar 50kg, Oil 20L, Rice 25kg). Select your breakdown fractions (e.g. 0.2500kg, 0.5000kg). OmniPOS allocates the unit cost to 4 decimal places and displays an AI Margin Erosion Alert if supplier costs spike, advising on minimum selling price.",
  },
  {
    category: "SHIFTS_CASH",
    icon: Layers,
    title: "How to balance the Cash Drawer and print Z-Reports?",
    summary:
      "Start the morning by entering your opening cash float under 'Shifts & Z-Reports' or inside the POS terminal. At the end of the shift, conduct an End-of-Day Drawer Count. The system calculates cash discrepancies, expected cash, and prints an itemized thermal Z-Report.",
  },
  {
    category: "OFFLINE_RESILIENCE",
    icon: Wifi,
    title: "Can OmniPOS operate if the internet or power drops?",
    summary:
      "Yes! OmniPOS uses client-side IndexedDB caching. Cashiers can continue scanning barcodes, completing cash sales, and queueing M-Pesa payments offline. Once network returns, all transactions and AI sync tasks automatically reconcile with the Neon cloud database.",
  },
];

export function HelpCenterClient({ tenant, user }: HelpClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter((f) => {
    const matchesCat = selectedCategory === "ALL" || f.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q || f.title.toLowerCase().includes(q) || f.summary.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Help Center & Diagnostics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Operational guides, KRA compliance tips, M-Pesa fraud prevention, and 24/7 WhatsApp helpdesk.
          </p>
        </div>

        {/* WhatsApp Direct Chat Button */}
        <a
          href="https://wa.me/254700000000?text=Hello%20OmniPOS%20Support,%20I%20need%20assistance%20with%20my%20store"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat with WhatsApp Support</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>

      {/* System Health & Diagnostics Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Live POS System Health & Diagnostics
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Database Engine</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">Neon PostgreSQL</div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Connected (Pooler)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">AI Copilot Engine</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">Gemini 2.5 Flash</div>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Sheng / Swahili Ready
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Offline Cache</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">IndexedDB Store</div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sync Ready
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Thermal Printer</div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">ESC/POS 80mm</div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Receipt className="w-3.5 h-3.5" />
              Browser Ready
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search operational guides, eTIMS, M-Pesa, Kadogo splitting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "ALL", label: "All Guides" },
            { key: "TAX_ETIMS", label: "KRA eTIMS" },
            { key: "PAYMENTS_MPESA", label: "M-Pesa Reconciliation" },
            { key: "KADOGO_ECONOMY", label: "Kadogo Bulk Units" },
            { key: "SHIFTS_CASH", label: "Cash Drawer Shifts" },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                selectedCategory === cat.key
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const Icon = faq.icon;
          const isOpen = openFaqIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {faq.title}
                  </h4>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
                  {faq.summary}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Contact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white text-xs">WhatsApp Dedicated Desk</h5>
          <p className="text-[11px] text-slate-500">Live chat assistance for cashiers and store managers.</p>
          <a
            href="https://wa.me/254700000000"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline block pt-1"
          >
            +254 700 000 000 &rarr;
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Phone className="w-5 h-5" />
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white text-xs">Telephone Hotline</h5>
          <p className="text-[11px] text-slate-500">Monday to Saturday: 7:00 AM - 10:00 PM EAT.</p>
          <a
            href="tel:0200000000"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline block pt-1"
          >
            020 000 0000 &rarr;
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white text-xs">Technical Email Support</h5>
          <p className="text-[11px] text-slate-500">For hardware integration & developer webhooks.</p>
          <a
            href="mailto:support@omnipos.africa"
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline block pt-1"
          >
            support@omnipos.africa &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
