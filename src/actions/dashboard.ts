"use server";

import { db } from "@/db";
import { orders, orderItems, products, customers, registerShifts } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export async function getExecutiveAnalytics() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  // Start of today (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch today's completed orders
  const todayOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.tenantId, tenantId),
      eq(orders.status, "COMPLETED"),
      gte(orders.createdAt, today)
    ),
    with: {
      items: true,
      customer: true,
    },
    orderBy: [desc(orders.createdAt)],
  });

  // 2. Fetch all completed orders (for general metrics & 7-day trend)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.tenantId, tenantId),
      eq(orders.status, "COMPLETED"),
      gte(orders.createdAt, sevenDaysAgo)
    ),
    with: {
      items: true,
    },
    orderBy: [desc(orders.createdAt)],
  });

  // Calculate Today's Revenue and Net Profit
  let todayRevenue = 0;
  let todayCostOfGoods = 0;

  const paymentBreakdown: Record<string, { count: number; total: number }> = {
    CASH: { count: 0, total: 0 },
    MOBILE_MONEY: { count: 0, total: 0 },
    CARD: { count: 0, total: 0 },
    CREDIT_TAB: { count: 0, total: 0 },
    SPLIT: { count: 0, total: 0 },
  };

  for (const o of todayOrders) {
    const total = parseFloat(o.totalAmount);
    todayRevenue += total;

    if (paymentBreakdown[o.paymentMethod]) {
      paymentBreakdown[o.paymentMethod].count += 1;
      paymentBreakdown[o.paymentMethod].total += total;
    }

    if (o.items) {
      for (const item of o.items) {
        const qty = parseFloat(item.quantity);
        const cost = parseFloat(item.unitCost);
        todayCostOfGoods += qty * cost;
      }
    }
  }

  const todayGrossProfit = todayRevenue - todayCostOfGoods;

  // 3. Low stock and Expiring items
  const allProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  const lowStockAlerts = [];
  const expiringAlerts = [];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  for (const p of allProducts) {
    const stock = parseFloat(p.stockQuantity);
    const threshold = parseFloat(p.lowStockThreshold);

    if (stock <= threshold) {
      lowStockAlerts.push(p);
    }

    if (p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow) {
      expiringAlerts.push(p);
    }
  }

  // 4. Customer Outstanding Debt
  const allCustomers = await db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
  });

  let totalOutstandingDebt = 0;
  for (const c of allCustomers) {
    totalOutstandingDebt += parseFloat(c.creditBalance) || 0;
  }

  // 5. Build 7-day trend array for Recharts
  const daysMap: Record<string, { date: string; revenue: number; profit: number; orders: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    daysMap[key] = { date: key, revenue: 0, profit: 0, orders: 0 };
  }

  for (const o of recentOrders) {
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (daysMap[key]) {
      const amt = parseFloat(o.totalAmount);
      daysMap[key].revenue += amt;
      daysMap[key].orders += 1;

      let cogs = 0;
      if (o.items) {
        for (const item of o.items) {
          cogs += parseFloat(item.quantity) * parseFloat(item.unitCost);
        }
      }
      daysMap[key].profit += amt - cogs;
    }
  }

  const salesTrend = Object.values(daysMap);

  // 6. Active shift check
  const activeShift = await db.query.registerShifts.findFirst({
    where: and(
      eq(registerShifts.tenantId, tenantId),
      eq(registerShifts.status, "OPEN")
    ),
  });

  return {
    tenant: session.tenant,
    user: session.user,
    metrics: {
      todayRevenue,
      todayGrossProfit,
      todayOrdersCount: todayOrders.length,
      profitMarginPercent: todayRevenue > 0 ? ((todayGrossProfit / todayRevenue) * 100).toFixed(1) : "0.0",
      totalOutstandingDebt,
      lowStockCount: lowStockAlerts.length,
      expiringCount: expiringAlerts.length,
      hasActiveShift: !!activeShift,
      activeShift,
    },
    paymentBreakdown: Object.entries(paymentBreakdown).map(([method, data]) => ({
      method: method.replace(/_/g, " "),
      key: method,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    })),
    salesTrend,
    lowStockAlerts: lowStockAlerts.slice(0, 5),
    expiringAlerts: expiringAlerts.slice(0, 5),
    recentOrders: todayOrders.slice(0, 10),
  };
}
