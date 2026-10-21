export const dynamic = "force-dynamic";

import React from "react";
import { getCustomersData } from "@/actions/customers";
import { CustomersManagementClient } from "./customers-client";
import { redirect } from "next/navigation";

export default async function CustomersPage() {
  const data = await getCustomersData();

  if (!data) {
    redirect("/login");
  }

  return <CustomersManagementClient data={data} />;
}
