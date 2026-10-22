"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  KADOGO_PRESET_TEMPLATES,
  calculateKadogoMargin,
  roundTo4,
  roundTo2,
  KadogoMarginAnalysis,
} from "@/lib/fractional-units";
import { breakBulkIntoKadogoUnitsAction } from "@/actions/invoices";

interface KadogoUnitConverterProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    costPrice: string;
    sellingPrice: string;
    stockQuantity: string;
    unit: string;
  } | null;
  currency?: string;
  onSuccess?: () => void;
}

interface FractionRow {
  unitName: string;
  unitCode: string;
  ratioToBulk: number;
  outputQuantityProduced: number;
  sellingPrice: number;
  targetMarginPercent: number;
}

export function KadogoUnitConverter({
  isOpen,
  onClose,
  product,
  currency = "KES",
  onSuccess,
}: KadogoUnitConverterProps) {
  const [bulkQuantityToBreak, setBulkQuantityToBreak] = useState<number>(1);
  const [fractions, setFractions] = useState<FractionRow[]>([]);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("SUGAR_50KG");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize with appropriate preset based on product name or default to sugar
  useEffect(() => {
    if (!product) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setBulkQuantityToBreak(1);

    const pName = product.name.toLowerCase();
    let presetKey = "SUGAR_50KG";

    if (pName.includes("oil") || pName.includes("salit") || pName.includes("jerrycan")) {
      presetKey = "COOKING_OIL_20L";
    } else if (pName.includes("rice") || pName.includes("pishori") || pName.includes("basmati")) {
      presetKey = "RICE_25KG";
    } else if (pName.includes("soap") || pName.includes("bar") || pName.includes("gental")) {
      presetKey = "BAR_SOAP_BALE";
    }

    setSelectedPresetKey(presetKey);
    loadPreset(presetKey);
  }, [product]);

  const loadPreset = (key: string) => {
    const preset = KADOGO_PRESET_TEMPLATES[key];
    if (!preset || !product) return;

    const bulkCost = parseFloat(product.costPrice) || 0;

    const initialFractions: FractionRow[] = preset.fractions.map((f) => {
      // Calculate output packets if 1 bulk unit is converted
      const packetsPerBulk = Math.round(1 / f.ratio);
      const allocatedCost = roundTo4(bulkCost * f.ratio);
      // Default selling price at default margin
      const defaultPrice = roundTo2(allocatedCost / (1 - f.defaultMargin / 100));

      return {
        unitName: f.name,
        unitCode: f.code,
        ratioToBulk: f.ratio,
        outputQuantityProduced: packetsPerBulk * bulkQuantityToBreak,
        sellingPrice: defaultPrice,
        targetMarginPercent: f.defaultMargin,
      };
    });

    setFractions(initialFractions);
  };

  const handlePresetChange = (key: string) => {
    setSelectedPresetKey(key);
    loadPreset(key);
  };

  const updateFractionField = (index: number, field: keyof FractionRow, value: any) => {
    const updated = [...fractions];
    updated[index] = { ...updated[index], [field]: value };

    // If ratio or bulk quantity changed, adjust output quantity
    if (field === "ratioToBulk") {
      const r = parseFloat(value) || 0.001;
      updated[index].outputQuantityProduced = Math.round((1 / r) * bulkQuantityToBreak);
    }

    setFractions(updated);
  };

  const handleBulkQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setBulkQuantityToBreak(validQty);

    // Re-scale output quantities
    setFractions((prev) =>
      prev.map((f) => ({
        ...f,
        outputQuantityProduced: Math.round((1 / f.ratioToBulk) * validQty),
      }))
    );
  };

  const addCustomFraction = () => {
    const bulkCost = parseFloat(product?.costPrice || "0");
    const ratio = 0.02; // e.g. 1kg from 50kg
    const allocatedCost = roundTo4(bulkCost * ratio);

    setFractions((prev) => [
      ...prev,
      {
        unitName: "Custom Micro-Packet",
        unitCode: `CUST_${Date.now().toString().slice(-4)}`,
        ratioToBulk: ratio,
        outputQuantityProduced: Math.round((1 / ratio) * bulkQuantityToBreak),
        sellingPrice: roundTo2(allocatedCost * 1.2),
        targetMarginPercent: 15.0,
      },
    ]);
  };

  const removeFraction = (index: number) => {
    setFractions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecuteBreakdown = async () => {
    if (!product || fractions.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await breakBulkIntoKadogoUnitsAction({
        bulkProductId: product.id,
        bulkQuantityToBreak,
        conversions: fractions,
      });

      if (res.success) {
        setSuccessMsg(
          `Success! Deducted ${bulkQuantityToBreak} bulk units from ${product.name} and stocked ${res.microProductsProcessed} fractional micro-products with 4-decimal precision.`
        );
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || "Failed to execute Kadogo unit breaking.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to communicate with inventory service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  const bulkStockNum = parseFloat(product.stockQuantity) || 0;
  const bulkCostNum = parseFloat(product.costPrice) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Kadogo Economy Unit Breakdown & Margin Alert
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                  4-Decimal Precision
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Break wholesale bulk sacks and jerrycans into fractional retail units with live margin protection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Bulk Product Information Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Wholesale Parent Stock
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {product.name}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Available: <strong className="text-slate-900 dark:text-white">{bulkStockNum.toFixed(2)} {product.unit}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Unit Cost: <strong className="text-indigo-600 dark:text-indigo-400">{currency} {bulkCostNum.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bulk Units to Break:
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, bulkStockNum)}
                value={bulkQuantityToBreak}
                onChange={(e) => handleBulkQuantityChange(parseFloat(e.target.value) || 1)}
                className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center text-sm"
              />
            </div>
          </div>

          {/* Preset Recipe Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Staple Recipes:
            </span>
            {Object.keys(KADOGO_PRESET_TEMPLATES).map((key) => {
              const p = KADOGO_PRESET_TEMPLATES[key];
              const isSelected = selectedPresetKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetChange(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    isSelected
                      ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                  }`}
                >
                  {p.bulkName.split("(")[0]}
                </button>
              );
            })}
          </div>

          {/* Fractional Units Breakdown Table & Real-Time Margin Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Micro-Packet Conversion Specifications
              </h5>
              <button
                type="button"
                onClick={addCustomFraction}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold flex items-center gap-1 hover:bg-indigo-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Fractional Unit
              </button>
            </div>

            <div className="space-y-3">
              {fractions.map((f, idx) => {
                const analysis: KadogoMarginAnalysis = calculateKadogoMargin(
                  bulkCostNum,
                  f.ratioToBulk,
                  f.sellingPrice,
                  f.targetMarginPercent
                );

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      analysis.isMarginEroded
                        ? "bg-red-50/60 dark:bg-red-500/5 border-red-200 dark:border-red-500/30"
                        : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                      {/* Name */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Packet Label
                        </label>
                        <input
                          type="text"
                          value={f.unitName}
                          onChange={(e) => updateFractionField(idx, "unitName", e.target.value)}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Ratio */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Fraction Ratio
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={f.ratioToBulk}
                          onChange={(e) =>
                            updateFractionField(idx, "ratioToBulk", parseFloat(e.target.value) || 0)
                          }
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-center"
                        />
                      </div>

                      {/* Produced Packets */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Output Packets
                        </label>
                        <input
                          type="number"
                          value={f.outputQuantityProduced}
                          onChange={(e) =>
                            updateFractionField(
                              idx,
                              "outputQuantityProduced",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-center text-emerald-600 dark:text-emerald-400"
                        />
                      </div>

                      {/* Retail Price */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Selling Price ({currency})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={f.sellingPrice}
                          onChange={(e) =>
                            updateFractionField(
                              idx,
                              "sellingPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-center text-indigo-600 dark:text-indigo-400"
                        />
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-end sm:justify-center pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => removeFraction(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Financial Precision & Margin Analysis Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          Allocated Unit Cost:{" "}
                          <strong className="text-slate-900 dark:text-white font-mono">
                            {currency} {analysis.allocatedUnitCost.toFixed(4)}
                          </strong>
                        </span>
                        <span>&bull;</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Profit Margin:{" "}
                          <strong
                            className={`font-mono ${
                              analysis.isMarginEroded ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {analysis.grossMarginPercent}%
                          </strong>
                        </span>
                      </div>

                      {/* AI Margin Erosion Warning */}
                      {analysis.isMarginEroded && (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold text-[11px] bg-red-100/60 dark:bg-red-500/20 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Cost spike erodes margin! Recommended minimum:{" "}
                            <strong>
                              {currency} {analysis.suggestedMinimumPrice.toFixed(2)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback & Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || fractions.length === 0}
            onClick={handleExecuteBreakdown}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Breaking Stock & Updating Ledger...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Break Stock into Kadogo Units
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
