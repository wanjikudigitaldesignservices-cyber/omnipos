export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.tenant.onboardingCompleted) {
    redirect("/onboarding");
  }

  redirect("/pos");
}
