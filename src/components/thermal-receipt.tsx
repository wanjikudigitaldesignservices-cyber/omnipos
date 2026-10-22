"use client";

import React from "react";
import { Printer, Check, X, Share2, MessageCircle } from "lucide-react";

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
      method: "CASH" | "MPESA_TILL" | "CARD" | "CREDIT_DENI" | string;
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
    taxInclusive?: boolean;
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

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*${organization.name} - Official E-Receipt*\n` +
      `Receipt #: ${sale.receiptNumber}\n` +
      `Date: ${saleDate.toLocaleDateString()} ${saleDate.toLocaleTimeString()}\n` +
      `Cashier: ${cashierName}\n` +
      `--------------------------------\n` +
      sale.items.map((i) => `${i.quantity}x ${i.productName} = ${organization.currency} ${i.subtotal.toFixed(2)}`).join("\n") +
      `\n--------------------------------\n` +
      `Subtotal: ${organization.currency} ${sale.subtotal.toFixed(2)}\n` +
      `Tax: ${organization.currency} ${sale.taxAmount.toFixed(2)}\n` +
      `*TOTAL PAID: ${organization.currency} ${sale.totalAmount.toFixed(2)}*\n` +
      `\nThank you for shopping with ${organization.name}! Karibu tena.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative my-6 text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer print:hidden transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4 print:hidden">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 font-bold">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Sale Recorded Successfully!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ready to print 80mm thermal receipt or share via WhatsApp</p>
        </div>

        {/* 80mm Thermal Receipt Container (Always Crisp Paper White for Authentic Printing) */}
        <div
          id="receipt-print-area"
          className="w-full bg-white text-slate-950 p-5 rounded-xl font-mono text-xs leading-relaxed border border-slate-300 shadow-md select-text"
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

          {/* Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{saleDate.toLocaleDateString()} {saleDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{cashierName}</span>
            </div>
            {customerName && (
              <div className="flex justify-between font-bold text-emerald-900">
                <span>Customer:</span>
                <span>{customerName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] text-slate-600 uppercase">
              <span>Item & Qty</span>
              <span>Subtotal</span>
            </div>
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <div className="pr-2 overflow-hidden">
                  <div className="font-semibold">{item.productName}</div>
                  <div className="text-[10px] text-slate-600">
                    {item.quantity} x {organization.currency} {item.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div className="font-bold shrink-0">
                  {organization.currency} {item.subtotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{organization.currency} {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-red-700">
                <span>Discount:</span>
                <span>-{organization.currency} {sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT ({organization.taxRate}%):</span>
              <span>{organization.currency} {sale.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
              <span>TOTAL:</span>
              <span>{organization.currency} {sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Tender Breakdown */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
            <div className="font-bold text-slate-700 uppercase">Payment Summary:</div>
            {sale.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{p.method.replace(/_/g, " ")}:</span>
                <span className="font-bold">
                  {organization.currency} {p.amount.toFixed(2)}
                  {p.referenceCode ? ` (Ref: ${p.referenceCode})` : ""}
                </span>
              </div>
            ))}
            {changeAmount > 0 && (
              <div className="flex justify-between font-bold text-emerald-800 pt-1">
                <span>Change Returned:</span>
                <span>{organization.currency} {changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 text-center text-[10px] text-slate-600 italic space-y-1">
            <p>{organization.receiptFooter || "Goods once sold are not returnable. Thank you for your business!"}</p>
            <p className="font-bold not-italic text-[9px] text-slate-400 uppercase tracking-widest pt-1">
              OmniPOS Cloud • Universal SME ERP
            </p>
          </div>
        </div>

        {/* Action Buttons (Hidden during thermal printing) */}
        <div className="space-y-2 mt-5 print:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-500/30 cursor-pointer transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" /> New Sale / Return to Register
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
