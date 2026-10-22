"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import { ExtractedInvoiceItem, ExtractedInvoiceResult } from "@/lib/ai/vision-invoice-engine";
import { commitSupplierInvoiceAction } from "@/actions/invoices";

interface VisionInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  onSuccess?: () => void;
  onOpenKadogoConverter?: (product: any) => void;
}

export function VisionInvoiceModal({
  isOpen,
  onClose,
  currency = "KES",
  onSuccess,
  onOpenKadogoConverter,
}: VisionInvoiceModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceResult | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setCommitSuccess(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      runVisionOCR(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDemoPreset = (type: "sugar" | "oil") => {
    setErrorMsg(null);
    setCommitSuccess(null);
    const mockFileName = type === "sugar" ? "nairobi_sugar_wholesalers_docket.jpg" : "bidco_edible_oils_delivery.png";
    setFileName(mockFileName);
    setImagePreview("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%231e293b'/><text x='50%' y='50%' fill='%23e2e8f0' font-family='sans-serif' font-size='16' text-anchor='middle'>Supplier Delivery Docket Scan</text></svg>");
    runVisionOCR("data:image/jpeg;base64,mockImageBase64Payload", mockFileName);
  };

  const runVisionOCR = async (base64Payload: string, name: string) => {
    setIsScanning(true);
    setExtractedData(null);

    try {
      const res = await fetch("/api/ai/vision-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Payload,
          fileName: name,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setExtractedData(json.data);
      } else {
        setErrorMsg(json.error || "Failed to scan receipt image.");
      }
    } catch (err: any) {
      setErrorMsg("Network error communicating with Vision AI service.");
    } finally {
      setIsScanning(false);
    }
  };

  const updateItemField = (index: number, field: keyof ExtractedInvoiceItem, value: any) => {
    if (!extractedData) return;
    const updated = [...extractedData.items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-update total cost if qty or unit cost changes
    if (field === "quantity" || field === "unitCost") {
      const q = field === "quantity" ? parseFloat(value) || 0 : updated[index].quantity;
      const c = field === "unitCost" ? parseFloat(value) || 0 : updated[index].unitCost;
      updated[index].totalCost = Math.round(q * c * 10000) / 10000;
    }

    const newTotal = updated.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    setExtractedData({
      ...extractedData,
      items: updated,
      totalAmount: Math.round(newTotal * 100) / 100,
    });
  };

  const removeItem = (index: number) => {
    if (!extractedData) return;
    const updated = extractedData.items.filter((_, i) => i !== index);
    const newTotal = updated.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      totalAmount: Math.round(newTotal * 100) / 100,
    });
  };

  const handleCommit = async () => {
    if (!extractedData || extractedData.items.length === 0) return;

    setIsCommitting(true);
    setErrorMsg(null);

    try {
      const res = await commitSupplierInvoiceAction({
        supplierName: extractedData.supplierName,
        invoiceNumber: extractedData.invoiceNumber,
        invoiceDate: extractedData.invoiceDate,
        totalAmount: extractedData.totalAmount,
        taxAmount: extractedData.taxAmount,
        items: extractedData.items,
        imageUrl: imagePreview || undefined,
      });

      if (res.success) {
        const totalProcessed = (res.itemsUpdatedCount ?? 0) + (res.itemsCreatedCount ?? 0);
        setCommitSuccess(
          `Success! Added/updated ${totalProcessed} inventory items into stock and logged in ledger.`
        );
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || "Failed to commit invoice to catalog.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to execute commit transaction.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Multimodal Supplier Invoice Ingestion
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                  Gemini 2.5 Vision OCR
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Snap or upload printed supplier receipts & handwritten delivery dockets to auto-stock items
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Upload Area / Camera Trigger */}
          {!extractedData && !isScanning && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  Snap or Upload Supplier Delivery Docket
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Supports Unga Ltd, Bidco Africa, Brookside Dairy, Twiga, and handwritten local wholesaler receipts
                </p>
              </div>

              {/* Quick Preset Demonstrations */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Quick Test Dockets:</span>
                <button
                  type="button"
                  onClick={() => handleDemoPreset("sugar")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                >
                  🌾 50kg Sugar & Unga Docket (Nairobi Wholesalers)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPreset("oil")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                >
                  🛢️ 20L Cooking Oil & Soap Docket (Bidco Africa)
                </button>
              </div>
            </div>
          )}

          {/* Scanning Progress */}
          {isScanning && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-xl shadow-indigo-600/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">
                Reading Supplier Invoice with Vision AI...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Extracting wholesale items, purchase costs, VAT tax categories, and matching against your catalog products.
              </p>
            </div>
          )}

          {/* Extracted Data Review Table */}
          {extractedData && (
            <div className="space-y-6">
              {/* Supplier Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier Name</label>
                  <input
                    type="text"
                    value={extractedData.supplierName}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, supplierName: e.target.value })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice / Docket #</label>
                  <input
                    type="text"
                    value={extractedData.invoiceNumber}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Docket Date</label>
                  <input
                    type="date"
                    value={extractedData.invoiceDate}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, invoiceDate: e.target.value })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</label>
                  <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs font-black text-emerald-700 dark:text-emerald-400">
                    {currency} {extractedData.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">Product Name & Category</th>
                      <th className="p-3 w-20">Qty</th>
                      <th className="p-3 w-28">Wholesale Cost ({currency})</th>
                      <th className="p-3 w-28">Suggested Retail</th>
                      <th className="p-3 w-28">Tax Bracket</th>
                      <th className="p-3 w-24">Bulk Kadogo?</th>
                      <th className="p-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {extractedData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItemField(idx, "name", e.target.value)}
                            className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">{item.categoryHint}</span>
                            {item.matchedProductId ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                Matches Catalog (Stock: {item.currentCatalogStock})
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                + New Catalog Product
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.0001"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemField(idx, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-right"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.0001"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateItemField(idx, "unitCost", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-right text-indigo-600 dark:text-indigo-400"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.suggestedRetailPrice}
                            onChange={(e) =>
                              updateItemField(
                                idx,
                                "suggestedRetailPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={item.taxCategory}
                            onChange={(e) => updateItemField(idx, "taxCategory", e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold"
                          >
                            <option value="STANDARD_16">16% VAT</option>
                            <option value="ZERO_RATED">0% Zero-Rated</option>
                            <option value="EXEMPT">Exempt</option>
                          </select>
                        </td>
                        <td className="p-3">
                          {item.isFractionalEligible ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                              Kadogo Bulk
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Standard</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status & Feedback */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {commitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{commitSuccess}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          {extractedData ? (
            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setImagePreview(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Scan Another Docket
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            {extractedData && (
              <button
                type="button"
                disabled={isCommitting || extractedData.items.length === 0}
                onClick={handleCommit}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Committing to Inventory...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Commit to Inventory Stock
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
