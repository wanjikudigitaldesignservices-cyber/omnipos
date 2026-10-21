"use server";

import { db } from "@/db";
import { orders, orderItems, products, inventoryLedger, registerShifts, customers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getOrdersData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allOrders = await db.query.orders.findMany({
    where: eq(orders.tenantId, tenantId),
    with: {
      items: true,
      customer: true,
      cashier: {
        columns: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      shift: true,
    },
    orderBy: [desc(orders.createdAt)],
    limit: 100,
  });

  return {
    tenant: session.tenant,
    orders: allOrders,
  };
}

export async function processRefundAction(
  orderId: string,
  restoreStock = true,
  notes?: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.tenantId, session.tenant.id)),
      with: {
        items: true,
      },
    });

    if (!order) return { success: false, error: "Order not found." };
    if (order.status === "REFUNDED") {
      return { success: false, error: "This order is already refunded." };
    }

    // 1. Restore product stock if requested
    if (restoreStock && order.items && order.items.length > 0) {
      for (const item of order.items) {
        const qty = parseFloat(item.quantity);
        const prod = await db.query.products.findFirst({
          where: and(eq(products.id, item.productId), eq(products.tenantId, session.tenant.id)),
        });

        if (prod) {
          const currentStock = parseFloat(prod.stockQuantity);
          const restoredStock = currentStock + qty;

          await db
            .update(products)
            .set({ stockQuantity: restoredStock.toFixed(2) })
            .where(eq(products.id, item.productId));

          await db.insert(inventoryLedger).values({
            tenantId: session.tenant.id,
            productId: item.productId,
            userId: session.user.id,
            type: "RETURN",
            quantityChange: qty.toFixed(2),
            previousStock: currentStock.toFixed(2),
            newStock: restoredStock.toFixed(2),
            referenceNote: `Refund/Return for Order #${order.receiptNumber}: ${notes || "Customer returned item"}`,
          });
        }
      }
    }

    // 2. Adjust Shift Cash if paid in cash
    if (order.shiftId && (order.paymentMethod === "CASH" || order.paymentMethod === "SPLIT")) {
      const shift = await db.query.registerShifts.findFirst({
        where: eq(registerShifts.id, order.shiftId),
      });

      if (shift && shift.status === "OPEN") {
        const orderTotal = parseFloat(order.totalAmount);
        await db
          .update(registerShifts)
          .set({
            expectedCash: sql`${registerShifts.expectedCash} - ${orderTotal.toFixed(2)}::numeric`,
          })
          .where(eq(registerShifts.id, order.shiftId));
      }
    }

    // 3. Adjust Customer Credit if paid with credit tab
    if (order.customerId && order.paymentMethod === "CREDIT_TAB") {
      const orderTotal = parseFloat(order.totalAmount);
      await db
        .update(customers)
        .set({
          creditBalance: sql`GREATEST(0, ${customers.creditBalance} - ${orderTotal.toFixed(2)}::numeric)`,
        })
        .where(eq(customers.id, order.customerId));
    }

    // 4. Mark order as REFUNDED
    await db
      .update(orders)
      .set({
        status: "REFUNDED",
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/customers");
    revalidatePath("/pos");

    return { success: true };
  } catch (error: any) {
    console.error("processRefundAction error:", error);
    return { success: false, error: error.message || "Failed to process refund." };
  }
}
