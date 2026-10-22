import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseSupplierInvoiceImage } from "@/lib/ai/vision-invoice-engine";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized session." }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, fileName } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing imageBase64 data in request." },
        { status: 400 }
      );
    }

    const extracted = await parseSupplierInvoiceImage(imageBase64, fileName);

    // Auto-match items against merchant's existing catalog
    const existingProducts = await db.query.products.findMany({
      where: eq(products.tenantId, session.tenant.id),
    });

    const enrichedItems = extracted.items.map((item) => {
      const match = existingProducts.find(
        (p) =>
          p.name.toLowerCase() === item.name.toLowerCase() ||
          item.name.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(item.name.toLowerCase())
      );

      return {
        ...item,
        matchedProductId: match ? match.id : null,
        currentCatalogStock: match ? parseFloat(match.stockQuantity) : null,
        currentCostPrice: match ? parseFloat(match.costPrice) : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...extracted,
        items: enrichedItems,
      },
    });
  } catch (error: any) {
    console.error("API /api/ai/vision-invoice Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process vision invoice." },
      { status: 500 }
    );
  }
}
