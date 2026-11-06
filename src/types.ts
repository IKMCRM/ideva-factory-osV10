export interface Supplier {
  id: number;
  code: string;
  name: string;
  company_name?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  status: string; // 'active' | 'suspended' | 'merged'
  merged_into_id?: number;
  created_at?: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  address?: string;
  status: string;
  created_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  type: string;
  version: string;
  status: string;
  image_url?: string;
}

export interface RawMaterial {
  id: number;
  code: string;
  name: string;
  category?: string;          // e.g. Essential Oil, Synthetic Fragrance, Solvents, Additives
  unit?: string;               // Legacy or alias for default_unit
  default_unit: string;       // e.g. KG, G, L, ML
  base_unit: string;          // e.g. G for weight, ML for volume
  standard_conversion?: number; // e.g. 1000 for KG -> G
  supplier?: string;
  supplier_id?: number;
  supplier_name?: string;
  min_stock: number;          // Minimum Stock in Base Unit (G / ML)
  stock_qty: number;          // Total Available Stock in Base Unit (G / ML)
  storage_condition?: string; // e.g. Cool & Dry (15-25°C), Dark Bottle
  status: string;             // 'active' | 'inactive'
  unit_price?: number;        // Representative reference price per KG
  coa_required?: boolean;     // Requires COA document
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterialLot {
  id: number;
  lot_id_code: string;        // System Generated Lot ID e.g. LOT-202611-001
  material_id: number;
  material_code?: string;
  material_name?: string;
  supplier_lot_no: string;    // Label on supplier package e.g. LOT-DE-8821
  grn_id?: number;
  grn_no: string;             // Receiving No. e.g. GRN-6162960
  po_number?: string;
  supplier_id?: number;
  supplier_name: string;      // e.g. IDEVA / De Roma
  received_date: string;      // YYYY-MM-DD
  manufacture_date?: string;  // YYYY-MM-DD
  expiry_date: string;        // YYYY-MM-DD
  retest_date?: string;       // YYYY-MM-DD (วันที่ทดสอบซ้ำ)
  received_qty: number;       // In Purchase Unit or Base Unit
  remaining_qty: number;      // Remaining In Base Unit (G / ML)
  purchase_unit: string;      // e.g. KG, G, L
  unit_price_per_kg: number;  // Price in THB per 1 KG (or per 1 L)
  total_purchase_value: number; // Purchase Quantity (KG) * Price (THB/KG)
  currency: string;           // THB
  qc_status: "Pending QC" | "Under Inspection" | "QC Passed" | "QC Failed" | "Quarantine";
  appearance?: string;        // e.g. ของเหลว, ผง, เกล็ด
  coa_url?: string;           // COA Attachment URL or base64
  coa_status?: "Attached" | "Missing COA";
  barcode?: string;           // Scannable barcode string
  stock_status: "Available" | "Quarantine" | "Exhausted" | "Expired";
  created_by?: string;
  created_at?: string;
}

export interface QcChecklistItem {
  id: string;
  title: string;
  title_en: string;
  result: "PASS" | "FAIL" | "N/A";
  remark?: string;
}

export interface QcInspection {
  id: number;
  grn_no: string;
  material_id: number;
  material_code: string;
  material_name: string;
  lot_id: number;
  lot_code: string;
  supplier_lot_no: string;
  supplier_name: string;
  received_qty: number;
  purchase_unit: string;
  expiry_date: string;
  retest_date?: string;
  appearance?: string;
  coa_status: "Attached" | "Missing COA";
  qc_status: "Pending QC" | "Under Inspection" | "QC Passed" | "QC Failed" | "Quarantine";
  checklist: QcChecklistItem[];
  inspector: string;
  inspection_date: string;
  approver?: string;
  approval_date?: string;
  remarks?: string;
  label_pieces?: number;      // ชิ้นที่ e.g. 1 / 1
}

export interface AuditLog {
  id: number;
  user: string;
  timestamp: string;
  action: string;             // e.g. "CREATE_LOT", "QC_INSPECT", "STOCK_ISSUE", "NON_FEFO_OVERRIDE"
  module: string;             // e.g. "RawMaterial", "IncomingQC", "GRN", "Production"
  material_code?: string;
  lot_number?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  ref_doc?: string;
}

export interface BomMaterial {
  part?: string;
  material_id?: number;
  material_code?: string;
  material_name: string;
  quantity: number;           // Quantity in G or default unit
  unit: string;               // G, KG, ML, L
  notes?: string | null;
  unit_price?: number;
}

export interface BomRecipe {
  id: number;
  product_id: number;
  part_no?: string;
  version: string;
  status: string;
  notes?: string;
  materials: BomMaterial[];
  product_code?: string;
  product_name?: string;
  product_type?: string;
  production_count?: number;
  production_quantity?: number;
  estimated_unit_cost?: number;
}

export interface ProductionLotDeduction {
  lot_id: number;
  lot_code: string;
  supplier_lot_no: string;
  deduct_qty_g: number;
  unit_price_per_kg: number;
  lot_cost: number;
}

export interface ProductionOrder {
  id: number;
  code: string;
  customer_id: number;
  product_id: number;
  quantity: number;
  unit: string;
  status: string;
  due_date: string;
  staff?: string;
  date: string;
  customer_name?: string;
  product_name?: string;
  product_code?: string;
  lot_deductions?: ProductionLotDeduction[];
  total_material_cost?: number;
  created_at?: string;
}

export interface PackingOrder {
  id: number;
  code: string;
  production_order_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  status: string;
}

export interface PurchaseItem {
  raw_material_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  supplier: string;
  order_date: string;
  status: string;
  total_amount: number;
  items: PurchaseItem[];
  material?: string;
  qty?: number;
  price?: number;
}

export interface Grn {
  id: number;
  code: string;               // e.g. GRN-6162960
  purchase_order_id?: number;
  po_number?: string;
  raw_material_id: number;
  material_code?: string;
  material_name?: string;
  supplier_name: string;
  supplier_lot_no: string;    // Supplier Lot No.
  lot_number?: string;        // Alias for supplier_lot_no
  system_lot_code?: string;   // Generated Lot ID
  manufacture_date?: string;
  expiry_date: string;
  retest_date?: string;
  received_qty: number;
  purchase_unit: string;
  unit_price: number;         // THB per KG
  total_amount: number;
  invoice_number?: string;
  coa_url?: string;
  qc_status: "Pending QC" | "Under Inspection" | "QC Passed" | "QC Failed" | "Quarantine";
  receiver: string;
  receive_date: string;
  receiving_remark?: string;
  status: string;
}

export interface Precheck {
  id: number;
  material: string;
  lot: string;
  expiry: string;
  inspector: string;
  date: string;
  result: string;
}

export interface InventoryPack {
  id: number;
  code: string;
  type: string;
  name: string;
  qty: number;
  unit: string;
  status: string;
  supplier_name?: string;
  unit_price?: number;
  image_url?: string;
}

export interface Project {
  id: number;
  title: string;
  project_type?: string;
  customer_id?: number;
  customer: string;
  customer_status?: string;
  owner: string;
  price: number;
  start_date: string;
  due_date: string;
  progress: number;
  status: string;
  quantity: number;
  tags?: string[];
  description?: string;
  product_code?: string;
  lot_number?: string;
  product_name?: string;
  details?: string;
  category?: string;
  created_at?: string;
}

export interface SemiFinishedGood {
  id: number;
  code: string;
  name: string;
  batch_no: string;
  qty: number;
  unit: string;
  tank_no: string;
  mfg_date: string;
  status: string;
}

export interface RequisitionSlip {
  id: number;
  code: string;
  date: string;
  department: string;
  requester: string;
  items: { item_name: string; qty: number; unit: string; lot_code?: string; cost?: number }[];
  status: "approved" | "pending";
  purpose: string;
}


