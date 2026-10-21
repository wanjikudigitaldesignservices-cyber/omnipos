export const dynamic = "force-dynamic";

import React from "react";
import { getInventoryData } from "@/actions/inventory";
import { InventoryManagementClient } from "./inventory-client";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const data = await getInventoryData();

  if (!data) {
    redirect("/login");
  }

  return <InventoryManagementClient data={data} />;
}
