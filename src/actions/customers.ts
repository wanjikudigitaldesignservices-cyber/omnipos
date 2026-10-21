"use server";

import { db } from "@/db";
import { customers, orders, registerShifts } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCustomersData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allCustomers = await db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    with: {
      orders: {
        orderBy: [desc(orders.createdAt)],
        limit: 5,
      },
    },
    orderBy: [desc(customers.name)],
  });

  // Calculate totals
  let totalDebt = 0;
  let totalLoyalty = 0;
  let debtorsCount = 0;

  for (const c of allCustomers) {
    const bal = parseFloat(c.creditBalance) || 0;
    totalDebt += bal;
    totalLoyalty += c.loyaltyPoints || 0;
    if (bal > 0) debtorsCount++;
  }

  return {
    tenant: session.tenant,
    customers: allCustomers,
    metrics: {
      totalCustomers: allCustomers.length,
      totalDebt,
      totalLoyalty,
      debtorsCount,
    },
  };
}

export async function createCustomerAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const name = formData.get("name") as string;
    const phone = (formData.get("phone") as string) || null;
    const email = (formData.get("email") as string) || null;
    const creditLimit = (formData.get("creditLimit") as string) || "50000.00";

    if (!name) return { success: false, error: "Customer name is required." };

    const [newCustomer] = await db
      .insert(customers)
      .values({
        tenantId: session.tenant.id,
        name,
        phone,
        email,
        creditLimit,
        creditBalance: "0.00",
        loyaltyPoints: 0,
      })
      .returning();

    revalidatePath("/dashboard/customers");
    revalidatePath("/pos");
    return { success: true, customer: newCustomer };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create customer." };
  }
}

export async function recordCustomerRepaymentAction(
  customerId: string,
  amount: number,
  paymentMethod: "CASH" | "MOBILE_MONEY" = "CASH",
  shiftId?: string | null,
  notes?: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (amount <= 0) {
      return { success: false, error: "Repayment amount must be greater than zero." };
    }

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.tenantId, session.tenant.id)),
    });

    if (!customer) return { success: false, error: "Customer not found." };

    const currentBal = parseFloat(customer.creditBalance);
    const newBal = Math.max(0, currentBal - amount);

    // Update customer debt balance
    await db
      .update(customers)
      .set({
        creditBalance: newBal.toFixed(2),
      })
      .where(eq(customers.id, customerId));

    // If payment was cash and shift is provided, credit register shift
    if (paymentMethod === "CASH" && shiftId) {
      await db
        .update(registerShifts)
        .set({
          expectedCash: sql`${registerShifts.expectedCash} + ${amount.toFixed(2)}::numeric`,
        })
        .where(eq(registerShifts.id, shiftId));
    }

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    return { success: true, newBalance: newBal };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record debt repayment." };
  }
}
