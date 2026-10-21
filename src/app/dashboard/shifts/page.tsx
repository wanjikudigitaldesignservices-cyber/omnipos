export const dynamic = "force-dynamic";

import React from "react";
import { getShiftsData } from "@/actions/shifts";
import { ShiftsManagementClient } from "./shifts-client";
import { redirect } from "next/navigation";

export default async function ShiftsPage() {
  const data = await getShiftsData();

  if (!data) {
    redirect("/login");
  }

  return <ShiftsManagementClient data={data} />;
}
