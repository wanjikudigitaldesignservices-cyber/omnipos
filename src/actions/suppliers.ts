"use server";

import { db } from "@/db";
import { suppliers, supplierInvoices, inventoryLedger } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSuppliersData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allSuppliers = await db.query.suppliers.findMany({
    where: eq(suppliers.tenantId, tenantId),
    orderBy: [desc(suppliers.createdAt)],
  });

  const recentInvoices = await db.query.supplierInvoices.findMany({
    where: eq(supplierInvoices.tenantId, tenantId),
    orderBy: [desc(supplierInvoices.createdAt)],
    limit: 30,
  });

  // Calculate metrics
  let totalBalanceOwed = 0;
  for (const s of allSuppliers) {
    totalBalanceOwed += parseFloat(s.outstandingBalance) || 0;
  }

  return {
    tenant: session.tenant,
    suppliers: allSuppliers,
    invoices: recentInvoices,
    metrics: {
      totalSuppliers: allSuppliers.length,
      totalBalanceOwed,
      recentInvoicesCount: recentInvoices.length,
    },
  };
}

export async function createSupplierAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const name = formData.get("name") as string;
    const contactPerson = (formData.get("contactPerson") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    const email = (formData.get("email") as string) || null;
    const address = (formData.get("address") as string) || null;
    const paymentTerms = (formData.get("paymentTerms") as string) || "CASH_ON_DELIVERY";
    const outstandingBalance = (formData.get("outstandingBalance") as string) || "0.0000";
    const mpesaPaybillNumber = (formData.get("mpesaPaybillNumber") as string) || null;
    const bankDetails = (formData.get("bankDetails") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!name?.trim()) {
      return { success: false, error: "Supplier name is required." };
    }

    const [newSup] = await db
      .insert(suppliers)
      .values({
        tenantId: session.tenant.id,
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        paymentTerms,
        outstandingBalance: parseFloat(outstandingBalance).toFixed(4),
        mpesaPaybillNumber: mpesaPaybillNumber?.trim() || null,
        bankDetails: bankDetails?.trim() || null,
        notes: notes?.trim() || null,
      })
      .returning();

    revalidatePath("/dashboard/suppliers");
    return { success: true, supplier: newSup };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create supplier." };
  }
}

export async function updateSupplierAction(id: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const name = formData.get("name") as string;
    const contactPerson = (formData.get("contactPerson") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    const email = (formData.get("email") as string) || null;
    const address = (formData.get("address") as string) || null;
    const paymentTerms = (formData.get("paymentTerms") as string) || "CASH_ON_DELIVERY";
    const outstandingBalance = formData.get("outstandingBalance") as string;
    const mpesaPaybillNumber = (formData.get("mpesaPaybillNumber") as string) || null;
    const bankDetails = (formData.get("bankDetails") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!name?.trim()) {
      return { success: false, error: "Supplier name is required." };
    }

    const updateFields: any = {
      name: name.trim(),
      contactPerson: contactPerson?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      paymentTerms,
      mpesaPaybillNumber: mpesaPaybillNumber?.trim() || null,
      bankDetails: bankDetails?.trim() || null,
      notes: notes?.trim() || null,
    };

    if (outstandingBalance !== undefined && outstandingBalance !== null) {
      updateFields.outstandingBalance = parseFloat(outstandingBalance).toFixed(4);
    }

    await db
      .update(suppliers)
      .set(updateFields)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, session.tenant.id)));

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update supplier." };
  }
}

export async function recordSupplierPaymentAction(
  supplierId: string,
  amountPaid: number,
  paymentMethod: string,
  referenceNote?: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (amountPaid <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }

    const sup = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, session.tenant.id)),
    });

    if (!sup) return { success: false, error: "Supplier not found." };

    const currentBal = parseFloat(sup.outstandingBalance) || 0;
    const newBal = Math.max(0, currentBal - amountPaid);

    await db
      .update(suppliers)
      .set({
        outstandingBalance: newBal.toFixed(4),
      })
      .where(eq(suppliers.id, supplierId));

    revalidatePath("/dashboard/suppliers");
    return { success: true, newBalance: newBal };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, session.tenant.id)));

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete supplier." };
  }
}
