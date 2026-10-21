# OmniPOS — Universal Multi-Tenant Point of Sale (POS) & Cloud ERP for SMEs

OmniPOS is a high-throughput, production-ready, multi-tenant Universal Point of Sale (POS) and Cloud ERP system tailored for African and global SMEs spanning **Retail & Supermarkets**, **Restaurants & Cafes**, **Pharmacies & Agrovets**, and **Service Salons & Spas**.

---

## 🛠️ Infrastructure & Tech Stack
- **Framework:** Next.js (App Router, TypeScript) optimized for **Vercel** serverless edge deployment.
- **Database:** **Neon Serverless PostgreSQL** (`@neondatabase/serverless`) via **Drizzle ORM** (`drizzle-orm/neon-http` & `drizzle-kit`) for zero-cold-start atomic transactions.
- **Authentication:** 100% Real, Database-Backed Custom Auth in Neon (`users` & `sessions` tables) with `bcryptjs` password/PIN hashing and `jose` HTTP-only encrypted JWT session cookies via Next.js Server Actions and Middleware (`middleware.ts`).
- **UI & Ergonomics:** Tailwind CSS, Lucide React icons, and Recharts for back-office executive visualizations.
- **Client State:** Zustand with `persist` middleware for zero-latency cart updates, multi-cart hold/park orders, and active shift state.

---

## 🗄️ Relational Database Schema (`src/db/schema.ts`)
Every operational table includes a foreign key referencing `tenants.id` (`onDelete: "cascade"`) for strict multi-tenant isolation:

1. **`tenants` (Businesses):**
   - `id` (UUID PK), `name`, `slug` (unique), `businessType` (`RETAIL | RESTAURANT | PHARMACY_AGROVET | SERVICE`), `currency` (`KES`, `USD`, `UGX`, `TZS`, `EUR`, `GBP`), `taxRate` (default `16.00`), `receiptHeader`, `receiptFooter`, `onboardingCompleted` (boolean), `createdAt`.
2. **`users` (Owners, Managers, Cashiers):**
   - `id` (UUID PK), `tenantId` (FK), `fullName`, `email` (unique), `passwordHash`, `pinCodeHash` (4-digit PIN for instant terminal switching), `role` (`OWNER | MANAGER | CASHIER`), `isActive`, `createdAt`.
3. **`sessions`:**
   - `id` (UUID PK), `userId` (FK), `token` (unique), `expiresAt`, `createdAt`.
4. **`categories` & `products`:**
   - `categories`: `id`, `tenantId`, `name`, `color`.
   - `products`: `id`, `tenantId`, `categoryId`, `name`, `sku`, `barcode`, `costPrice`, `sellingPrice`, `stockQuantity` (supports decimals for kg/ltr), `lowStockThreshold`, `unit`, `expiryDate`, `batchNumber`, `modifiersJson`, `imageUrl`.
5. **`register_shifts` (Cash Control & Float Enforcement):**
   - `id`, `tenantId`, `userId`, `openedAt`, `closedAt`, `openingFloat`, `expectedCash`, `actualCountedCash`, `variance` (Over/Short), `notes`, `status` (`OPEN | CLOSED`).
6. **`customers` (CRM, Loyalty & Credit/Deni):**
   - `id`, `tenantId`, `name`, `phone`, `email`, `loyaltyPoints`, `creditBalance` (customer debt/tab), `creditLimit`.
7. **`orders` & `order_items`:**
   - `orders`: `id`, `tenantId`, `shiftId`, `cashierId`, `customerId`, `receiptNumber`, `orderType` (`WALK_IN | DINE_IN | TAKEAWAY | DELIVERY`), `tableNumber`, `subtotal`, `taxAmount`, `discountAmount`, `totalAmount`, `paymentMethod` (`CASH | MOBILE_MONEY | CARD | CREDIT_TAB | SPLIT`), `paymentSplitJson`, `status` (`COMPLETED | REFUNDED | PARTIAL_REFUND | VOIDED`), `createdAt`.
   - `order_items`: `id`, `orderId`, `productId`, `productName`, `quantity`, `unitCost`, `unitPrice`, `discount`, `subtotal`, `refundedQty`.
8. **`inventory_ledger` (Audit Trail):**
   - `id`, `tenantId`, `productId`, `userId`, `type` (`SALE | RESTOCK | ADJUSTMENT | RETURN | DAMAGE`), `quantityChange`, `previousStock`, `newStock`, `referenceNote`, `createdAt`.

---

## ⚡ Core Application Workflows

### 1. Real Database Auth & Industry Onboarding (`/register`, `/login`, `/onboarding`)
- **`/register`:** Creates tenant in unconfigured state + Owner user with bcrypt password and sets HTTP-only session cookie.
- **`/login`:** Validates against Neon DB and redirects to `/onboarding` (if incomplete) or `/pos`.
- **`/onboarding` (3-Step Dynamic Wizard):**
  - **Step 1:** Store Identity, Currency (`KES`, `USD`, etc.), VAT %, Receipt Header/Footer with live 80mm thermal receipt preview.
  - **Step 2:** Select Industry (`RETAIL`, `RESTAURANT`, `PHARMACY_AGROVET`, `SERVICE`). Automatically seeds 5 realistic industry products and matching categories into Neon DB!
  - **Step 3:** Tender acceptance configuration and 4-digit POS Cashier quick-PIN.

### 2. Universal Enterprise POS Terminal (`/pos`)
- **Industry-Adaptive Interface:**
  - *Restaurant:* Table # selector, Dine-In / Takeaway toggle, item kitchen notes.
  - *Pharmacy & Agrovet:* Batch # / Lot tracking, expiry date alarms, decimal weights (`+0.25`, `+0.5` kg).
  - *Retail:* Auto-focused barcode / SKU scanner input with instant enter-key item addition.
  - *Service:* Tagging staff member performing service per line item.
- **Shift Enforcement:** Prevents checkout until cashier opens session with an opening float.
- **Multi-Cart (Hold / Park Order):** Unlimited held carts persisted in Zustand with one-click recall.
- **Smart Checkout Modal:** Cash (quick denomination buttons & change calculator), M-Pesa / Mobile Money (confirmation code), Card, Customer Credit Tab (Deni), and Split Tender.
- **Atomic Checkout Execution:** Single server action updates order, decrements stock, records `inventory_ledger` audit, updates shift cash float, and increments loyalty points.
- **80mm ESC/POS Thermal Receipt:** Print modal with `@media print` CSS for standard thermal printers.

### 3. Back-Office ERP Cockpit (`/dashboard/*`)
- **`/dashboard` (Executive Analytics):** Today's Revenue, Net Profit margin, Total Orders, Payment Method breakdown (Recharts Pie), 7-Day sales trend (Recharts Bar), and urgent stock alarms.
- **`/dashboard/inventory`:** Product catalog CRUD, "Receive Stock / Restock" modal that increments stock and logs to `inventory_ledger`, and stock valuation totals.
- **`/dashboard/orders`:** Searchable sales order table, receipt preview, and "Process Refund / Return" modal that restores stock to Neon and adjusts register shift cash.
- **`/dashboard/shifts`:** Active drawer monitoring, cash reconciliation, variance calculation (Over/Short), and printable Z-Reports.
- **`/dashboard/customers`:** Customer ledger, outstanding debt tabs (`creditBalance`), and "Record Repayment" modal.
- **`/dashboard/settings`:** Business profile configuration, multi-cashier staff management with roles (`OWNER`, `MANAGER`, `CASHIER`), and 4-digit quick-PIN setup.

---

## 🚀 Running Locally & Deploying to Vercel

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure .env with your Neon Serverless DB URL
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-secure-jwt-key"

# 3. Start development server
npm run dev
```

### Deploying to Vercel
1. Push repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete production-ready universal POS & ERP system"
   git remote add origin https://github.com/your-username/omnipos.git
   git push -u origin main
   ```
2. Import project into Vercel and configure the environment variables:
   - `DATABASE_URL` = your Neon PostgreSQL connection string
   - `JWT_SECRET` = your secure token secret
3. Automatic CI/CD build will run `next build` and deploy seamlessly.
