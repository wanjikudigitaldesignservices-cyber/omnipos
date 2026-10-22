export const dynamic = "force-dynamic";

import React from "react";
import { getExpensesData } from "@/actions/expenses";
import { ExpensesManagementClient } from "./expenses-client";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const data = await getExpensesData();

  if (!data) {
    redirect("/login");
  }

  return <ExpensesManagementClient data={data} />;
}
