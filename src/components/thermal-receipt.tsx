"use client";

import React from "react";
import { Printer, Check, X } from "lucide-react";

interface ThermalReceiptProps {
  sale: {
    receiptNumber: string;
    totalAmount: number;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    createdAt?: Date | string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    payments: Array<{
      method: "CASH" | "MPESA_TILL" | "CARD" | "CREDIT_DENI";
      amount: number;
      referenceCode?: string;
    }>;
  };
  cashierName: string;
  customerName?: string | null;
  changeAmount?: number;
  organization: {
    name: string;
    logoUrl?: string | null;
    currency: string;
    taxRate: string;
    taxInclusive: boolean;
    receiptHeader?: string | null;
    receiptFooter?: string | null;
    mpesaTillOrPaybill?: string | null;
  };
  onClose: () => void;
}

export function ThermalReceiptModal({
  sale,
  cashierName,
  customerName,
  changeAmount = 0,
  organization,
  onClose,
}: ThermalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4 print:hidden">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Payment Recorded!</h3>
          <p className="text-xs text-slate-400">Ready to print 80mm ESC/POS receipt</p>
        </div>

        {/* 80mm Thermal Receipt Container */}
        <div
          id="receipt-print-area"
          className="w-full bg-white text-slate-950 p-5 rounded-xl font-mono text-xs leading-relaxed border border-slate-200 shadow-md select-text"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
            {organization.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-12 mx-auto object-contain mb-1"
              />
            ) : (
              <h2 className="font-extrabold text-sm uppercase tracking-wider">{organization.name}</h2>
            )}
            {organization.receiptHeader && (
              <p className="text-[10px] text-slate-700">{organization.receiptHeader}</p>
            )}
            {organization.mpesaTillOrPaybill && (
              <p className="text-[10px] font-bold text-emerald-800">
                LIPA NA M-PESA: {organization.mpesaTillOrPaybill}
              </p>
            )}
          </div>

          {/* Receipt Metadata */}
          <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-slate-400 text-slate-700">
            <div className="flex justify-between">
              <span>RECEIPT:</span>
              <span className="font-bold">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE:</span>
              <span>{saleDate.toLocaleDateString()} {saleDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex justify-between">
              <span>CASHIER:</span>
              <span>{cashierName}</span>
            </div>
            {customerName && (
              <div className="flex justify-between font-bold text-slate-900">
                <span>CUSTOMER:</span>
                <span>{customerName}</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] text-slate-900 pb-1 border-b border-slate-200">
              <span>ITEM</span>
              <span className="text-right">QTY x AMT</span>
            </div>
            {sale.items.map((item, index) => (
              <div key={index} className="space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span className="truncate pr-2">{item.productName}</span>
                  <span className="font-bold">{organization.currency} {item.subtotal.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {item.quantity} @ {organization.currency} {item.unitPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2 space-y-1 border-b border-dashed border-slate-400">
            <div className="flex justify-between text-[11px]">
              <span>SUBTOTAL:</span>
              <span>{organization.currency} {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-[10px] text-emerald-800">
                <span>DISCOUNT:</span>
                <span>-{organization.currency} {sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>VAT ({organization.taxRate}% {organization.taxInclusive ? "INCL" : "EXCL"}):</span>
              <span>{organization.currency} {sale.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 text-slate-950">
              <span>TOTAL DUE:</span>
              <span>{organization.currency} {sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Tendered Breakdown */}
          <div className="py-2 text-[10px] space-y-1 border-b border-dashed border-slate-400">
            <span className="font-bold text-slate-800 uppercase block">Payment Details:</span>
            {sale.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {p.method.replace("_", " ")}
                  {p.referenceCode ? ` (${p.referenceCode})` : ""}:
                </span>
                <span className="font-semibold">{organization.currency} {p.amount.toFixed(2)}</span>
              </div>
            ))}
            {changeAmount > 0 && (
              <div className="flex justify-between font-bold text-emerald-800 pt-0.5 border-t border-slate-200">
                <span>CHANGE GIVEN:</span>
                <span>{organization.currency} {changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 text-center text-[10px] text-slate-600 italic space-y-1">
            <p>{organization.receiptFooter || "Goods once sold are not returnable. Thank you for your business!"}</p>
            <p className="font-bold not-italic text-[9px] text-slate-400 uppercase tracking-widest pt-1">
              OmniPOS Serverless Cloud
            </p>
          </div>
        </div>

        {/* Modal Buttons (Hidden during printing) */}
        <div className="flex gap-3 mt-5 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" /> Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" /> Next Order
          </button>
        </div>
      </div>

      {/* Global CSS for Clean Thermal Printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
