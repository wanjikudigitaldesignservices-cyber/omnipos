import {
  pgTable,
  text,
  uuid,
  timestamp,
  numeric,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. ENUMS
// ==========================================

export const businessTypeEnum = pgEnum("business_type", [
  "RETAIL",
  "RESTAURANT",
  "PHARMACY_AGROVET",
  "SERVICE",
]);

export const userRoleEnum = pgEnum("user_role", [
  "OWNER",
  "MANAGER",
  "CASHIER",
]);

export const shiftStatusEnum = pgEnum("shift_status", [
  "OPEN",
  "CLOSED",
]);

export const orderTypeEnum = pgEnum("order_type", [
  "WALK_IN",
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "MOBILE_MONEY",
  "CARD",
  "CREDIT_TAB",
  "SPLIT",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "COMPLETED",
  "REFUNDED",
  "PARTIAL_REFUND",
  "VOIDED",
]);

export const ledgerTypeEnum = pgEnum("ledger_type", [
  "SALE",
  "RESTOCK",
  "ADJUSTMENT",
  "RETURN",
  "DAMAGE",
]);

// ==========================================
// 2. OPERATIONAL TABLES (Strict Multi-Tenant)
// ==========================================

// 1. Tenants (Businesses)
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    businessType: businessTypeEnum("business_type").default("RETAIL").notNull(),
    currency: text("currency").default("KES").notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("16.00").notNull(),
    receiptHeader: text("receipt_header"),
    receiptFooter: text("receipt_footer"),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tenants_slug_idx").on(table.slug),
  ]
);

// 2. Users (Staff & Owners)
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    pinCodeHash: text("pin_code_hash"), // 4-digit PIN for fast terminal switching
    role: userRoleEnum("role").default("OWNER").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_tenant_idx").on(table.tenantId),
    index("users_email_idx").on(table.email),
  ]
);

// Database-backed Sessions
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_token_idx").on(table.token),
    index("sessions_user_idx").on(table.userId),
  ]
);

// 3. Categories
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    color: text("color").default("#3b82f6").notNull(),
  },
  (table) => [
    index("categories_tenant_idx").on(table.tenantId),
  ]
);

// 4. Products
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
    sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
    stockQuantity: numeric("stock_quantity", { precision: 12, scale: 2 }).default("0.00").notNull(), // supports decimals for kg/ltr
    lowStockThreshold: numeric("low_stock_threshold", { precision: 12, scale: 2 }).default("5.00").notNull(),
    unit: text("unit").default("pcs").notNull(), // pcs, kg, ltr, etc.
    expiryDate: timestamp("expiry_date", { withTimezone: true }), // For Pharmacy/Agrovet
    batchNumber: text("batch_number"), // For Pharmacy/Agrovet
    modifiersJson: jsonb("modifiers_json"), // For Restaurant add-ons/tables
    imageUrl: text("image_url"),
    // AI & Kadogo Fractional Extensions
    parentProductId: uuid("parent_product_id"),
    conversionFactor: numeric("conversion_factor", { precision: 14, scale: 4 }),
    isFractional: boolean("is_fractional").default(false).notNull(),
    taxCategory: text("tax_category").default("STANDARD").notNull(), // STANDARD (16%), ZERO_RATED (0%), EXEMPT (0%)
    hsCode: text("hs_code"), // KRA eTIMS HS Code
  },
  (table) => [
    index("products_tenant_idx").on(table.tenantId),
    index("products_barcode_idx").on(table.barcode),
    index("products_sku_idx").on(table.sku),
    index("products_parent_idx").on(table.parentProductId),
  ]
);

// 5. Register Shifts (Cash Drawer Control & Float Enforcement)
export const registerShifts = pgTable(
  "register_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    openingFloat: numeric("opening_float", { precision: 12, scale: 2 }).default("0.00").notNull(),
    expectedCash: numeric("expected_cash", { precision: 12, scale: 2 }).default("0.00").notNull(),
    actualCountedCash: numeric("actual_counted_cash", { precision: 12, scale: 2 }),
    variance: numeric("variance", { precision: 12, scale: 2 }),
    notes: text("notes"),
    status: shiftStatusEnum("status").default("OPEN").notNull(),
  },
  (table) => [
    index("shifts_tenant_idx").on(table.tenantId),
    index("shifts_user_idx").on(table.userId),
    index("shifts_status_idx").on(table.status),
  ]
);

// 6. Customers (CRM, Loyalty & Credit/Deni)
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    creditBalance: numeric("credit_balance", { precision: 12, scale: 2 }).default("0.00").notNull(), // tracks customer debt/tab
    creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).default("50000.00").notNull(),
  },
  (table) => [
    index("customers_tenant_idx").on(table.tenantId),
    index("customers_phone_idx").on(table.phone),
  ]
);

// 7. Orders (Sales)
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    shiftId: uuid("shift_id")
      .references(() => registerShifts.id, { onDelete: "set null" }),
    cashierId: uuid("cashier_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "set null" }),
    receiptNumber: text("receipt_number").notNull(),
    orderType: orderTypeEnum("order_type").default("WALK_IN").notNull(),
    tableNumber: text("table_number"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").default("CASH").notNull(),
    paymentSplitJson: jsonb("payment_split_json"), // Stores split breakdown or M-Pesa Ref
    status: orderStatusEnum("status").default("COMPLETED").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_tenant_idx").on(table.tenantId),
    index("orders_receipt_idx").on(table.receiptNumber),
    index("orders_created_at_idx").on(table.createdAt),
  ]
);

// 8. Order Items
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "restrict" })
      .notNull(),
    productName: text("product_name").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).default("0.0000").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    refundedQty: numeric("refunded_qty", { precision: 14, scale: 4 }).default("0.0000").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
  ]
);

// 9. Inventory Ledger (Audit Trail)
export const inventoryLedger = pgTable(
  "inventory_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    type: ledgerTypeEnum("type").notNull(),
    quantityChange: numeric("quantity_change", { precision: 14, scale: 4 }).notNull(),
    previousStock: numeric("previous_stock", { precision: 14, scale: 4 }).notNull(),
    newStock: numeric("new_stock", { precision: 14, scale: 4 }).notNull(),
    referenceNote: text("reference_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("inventory_ledger_tenant_idx").on(table.tenantId),
    index("inventory_ledger_product_idx").on(table.productId),
    index("inventory_ledger_created_at_idx").on(table.createdAt),
  ]
);

// 10. Product Unit Conversions ("Kadogo" Fractional Economy Engine)
export const productUnitConversions = pgTable(
  "product_unit_conversions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    bulkProductId: uuid("bulk_product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    unitName: text("unit_name").notNull(), // e.g. "0.2500kg (Quarter kg)", "0.5000kg (Nusu kg)"
    unitCode: text("unit_code").notNull(), // e.g. "0.2500_KG", "0.5000_KG"
    ratioToBulk: numeric("ratio_to_bulk", { precision: 14, scale: 4 }).notNull(), // 0.0050 for 250g from 50kg sack
    sellingPrice: numeric("selling_price", { precision: 14, scale: 4 }).notNull(),
    costPrice: numeric("cost_price", { precision: 14, scale: 4 }).notNull(),
    targetMarginPercent: numeric("target_margin_percent", { precision: 6, scale: 2 }).default("15.00").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("unit_conversions_tenant_idx").on(table.tenantId),
    index("unit_conversions_bulk_idx").on(table.bulkProductId),
  ]
);

// 11. Supplier Invoices (Vision Ingestion & Delivery Receipts)
export const supplierInvoices = pgTable(
  "supplier_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    supplierName: text("supplier_name").notNull(),
    invoiceNumber: text("invoice_number"),
    invoiceDate: timestamp("invoice_date", { withTimezone: true }),
    totalAmount: numeric("total_amount", { precision: 14, scale: 4 }).default("0.0000").notNull(),
    rawOcrText: text("raw_ocr_text"),
    extractedItemsJson: jsonb("extracted_items_json"),
    imageUrl: text("image_url"),
    status: text("status").default("PENDING_REVIEW").notNull(), // "PENDING_REVIEW" | "COMMITTED" | "REJECTED"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("supplier_invoices_tenant_idx").on(table.tenantId),
    index("supplier_invoices_created_idx").on(table.createdAt),
  ]
);

// 12. AI Conversations (Conversational Copilot Drawer & WhatsApp Webhooks)
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    channel: text("channel").default("DRAWER").notNull(), // "DRAWER" | "WHATSAPP" | "POS"
    title: text("title").default("New Conversation").notNull(),
    messagesJson: jsonb("messages_json").default([]).notNull(),
    lastInteractedAt: timestamp("last_interacted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_conversations_tenant_idx").on(table.tenantId),
    index("ai_conversations_user_idx").on(table.userId),
  ]
);

// 13. Suppliers (Vendor Directory, Purchasing & Payment Terms)
export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    paymentTerms: text("payment_terms").default("CASH_ON_DELIVERY").notNull(), // CASH_ON_DELIVERY, NET_7, NET_14, NET_30
    outstandingBalance: numeric("outstanding_balance", { precision: 14, scale: 4 }).default("0.0000").notNull(),
    mpesaPaybillNumber: text("mpesa_paybill_number"),
    bankDetails: text("bank_details"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("suppliers_tenant_idx").on(table.tenantId),
  ]
);

// 14. Expenses (Petty Cash, Utilities, Rent, Transport & Operations)
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),
    category: text("category").default("OTHER").notNull(), // RENT, UTILITIES_KPLC, WATER, WAGES, TRANSPORT_BODA, PACKAGING, STOCK_PURCHASE, TAXES_LICENSES, MAINTENANCE, OTHER
    amount: numeric("amount", { precision: 14, scale: 4 }).default("0.0000").notNull(),
    paymentMethod: text("payment_method").default("CASH").notNull(), // CASH, MPESA, BANK, CREDIT
    recipientName: text("recipient_name"),
    description: text("description").notNull(),
    referenceNumber: text("reference_number"),
    receiptUrl: text("receipt_url"),
    expenseDate: timestamp("expense_date", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("expenses_tenant_idx").on(table.tenantId),
    index("expenses_date_idx").on(table.expenseDate),
  ]
);

// ==========================================
// 3. RELATIONS
// ==========================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  products: many(products),
  registerShifts: many(registerShifts),
  customers: many(customers),
  orders: many(orders),
  inventoryLedger: many(inventoryLedger),
  productUnitConversions: many(productUnitConversions),
  supplierInvoices: many(supplierInvoices),
  aiConversations: many(aiConversations),
  suppliers: many(suppliers),
  expenses: many(expenses),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  sessions: many(sessions),
  shifts: many(registerShifts),
  orders: many(orders),
  supplierInvoices: many(supplierInvoices),
  aiConversations: many(aiConversations),
  expenses: many(expenses),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  inventoryLedger: many(inventoryLedger),
  unitConversions: many(productUnitConversions),
}));

export const registerShiftsRelations = relations(registerShifts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [registerShifts.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [registerShifts.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  shift: one(registerShifts, {
    fields: [orders.shiftId],
    references: [registerShifts.id],
  }),
  cashier: one(users, {
    fields: [orders.cashierId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const inventoryLedgerRelations = relations(inventoryLedger, ({ one }) => ({
  tenant: one(tenants, {
    fields: [inventoryLedger.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [inventoryLedger.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [inventoryLedger.userId],
    references: [users.id],
  }),
}));

export const productUnitConversionsRelations = relations(productUnitConversions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productUnitConversions.tenantId],
    references: [tenants.id],
  }),
  bulkProduct: one(products, {
    fields: [productUnitConversions.bulkProductId],
    references: [products.id],
  }),
}));

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [supplierInvoices.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [supplierInvoices.userId],
    references: [users.id],
  }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiConversations.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [expenses.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

// Types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type RegisterShift = typeof registerShifts.$inferSelect;
export type NewRegisterShift = typeof registerShifts.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type InventoryLedger = typeof inventoryLedger.$inferSelect;
export type NewInventoryLedger = typeof inventoryLedger.$inferInsert;
export type ProductUnitConversion = typeof productUnitConversions.$inferSelect;
export type NewProductUnitConversion = typeof productUnitConversions.$inferInsert;
export type SupplierInvoice = typeof supplierInvoices.$inferSelect;
export type NewSupplierInvoice = typeof supplierInvoices.$inferInsert;
export type AiConversation = typeof aiConversations.$inferSelect;
export type NewAiConversation = typeof aiConversations.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;


