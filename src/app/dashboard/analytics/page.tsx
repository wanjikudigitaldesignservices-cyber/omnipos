export const dynamic = "force-dynamic";

import React from "react";
import { getExecutiveAnalytics } from "@/actions/dashboard";
import { DashboardExecutiveClient } from "../dashboard-client";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const data = await getExecutiveAnalytics();

  if (!data) {
    redirect("/login");
  }

  return <DashboardExecutiveClient data={data} />;
}
