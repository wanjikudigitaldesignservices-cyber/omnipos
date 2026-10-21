export const dynamic = "force-dynamic";

import React from "react";
import { getOrdersData } from "@/actions/orders";
import { OrdersManagementClient } from "./orders-client";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const data = await getOrdersData();

  if (!data) {
    redirect("/login");
  }

  return <OrdersManagementClient data={data} />;
}
