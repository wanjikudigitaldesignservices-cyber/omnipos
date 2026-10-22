export const dynamic = "force-dynamic";

import React from "react";
import { getSuppliersData } from "@/actions/suppliers";
import { SuppliersManagementClient } from "./suppliers-client";
import { redirect } from "next/navigation";

export default async function SuppliersPage() {
  const data = await getSuppliersData();

  if (!data) {
    redirect("/login");
  }

  return <SuppliersManagementClient data={data} />;
}
