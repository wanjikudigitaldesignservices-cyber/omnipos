"use server";

import { db } from "@/db";
import {
  tenants,
  users,
  registerShifts,
  products,
  categories,
  customers,
  orders,
  orderItems,
  inventoryLedger,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CheckoutItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface CheckoutPayload {
  shiftId?: string | null;
  customerId?: string | null;
  orderType: "WALK_IN" | "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD" | "CREDIT_TAB" | "SPLIT";
  paymentSplitJson?: any;
  items: CheckoutItemPayload[];
}

export async function getPosInitialData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;
  const userId = session.user.id;

  // 1. Check for an active OPEN shift for this user / tenant
  const activeShift = await db.query.registerShifts.findFirst({
    where: and(
      eq(registerShifts.tenantId, tenantId),
      eq(registerShifts.userId, userId),
      eq(registerShifts.status, "OPEN")
    ),
    orderBy: [desc(registerShifts.openedAt)],
  });

  // 2. Fetch categories
  const tenantCategories = await db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
  });

  // 3. Fetch products
  const tenantProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
    with: {
      category: true,
    },
    orderBy: [desc(products.name)],
  });

  // 4. Fetch customers (for credit tab or loyalty)
  const tenantCustomers = await db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    orderBy: [desc(customers.name)],
  });

  // 5. Fetch team members (for quick cashier switch)
  const staffMembers = await db.query.users.findMany({
    where: and(
      eq(users.tenantId, tenantId),
      eq(users.isActive, true)
    ),
    columns: {
      id: true,
      fullName: true,
      role: true,
      email: true,
    },
  });

  return {
    tenant: session.tenant,
    user: session.user,
    activeShift,
    categories: tenantCategories,
    products: tenantProducts,
    customers: tenantCustomers,
    staffMembers,
  };
}

export async function openShiftAction(openingFloat: number, notes?: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const floatVal = openingFloat >= 0 ? openingFloat.toFixed(2) : "0.00";

    const [newShift] = await db
      .insert(registerShifts)
      .values({
        tenantId: session.tenant.id,
        userId: session.user.id,
        openingFloat: floatVal,
        expectedCash: floatVal,
        notes: notes || "Opened register session",
        status: "OPEN",
      })
      .returning();

    revalidatePath("/pos");
    revalidatePath("/dashboard/shifts");
    return { success: true, shift: newShift };
  } catch (error: any) {
    console.error("openShiftAction error:", error);
    return { success: false, error: error.message || "Failed to open register shift." };
  }
}

export async function closeShiftAction(shiftId: string, actualCountedCash: number, notes?: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const shift = await db.query.registerShifts.findFirst({
      where: and(
        eq(registerShifts.id, shiftId),
        eq(registerShifts.tenantId, session.tenant.id)
      ),
    });

    if (!shift) {
      return { success: false, error: "Shift session not found." };
    }

    const countedVal = actualCountedCash.toFixed(2);
    const expected = parseFloat(shift.expectedCash);
    const varianceVal = (actualCountedCash - expected).toFixed(2);

    const [closedShift] = await db
      .update(registerShifts)
      .set({
        closedAt: new Date(),
        actualCountedCash: countedVal,
        variance: varianceVal,
        notes: notes || shift.notes,
        status: "CLOSED",
      })
      .where(eq(registerShifts.id, shiftId))
      .returning();

    revalidatePath("/pos");
    revalidatePath("/dashboard/shifts");
    return {
      success: true,
      shift: closedShift,
      expectedCash: expected,
      countedCash: actualCountedCash,
      variance: actualCountedCash - expected,
    };
  } catch (error: any) {
    console.error("closeShiftAction error:", error);
    return { success: false, error: error.message || "Failed to close register shift." };
  }
}

export async function processCheckoutAction(payload: CheckoutPayload) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Cannot checkout with an empty cart." };
    }

    const tenantId = session.tenant.id;
    const cashierId = session.user.id;

    // Generate readable receipt number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCP-${datePrefix}-${randomSuffix}`;

    // 1. Create the Order
    const [order] = await db
      .insert(orders)
      .values({
        tenantId,
        shiftId: payload.shiftId || null,
        cashierId,
        customerId: payload.customerId || null,
        receiptNumber,
        orderType: payload.orderType || "WALK_IN",
        tableNumber: payload.tableNumber || null,
        subtotal: payload.subtotal.toFixed(2),
        taxAmount: payload.taxAmount.toFixed(2),
        discountAmount: payload.discountAmount.toFixed(2),
        totalAmount: payload.totalAmount.toFixed(2),
        paymentMethod: payload.paymentMethod,
        paymentSplitJson: payload.paymentSplitJson || null,
        status: "COMPLETED",
      })
      .returning();

    // 2. Insert Order Items & Decrement Stock & Record Inventory Ledger
    for (const item of payload.items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity.toString(),
        unitCost: item.unitCost.toFixed(2),
        unitPrice: item.unitPrice.toFixed(2),
        discount: item.discount.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
      });

      // Fetch current product stock
      const prod = await db.query.products.findFirst({
        where: and(eq(products.id, item.productId), eq(products.tenantId, tenantId)),
      });

      if (prod) {
        const currentStock = parseFloat(prod.stockQuantity);
        const newStock = Math.max(0, currentStock - item.quantity);

        // Update product stock
        await db
          .update(products)
          .set({
            stockQuantity: newStock.toFixed(2),
          })
          .where(eq(products.id, item.productId));

        // Audit Trail Entry
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: item.productId,
          userId: cashierId,
          type: "SALE",
          quantityChange: (-item.quantity).toFixed(2),
          previousStock: currentStock.toFixed(2),
          newStock: newStock.toFixed(2),
          referenceNote: `Sale Receipt #${receiptNumber}`,
        });
      }
    }

    // 3. Update Register Shift Cash Balance (if cash tender was used)
    if (payload.shiftId) {
      let cashAmount = 0;
      if (payload.paymentMethod === "CASH") {
        cashAmount = payload.totalAmount;
      } else if (payload.paymentMethod === "SPLIT" && Array.isArray(payload.paymentSplitJson)) {
        for (const split of payload.paymentSplitJson) {
          if (split.method === "CASH") {
            cashAmount += parseFloat(split.amount || 0);
          }
        }
      }

      if (cashAmount > 0) {
        await db
          .update(registerShifts)
          .set({
            expectedCash: sql`${registerShifts.expectedCash} + ${cashAmount.toFixed(2)}::numeric`,
          })
          .where(eq(registerShifts.id, payload.shiftId));
      }
    }

    // 4. Update Customer Loyalty & Credit Balance (if applicable)
    if (payload.customerId) {
      const loyaltyEarned = Math.floor(payload.totalAmount / 100);

      if (payload.paymentMethod === "CREDIT_TAB") {
        // Customer bought on Deni / Tab
        await db
          .update(customers)
          .set({
            creditBalance: sql`${customers.creditBalance} + ${payload.totalAmount.toFixed(2)}::numeric`,
            loyaltyPoints: sql`${customers.loyaltyPoints} + ${loyaltyEarned}`,
          })
          .where(eq(customers.id, payload.customerId));
      } else {
        // Regular payment, just add loyalty points
        await db
          .update(customers)
          .set({
            loyaltyPoints: sql`${customers.loyaltyPoints} + ${loyaltyEarned}`,
          })
          .where(eq(customers.id, payload.customerId));
      }
    }

    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/customers");

    return {
      success: true,
      order,
      receiptNumber,
      orderId: order.id,
    };
  } catch (error: any) {
    console.error("processCheckoutAction error:", error);
    return { success: false, error: error.message || "Failed to process sale." };
  }
}
