export const dynamic = "force-dynamic";

import React from "react";
import { getSettingsData } from "@/actions/settings";
import { SettingsManagementClient } from "./settings-client";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const data = await getSettingsData();

  if (!data) {
    redirect("/login");
  }

  return <SettingsManagementClient data={data} />;
}
