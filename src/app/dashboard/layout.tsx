export const dynamic = "force-dynamic";

import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardSidebar } from "./dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Back-office access restricted to Owner and Manager
  if (session.user.role === "CASHIER") {
    redirect("/pos");
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex overflow-hidden font-sans transition-colors duration-150">
      {/* Management Sidebar */}
      <DashboardSidebar tenant={session.tenant} user={session.user} />

      {/* Main Back-Office Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
