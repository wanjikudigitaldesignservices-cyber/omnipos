import { getSql } from "./index";

export async function ensureDatabaseTables() {
  const sql = getSql();

  try {
    // 1. Enums
    await sql`
      DO $$ BEGIN
        CREATE TYPE business_type AS ENUM ('RETAIL', 'RESTAURANT', 'PHARMACY_AGROVET', 'SERVICE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'CASHIER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE shift_status AS ENUM ('OPEN', 'CLOSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE order_type AS ENUM ('WALK_IN', 'DINE_IN', 'TAKEAWAY', 'DELIVERY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM ('CASH', 'MOBILE_MONEY', 'CARD', 'CREDIT_TAB', 'SPLIT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('COMPLETED', 'REFUNDED', 'PARTIAL_REFUND', 'VOIDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE ledger_type AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // 2. Tenants (Businesses)
    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        business_type business_type DEFAULT 'RETAIL' NOT NULL,
        currency TEXT DEFAULT 'KES' NOT NULL,
        tax_rate NUMERIC(5, 2) DEFAULT 16.00 NOT NULL,
        receipt_header TEXT,
        receipt_footer TEXT,
        onboarding_completed BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 3. Users (Staff & Owners)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        pin_code_hash TEXT,
        role user_role DEFAULT 'OWNER' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 4. Sessions
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 5. Categories
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3b82f6' NOT NULL
      );
    `;

    // 6. Products
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        sku TEXT,
        barcode TEXT,
        cost_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        selling_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        stock_quantity NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        low_stock_threshold NUMERIC(12, 2) DEFAULT 5.00 NOT NULL,
        unit TEXT DEFAULT 'pcs' NOT NULL,
        expiry_date TIMESTAMPTZ,
        batch_number TEXT,
        modifiers_json JSONB,
        image_url TEXT
      );
    `;

    // 7. Register Shifts (Cash Drawer Control)
    await sql`
      CREATE TABLE IF NOT EXISTS register_shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opened_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        closed_at TIMESTAMPTZ,
        opening_float NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        expected_cash NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        actual_counted_cash NUMERIC(12, 2),
        variance NUMERIC(12, 2),
        notes TEXT,
        status shift_status DEFAULT 'OPEN' NOT NULL
      );
    `;

    // 8. Customers
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        loyalty_points INTEGER DEFAULT 0 NOT NULL,
        credit_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        credit_limit NUMERIC(12, 2) DEFAULT 50000.00 NOT NULL
      );
    `;

    // 9. Orders
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        shift_id UUID REFERENCES register_shifts(id) ON DELETE SET NULL,
        cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        receipt_number TEXT NOT NULL,
        order_type order_type DEFAULT 'WALK_IN' NOT NULL,
        table_number TEXT,
        subtotal NUMERIC(12, 2) NOT NULL,
        tax_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        total_amount NUMERIC(12, 2) NOT NULL,
        payment_method payment_method DEFAULT 'CASH' NOT NULL,
        payment_split_json JSONB,
        status order_status DEFAULT 'COMPLETED' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 10. Order Items
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name TEXT NOT NULL,
        quantity NUMERIC(12, 2) NOT NULL,
        unit_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL,
        discount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL,
        refunded_qty NUMERIC(12, 2) DEFAULT 0.00 NOT NULL
      );
    `;

    // 11. Inventory Ledger
    await sql`
      CREATE TABLE IF NOT EXISTS inventory_ledger (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type ledger_type NOT NULL,
        quantity_change NUMERIC(14, 4) NOT NULL,
        previous_stock NUMERIC(14, 4) NOT NULL,
        new_stock NUMERIC(14, 4) NOT NULL,
        reference_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 12. Kadogo Fractional Unit Conversions
    await sql`
      CREATE TABLE IF NOT EXISTS product_unit_conversions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        bulk_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        unit_name TEXT NOT NULL,
        unit_code TEXT NOT NULL,
        ratio_to_bulk NUMERIC(14, 4) NOT NULL,
        selling_price NUMERIC(14, 4) NOT NULL,
        cost_price NUMERIC(14, 4) NOT NULL,
        target_margin_percent NUMERIC(6, 2) DEFAULT 15.00 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 13. Supplier Invoices (Vision OCR Delivery Receipts)
    await sql`
      CREATE TABLE IF NOT EXISTS supplier_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        supplier_name TEXT NOT NULL,
        invoice_number TEXT,
        invoice_date TIMESTAMPTZ,
        total_amount NUMERIC(14, 4) DEFAULT 0.0000 NOT NULL,
        raw_ocr_text TEXT,
        extracted_items_json JSONB,
        image_url TEXT,
        status TEXT DEFAULT 'PENDING_REVIEW' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 14. AI Conversations (Copilot & WhatsApp Drawer)
    await sql`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        channel TEXT DEFAULT 'DRAWER' NOT NULL,
        title TEXT DEFAULT 'New Conversation' NOT NULL,
        messages_json JSONB DEFAULT '[]'::jsonb NOT NULL,
        last_interacted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;

    // 15. Column Migrations (Non-destructive idempotent additions)
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(14, 4);`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_fractional BOOLEAN DEFAULT false;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_category TEXT DEFAULT 'STANDARD';`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS hs_code TEXT;`;

    // 16. Performance indexes
    await sql`CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants (slug);`;
    await sql`CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);`;
    await sql`CREATE INDEX IF NOT EXISTS products_tenant_idx ON products (tenant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS products_barcode_idx ON products (barcode);`;
    await sql`CREATE INDEX IF NOT EXISTS products_parent_idx ON products (parent_product_id);`;
    await sql`CREATE INDEX IF NOT EXISTS orders_tenant_idx ON orders (tenant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS orders_receipt_idx ON orders (receipt_number);`;
    await sql`CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);`;
    await sql`CREATE INDEX IF NOT EXISTS inventory_ledger_tenant_idx ON inventory_ledger (tenant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS unit_conversions_tenant_idx ON product_unit_conversions (tenant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS unit_conversions_bulk_idx ON product_unit_conversions (bulk_product_id);`;
    await sql`CREATE INDEX IF NOT EXISTS supplier_invoices_tenant_idx ON supplier_invoices (tenant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS ai_conversations_tenant_idx ON ai_conversations (tenant_id);`;

    return { success: true };
  } catch (error) {
    console.error("Error creating database tables:", error);
    return { success: false, error };
  }
}
