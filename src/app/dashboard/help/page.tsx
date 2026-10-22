export const dynamic = "force-dynamic";

import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HelpCenterClient } from "./help-client";

export default async function HelpCenterPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <HelpCenterClient
      tenant={session.tenant}
      user={session.user}
    />
  );
}
