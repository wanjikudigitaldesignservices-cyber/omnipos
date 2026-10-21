"use client";

import React, { useState } from "react";
import { completeOnboardingAction } from "@/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { useRouter } from "next/navigation";
import {
  Building2,
  Store,
  UtensilsCrossed,
  Pill,
  Scissors,
  KeyRound,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Sparkles,
  ChevronLeft,
  Coins,
  ShieldCheck,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState("My Business");
  const [currency, setCurrency] = useState("KES");
  const [taxRate, setTaxRate] = useState("16.00");
  const [receiptHeader, setReceiptHeader] = useState("Official Customer Receipt");
  const [receiptFooter, setReceiptFooter] = useState("Thank you for shopping with us! Karibu tena.");

  // Step 2: Business Type
  const [businessType, setBusinessType] = useState<"RETAIL" | "RESTAURANT" | "PHARMACY_AGROVET" | "SERVICE">("RETAIL");

  // Step 3: Payment Types & Terminal PIN
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptMpesa, setAcceptMpesa] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [acceptCredit, setAcceptCredit] = useState(true);
  const [pinCode, setPinCode] = useState("");

  const industries = [
    {
      id: "RETAIL",
      name: "Retail & Supermarket",
      desc: "Instant barcode scanner listener, SKU catalog, decimal stock, and real-time inventory ledger.",
      icon: Store,
      color: "from-blue-600 to-indigo-600",
      accent: "border-blue-500 bg-blue-500/10 text-blue-400",
      sampleItems: [
        "2kg Pure Cane Sugar",
        "1L Pure Sunflower Cooking Oil",
        "Fresh Cow Milk 500ml",
        "Mineral Water 1L",
        "Detergent Powder 1kg",
      ],
    },
    {
      id: "RESTAURANT",
      name: "Restaurant & Cafe",
      desc: "Table assignment, Dine-In / Takeaway routing, kitchen notes, and food item modifiers.",
      icon: UtensilsCrossed,
      color: "from-amber-600 to-orange-600",
      accent: "border-amber-500 bg-amber-500/10 text-amber-400",
      sampleItems: [
        "Grilled Chicken Breast & Chips",
        "Double Cheese Burger & Fries",
        "Spaghetti Bolognese Beef",
        "Fresh Passion Mint Juice",
        "Mocha Cappuccino Latte",
      ],
    },
    {
      id: "PHARMACY_AGROVET",
      name: "Pharmacy & Agrovet",
      desc: "Batch / Lot tracking, expiry date alarms, regulated meds, and bulk decimal weights (kg/L).",
      icon: Pill,
      color: "from-emerald-600 to-teal-600",
      accent: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
      sampleItems: [
        "Amoxicillin 500mg (Batch B-88301)",
        "Paracetamol 500mg Pain Relief",
        "Broad Spectrum Cattle Dewormer",
        "CAN Topdress Fertilizer 50kg",
        "Antiseptic Skin Solution 250ml",
      ],
    },
    {
      id: "SERVICE",
      name: "Salon, Spa & Services",
      desc: "Staff assignment per service, tip tracking, commission records, and hourly booking tickets.",
      icon: Scissors,
      color: "from-purple-600 to-pink-600",
      accent: "border-purple-500 bg-purple-500/10 text-purple-400",
      sampleItems: [
        "Executive Haircut & Beard Trim",
        "Deep Tissue Massage 60 Mins",
        "Gel Manicure & Deluxe Pedicure",
        "Hydrating Facial Scrub & Steam",
        "SME Business Tax Advisory (1 hr)",
      ],
    },
  ];

  const handleFinish = async () => {
    if (pinCode.length !== 4) {
      setError("Please set a 4-digit numeric PIN for the register lock screen.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("currency", currency);
    formData.append("taxRate", taxRate);
    formData.append("receiptHeader", receiptHeader);
    formData.append("receiptFooter", receiptFooter);
    formData.append("businessType", businessType);
    formData.append("pinCode", pinCode);

    const result = await completeOnboardingAction(formData);

    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
    } else {
      setError(result.error || "Failed to complete onboarding.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <BrandLogo size="md" />
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-slate-400">Step {step} of 3</div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-emerald-500"
                    : s < step
                    ? "w-3 bg-emerald-700"
                    : "w-3 bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Business Profile & Receipts */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <Building2 className="w-3.5 h-3.5" /> Step 1: Business Identity & Receipt
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Configure your Business & Currency
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Customize your store name, primary currency, and 80mm thermal receipt branding.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Business / Store Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Hypermarket Ltd"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Store Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="UGX">UGX - Ugandan Shilling</option>
                      <option value="TZS">TZS - Tanzanian Shilling</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tax / VAT Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Receipt Header Note
                  </label>
                  <input
                    type="text"
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    placeholder="e.g. Nairobi CBD Branch - Tel: 0700 000 000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Receipt Footer Note
                  </label>
                  <input
                    type="text"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="e.g. Thank you for your patronage! Karibu tena."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live 80mm Thermal Receipt Preview */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Live 80mm Thermal Receipt Preview
                </div>
                <div className="w-full max-w-[280px] bg-white text-black p-4 font-mono text-[11px] rounded-lg shadow-2xl border border-slate-300 space-y-2">
                  <div className="text-center font-bold text-sm tracking-tight uppercase">
                    {businessName || "OMNIPOS STORE"}
                  </div>
                  <div className="text-center text-[10px] text-gray-600">{receiptHeader}</div>
                  <div className="border-b border-dashed border-gray-400 my-1.5" />
                  <div className="flex justify-between text-[10px]">
                    <span>RCP-202610-001</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-400 my-1.5" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>1x Premium Item Sample</span>
                      <span>500.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x Grocery Demo Unit</span>
                      <span>240.00</span>
                    </div>
                  </div>
                  <div className="border-b border-dashed border-gray-400 my-1.5" />
                  <div className="flex justify-between text-[10px]">
                    <span>Subtotal:</span>
                    <span>{currency} 740.00</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>VAT ({taxRate}%):</span>
                    <span>{currency} {((740 * parseFloat(taxRate || "0")) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{currency} {(740 + (740 * parseFloat(taxRate || "0")) / 100).toFixed(2)}</span>
                  </div>
                  <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-400">
                    {receiptFooter}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                Continue to Industry Selection <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Business Type & Auto Seed */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Step 2: Adaptive Industry Engine
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Select your Industry Preset
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Your selection automatically tunes the POS interface and seeds 5 realistic sample products and categories!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {industries.map((ind) => {
                const isSelected = businessType === ind.id;
                const Icon = ind.icon;
                return (
                  <div
                    key={ind.id}
                    onClick={() => setBusinessType(ind.id as any)}
                    className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 relative ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500/20" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${ind.color} text-white shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{ind.name}</h3>
                        <span className="text-[11px] font-mono text-emerald-400">Auto-seeds 5 test items</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{ind.desc}</p>
                    <div className="border-t border-slate-800/80 pt-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Sample Catalog Included:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ind.sampleItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/50"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                Configure Payments & PIN <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Types & 4-Digit Terminal PIN */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Step 3: Payments & POS Cashier Lock PIN
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Tender Types & Terminal PIN
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Configure accepted tenders and set the master 4-digit PIN for instant terminal switching.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Payment Methods */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Accepted Payment Tenders
                </div>

                <div
                  onClick={() => setAcceptCash(!acceptCash)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    acceptCash
                      ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-sm">Cash Drawer</div>
                      <div className="text-xs text-slate-400">Calculates quick denomination change & float</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={acceptCash} readOnly className="accent-emerald-500 w-4 h-4" />
                </div>

                <div
                  onClick={() => setAcceptMpesa(!acceptMpesa)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    acceptMpesa
                      ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-sm">Mobile Money / M-Pesa</div>
                      <div className="text-xs text-slate-400">Stores transaction reference confirmation codes</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={acceptMpesa} readOnly className="accent-emerald-500 w-4 h-4" />
                </div>

                <div
                  onClick={() => setAcceptCard(!acceptCard)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    acceptCard
                      ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-bold text-sm">Credit & Debit Card</div>
                      <div className="text-xs text-slate-400">Visa / Mastercard PDQ terminals</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={acceptCard} readOnly className="accent-emerald-500 w-4 h-4" />
                </div>

                <div
                  onClick={() => setAcceptCredit(!acceptCredit)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    acceptCredit
                      ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="font-bold text-sm">Customer Credit (Deni / Tab)</div>
                      <div className="text-xs text-slate-400">Logs customer debt and enforces credit limits</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={acceptCredit} readOnly className="accent-emerald-500 w-4 h-4" />
                </div>
              </div>

              {/* Terminal PIN Configuration */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold mb-2">
                    <KeyRound className="w-4 h-4" /> Owner 4-Digit Quick PIN
                  </div>
                  <p className="text-xs text-slate-400 mb-6">
                    This PIN unlocks the register drawer and lets cashiers switch in 2 seconds without logging out.
                  </p>

                  <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3].map((idx) => {
                      const digit = pinCode[idx] || "";
                      return (
                        <div
                          key={idx}
                          className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black font-mono transition-all ${
                            digit
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md"
                              : "border-slate-800 bg-slate-950 text-slate-600"
                          }`}
                        >
                          {digit ? "•" : ""}
                        </div>
                      );
                    })}
                  </div>

                  {/* Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map((btn) => (
                      <button
                        key={btn.toString()}
                        type="button"
                        onClick={() => {
                          if (btn === "C") setPinCode("");
                          else if (btn === "⌫") setPinCode((p) => p.slice(0, -1));
                          else if (typeof btn === "number" && pinCode.length < 4) {
                            setPinCode((p) => p + btn);
                          }
                        }}
                        className="py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold text-base cursor-pointer hover:bg-slate-800/50 active:scale-95 transition-all"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                disabled={loading || pinCode.length !== 4}
                onClick={handleFinish}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base flex items-center gap-2.5 cursor-pointer shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>Provisioning Database & Catalog...</>
                ) : (
                  <>
                    Complete Setup & Launch POS <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
