"use server";

import { db } from "@/db";
import { registerShifts, orders, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export async function getShiftsData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allShifts = await db.query.registerShifts.findMany({
    where: eq(registerShifts.tenantId, tenantId),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          role: true,
          email: true,
        },
      },
      orders: {
        columns: {
          id: true,
          totalAmount: true,
          paymentMethod: true,
          status: true,
        },
      },
    },
    orderBy: [desc(registerShifts.openedAt)],
    limit: 50,
  });

  // Calculate current active shift
  const activeShift = allShifts.find((s) => s.status === "OPEN") || null;

  return {
    tenant: session.tenant,
    shifts: allShifts,
    activeShift,
  };
}

export async function getShiftZReport(shiftId: string) {
  const session = await getSession();
  if (!session) return null;

  const shift = await db.query.registerShifts.findFirst({
    where: and(eq(registerShifts.id, shiftId), eq(registerShifts.tenantId, session.tenant.id)),
    with: {
      user: true,
      orders: true,
    },
  });

  if (!shift) return null;

  let cashSales = 0;
  let mobileMoneySales = 0;
  let cardSales = 0;
  let creditTabSales = 0;
  let totalRefunds = 0;
  let validOrderCount = 0;

  for (const o of shift.orders) {
    const amt = parseFloat(o.totalAmount);
    if (o.status === "REFUNDED") {
      totalRefunds += amt;
    } else if (o.status === "COMPLETED") {
      validOrderCount++;
      if (o.paymentMethod === "CASH") cashSales += amt;
      else if (o.paymentMethod === "MOBILE_MONEY") mobileMoneySales += amt;
      else if (o.paymentMethod === "CARD") cardSales += amt;
      else if (o.paymentMethod === "CREDIT_TAB") creditTabSales += amt;
      else if (o.paymentMethod === "SPLIT") {
        cashSales += amt; // default approximation if split details omitted
      }
    }
  }

  const openingFloat = parseFloat(shift.openingFloat);
  const expectedCash = parseFloat(shift.expectedCash);
  const actualCounted = shift.actualCountedCash ? parseFloat(shift.actualCountedCash) : null;
  const variance = shift.variance ? parseFloat(shift.variance) : null;

  return {
    shift,
    summary: {
      openingFloat,
      cashSales,
      mobileMoneySales,
      cardSales,
      creditTabSales,
      totalSales: cashSales + mobileMoneySales + cardSales + creditTabSales,
      totalRefunds,
      validOrderCount,
      expectedCash,
      actualCounted,
      variance,
    },
  };
}
