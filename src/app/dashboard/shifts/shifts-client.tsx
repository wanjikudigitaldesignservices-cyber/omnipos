"use client";

import React, { useState } from "react";
import { getShiftZReport } from "@/actions/shifts";
import { closeShiftAction } from "@/actions/pos";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Printer,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ShiftsClientProps {
  data: {
    tenant: {
      name: string;
      currency: string;
      taxRate: string;
      receiptHeader?: string | null;
      receiptFooter?: string | null;
    };
    shifts: any[];
    activeShift: any | null;
  };
}

export function ShiftsManagementClient({ data }: ShiftsClientProps) {
  const { tenant, shifts, activeShift } = data;

  // Selected shift for Z-Report inspection
  const [selectedShiftZReport, setSelectedShiftZReport] = useState<any | null>(null);
  const [loadingZReport, setLoadingZReport] = useState(false);

  // Close shift modal state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Inspect Z-Report
  const handleInspectZReport = async (shiftId: string) => {
    setLoadingZReport(true);
    const report = await getShiftZReport(shiftId);
    if (report) {
      setSelectedShiftZReport(report);
    }
    setLoadingZReport(false);
  };

  // Close active shift
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setIsSubmittingClose(true);

    const counted = parseFloat(countedCashInput) || 0;
    const res = await closeShiftAction(activeShift.id, counted, notesInput);

    if (res.success) {
      setIsCloseModalOpen(false);
      window.location.reload();
    }
    setIsSubmittingClose(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Register Shifts & Cash Reconciliation
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Enterprise-grade cash float enforcement, counted vs. expected drawer variance, and Z-Reports.
          </p>
        </div>

        {activeShift && (
          <button
            type="button"
            onClick={() => setIsCloseModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Close Active Shift & Count Drawer</span>
          </button>
        )}
      </div>

      {/* Active Shift Banner Card */}
      {activeShift ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                  Active Drawer Session
                </div>
                <h3 className="text-lg font-bold text-white">Current Shift In Progress</h3>
                <p className="text-xs text-slate-400">
                  Opened {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} by {activeShift.user?.fullName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Starting Float
                </span>
                <span className="font-mono font-bold text-white text-base">
                  {tenant.currency} {parseFloat(activeShift.openingFloat).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Expected Cash Balance
                </span>
                <span className="font-mono font-black text-emerald-400 text-lg">
                  {tenant.currency} {parseFloat(activeShift.expectedCash).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800 text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">No Shift Currently Open</h4>
              <p className="text-xs text-slate-400">Cash drawer is locked. Staff must open a session on the POS terminal to begin sales.</p>
            </div>
          </div>
        </div>
      )}

      {/* Shifts History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Shift Ledger & Cash Drawer Reconciliation</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Opened & Closed</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5">Opening Float</th>
                <th className="px-5 py-3.5">Expected Cash</th>
                <th className="px-5 py-3.5">Actual Counted</th>
                <th className="px-5 py-3.5">Variance (Over/Short)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Z-Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium font-mono text-[11px]">
              {shifts.map((s) => {
                const variance = s.variance ? parseFloat(s.variance) : null;
                const isClosed = s.status === "CLOSED";
                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-sans">
                      <div>{new Date(s.openedAt).toLocaleDateString()} {new Date(s.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      {s.closedAt && (
                        <div className="text-[10px] text-slate-500">
                          to {new Date(s.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-sans font-bold text-white text-xs">
                      {s.user?.fullName || "Staff"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {tenant.currency} {parseFloat(s.openingFloat).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-white font-bold">
                      {tenant.currency} {parseFloat(s.expectedCash).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {s.actualCountedCash
                        ? `${tenant.currency} ${parseFloat(s.actualCountedCash).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-bold">
                      {variance === null ? (
                        <span className="text-slate-500 font-normal">Pending Close</span>
                      ) : variance === 0 ? (
                        <span className="text-emerald-400">Balanced (0.00)</span>
                      ) : variance > 0 ? (
                        <span className="text-blue-400">+{tenant.currency} {variance.toFixed(2)} (Over)</span>
                      ) : (
                        <span className="text-red-400">{tenant.currency} {variance.toFixed(2)} (Short)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isClosed
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleInspectZReport(s.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Z-Report</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Z-Report Inspection Modal                       */}
      {/* ======================================================== */}
      {selectedShiftZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative my-6">
            <button
              onClick={() => setSelectedShiftZReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Z-Report Styled Receipt Print Container */}
            <div
              id="z-report-print"
              className="bg-white text-slate-950 p-5 rounded-xl font-mono text-xs leading-relaxed border border-slate-200 shadow-md space-y-2 select-text"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h3 className="font-black text-sm uppercase tracking-wider">{tenant.name}</h3>
                <p className="text-[10px] font-bold text-slate-600">OFFICIAL Z-REPORT SUMMARY</p>
                <p className="text-[9px] text-slate-500">
                  Register Session: {selectedShiftZReport.shift.id.slice(0, 8)}
                </p>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2 text-slate-700">
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="font-bold">{selectedShiftZReport.shift.user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened:</span>
                  <span>{new Date(selectedShiftZReport.shift.openedAt).toLocaleString()}</span>
                </div>
                {selectedShiftZReport.shift.closedAt && (
                  <div className="flex justify-between">
                    <span>Closed:</span>
                    <span>{new Date(selectedShiftZReport.shift.closedAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Valid Orders Count:</span>
                  <span>{selectedShiftZReport.summary.validOrderCount}</span>
                </div>
              </div>

              {/* Tender Breakdown */}
              <div className="space-y-1 border-b border-dashed border-slate-400 py-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>{tenant.currency} {selectedShiftZReport.summary.openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales Tender:</span>
                  <span>{tenant.currency} {selectedShiftZReport.summary.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>M-Pesa / Mobile Money:</span>
                  <span>{tenant.currency} {selectedShiftZReport.summary.mobileMoneySales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Payments:</span>
                  <span>{tenant.currency} {selectedShiftZReport.summary.cardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit (Deni) Tab:</span>
                  <span>{tenant.currency} {selectedShiftZReport.summary.creditTabSales.toFixed(2)}</span>
                </div>
                {selectedShiftZReport.summary.totalRefunds > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Total Refunds Issued:</span>
                    <span>-{tenant.currency} {selectedShiftZReport.summary.totalRefunds.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Cash Reconciliation */}
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>Expected Drawer Cash:</span>
                  <span>{tenant.currency} {selectedShiftZReport.summary.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Actual Counted Cash:</span>
                  <span>
                    {selectedShiftZReport.summary.actualCounted !== null
                      ? `${tenant.currency} ${selectedShiftZReport.summary.actualCounted.toFixed(2)}`
                      : "Not Counted Yet"}
                  </span>
                </div>
                {selectedShiftZReport.summary.variance !== null && (
                  <div
                    className={`flex justify-between font-black text-xs pt-1 border-t border-slate-300 ${
                      selectedShiftZReport.summary.variance >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    <span>DRAWER VARIANCE:</span>
                    <span>
                      {selectedShiftZReport.summary.variance >= 0 ? "+" : ""}
                      {tenant.currency} {selectedShiftZReport.summary.variance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Z-Report Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Close Active Shift Modal                        */}
      {/* ======================================================== */}
      {isCloseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsCloseModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Count Cash & Close Shift</h3>
              <p className="text-xs text-slate-400">Perform physical drawer count reconciliation</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Opening Float:</span>
                <span className="font-mono text-white">{tenant.currency} {parseFloat(activeShift.openingFloat).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">System Expected Cash:</span>
                <span className="font-mono text-emerald-400">{tenant.currency} {parseFloat(activeShift.expectedCash).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Actual Counted Cash in Drawer ({tenant.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  placeholder="e.g. 15450.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Reconciliation Notes
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Drawer balanced perfectly"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingClose}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSubmittingClose ? "Closing Shift..." : "Finalize Count & Close Register"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
