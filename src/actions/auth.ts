"use server";

import { db } from "@/db";
import { tenants, users, categories, products, inventoryLedger, customers } from "@/db/schema";
import { hashPassword, verifyPassword, hashPin, verifyPin, createSession, clearSession, getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function registerSME(formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const businessName = formData.get("businessName") as string;

    if (!fullName || !email || !password || !businessName) {
      return { success: false, error: "All fields are required." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Check if email already registered
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Generate unique slug
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug || "sme"}-${randomSuffix}`;

    // 1. Create Tenant in initial state (onboardingCompleted = false)
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: businessName,
        slug,
        businessType: "RETAIL",
        currency: "KES",
        taxRate: "16.00",
        receiptHeader: `${businessName} - Quality & Value Guaranteed`,
        receiptFooter: "Thank you for shopping with us! Karibu tena.",
        onboardingCompleted: false,
      })
      .returning();

    // 2. Hash Password and Create Owner User
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        tenantId: newTenant.id,
        fullName,
        email,
        passwordHash,
        role: "OWNER",
        isActive: true,
      })
      .returning();

    // 3. Create real Neon session
    await createSession(newUser.id, newTenant.id, false, "OWNER", newUser.fullName);

    return { success: true, redirectUrl: "/onboarding" };
  } catch (error: any) {
    console.error("registerSME error:", error);
    return {
      success: false,
      error: error.message || "Failed to create account. Please check database connection.",
    };
  }
}

export async function loginUser(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    if (!user.isActive) {
      return { success: false, error: "This staff account has been deactivated." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
      return { success: false, error: "Associated business profile not found." };
    }

    // Create session in Neon DB with onboarding status
    await createSession(
      user.id,
      tenant.id,
      tenant.onboardingCompleted,
      user.role,
      user.fullName
    );

    const redirectUrl = tenant.onboardingCompleted ? "/pos" : "/onboarding";
    return { success: true, redirectUrl };
  } catch (error: any) {
    console.error("loginUser error:", error);
    return { success: false, error: error.message || "Login failed. Please try again." };
  }
}

export async function switchCashierByPin(pin: string) {
  try {
    if (!pin || pin.length !== 4) {
      return { success: false, error: "PIN must be exactly 4 digits." };
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized. Please log in first." };
    }

    // Fetch all active staff in this tenant
    const tenantStaff = await db.query.users.findMany({
      where: and(
        eq(users.tenantId, session.tenant.id),
        eq(users.isActive, true)
      ),
    });

    let matchedUser: (typeof tenantStaff)[0] | null = null;
    for (const staff of tenantStaff) {
      if (staff.pinCodeHash) {
        const matches = await verifyPin(pin, staff.pinCodeHash);
        if (matches) {
          matchedUser = staff;
          break;
        }
      }
    }

    if (!matchedUser) {
      return { success: false, error: "Invalid PIN or no staff member found with this PIN." };
    }

    // Create a new session for the switched cashier
    await createSession(
      matchedUser.id,
      session.tenant.id,
      session.tenant.onboardingCompleted,
      matchedUser.role,
      matchedUser.fullName
    );
    revalidatePath("/pos");

    return {
      success: true,
      cashier: {
        id: matchedUser.id,
        fullName: matchedUser.fullName,
        role: matchedUser.role,
      },
    };
  } catch (error: any) {
    console.error("switchCashierByPin error:", error);
    return { success: false, error: error.message || "Failed to switch cashier." };
  }
}

export async function setCashierPin(userId: string, pin: string) {
  try {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: "PIN must be exactly 4 numeric digits." };
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const hashed = await hashPin(pin);
    await db
      .update(users)
      .set({ pinCodeHash: hashed })
      .where(and(eq(users.id, userId), eq(users.tenantId, session.tenant.id)));

    revalidatePath("/pos");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update PIN." };
  }
}

export async function completeOnboardingAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized session." };
    }

    const businessName = formData.get("businessName") as string;
    const currency = (formData.get("currency") as string) || "KES";
    const taxRate = (formData.get("taxRate") as string) || "16.00";
    const receiptHeader = (formData.get("receiptHeader") as string) || "";
    const receiptFooter = (formData.get("receiptFooter") as string) || "";
    const businessType = (formData.get("businessType") as any) || "RETAIL";
    const pinCode = formData.get("pinCode") as string;

    if (!pinCode || pinCode.length !== 4) {
      return { success: false, error: "A 4-digit POS PIN is required for cashier security." };
    }

    // 1. Hash Owner PIN and update user
    const pinCodeHash = await hashPin(pinCode);
    await db
      .update(users)
      .set({ pinCodeHash })
      .where(eq(users.id, session.user.id));

    // 2. Update tenant profile
    await db
      .update(tenants)
      .set({
        name: businessName || session.tenant.name,
        currency,
        taxRate,
        receiptHeader: receiptHeader || `${businessName || session.tenant.name} - Official Receipt`,
        receiptFooter: receiptFooter || "Thank you for your business! Karibu tena.",
        businessType,
        onboardingCompleted: true,
      })
      .where(eq(tenants.id, session.tenant.id));

    // 3. Seed 5 realistic industry products and categories
    await seedIndustryData(session.tenant.id, session.user.id, businessType);

    // 4. Update session token with onboardingCompleted = true
    await createSession(
      session.user.id,
      session.tenant.id,
      true,
      session.user.role,
      session.user.fullName
    );

    revalidatePath("/pos");
    return { success: true, redirectUrl: "/pos" };
  } catch (error: any) {
    console.error("completeOnboardingAction error:", error);
    return { success: false, error: error.message || "Onboarding configuration failed." };
  }
}

async function seedIndustryData(
  tenantId: string,
  userId: string,
  businessType: "RETAIL" | "RESTAURANT" | "PHARMACY_AGROVET" | "SERVICE"
) {
  try {
    // 1. Create a sample customer for Credit/Deni testing
    await db.insert(customers).values({
      tenantId,
      name: "John Kamau",
      phone: "+254 712 345 678",
      email: "kamau@example.com",
      loyaltyPoints: 50,
      creditBalance: "0.00",
      creditLimit: "25000.00",
    });

    if (businessType === "RETAIL") {
      const [cat1] = await db.insert(categories).values({ tenantId, name: "Groceries", color: "#10b981" }).returning();
      const [cat2] = await db.insert(categories).values({ tenantId, name: "Beverages", color: "#3b82f6" }).returning();
      const [cat3] = await db.insert(categories).values({ tenantId, name: "Household", color: "#f59e0b" }).returning();

      const items = [
        { name: "2kg Pure Cane Sugar", sku: "RET-SUG-01", barcode: "616110123456", costPrice: "220.00", sellingPrice: "280.00", stockQuantity: "60.00", unit: "pcs", categoryId: cat1.id },
        { name: "1L Pure Sunflower Cooking Oil", sku: "RET-OIL-02", barcode: "616110123457", costPrice: "290.00", sellingPrice: "360.00", stockQuantity: "45.00", unit: "ltr", categoryId: cat1.id },
        { name: "Fresh Cow Milk 500ml Pouch", sku: "RET-MLK-03", barcode: "616110123458", costPrice: "48.00", sellingPrice: "65.00", stockQuantity: "80.00", unit: "pcs", categoryId: cat2.id },
        { name: "Mineral Drinking Water 1 Litre", sku: "RET-WTR-04", barcode: "616110123459", costPrice: "35.00", sellingPrice: "60.00", stockQuantity: "120.00", unit: "pcs", categoryId: cat2.id },
        { name: "Multipurpose Washing Detergent 1kg", sku: "RET-DET-05", barcode: "616110123460", costPrice: "180.00", sellingPrice: "250.00", stockQuantity: "35.00", unit: "kg", categoryId: cat3.id },
      ];

      for (const item of items) {
        const [prod] = await db.insert(products).values({ ...item, tenantId, lowStockThreshold: "5.00" }).returning();
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: prod.id,
          userId,
          type: "RESTOCK",
          quantityChange: item.stockQuantity,
          previousStock: "0.00",
          newStock: item.stockQuantity,
          referenceNote: "Initial Industry Onboarding Stock",
        });
      }
    } else if (businessType === "RESTAURANT") {
      const [cat1] = await db.insert(categories).values({ tenantId, name: "Mains & Grills", color: "#ef4444" }).returning();
      const [cat2] = await db.insert(categories).values({ tenantId, name: "Cold Beverages", color: "#06b6d4" }).returning();
      const [cat3] = await db.insert(categories).values({ tenantId, name: "Hot Drinks & Desserts", color: "#8b5cf6" }).returning();

      const items = [
        {
          name: "Grilled Chicken Breast with Chips",
          sku: "RES-CHK-01",
          barcode: "616220123456",
          costPrice: "380.00",
          sellingPrice: "650.00",
          stockQuantity: "50.00",
          unit: "portion",
          categoryId: cat1.id,
          modifiersJson: { modifiers: ["Extra Garlic Dip", "Spicy Peri-Peri", "No Onions"] },
        },
        {
          name: "Double Cheese Beef Burger & Fries",
          sku: "RES-BGR-02",
          barcode: "616220123457",
          costPrice: "320.00",
          sellingPrice: "550.00",
          stockQuantity: "40.00",
          unit: "portion",
          categoryId: cat1.id,
          modifiersJson: { modifiers: ["Extra Bacon", "Fried Egg", "Gluten-Free Bun"] },
        },
        {
          name: "Spaghetti Bolognese Beef Pasta",
          sku: "RES-PAS-03",
          barcode: "616220123458",
          costPrice: "280.00",
          sellingPrice: "480.00",
          stockQuantity: "35.00",
          unit: "portion",
          categoryId: cat1.id,
          modifiersJson: { modifiers: ["Extra Parmesan", "Garlic Bread"] },
        },
        {
          name: "Fresh Passion Mint Juice 500ml",
          sku: "RES-JCE-04",
          barcode: "616220123459",
          costPrice: "70.00",
          sellingPrice: "180.00",
          stockQuantity: "60.00",
          unit: "glass",
          categoryId: cat2.id,
        },
        {
          name: "Mocha Cappuccino Latte",
          sku: "RES-COF-05",
          barcode: "616220123460",
          costPrice: "80.00",
          sellingPrice: "220.00",
          stockQuantity: "55.00",
          unit: "cup",
          categoryId: cat3.id,
        },
      ];

      for (const item of items) {
        const [prod] = await db.insert(products).values({ ...item, tenantId, lowStockThreshold: "10.00" }).returning();
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: prod.id,
          userId,
          type: "RESTOCK",
          quantityChange: item.stockQuantity,
          previousStock: "0.00",
          newStock: item.stockQuantity,
          referenceNote: "Kitchen Ingredients Initial Setup",
        });
      }
    } else if (businessType === "PHARMACY_AGROVET") {
      const [cat1] = await db.insert(categories).values({ tenantId, name: "Human Pharma", color: "#0284c7" }).returning();
      const [cat2] = await db.insert(categories).values({ tenantId, name: "Veterinary Medicine", color: "#16a34a" }).returning();
      const [cat3] = await db.insert(categories).values({ tenantId, name: "Crop Nutrition", color: "#ca8a04" }).returning();

      const futureDate1 = new Date();
      futureDate1.setFullYear(futureDate1.getFullYear() + 2);
      const futureDate2 = new Date();
      futureDate2.setFullYear(futureDate2.getFullYear() + 1);

      const items = [
        {
          name: "Amoxicillin Capsules 500mg (10x10)",
          sku: "PHA-AMX-01",
          barcode: "616330123456",
          costPrice: "350.00",
          sellingPrice: "580.00",
          stockQuantity: "75.00",
          unit: "box",
          categoryId: cat1.id,
          batchNumber: "B-88301",
          expiryDate: futureDate1,
        },
        {
          name: "Paracetamol Pain Relief 500mg (100 Tabs)",
          sku: "PHA-PCT-02",
          barcode: "616330123457",
          costPrice: "80.00",
          sellingPrice: "180.00",
          stockQuantity: "120.00",
          unit: "pack",
          categoryId: cat1.id,
          batchNumber: "B-91024",
          expiryDate: futureDate2,
        },
        {
          name: "Broad Spectrum Cattle Dewormer 100ml",
          sku: "AGR-DWM-03",
          barcode: "616330123458",
          costPrice: "420.00",
          sellingPrice: "680.00",
          stockQuantity: "30.00",
          unit: "bottle",
          categoryId: cat2.id,
          batchNumber: "V-40192",
          expiryDate: futureDate2,
        },
        {
          name: "CAN Calcium Ammonium Nitrate 50kg",
          sku: "AGR-CAN-04",
          barcode: "616330123459",
          costPrice: "2600.00",
          sellingPrice: "3200.00",
          stockQuantity: "45.50", // decimal weight
          unit: "kg",
          categoryId: cat3.id,
          batchNumber: "F-10294",
        },
        {
          name: "Antiseptic Skin & Wound Solution 250ml",
          sku: "PHA-ANT-05",
          barcode: "616330123460",
          costPrice: "160.00",
          sellingPrice: "260.00",
          stockQuantity: "50.00",
          unit: "pcs",
          categoryId: cat1.id,
          batchNumber: "A-55912",
          expiryDate: futureDate1,
        },
      ];

      for (const item of items) {
        const [prod] = await db.insert(products).values({ ...item, tenantId, lowStockThreshold: "5.00" }).returning();
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: prod.id,
          userId,
          type: "RESTOCK",
          quantityChange: item.stockQuantity,
          previousStock: "0.00",
          newStock: item.stockQuantity,
          referenceNote: "Medical & Agrovet Initial Inflow",
        });
      }
    } else {
      // SERVICE
      const [cat1] = await db.insert(categories).values({ tenantId, name: "Hair & Styling", color: "#ec4899" }).returning();
      const [cat2] = await db.insert(categories).values({ tenantId, name: "Spa & Wellness", color: "#8b5cf6" }).returning();
      const [cat3] = await db.insert(categories).values({ tenantId, name: "Consulting", color: "#3b82f6" }).returning();

      const items = [
        { name: "Executive Haircut & Beard Trim", sku: "SRV-HRC-01", barcode: "616440123456", costPrice: "150.00", sellingPrice: "600.00", stockQuantity: "999.00", unit: "service", categoryId: cat1.id },
        { name: "Deep Tissue Massage (60 Mins)", sku: "SRV-MSG-02", barcode: "616440123457", costPrice: "500.00", sellingPrice: "2500.00", stockQuantity: "999.00", unit: "service", categoryId: cat2.id },
        { name: "Gel Manicure & Deluxe Pedicure", sku: "SRV-NIL-03", barcode: "616440123458", costPrice: "300.00", sellingPrice: "1200.00", stockQuantity: "999.00", unit: "service", categoryId: cat1.id },
        { name: "Hydrating Facial Scrub & Steam", sku: "SRV-FCL-04", barcode: "616440123459", costPrice: "400.00", sellingPrice: "1800.00", stockQuantity: "999.00", unit: "service", categoryId: cat2.id },
        { name: "SME Tax & Business Advisory (1 hr)", sku: "SRV-CNS-05", barcode: "616440123460", costPrice: "0.00", sellingPrice: "3500.00", stockQuantity: "999.00", unit: "hr", categoryId: cat3.id },
      ];

      for (const item of items) {
        const [prod] = await db.insert(products).values({ ...item, tenantId, lowStockThreshold: "0.00" }).returning();
        await db.insert(inventoryLedger).values({
          tenantId,
          productId: prod.id,
          userId,
          type: "RESTOCK",
          quantityChange: item.stockQuantity,
          previousStock: "0.00",
          newStock: item.stockQuantity,
          referenceNote: "Service Menu Provisioning",
        });
      }
    }
  } catch (err) {
    console.error("Error seeding industry data:", err);
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
