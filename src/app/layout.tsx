import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniPOS — Universal SME Point of Sale & ERP",
  description: "Next-generation Odoo-inspired Point of Sale and Cloud ERP for Retail, Chemists, Agrovets, and Dining SMEs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-emerald-500 selection:text-slate-950 font-sans">
        {children}
      </body>
    </html>
  );
}
