"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, ShieldCheck, Sparkles, Store } from "lucide-react";

interface Slide {
  image: string;
  tag: string;
  industry: string;
  quote: string;
  author: string;
  location: string;
  metricLabel: string;
  metricValue: string;
}

const slides: Slide[] = [
  {
    image: "/images/hero-retail.jpg",
    tag: "Retail & Supermarkets",
    industry: "Retail POS",
    quote: "Managing my 3 store branches with instant M-Pesa Till reconciliation and zero cash discrepancy.",
    author: "Wanjiru M.",
    location: "Wanjiru Fresh Market, Nairobi",
    metricLabel: "Checkout Speed",
    metricValue: "< 3 Seconds",
  },
  {
    image: "/images/hero-chemist.jpg",
    tag: "Pharmacies & Agrovets",
    industry: "Chemist ERP",
    quote: "Barcode batch scanning and automated expiry date alerts stopped all our stock shrinkages.",
    author: "Dr. Faith K.",
    location: "Fairview Pharmacy & Agrovet, Nakuru",
    metricLabel: "Stock Accuracy",
    metricValue: "99.9% Audit",
  },
  {
    image: "/images/hero-cafe.jpg",
    tag: "Dining & Bakehouses",
    industry: "Hospitality",
    quote: "Split payments across cash and mobile money made rush hour completely stress-free for our staff.",
    author: "Zawadi O.",
    location: "Zawadi's Bakehouse & Cafe, Westlands",
    metricLabel: "Daily Throughput",
    metricValue: "450+ Orders",
  },
];

export function SMESlideshow() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div
      className="relative w-full h-full min-h-[540px] lg:min-h-full overflow-hidden rounded-3xl bg-slate-950 flex flex-col justify-between p-6 sm:p-8 md:p-10 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 scale-100 z-0" : "opacity-0 scale-105 pointer-events-none -z-10"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.author}
            className="w-full h-full object-cover object-top transition-transform duration-7000 ease-out transform"
          />
          {/* Dual Gradient Overlay (Top to bottom + Bottom heavy) */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40" />
        </div>
      ))}

      {/* Top Bar: Brand trust chip & slide counter */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real African SMEs Powered by OmniPOS</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-xs text-slate-300 font-mono">
          <span className="text-emerald-400 font-bold">{current + 1}</span>
          <span>/</span>
          <span>{slides.length}</span>
        </div>
      </div>

      {/* Bottom Content Area: Testimonial & Metric Cards */}
      <div className="relative z-10 space-y-4 pt-20">
        {/* Industry Pill & Metric Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md">
            {slides[current].tag}
          </span>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white font-medium text-[11px] flex items-center gap-1.5">
            <span className="text-slate-400">{slides[current].metricLabel}:</span>
            <strong className="text-emerald-400 font-bold">{slides[current].metricValue}</strong>
          </div>
        </div>

        {/* Quote */}
        <blockquote className="text-lg sm:text-xl font-bold text-white leading-snug drop-shadow-md">
          “{slides[current].quote}”
        </blockquote>

        {/* Merchant Info */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div>
            <div className="font-bold text-white text-sm">{slides[current].author}</div>
            <div className="text-xs text-slate-300 flex items-center gap-1">
              <Store className="w-3 h-3 text-emerald-400" />
              <span>{slides[current].location}</span>
            </div>
          </div>

          {/* Prev/Next Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous story"
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white hover:text-emerald-400 transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next story"
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white hover:text-emerald-400 transition-all cursor-pointer backdrop-blur-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Pill Bar (like KCB / Co-op Bank Apps) */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className="h-1.5 rounded-full overflow-hidden bg-slate-800/80 cursor-pointer transition-all"
            >
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  index === current ? "bg-emerald-400 w-full" : "w-0"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
