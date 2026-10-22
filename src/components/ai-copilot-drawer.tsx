"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  RotateCcw,
  Languages,
  DollarSign,
  ChevronRight,
  Database,
  CheckCircle2,
} from "lucide-react";

interface MessageItem {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  language?: string;
  toolCalls?: Array<{ tool: string; resultSummary: string }>;
  dataPayload?: any;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  storeName?: string;
}

const QUICK_PROMPTS = [
  {
    label: "🇰🇪 Niambie faida ya leo",
    prompt: "Niambie faida ya leo na profit margin ya duka",
    category: "finance",
  },
  {
    label: "📦 Stock gani zinaisha?",
    prompt: "Hizi stocks gani zinaisha haraka na zinahitaji kuongezwa?",
    category: "inventory",
  },
  {
    label: "💳 Nani ako na madeni?",
    prompt: "Nani ako na madeni makubwa dukani na total ni ngapi?",
    category: "credit",
  },
  {
    label: "📊 Mauzo na orders za leo",
    prompt: "Nipe summary ya mauzo ya leo, idadi ya orders, na cash vs mpesa",
    category: "sales",
  },
  {
    label: "⚖️ Kadogo Margin Advice",
    prompt: "How should I price 0.2500kg sugar packets if wholesale 50kg sack costs KES 6,500?",
    category: "kadogo",
  },
];

export function AICopilotDrawer({
  isOpen,
  onClose,
  currency = "KES",
  storeName = "Store",
}: AICopilotDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: `Sasa! Mimi ni OmniAI Copilot wa duka lako (**${storeName}**). Unaweza kuniuliza chochote kwa Sheng, Kiswahili, au English kuhusu mauzo ya leo, faida, stock inayoisha, au madeni ya wateja!`,
      timestamp: "Just now",
      language: "Sheng / Swahili / English",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || inputValue).trim();
    if (!textToSend || isSubmitting) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMessageId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overridePrompt) setInputValue("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === "ai" ? "model" : "user",
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMsg: MessageItem = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          language: data.language,
          toolCalls: data.toolCallsExecuted,
          dataPayload: data.dataPayload,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: MessageItem = {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `Samahani, kumetokea hitilafu: ${data.error || "Please try again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `Network error or timeout. Tafadhali hakikisha uko online au jaribu tena.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: `Mambo yame-resetiwa! Duka lako (**${storeName}**) liko tayari. Uliza swali lolote la biashara.`,
        timestamp: "Just now",
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 z-10 transition-transform duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-none">
                  OmniAI Copilot
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  Sheng &bull; Swahili &bull; EN
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time African SME Intelligence &bull; Read-only DB Tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              title="Reset conversation"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSend(qp.prompt)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm shrink-0"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/60"
                }`}
              >
                {/* Tool calls execution badge */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
                    {msg.toolCalls.map((tc, tidx) => (
                      <span
                        key={tidx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-500/30"
                      >
                        <Database className="w-3 h-3" />
                        {tc.tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Formatted body text */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Footer timestamp & language detection badge */}
                <div
                  className={`mt-2 flex items-center justify-between text-[10px] ${
                    msg.sender === "user" ? "text-emerald-100" : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.language && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Languages className="w-3 h-3" />
                      {msg.language}
                    </span>
                  )}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isSubmitting && (
            <div className="flex gap-3 items-center text-slate-400 dark:text-slate-500 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-600 flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="animate-pulse font-medium">
                Ina-query database ya duka na kukokotoa majibu...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp & Integration banner */}
        <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            WhatsApp Bot Ready: Send questions to store WhatsApp number
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/50 dark:bg-emerald-500/20">
            v2.5 Flash
          </span>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSubmitting}
            placeholder="Uliza kwa Sheng, Kiswahili au English..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSubmitting}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center justify-center shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
