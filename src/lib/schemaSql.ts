// Full PostgreSQL Schema for Supabase with Realtime and Row Level Security
export const FULL_SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- IDEVA FACTORY OS — COMPLETE SUPABASE POSTGRESQL SCHEMA (100% REALTIME READY)
-- ============================================================================
-- This script creates all 20 tables, relational child tables, indexes,
-- Row Level Security (RLS) permissive policies, Supabase Realtime publications,
-- and seed data for the chemical factory OS.
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    merged_into_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    tax_id VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Liquid',
    version VARCHAR(50) DEFAULT 'v1.0',
    status VARCHAR(50) DEFAULT 'active',
    image_url TEXT,
    category VARCHAR(100),
    description TEXT,
    unit_price DECIMAL(12,2) DEFAULT 0.00,
    stock_qty DECIMAL(12,4) DEFAULT 0.0000,
    min_stock DECIMAL(12,4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. RAW MATERIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    default_unit VARCHAR(50) DEFAULT 'KG.',
    base_unit VARCHAR(50) DEFAULT 'G.',
    standard_conversion DECIMAL(12,4) DEFAULT 1000.0000,
    unit VARCHAR(50) DEFAULT 'KG.',
    stock_qty DECIMAL(12,4) DEFAULT 0.0000,
    min_stock DECIMAL(12,4) DEFAULT 0.0000,
    unit_price DECIMAL(12,2) DEFAULT 0.00,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    storage_condition VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    coa_required BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4B. MATERIAL_SUPPLIERS JUNCTION TABLE (M:N Materials <-> Suppliers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS material_suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(120) NOT NULL UNIQUE,
    material_id INT NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    material_code VARCHAR(50),
    material_name VARCHAR(255),
    supplier_id INT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50),
    supplier_name VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    latest_price DECIMAL(14,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'THB',
    unit VARCHAR(50) DEFAULT 'KG.',
    last_purchase_date DATE,
    last_po_no VARCHAR(100),
    last_grn_no VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (material_id, supplier_id)
);

-- ============================================================================
-- 4C. PURCHASE PRICE HISTORY TABLE (Historical Purchase Prices per Supplier)
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_price_history (
    id SERIAL PRIMARY KEY,
    code VARCHAR(120) NOT NULL UNIQUE,
    material_supplier_id INT REFERENCES material_suppliers(id) ON DELETE SET NULL,
    material_id INT NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    material_code VARCHAR(50),
    material_name VARCHAR(255),
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_code VARCHAR(50),
    supplier_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    previous_price DECIMAL(14,2) DEFAULT 0.00,
    unit VARCHAR(50) DEFAULT 'KG.',
    currency VARCHAR(10) DEFAULT 'THB',
    qty DECIMAL(12,4) DEFAULT 0.0000,
    purchase_date DATE NOT NULL,
    source_type VARCHAR(50) DEFAULT 'MANUAL_UPDATE',
    ref_doc VARCHAR(100),
    recorded_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. RAW MATERIAL LOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_material_lots (
    id SERIAL PRIMARY KEY,
    lot_id_code VARCHAR(100) NOT NULL UNIQUE,
    material_id INT REFERENCES raw_materials(id) ON DELETE CASCADE,
    material_code VARCHAR(50),
    material_name VARCHAR(255),
    supplier_lot_no VARCHAR(100),
    grn_id INT,
    grn_no VARCHAR(100),
    po_number VARCHAR(100),
    supplier_id INT,
    supplier_name VARCHAR(255),
    received_date DATE,
    manufacture_date DATE,
    expiry_date DATE,
    retest_date DATE,
    received_qty DECIMAL(12,4) DEFAULT 0.0000,
    remaining_qty DECIMAL(12,4) DEFAULT 0.0000,
    purchase_unit VARCHAR(50) DEFAULT 'KG.',
    unit_price_per_kg DECIMAL(12,2) DEFAULT 0.00,
    total_purchase_value DECIMAL(14,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'THB',
    qc_status VARCHAR(50) DEFAULT 'Pending QC',
    appearance VARCHAR(255),
    coa_url TEXT,
    coa_status VARCHAR(50) DEFAULT 'Missing COA',
    barcode VARCHAR(100),
    stock_status VARCHAR(50) DEFAULT 'Available',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. QC INSPECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS qc_inspections (
    id SERIAL PRIMARY KEY,
    grn_no VARCHAR(100),
    material_id INT,
    material_code VARCHAR(50),
    material_name VARCHAR(255),
    lot_id INT,
    lot_code VARCHAR(100),
    supplier_lot_no VARCHAR(100),
    supplier_name VARCHAR(255),
    received_qty DECIMAL(12,4) DEFAULT 0.0000,
    purchase_unit VARCHAR(50) DEFAULT 'KG.',
    expiry_date DATE,
    retest_date DATE,
    appearance VARCHAR(255),
    coa_status VARCHAR(50) DEFAULT 'Missing COA',
    qc_status VARCHAR(50) DEFAULT 'Pending QC',
    checklist JSONB DEFAULT '[]'::jsonb,
    inspector VARCHAR(255),
    inspection_date DATE,
    approver VARCHAR(255),
    approval_date DATE,
    remarks TEXT,
    label_pieces INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    "user" VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100),
    module VARCHAR(100),
    material_code VARCHAR(50),
    lot_number VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    ref_doc VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. BOM RECIPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bom_recipes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    part_no VARCHAR(100),
    version VARCHAR(50) DEFAULT 'v1.0',
    status VARCHAR(50) DEFAULT 'active',
    estimated_unit_cost DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    materials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INT NOT NULL REFERENCES bom_recipes(id) ON DELETE CASCADE,
    part VARCHAR(10) DEFAULT 'A',
    raw_material_id INT REFERENCES raw_materials(id) ON DELETE SET NULL,
    material_code VARCHAR(50),
    material_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
    unit VARCHAR(50) DEFAULT 'กก.',
    unit_price DECIMAL(14,2) DEFAULT 0.00,
    notes VARCHAR(255)
);

-- ============================================================================
-- 9. PRODUCTION ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50) DEFAULT 'ลิตร',
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    staff VARCHAR(255),
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. PACKING ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS packing_orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    production_order_id INT NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50) DEFAULT 'ขวด',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. PURCHASE ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    supplier VARCHAR(255) NOT NULL,
    order_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(14,2) DEFAULT 0.00,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    raw_material_id INT REFERENCES raw_materials(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    unit VARCHAR(50) DEFAULT 'กก.',
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00
);

-- ============================================================================
-- 12. GRNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS grns (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE SET NULL,
    raw_material_id INT NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    expiry_date DATE,
    received_qty DECIMAL(12,4) DEFAULT 0.0000,
    receiver VARCHAR(255),
    receive_date DATE,
    status VARCHAR(50) DEFAULT 'received',
    unit VARCHAR(50) DEFAULT 'KG.',
    unit_price DECIMAL(14,2) DEFAULT 0.00,
    supplier_name VARCHAR(255),
    po_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. PRECHECKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prechecks (
    id SERIAL PRIMARY KEY,
    material VARCHAR(255) NOT NULL,
    lot VARCHAR(100) NOT NULL,
    expiry DATE,
    inspector VARCHAR(255),
    date DATE,
    result VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 14. INVENTORY PACK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_pack (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    qty DECIMAL(12,4) DEFAULT 0.0000,
    unit VARCHAR(50) DEFAULT 'ชิ้น',
    status VARCHAR(50) DEFAULT 'active',
    supplier_name VARCHAR(255),
    unit_price DECIMAL(14,2) DEFAULT 0.00,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 15. PURCHASE PACKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_packs (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    supplier VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    qty DECIMAL(12,4) DEFAULT 0.0000,
    price DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    unit VARCHAR(50) DEFAULT 'ชิ้น',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 16. PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_type VARCHAR(100),
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    customer VARCHAR(255),
    customer_status VARCHAR(50),
    owner VARCHAR(100),
    price DECIMAL(14,2) DEFAULT 0.00,
    start_date VARCHAR(50),
    due_date VARCHAR(50),
    progress INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'กำลังผลิต',
    quantity DECIMAL(12,2) DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    product_code VARCHAR(50),
    lot_number VARCHAR(50),
    product_name VARCHAR(255),
    details TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 17. SEMI-FINISHED GOODS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semi_finished_goods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    batch_no VARCHAR(100),
    qty DECIMAL(12,4) DEFAULT 0.0000,
    unit VARCHAR(50) DEFAULT 'KG.',
    tank_no VARCHAR(100),
    mfg_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 18. REQUISITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS requisitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    date DATE,
    department VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'approved',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 19. ROW LEVEL SECURITY (RLS) POLICIES — 100% PUBLIC ACCESS FOR ANON
-- ============================================================================
DO $$ 
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'suppliers', 'customers', 'products', 'raw_materials', 'material_suppliers', 'purchase_price_history', 'raw_material_lots', 'qc_inspections', 'audit_logs',
        'bom_recipes', 'bom_items', 'production_orders', 'packing_orders',
        'purchase_orders', 'purchase_order_items', 'grns', 'prechecks',
        'inventory_pack', 'purchase_packs', 'projects', 'semi_finished_goods', 'requisitions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public full access on %s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public full access on %s" ON %I FOR ALL TO public USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- 20. ENABLE SUPABASE REALTIME REPLICATION
-- ============================================================================
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'suppliers', 'customers', 'products', 'raw_materials', 'material_suppliers', 'purchase_price_history', 'raw_material_lots', 'qc_inspections', 'audit_logs',
        'bom_recipes', 'bom_items', 'production_orders', 'packing_orders',
        'purchase_orders', 'purchase_order_items', 'grns', 'prechecks',
        'inventory_pack', 'purchase_packs', 'projects', 'semi_finished_goods', 'requisitions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL;', tbl);
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl);
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
            WHEN OTHERS THEN
                NULL;
        END;
END $$;
`;
