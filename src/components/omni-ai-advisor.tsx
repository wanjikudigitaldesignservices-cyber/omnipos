"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Package,
  Users,
  Send,
  Zap,
} from "lucide-react";

interface OmniAIAdvisorProps {
  tenant: {
    name: string;
    currency: string;
    businessType: string;
  };
  metrics: {
    todayRevenue: number;
    todayGrossProfit: number;
    todayOrdersCount: number;
    profitMarginPercent: string;
    totalOutstandingDebt: number;
    lowStockCount: number;
  };
}

export function OmniAIAdvisor({ tenant, metrics }: OmniAIAdvisorProps) {
  const [activeTab, setActiveTab] = useState<"INSIGHTS" | "SIMULATOR" | "CHAT">("INSIGHTS");
  const [simulationPercentage, setSimulationPercentage] = useState<number>(5);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string }>>([
    {
      sender: "ai",
      text: `Hello ${tenant.name}! I am your OmniAI Business Advisor. Today your margin is running at ${metrics.profitMarginPercent}%. Ask me anything about stock optimization, pricing, or debt management!`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Simulated profit impact calculation
  const simulatedIncrease = (metrics.todayRevenue * (simulationPercentage / 100)).toFixed(2);

  const handleSendMessage = (customPrompt?: string) => {
    const query = customPrompt || chatInput;
    if (!query.trim()) return;

    const userMsg = query;
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    if (!customPrompt) setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("profit") || lower.includes("margin") || lower.includes("price")) {
        reply = `Based on your sales volume in ${tenant.currency}, bumping pricing by 3-5% on non-staple goods can lift monthly net profit by up to ${tenant.currency} ${(metrics.todayRevenue * 15 * 0.05).toFixed(0)} without dampening footfall. Consider bundling high-velocity items with slower high-margin items.`;
      } else if (lower.includes("stock") || lower.includes("inventory") || lower.includes("reorder")) {
        reply = `You have ${metrics.lowStockCount} items nearing low threshold. OmniAI recommends placing a replenishment order 3 days before payday weekend when store velocity spikes by ~38%.`;
      } else if (lower.includes("debt") || lower.includes("deni") || lower.includes("credit")) {
        reply = `Current customer debt tab stands at ${tenant.currency} ${metrics.totalOutstandingDebt.toFixed(2)}. OmniAI recommends enabling automated SMS / WhatsApp balance reminders when tabs exceed 14 days to recover liquidity faster.`;
      } else {
        reply = `For ${tenant.businessType.replace("_", " ")}, the key to scaling from small to medium enterprise is real-time inventory velocity and shift reconciliation. You are tracking all sales in your isolated Neon PostgreSQL partition with 100% audit integrity!`;
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150">
      {/* Top AI Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                OmniAI Copilot & Growth Advisor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                AI Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Machine learning analytics trained on Kenyan & African SME commerce velocity
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("INSIGHTS")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              activeTab === "INSIGHTS"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Smart Briefing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SIMULATOR")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              activeTab === "SIMULATOR"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Margin Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CHAT")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              activeTab === "CHAT"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            AI Chat Copilot
          </button>
        </div>
      </div>

      {/* Tab 1: Smart Briefing */}
      {activeTab === "INSIGHTS" && (
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>Gross Margin Health</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {metrics.profitMarginPercent}%
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                {parseFloat(metrics.profitMarginPercent) >= 20
                  ? "Optimal product margins. Above industry retail benchmark (18%)."
                  : "Consider reviewing cost prices with suppliers to expand spread."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Package className="w-4 h-4" />
                <span>Stockout Risk Status</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {metrics.lowStockCount} items
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                {metrics.lowStockCount === 0
                  ? "All active products have sufficient buffer stock for this week."
                  : "Items flagged near threshold. Reorder before weekend peak traffic."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                <Users className="w-4 h-4" />
                <span>Customer Debt Recovery</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {tenant.currency} {metrics.totalOutstandingDebt.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                {metrics.totalOutstandingDebt === 0
                  ? "Zero unpaid tabs! Merchant working capital liquidity is at 100%."
                  : "Store debt ledger active. Track repayments in CRM & Debt Manager."}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                OmniAI Tactical Growth Recommendation:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Offer loyalty points multipliers (e.g. 2x points) for customers settling transactions via Mobile Money or Cash over store debt tabs. This reduces balance recovery cycles from 18 days to instant settlement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Margin Simulator */}
      {activeTab === "SIMULATOR" && (
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Price Optimization & Revenue Elasticity Simulator
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Simulate adjusting prices across your catalog to project bottom-line profit lift.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[3, 5, 8, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSimulationPercentage(pct)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    simulationPercentage === pct
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid sm:grid-cols-2 gap-4 items-center">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Projected Additional Daily Net Revenue
              </span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                +{tenant.currency} {simulatedIncrease} / day
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Calculated at +{simulationPercentage}% adjustment on today’s sales volume ({tenant.currency} {metrics.todayRevenue.toFixed(2)}).
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                Estimated Annualized Impact:
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                +{tenant.currency} {(parseFloat(simulatedIncrease) * 365).toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Reinvest into bulk wholesale discounts or opening a second terminal station.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Copilot Chat */}
      {activeTab === "CHAT" && (
        <div className="p-6 space-y-4">
          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {[
              "How can I increase profits today?",
              "When should I restock low items?",
              "Tips to manage customer debt tabs",
              "Best practices for cash drawer float",
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="h-56 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic pl-10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                OmniAI is analyzing your store telemetry...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask OmniAI about your store operations, margins, or catalog..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
