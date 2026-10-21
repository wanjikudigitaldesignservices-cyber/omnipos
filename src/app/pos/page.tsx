export const dynamic = "force-dynamic";

import React from "react";
import { getPosInitialData } from "@/actions/pos";
import { WorkspaceNav } from "@/components/workspace-nav";
import { PosTerminalClient } from "./pos-client";
import { redirect } from "next/navigation";

export default async function PosPage() {
  const data = await getPosInitialData();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <WorkspaceNav user={data.user} tenant={data.tenant} activeShift={data.activeShift} />
      <main className="flex-1 overflow-hidden">
        <PosTerminalClient
          tenant={data.tenant}
          user={data.user}
          initialActiveShift={data.activeShift}
          categories={data.categories}
          initialProducts={data.products}
          initialCustomers={data.customers}
        />
      </main>
    </div>
  );
}
