"use client";

import React from "react";
import { useTheme } from "./theme-context";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ThemeToggle({
  className = "",
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Until mounted, render a placeholder with identical dimensions to prevent layout shift
  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
          size === "sm" ? "px-2.5 py-1.5" : "px-3 py-2"
        } ${className}`}
        aria-hidden="true"
      >
        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        {showLabel && <span className="w-12 h-3 bg-slate-200 dark:bg-slate-700 rounded" />}
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode (Daylight friendly)" : "Switch to Dark Mode (Night terminal)"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`inline-flex items-center gap-2 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isDark
          ? "bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300 hover:border-amber-400/40 hover:bg-slate-800 shadow-sm"
          : "bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:border-slate-400 hover:bg-slate-100 shadow-sm"
      } ${size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-xs"} ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
          {showLabel && <span className="text-slate-200">Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 animate-in -spin-in-90 duration-200" />
          {showLabel && <span className="text-slate-700">Dark Mode</span>}
        </>
      )}
    </button>
  );
}
