"use server";

import { db } from "@/db";
import { expenses, registerShifts } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getExpensesData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allExpenses = await db.query.expenses.findMany({
    where: eq(expenses.tenantId, tenantId),
    with: {
      user: true,
    },
    orderBy: [desc(expenses.expenseDate)],
    limit: 100,
  });

  // Calculate metrics
  let totalExpensesAmount = 0;
  let todayExpensesAmount = 0;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const categoryTotals: Record<string, number> = {};

  for (const exp of allExpenses) {
    const amt = parseFloat(exp.amount) || 0;
    totalExpensesAmount += amt;

    const expDateStr = new Date(exp.expenseDate).toISOString().split("T")[0];
    if (expDateStr === todayStr) {
      todayExpensesAmount += amt;
    }

    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
  }

  const categoryBreakdown = Object.entries(categoryTotals).map(([cat, total]) => ({
    category: cat,
    total,
  }));

  return {
    tenant: session.tenant,
    expenses: allExpenses,
    categoryBreakdown,
    metrics: {
      totalCount: allExpenses.length,
      totalExpensesAmount,
      todayExpensesAmount,
    },
  };
}

export async function createExpenseAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const category = (formData.get("category") as string) || "OTHER";
    const paymentMethod = (formData.get("paymentMethod") as string) || "CASH";
    const recipientName = (formData.get("recipientName") as string) || null;
    const referenceNumber = (formData.get("referenceNumber") as string) || null;
    const dateStr = formData.get("expenseDate") as string;

    if (!description?.trim()) {
      return { success: false, error: "Description is required." };
    }

    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      return { success: false, error: "Valid expense amount is required." };
    }

    const expenseDate = dateStr ? new Date(dateStr) : new Date();

    const [newExp] = await db
      .insert(expenses)
      .values({
        tenantId: session.tenant.id,
        userId: session.user.id,
        description: description.trim(),
        amount: amount.toFixed(4),
        category,
        paymentMethod,
        recipientName: recipientName?.trim() || null,
        referenceNumber: referenceNumber?.trim() || null,
        expenseDate,
      })
      .returning();

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true, expense: newExp };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log expense." };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.tenantId, session.tenant.id)));

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete expense." };
  }
}
