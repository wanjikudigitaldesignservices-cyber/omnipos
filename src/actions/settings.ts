"use server";

import { db } from "@/db";
import { tenants, users, orderItems, orders, inventoryLedger, products, categories, customers, registerShifts } from "@/db/schema";
import { getSession, hashPassword, hashPin } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSettingsData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allStaff = await db.query.users.findMany({
    where: eq(users.tenantId, tenantId),
    columns: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      pinCodeHash: true,
      createdAt: true,
    },
    orderBy: [desc(users.createdAt)],
  });

  return {
    tenant: session.tenant,
    currentUser: session.user,
    staff: allStaff.map((s) => ({
      ...s,
      hasPin: !!s.pinCodeHash,
      pinCodeHash: undefined, // do not leak hash
    })),
  };
}

export async function updateBusinessProfileAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
      return { success: false, error: "Only Owners and Managers can update business settings." };
    }

    const name = formData.get("name") as string;
    const businessType = formData.get("businessType") as any;
    const currency = (formData.get("currency") as string) || "KES";
    const taxRate = (formData.get("taxRate") as string) || "16.00";
    const receiptHeader = (formData.get("receiptHeader") as string) || null;
    const receiptFooter = (formData.get("receiptFooter") as string) || null;

    if (!name) return { success: false, error: "Business name is required." };

    await db
      .update(tenants)
      .set({
        name,
        businessType,
        currency,
        taxRate,
        receiptHeader,
        receiptFooter,
      })
      .where(eq(tenants.id, session.tenant.id));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update business profile." };
  }
}

export async function addStaffMemberAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
      return { success: false, error: "Only Owners and Managers can add staff." };
    }

    const fullName = formData.get("fullName") as string;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const role = (formData.get("role") as any) || "CASHIER";
    const pin = (formData.get("pin") as string) || "";

    if (!fullName || !email || !password) {
      return { success: false, error: "Name, email, and password are required." };
    }

    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      return { success: false, error: "Terminal PIN must be exactly 4 digits." };
    }

    // Check if email already used
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return { success: false, error: "A user with this email already exists." };
    }

    const passwordHash = await hashPassword(password);
    const pinCodeHash = pin ? await hashPin(pin) : null;

    const [newUser] = await db
      .insert(users)
      .values({
        tenantId: session.tenant.id,
        fullName,
        email,
        passwordHash,
        pinCodeHash,
        role,
        isActive: true,
      })
      .returning();

    revalidatePath("/dashboard/settings");
    revalidatePath("/pos");
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add staff member." };
  }
}

export async function toggleStaffStatusAction(userId: string, isActive: boolean) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (session.user.role !== "OWNER") {
      return { success: false, error: "Only the business Owner can change staff access status." };
    }

    if (userId === session.user.id) {
      return { success: false, error: "You cannot deactivate your own owner account." };
    }

    await db
      .update(users)
      .set({ isActive })
      .where(and(eq(users.id, userId), eq(users.tenantId, session.tenant.id)));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update staff status." };
  }
}

export async function clearAllDemoDataAction() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (session.user.role !== "OWNER") {
      return { success: false, error: "Only the business Owner can reset store data." };
    }

    const tenantId = session.tenant.id;

    // Delete in sequence to respect foreign key constraints
    await db.delete(orderItems).where(
      sql`order_id IN (SELECT id FROM ${orders} WHERE tenant_id = ${tenantId})`
    );
    await db.delete(orders).where(eq(orders.tenantId, tenantId));
    await db.delete(inventoryLedger).where(eq(inventoryLedger.tenantId, tenantId));
    await db.delete(products).where(eq(products.tenantId, tenantId));
    await db.delete(categories).where(eq(categories.tenantId, tenantId));
    await db.delete(customers).where(eq(customers.tenantId, tenantId));
    await db.delete(registerShifts).where(eq(registerShifts.tenantId, tenantId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/shifts");
    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/settings");
    revalidatePath("/pos");

    return { success: true };
  } catch (error: any) {
    console.error("clearAllDemoDataAction error:", error);
    return { success: false, error: error.message || "Failed to clear demo data." };
  }
}
