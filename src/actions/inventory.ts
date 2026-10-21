"use server";

import { db } from "@/db";
import { products, categories, inventoryLedger, tenants } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInventoryData() {
  const session = await getSession();
  if (!session) return null;

  const tenantId = session.tenant.id;

  const allCategories = await db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
    orderBy: [desc(categories.name)],
  });

  const allProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
    with: {
      category: true,
    },
    orderBy: [desc(products.name)],
  });

  const recentLedger = await db.query.inventoryLedger.findMany({
    where: eq(inventoryLedger.tenantId, tenantId),
    with: {
      product: true,
      user: true,
    },
    orderBy: [desc(inventoryLedger.createdAt)],
    limit: 50,
  });

  // Calculate valuation metrics
  let totalCostValuation = 0;
  let totalRetailValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of allProducts) {
    const qty = parseFloat(p.stockQuantity) || 0;
    const cost = parseFloat(p.costPrice) || 0;
    const price = parseFloat(p.sellingPrice) || 0;
    const threshold = parseFloat(p.lowStockThreshold) || 5;

    totalCostValuation += qty * cost;
    totalRetailValuation += qty * price;

    if (qty <= 0) {
      outOfStockCount++;
    } else if (qty <= threshold) {
      lowStockCount++;
    }
  }

  return {
    tenant: session.tenant,
    categories: allCategories,
    products: allProducts,
    recentLedger,
    metrics: {
      totalItems: allProducts.length,
      totalCostValuation,
      totalRetailValuation,
      lowStockCount,
      outOfStockCount,
    },
  };
}

export async function createProductAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const name = formData.get("name") as string;
    const categoryId = (formData.get("categoryId") as string) || null;
    const sku = (formData.get("sku") as string) || null;
    const barcode = (formData.get("barcode") as string) || null;
    const costPrice = (formData.get("costPrice") as string) || "0.00";
    const sellingPrice = (formData.get("sellingPrice") as string) || "0.00";
    const stockQuantity = (formData.get("stockQuantity") as string) || "0.00";
    const lowStockThreshold = (formData.get("lowStockThreshold") as string) || "5.00";
    const unit = (formData.get("unit") as string) || "pcs";
    const batchNumber = (formData.get("batchNumber") as string) || null;
    const expiryDateStr = (formData.get("expiryDate") as string) || null;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    if (!name) {
      return { success: false, error: "Product name is required." };
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        tenantId: session.tenant.id,
        categoryId: categoryId || null,
        name,
        sku,
        barcode,
        costPrice,
        sellingPrice,
        stockQuantity,
        lowStockThreshold,
        unit,
        batchNumber,
        expiryDate,
      })
      .returning();

    // Log initial stock to ledger
    if (parseFloat(stockQuantity) > 0) {
      await db.insert(inventoryLedger).values({
        tenantId: session.tenant.id,
        productId: newProduct.id,
        userId: session.user.id,
        type: "RESTOCK",
        quantityChange: stockQuantity,
        previousStock: "0.00",
        newStock: stockQuantity,
        referenceNote: "Initial product stock upon creation",
      });
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");
    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error("createProductAction error:", error);
    return { success: false, error: error.message || "Failed to create product." };
  }
}

export async function updateProductAction(productId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const name = formData.get("name") as string;
    const categoryId = (formData.get("categoryId") as string) || null;
    const sku = (formData.get("sku") as string) || null;
    const barcode = (formData.get("barcode") as string) || null;
    const costPrice = (formData.get("costPrice") as string) || "0.00";
    const sellingPrice = (formData.get("sellingPrice") as string) || "0.00";
    const lowStockThreshold = (formData.get("lowStockThreshold") as string) || "5.00";
    const unit = (formData.get("unit") as string) || "pcs";
    const batchNumber = (formData.get("batchNumber") as string) || null;
    const expiryDateStr = (formData.get("expiryDate") as string) || null;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    if (!name) {
      return { success: false, error: "Product name is required." };
    }

    await db
      .update(products)
      .set({
        name,
        categoryId: categoryId || null,
        sku,
        barcode,
        costPrice,
        sellingPrice,
        lowStockThreshold,
        unit,
        batchNumber,
        expiryDate,
      })
      .where(and(eq(products.id, productId), eq(products.tenantId, session.tenant.id)));

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update product." };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, session.tenant.id)));

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product." };
  }
}

export async function receiveStockAction(
  productId: string,
  quantityReceived: number,
  newUnitCost?: number,
  referenceNote?: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (quantityReceived <= 0) {
      return { success: false, error: "Received quantity must be greater than zero." };
    }

    const prod = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.tenantId, session.tenant.id)),
    });

    if (!prod) return { success: false, error: "Product not found." };

    const prevStock = parseFloat(prod.stockQuantity);
    const updatedStock = prevStock + quantityReceived;

    const updateFields: any = {
      stockQuantity: updatedStock.toFixed(2),
    };

    if (newUnitCost && newUnitCost > 0) {
      updateFields.costPrice = newUnitCost.toFixed(2);
    }

    await db
      .update(products)
      .set(updateFields)
      .where(eq(products.id, productId));

    // Audit trail
    await db.insert(inventoryLedger).values({
      tenantId: session.tenant.id,
      productId,
      userId: session.user.id,
      type: "RESTOCK",
      quantityChange: quantityReceived.toFixed(2),
      previousStock: prevStock.toFixed(2),
      newStock: updatedStock.toFixed(2),
      referenceNote: referenceNote || "Supplier Stock Inflow / Restock",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");
    return { success: true, newStock: updatedStock };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to restock." };
  }
}

export async function createCategoryAction(name: string, color?: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    if (!name) return { success: false, error: "Category name is required." };

    const [newCat] = await db
      .insert(categories)
      .values({
        tenantId: session.tenant.id,
        name,
        color: color || "#3b82f6",
      })
      .returning();

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");
    return { success: true, category: newCat };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create category." };
  }
}
