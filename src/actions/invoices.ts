"use server";

import { db } from "@/db";
import { products, supplierInvoices, inventoryLedger, productUnitConversions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { roundTo4, roundTo2, calculateKadogoMargin } from "@/lib/fractional-units";
import { ExtractedInvoiceItem } from "@/lib/ai/vision-invoice-engine";

/**
 * Commits a vision-extracted supplier invoice into the inventory ledger and catalog.
 */
export async function commitSupplierInvoiceAction(params: {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  items: ExtractedInvoiceItem[];
  imageUrl?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const tenantId = session.tenant.id;
    const userId = session.user.id;

    // 1. Record the supplier invoice
    const [insertedInvoice] = await db
      .insert(supplierInvoices)
      .values({
        tenantId,
        supplierName: params.supplierName,
        invoiceNumber: params.invoiceNumber,
        invoiceDate: new Date(params.invoiceDate),
        totalAmount: params.totalAmount.toFixed(4),
        status: "COMMITTED",
        rawOcrText: `Extracted ${params.items.length} items from supplier ${params.supplierName}. Tax: KES ${params.taxAmount.toFixed(4)}`,
        extractedItemsJson: params.items,
        imageUrl: params.imageUrl || null,
        userId,
      })
      .returning();

    // 2. Process each item: Update stock or create product
    let itemsUpdatedCount = 0;
    let itemsCreatedCount = 0;

    for (const item of params.items) {
      const unitCost4 = roundTo4(item.unitCost);
      const qty4 = roundTo4(item.quantity);
      const retailPrice2 = roundTo2(item.suggestedRetailPrice || unitCost4 * 1.2);

      let targetProduct = null;

      if (item.matchedProductId) {
        targetProduct = await db.query.products.findFirst({
          where: and(eq(products.id, item.matchedProductId), eq(products.tenantId, tenantId)),
        });
      }

      if (!targetProduct) {
        // Try matching by exact name
        targetProduct = await db.query.products.findFirst({
          where: and(eq(products.name, item.name), eq(products.tenantId, tenantId)),
        });
      }

      if (targetProduct) {
        // Update existing product stock & cost price
        const prevStock = parseFloat(targetProduct.stockQuantity) || 0;
        const newStock = roundTo4(prevStock + qty4);

        await db
          .update(products)
          .set({
            stockQuantity: newStock.toFixed(4),
            costPrice: unitCost4.toFixed(4),
            sellingPrice: retailPrice2 > parseFloat(targetProduct.sellingPrice) ? retailPrice2.toFixed(4) : targetProduct.sellingPrice,
            taxCategory: item.taxCategory || targetProduct.taxCategory,
          })
          .where(eq(products.id, targetProduct.id));

        // Ledger audit
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: targetProduct.id,
          userId,
          type: "RESTOCK",
          quantityChange: qty4.toFixed(4),
          previousStock: prevStock.toFixed(4),
          newStock: newStock.toFixed(4),
          referenceNote: `Vision Ingestion: Inv #${params.invoiceNumber} (${params.supplierName})`,
        });

        itemsUpdatedCount++;
      } else {
        // Create new catalog product from invoice
        const [newProduct] = await db
          .insert(products)
          .values({
            tenantId,
            name: item.name,
            sku: `INV-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
            costPrice: unitCost4.toFixed(4),
            sellingPrice: retailPrice2.toFixed(4),
            stockQuantity: qty4.toFixed(4),
            unit: item.unit || "pcs",
            lowStockThreshold: "5.0000",
            taxCategory: item.taxCategory || "STANDARD_16",
            isFractional: item.isFractionalEligible,
          })
          .returning();

        // Ledger audit
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: newProduct.id,
          userId,
          type: "RESTOCK",
          quantityChange: qty4.toFixed(4),
          previousStock: "0.0000",
          newStock: qty4.toFixed(4),
          referenceNote: `Vision Ingestion (New Product): Inv #${params.invoiceNumber}`,
        });

        itemsCreatedCount++;
      }
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");

    return {
      success: true,
      invoiceId: insertedInvoice.id,
      itemsUpdatedCount,
      itemsCreatedCount,
    };
  } catch (error: any) {
    console.error("commitSupplierInvoiceAction error:", error);
    return { success: false, error: error.message || "Failed to commit invoice." };
  }
}

/**
 * Kadogo Economy Bulk-to-Micro Unit Breaking Action
 * Takes bulk stock (e.g. 1 x 50kg Sugar Bag at KES 6,500) and transforms it into
 * fractional packets (e.g. 100 x 0.5000kg Packets at retail KES 75 each) with strict 4-decimal precision.
 */
export async function breakBulkIntoKadogoUnitsAction(params: {
  bulkProductId: string;
  bulkQuantityToBreak: number; // e.g. 1 sack
  conversions: Array<{
    unitName: string; // e.g. "0.5000kg Packet (Nusu kg)"
    unitCode: string; // e.g. "0.5000_KG"
    ratioToBulk: number; // e.g. 0.0100 (0.5kg out of 50kg)
    outputQuantityProduced: number; // e.g. 100 packets
    sellingPrice: number; // e.g. KES 75.00
    targetMarginPercent: number; // e.g. 15%
  }>;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    const tenantId = session.tenant.id;
    const userId = session.user.id;

    const bulkProduct = await db.query.products.findFirst({
      where: and(eq(products.id, params.bulkProductId), eq(products.tenantId, tenantId)),
    });

    if (!bulkProduct) {
      return { success: false, error: "Bulk product not found." };
    }

    const currentBulkStock = parseFloat(bulkProduct.stockQuantity) || 0;
    if (currentBulkStock < params.bulkQuantityToBreak) {
      return {
        success: false,
        error: `Insufficient bulk stock. Available: ${currentBulkStock.toFixed(2)}, required: ${params.bulkQuantityToBreak}`,
      };
    }

    const bulkCostPerUnit = parseFloat(bulkProduct.costPrice) || 0;

    // 1. Deduct bulk stock
    const newBulkStock = roundTo4(currentBulkStock - params.bulkQuantityToBreak);
    await db
      .update(products)
      .set({
        stockQuantity: newBulkStock.toFixed(4),
      })
      .where(eq(products.id, bulkProduct.id));

    // Ledger for bulk deduction
    await db.insert(inventoryLedger).values({
      tenantId,
      productId: bulkProduct.id,
      userId,
      type: "ADJUSTMENT",
      quantityChange: (-params.bulkQuantityToBreak).toFixed(4),
      previousStock: currentBulkStock.toFixed(4),
      newStock: newBulkStock.toFixed(4),
      referenceNote: `Kadogo Breaking: Converted ${params.bulkQuantityToBreak} bulk units into micro-retail units`,
    });

    // 2. For each fractional conversion, create/update child fractional product
    const createdMicroProducts = [];

    for (const conv of params.conversions) {
      const marginCalc = calculateKadogoMargin(
        bulkCostPerUnit,
        conv.ratioToBulk,
        conv.sellingPrice,
        conv.targetMarginPercent
      );

      const microName = `${bulkProduct.name} - ${conv.unitName}`;

      // Check if child micro-product already exists
      let microProd = await db.query.products.findFirst({
        where: and(
          eq(products.tenantId, tenantId),
          eq(products.parentProductId, bulkProduct.id),
          eq(products.name, microName)
        ),
      });

      if (!microProd) {
        // Also search by name alone
        microProd = await db.query.products.findFirst({
          where: and(eq(products.tenantId, tenantId), eq(products.name, microName)),
        });
      }

      const packetsToAdd = roundTo4(conv.outputQuantityProduced);

      if (microProd) {
        const prevMicroStock = parseFloat(microProd.stockQuantity) || 0;
        const newMicroStock = roundTo4(prevMicroStock + packetsToAdd);

        await db
          .update(products)
          .set({
            stockQuantity: newMicroStock.toFixed(4),
            costPrice: marginCalc.allocatedUnitCost.toFixed(4),
            sellingPrice: marginCalc.sellingPrice.toFixed(4),
            parentProductId: bulkProduct.id,
            conversionFactor: conv.ratioToBulk.toFixed(4),
            isFractional: true,
          })
          .where(eq(products.id, microProd.id));

        await db.insert(inventoryLedger).values({
          tenantId,
          productId: microProd.id,
          userId,
          type: "ADJUSTMENT",
          quantityChange: packetsToAdd.toFixed(4),
          previousStock: prevMicroStock.toFixed(4),
          newStock: newMicroStock.toFixed(4),
          referenceNote: `Kadogo Breaking output from ${bulkProduct.name}`,
        });

        createdMicroProducts.push(microProd);
      } else {
        const [newMicro] = await db
          .insert(products)
          .values({
            tenantId,
            name: microName,
            sku: `KDG-${Date.now().toString().slice(-4)}-${conv.unitCode}`,
            costPrice: marginCalc.allocatedUnitCost.toFixed(4),
            sellingPrice: marginCalc.sellingPrice.toFixed(4),
            stockQuantity: packetsToAdd.toFixed(4),
            unit: conv.unitName.split(" ")[0] || "pkt",
            lowStockThreshold: "10.0000",
            taxCategory: bulkProduct.taxCategory,
            parentProductId: bulkProduct.id,
            conversionFactor: conv.ratioToBulk.toFixed(4),
            isFractional: true,
          })
          .returning();

        await db.insert(inventoryLedger).values({
          tenantId,
          productId: newMicro.id,
          userId,
          type: "ADJUSTMENT",
          quantityChange: packetsToAdd.toFixed(4),
          previousStock: "0.0000",
          newStock: packetsToAdd.toFixed(4),
          referenceNote: `Initial Kadogo creation from ${bulkProduct.name}`,
        });

        // Record conversion definition
        await db.insert(productUnitConversions).values({
          tenantId,
          bulkProductId: bulkProduct.id,
          unitName: conv.unitName,
          unitCode: conv.unitCode,
          ratioToBulk: conv.ratioToBulk.toFixed(4),
          sellingPrice: conv.sellingPrice.toFixed(4),
          costPrice: marginCalc.allocatedUnitCost.toFixed(4),
          targetMarginPercent: conv.targetMarginPercent.toFixed(2),
        });

        createdMicroProducts.push(newMicro);
      }
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/pos");

    return {
      success: true,
      remainingBulkStock: newBulkStock,
      microProductsProcessed: createdMicroProducts.length,
    };
  } catch (error: any) {
    console.error("breakBulkIntoKadogoUnitsAction error:", error);
    return { success: false, error: error.message || "Failed to execute unit conversion." };
  }
}

/**
 * Fetches recent supplier invoices and pending OCR scans.
 */
export async function getSupplierInvoicesAction() {
  const session = await getSession();
  if (!session) return [];

  return await db.query.supplierInvoices.findMany({
    where: eq(supplierInvoices.tenantId, session.tenant.id),
    orderBy: [desc(supplierInvoices.createdAt)],
    limit: 25,
  });
}
