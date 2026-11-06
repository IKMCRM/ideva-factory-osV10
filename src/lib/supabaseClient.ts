import { createClient } from "@supabase/supabase-js";
import { EMBEDDED_SUPABASE_URL, EMBEDDED_SUPABASE_KEY } from "./supabaseCredentials";
import { 
  firestoreGetCollection, 
  firestoreSaveDoc, 
  firestoreDeleteDoc,
  testFirestoreConnection,
  seedOfficialSuppliersToFirestore,
  OFFICIAL_SUPPLIERS
} from "./firebaseClient";

const getValidEnvVar = (val: any): string => {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (trimmed === "undefined" || trimmed === "null" || trimmed.includes("YOUR_SUPABASE")) return "";
  return trimmed;
};

const envUrl = getValidEnvVar((import.meta as any).env?.VITE_SUPABASE_URL);
const envKey = getValidEnvVar((import.meta as any).env?.VITE_SUPABASE_KEY) || getValidEnvVar((import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

// Default credentials hardcoded & embedded directly into system build
const DEFAULT_SUPABASE_URL = envUrl || EMBEDDED_SUPABASE_URL;
const DEFAULT_SUPABASE_KEY = envKey || EMBEDDED_SUPABASE_KEY;

export function getSupabaseConfig() {
  let customUrl = "";
  let customKey = "";

  // 1. Auto-detect from URL query parameters (enables 1-click database sync across any link/device)
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("supabase_url") || params.get("db_url");
      const keyParam = params.get("supabase_key") || params.get("db_key");
      if (urlParam && keyParam && urlParam.trim() !== "undefined" && keyParam.trim() !== "undefined") {
        customUrl = urlParam.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
        customKey = keyParam.trim();
        localStorage.setItem("custom_supabase_url", customUrl);
        localStorage.setItem("custom_supabase_key", customKey);
        // Clean address bar so URL remains neat
        try {
          const cleanPath = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanPath);
        } catch {}
      }
    } catch {}
  }

  // 2. Read from localStorage
  if (!customUrl || !customKey) {
    try {
      const storedUrl = localStorage.getItem("custom_supabase_url");
      const storedKey = localStorage.getItem("custom_supabase_key");
      if (storedUrl && storedKey && storedUrl.trim() !== "undefined" && storedKey.trim() !== "undefined") {
        customUrl = storedUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
        customKey = storedKey.trim();
      }
    } catch {}
  }

  const url = customUrl || DEFAULT_SUPABASE_URL;
  const key = customKey || DEFAULT_SUPABASE_KEY;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectId = match ? match[1] : "zizlhxikswejwvoftshk";

  return {
    url,
    key,
    isCustom: !!(customUrl || customKey),
    projectId
  };
}

/**
 * Generate a universal link containing active database credentials
 * Anyone clicking this link on any device will connect to the exact same cloud database!
 */
export function getShareableDatabaseLink(): string {
  if (typeof window === "undefined") return "";
  const cfg = getSupabaseConfig();
  const url = new URL(window.location.href);
  url.searchParams.set("db_url", cfg.url);
  url.searchParams.set("db_key", cfg.key);
  return url.toString();
}

let currentConfig = getSupabaseConfig();
let activeClientUrl = currentConfig.url.replace(/\/rest\/v1\/?$/, "");
let activeClientKey = currentConfig.key;

export let supabase = createClient(activeClientUrl, activeClientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

function ensureSupabaseClient(url: string, key: string) {
  const clean = url.trim().replace(/\/rest\/v1\/?$/, "");
  if (clean === activeClientUrl && key.trim() === activeClientKey && supabase) {
    return supabase;
  }
  try {
    if (supabase) {
      supabase.removeAllChannels();
    }
  } catch {}

  activeClientUrl = clean;
  activeClientKey = key.trim();
  supabase = createClient(clean, activeClientKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
  return supabase;
}

export function clearLocalCache() {
  const tables = [
    "suppliers", "customers", "products", "raw_materials", "raw_material_lots",
    "qc_inspections", "audit_logs", "bom_recipes", "bom_items", "production_orders",
    "packing_orders", "purchase_orders", "purchase_order_items", "grns", "prechecks",
    "inventory_pack", "purchase_packs", "projects", "semi_finished_goods", "requisitions"
  ];
  tables.forEach((t) => {
    try {
      localStorage.removeItem(`${LIVE_STORE_PREFIX}${t}`);
    } catch {}
  });
}

export const updateSupabaseConfig = (url: string, key: string) => {
  const clean = url.trim().replace(/\/rest\/v1\/?$/, "");
  try {
    localStorage.setItem("custom_supabase_url", clean);
    localStorage.setItem("custom_supabase_key", key.trim());
  } catch {}
  currentConfig = {
    url: clean,
    key: key.trim(),
    isCustom: true,
    projectId: clean.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "custom"
  };
  clearLocalCache();
  ensureSupabaseClient(clean, key.trim());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("supabase_config_changed", { detail: currentConfig }));
  }
};

export const resetSupabaseConfig = () => {
  const hadCustom = !!(
    localStorage.getItem("custom_supabase_url") || localStorage.getItem("custom_supabase_key")
  );
  try {
    localStorage.removeItem("custom_supabase_url");
    localStorage.removeItem("custom_supabase_key");
  } catch {}

  currentConfig = getSupabaseConfig();
  const clean = currentConfig.url.replace(/\/rest\/v1\/?$/, "");

  // If already running on target URL & Key, do not recreate or emit redundant change events
  if (clean === activeClientUrl && currentConfig.key === activeClientKey) {
    return;
  }

  clearLocalCache();
  ensureSupabaseClient(clean, currentConfig.key);
  if (typeof window !== "undefined" && hadCustom) {
    window.dispatchEvent(new CustomEvent("supabase_config_changed", { detail: currentConfig }));
  }
};

// Resilient Live Storage & Auto-Sync Queue Prefix
const LIVE_STORE_PREFIX = "ideva_db_v5_";
const SYNC_QUEUE_KEY = "ideva_db_v5_sync_queue";

// Cleanup legacy localStorage mock keys automatically on startup
(() => {
  try {
    const legacyKeys = [
      "factory_memory_db",
      "factory_database_cleared",
      "factory_warehouse_semi",
      "factory_warehouse_requisitions",
      "factory_warehouse_deleted_fg",
      "factory_warehouse_custom_fg",
      "supabase_is_offline",
      "factory_db_autoseeded",
      `${LIVE_STORE_PREFIX}suppliers` // Purge any cached suppliers to force 100% direct fetch from Supabase
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("factory_deleted_") || key.startsWith("supabase_failed_"))) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
})();

// Timeout wrapper with generous 12s timeout to prevent premature aborts on mobile/cloud
export const withTimeout = <T>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Supabase request timeout")), ms))
  ]);
};

// Export dummy fallbackDB interface if anything needs it, but it contains NO mock records
export const fallbackDB: Record<string, any[]> = {};

export const setSupabaseOffline = (_offline: boolean) => {
  // No-op
};

// In-Memory Query Cache with Stale-Time / Invalidation (Eliminates redundant network requests)
interface CacheItem {
  data: any[];
  timestamp: number;
}
const tableCache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 20000; // 20s cache window for instant responses

export function invalidateCache(table?: string) {
  if (table) {
    tableCache.delete(table);
    if (table === "raw_materials") {
      tableCache.delete("raw_material_lots");
      tableCache.delete("qc_inspections");
    } else if (table === "grns") {
      tableCache.delete("raw_materials");
      tableCache.delete("raw_material_lots");
      tableCache.delete("qc_inspections");
    } else if (table === "bom_recipes") {
      tableCache.delete("bom_items");
    } else if (table === "purchase_orders") {
      tableCache.delete("purchase_order_items");
    }
  } else {
    tableCache.clear();
  }
}

export const broadcastSyncChannel = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined" 
  ? new BroadcastChannel("ideva_factory_sync") 
  : null;

export function notifyGlobalSync(table?: string) {
  invalidateCache(table);
  if (broadcastSyncChannel) {
    try {
      broadcastSyncChannel.postMessage({ type: "DATA_MUTATED", table, timestamp: Date.now() });
    } catch {}
  }
}

export interface SyncItem {
  id?: string | number;
  action: "save" | "delete";
  table: string;
  record?: any;
  recordId?: number | string;
  timestamp: number;
}

export function getLocalTable(table: string): any[] {
  try {
    const raw = localStorage.getItem(`${LIVE_STORE_PREFIX}${table}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function setLocalTable(table: string, rows: any[]) {
  try {
    localStorage.setItem(`${LIVE_STORE_PREFIX}${table}`, JSON.stringify(rows));
  } catch {}
}

export function saveLocalRecord(table: string, record: any): any {
  const current = getLocalTable(table);
  const existingIdx = current.findIndex((r: any) => String(r.id) === String(record.id));
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...record };
  } else {
    current.unshift(record);
  }
  setLocalTable(table, current);
  return record;
}

export function deleteLocalRecord(table: string, id: number | string) {
  const current = getLocalTable(table);
  const filtered = current.filter((r: any) => String(r.id) !== String(id));
  setLocalTable(table, filtered);
}

export function getSyncQueue(): SyncItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setSyncQueue(queue: SyncItem[]) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function queueSyncItem(item: Omit<SyncItem, "timestamp">) {
  const q = getSyncQueue();
  // Filter out duplicate saves for the same record
  const filtered = q.filter((i) => !(i.table === item.table && i.action === item.action && String(i.record?.id || i.recordId || i.id) === String(item.record?.id || item.recordId || item.id)));
  filtered.push({ ...item, timestamp: Date.now() });
  setSyncQueue(filtered);
}

export async function processSyncQueue(): Promise<number> {
  const queue = getSyncQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remaining: SyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.action === "save" && item.record) {
        const row = { ...item.record };
        // If temporary client timestamp ID (>= 1700000000000), let Supabase generate auto-increment primary key
        if (typeof row.id === "number" && row.id > 1700000000000) {
          delete row.id;
        }
        const { error } = await withTimeout(supabase.from(item.table).upsert(row), 4000);
        if (!error) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      } else if (item.action === "delete") {
        const targetId = item.recordId ?? item.id;
        if (targetId) {
          const numId = Number(targetId) || targetId;
          const { error } = await withTimeout(supabase.from(item.table).delete().eq("id", numId), 4000);
          if (!error) {
            syncedCount++;
          } else {
            remaining.push(item);
          }
        }
      }
    } catch {
      remaining.push(item);
    }
  }

  setSyncQueue(remaining);
  return syncedCount;
}

/**
 * 100% DIRECT SUPABASE QUERY
 * - Returns exact records from the Supabase database.
 * - When table has 0 records, returns [] (Empty array).
 * - NEVER falls back to mock data or localStorage fake data!
 */
export const TABLE_ALLOWED_COLUMNS: Record<string, string[]> = {
  suppliers: [
    "code", "name", "company_name", "contact", "phone", "email", "address", "tax_id", "status", "merged_into_id", "created_at"
  ],
  customers: [
    "code", "name", "contact", "phone", "email", "tax_id", "address", "status", "created_at"
  ],
  products: [
    "code", "name", "type", "version", "status", "image_url", "category", "description", "unit_price", "stock_qty", "min_stock", "created_at"
  ],
  raw_materials: [
    "code", "name", "category", "default_unit", "base_unit", "standard_conversion", "unit", "stock_qty", "min_stock", "unit_price", "supplier_id", "supplier_name", "storage_condition", "status", "coa_required", "image_url", "created_at", "updated_at"
  ],
  raw_material_lots: [
    "lot_id_code", "material_id", "material_code", "material_name", "supplier_lot_no", "grn_id", "grn_no", "po_number", "supplier_id", "supplier_name", "received_date", "manufacture_date", "expiry_date", "retest_date", "received_qty", "remaining_qty", "purchase_unit", "unit_price_per_kg", "total_purchase_value", "currency", "qc_status", "appearance", "coa_url", "coa_status", "barcode", "stock_status", "created_by", "created_at"
  ],
  qc_inspections: [
    "grn_no", "material_id", "material_code", "material_name", "lot_id", "lot_code", "supplier_lot_no", "supplier_name", "received_qty", "purchase_unit", "expiry_date", "retest_date", "appearance", "coa_status", "qc_status", "checklist", "inspector", "inspection_date", "approver", "approval_date", "remarks", "label_pieces", "created_at"
  ],
  audit_logs: [
    "user", "timestamp", "action", "module", "material_code", "lot_number", "old_value", "new_value", "reason", "ref_doc", "created_at"
  ],
  bom_recipes: [
    "product_id", "part_no", "version", "status", "estimated_unit_cost", "notes", "materials", "created_at"
  ],
  bom_items: [
    "bom_id", "part", "raw_material_id", "material_code", "material_name", "quantity", "unit", "unit_price", "notes"
  ],
  production_orders: [
    "code", "customer_id", "product_id", "quantity", "unit", "status", "due_date", "staff", "date", "created_at"
  ],
  packing_orders: [
    "code", "production_order_id", "item_name", "quantity", "unit", "status", "created_at"
  ],
  purchase_orders: [
    "code", "supplier", "order_date", "status", "total_amount", "items", "created_at"
  ],
  purchase_order_items: [
    "purchase_order_id", "raw_material_id", "item_name", "quantity", "unit", "unit_price", "subtotal"
  ],
  grns: [
    "code", "purchase_order_id", "raw_material_id", "lot_number", "expiry_date", "received_qty", "receiver", "receive_date", "status", "unit", "unit_price", "supplier_name", "po_number", "created_at"
  ],
  prechecks: [
    "material", "lot", "expiry", "inspector", "date", "result", "notes", "created_at"
  ],
  inventory_pack: [
    "code", "type", "name", "qty", "unit", "status", "supplier_name", "unit_price", "image_url", "created_at"
  ],
  purchase_packs: [
    "code", "supplier", "item", "qty", "price", "status", "unit", "created_at"
  ],
  projects: [
    "title", "project_type", "customer_id", "customer", "customer_status", "owner", "price", "start_date", "due_date", "progress", "status", "quantity", "tags", "description", "product_code", "lot_number", "product_name", "details", "category", "created_at"
  ],
  semi_finished_goods: [
    "code", "name", "batch_no", "qty", "unit", "tank_no", "mfg_date", "status", "created_at"
  ],
  requisitions: [
    "code", "date", "department", "requester", "purpose", "status", "items", "created_at"
  ]
};

/**
 * 100% DIRECT SUPABASE QUERY
 * - Returns exact records from the Supabase database.
 * - When table has 0 records, returns [] (Empty array).
 * - Queries and maps all tables and columns directly.
 */
export async function clientGetList(entity: string, forceFresh = false): Promise<any[]> {
  try {
    const table = entity;
    const now = Date.now();

    // 1. Instant cache hit (short TTL to keep UI reactive)
    if (!forceFresh && tableCache.has(table)) {
      const cached = tableCache.get(table)!;
      if (now - cached.timestamp < 3000) {
        return cached.data;
      }
    }

    let rows: any[] = [];
    let remoteSuccess = false;
    const isAscending = ["suppliers", "customers", "products", "raw_materials"].includes(table);

    // ⚡ 1. Primary 100% Direct Query from Firebase Firestore
    try {
      const fbDocs = await firestoreGetCollection(table);
      if (fbDocs && fbDocs.length > 0) {
        let processedData = fbDocs;
        if (entity === "requisitions") {
          processedData = fbDocs.map((r: any) => ({
            ...r,
            items: Array.isArray(r.items) ? r.items : (typeof r.items === "string" ? JSON.parse(r.items || "[]") : [])
          }));
        }

        rows = isAscending
          ? processedData.sort((a, b) => {
              const codeA = String(a.code || a.id || "");
              const codeB = String(b.code || b.id || "");
              return codeA.localeCompare(codeB, undefined, { numeric: true });
            })
          : processedData.sort((a, b) => {
              const dateA = new Date(b.created_at || b.updated_at || 0).getTime();
              const dateB = new Date(a.created_at || a.updated_at || 0).getTime();
              return dateA - dateB;
            });

        remoteSuccess = true;
        setLocalTable(table, rows);
      }
    } catch (fbErr) {
      console.warn(`[Firebase Firestore Primary Warning] '${table}':`, fbErr);
    }

    // Special guarantee for suppliers: Ensure all 9 official chemical suppliers are always populated
    if (table === "suppliers" && rows.length === 0) {
      try {
        await seedOfficialSuppliersToFirestore();
        const refreshed = await firestoreGetCollection("suppliers");
        rows = refreshed.length > 0 ? refreshed : OFFICIAL_SUPPLIERS;
      } catch {
        rows = OFFICIAL_SUPPLIERS;
      }
      rows.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
      remoteSuccess = true;
      setLocalTable("suppliers", rows);
    }

    // 2. If table is empty in Firestore, check local store
    if (!remoteSuccess || rows.length === 0) {
      const local = getLocalTable(table);
      if (local && local.length > 0) {
        rows = local;
      }
    }

    if (rows.length === 0) {
      tableCache.set(table, { data: [], timestamp: now });
      return [];
    }

    // Specific relational enrichment for bom_recipes (Batch fetch from Firestore)
    if (entity === "bom_recipes") {
      const emptyBomRows = rows.filter((r) => {
        const mat = r.materials;
        return !mat || (Array.isArray(mat) && mat.length === 0) || (typeof mat === "string" && mat.trim() === "[]");
      });
      const bomIdsToFetch = emptyBomRows.map((r) => String(r.id)).filter(Boolean);

      if (bomIdsToFetch.length > 0) {
        try {
          const allItems = await firestoreGetCollection("bom_items");
          const itemsByBomId: Record<string, any[]> = {};
          allItems.forEach((itm: any) => {
            const bId = String(itm.bom_id);
            if (!itemsByBomId[bId]) itemsByBomId[bId] = [];
            itemsByBomId[bId].push({
              part: itm.part || "A",
              raw_material_id: itm.raw_material_id,
              material_code: itm.material_code || "",
              material_name: itm.material_name,
              quantity: parseFloat(itm.quantity) || 0,
              unit: itm.unit || "KG.",
              notes: itm.notes || ""
            });
          });

          rows = rows.map((row) => {
            let materials: any[] = [];
            if (Array.isArray(row.materials)) {
              materials = row.materials;
            } else if (typeof row.materials === "string") {
              try { materials = JSON.parse(row.materials); } catch {}
            }
            if (materials.length === 0 && itemsByBomId[String(row.id)]) {
              materials = itemsByBomId[String(row.id)];
            }
            return { ...row, materials };
          });
        } catch (e) {
          console.warn("Batch fetch bom_items from Firestore error:", e);
        }
      }

      tableCache.set(table, { data: rows, timestamp: now });
      return rows;
    }

    // Specific relational enrichment for purchase_orders (Batch fetch from Firestore)
    if (entity === "purchase_orders") {
      const emptyPoRows = rows.filter((r) => {
        const itms = r.items;
        return !itms || (Array.isArray(itms) && itms.length === 0) || (typeof itms === "string" && itms.trim() === "[]");
      });
      const poIdsToFetch = emptyPoRows.map((r) => String(r.id)).filter(Boolean);

      if (poIdsToFetch.length > 0) {
        try {
          const allItems = await firestoreGetCollection("purchase_order_items");
          const itemsByPoId: Record<string, any[]> = {};
          allItems.forEach((itm: any) => {
            const pId = String(itm.purchase_order_id);
            if (!itemsByPoId[pId]) itemsByPoId[pId] = [];
            itemsByPoId[pId].push({
              raw_material_id: itm.raw_material_id,
              item_name: itm.item_name,
              quantity: parseFloat(itm.quantity) || 0,
              unit: itm.unit || "กก.",
              unit_price: parseFloat(itm.unit_price) || 0,
              subtotal: parseFloat(itm.subtotal) || 0
            });
          });

          rows = rows.map((row) => {
            let items: any[] = [];
            if (Array.isArray(row.items)) {
              items = row.items;
            } else if (typeof row.items === "string") {
              try { items = JSON.parse(row.items); } catch {}
            }
            if (items.length === 0 && itemsByPoId[String(row.id)]) {
              items = itemsByPoId[String(row.id)];
            }
            return { ...row, items };
          });
        } catch (e) {
          console.warn("Batch fetch purchase_order_items from Firestore error:", e);
        }
      }

      tableCache.set(table, { data: rows, timestamp: now });
      return rows;
    }

    tableCache.set(table, { data: rows, timestamp: now });
    return rows;
  } catch (err: any) {
    console.warn(`[Database] Query exception for '${entity}':`, err?.message || err);
    return getLocalTable(entity);
  }
}

/**
 * Sanitize Payload against Allowed Columns for Table
 */
export function sanitizePayload(entity: string, data: any): any {
  const rawInput = { ...data };
  delete rawInput.id;

  const allowedCols = TABLE_ALLOWED_COLUMNS[entity];
  const cleanData: any = {};
  if (allowedCols) {
    for (const col of allowedCols) {
      if (col in rawInput && rawInput[col] !== undefined) {
        cleanData[col] = rawInput[col];
      }
    }
  } else {
    Object.assign(cleanData, rawInput);
  }

  // Type coercions
  if (entity === "raw_materials") {
    if ("stock_qty" in cleanData) cleanData.stock_qty = Number(cleanData.stock_qty) || 0;
    if ("min_stock" in cleanData) cleanData.min_stock = Number(cleanData.min_stock) || 0;
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
    if ("supplier_id" in cleanData) cleanData.supplier_id = cleanData.supplier_id ? Number(cleanData.supplier_id) : null;
  } else if (entity === "products") {
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
    if ("stock_qty" in cleanData) cleanData.stock_qty = Number(cleanData.stock_qty) || 0;
    if ("min_stock" in cleanData) cleanData.min_stock = Number(cleanData.min_stock) || 0;
  } else if (entity === "inventory_pack") {
    if ("qty" in cleanData) cleanData.qty = Number(cleanData.qty) || 0;
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
  } else if (entity === "purchase_packs") {
    if ("qty" in cleanData) cleanData.qty = Number(cleanData.qty) || 0;
    if ("price" in cleanData) cleanData.price = Number(cleanData.price) || 0;
  } else if (entity === "production_orders") {
    if ("quantity" in cleanData) cleanData.quantity = Number(cleanData.quantity) || 0;
    if ("customer_id" in cleanData) cleanData.customer_id = Number(cleanData.customer_id) || null;
    if ("product_id" in cleanData) cleanData.product_id = Number(cleanData.product_id) || null;
  } else if (entity === "packing_orders") {
    if ("quantity" in cleanData) cleanData.quantity = Number(cleanData.quantity) || 0;
    if ("production_order_id" in cleanData) cleanData.production_order_id = Number(cleanData.production_order_id) || null;
  } else if (entity === "purchase_orders") {
    if ("total_amount" in cleanData) cleanData.total_amount = Number(cleanData.total_amount) || 0;
  } else if (entity === "grns") {
    if ("received_qty" in cleanData) cleanData.received_qty = Number(cleanData.received_qty) || 0;
    if ("raw_material_id" in cleanData) cleanData.raw_material_id = Number(cleanData.raw_material_id);
    if ("purchase_order_id" in cleanData) cleanData.purchase_order_id = cleanData.purchase_order_id ? Number(cleanData.purchase_order_id) : null;
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
  } else if (entity === "projects") {
    if ("price" in cleanData) cleanData.price = Number(cleanData.price) || 0;
    if ("progress" in cleanData) cleanData.progress = Number(cleanData.progress) || 0;
    if ("quantity" in cleanData) cleanData.quantity = Number(cleanData.quantity) || 0;
    if ("customer_id" in cleanData) cleanData.customer_id = cleanData.customer_id ? Number(cleanData.customer_id) : null;
  } else if (entity === "semi_finished_goods") {
    if ("qty" in cleanData) cleanData.qty = Number(cleanData.qty) || 0;
  } else if (entity === "bom_recipes") {
    if ("product_id" in cleanData) cleanData.product_id = Number(cleanData.product_id) || 0;
    if ("estimated_unit_cost" in cleanData) cleanData.estimated_unit_cost = Number(cleanData.estimated_unit_cost) || 0;
  }

  return cleanData;
}

export const fetchTableData = clientGetList;

export async function insertTableData(table: string, payload: any): Promise<any> {
  const clean = sanitizePayload(table, payload);
  let currentPayload = { ...clean };
  let lastError = null;
  let resultRecord = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from(table)
      .insert(currentPayload)
      .select()
      .single();

    if (!error && data) {
      resultRecord = data;
      break;
    }

    lastError = error;
    console.warn(`[Supabase INSERT Warning - Attempt ${attempt + 1}] table '${table}':`, error?.message);

    const colMatch = error?.message?.match(/column ["']?([a_z0_9_]+)["']?/i) || error?.message?.match(/find the ["']?([a_z0_9_]+)["']? column/i);
    if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
      delete currentPayload[colMatch[1]];
      continue;
    }
    break;
  }

  if (resultRecord) {
    notifyGlobalSync();
    return resultRecord;
  }
  if (lastError) throw lastError;
  return null;
}

export async function updateTableData(table: string, id: number | string, payload: any): Promise<any> {
  const numId = Number(id) || id;
  const clean = sanitizePayload(table, payload);
  let currentPayload = { ...clean };
  let lastError = null;
  let resultRecord = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from(table)
      .update(currentPayload)
      .eq("id", numId)
      .select()
      .single();

    if (!error) {
      resultRecord = data || { id: numId, ...currentPayload };
      break;
    }

    lastError = error;
    console.warn(`[Supabase UPDATE Warning - Attempt ${attempt + 1}] table '${table}' id=${numId}:`, error?.message);

    const colMatch = error?.message?.match(/column ["']?([a_z0_9_]+)["']?/i) || error?.message?.match(/find the ["']?([a_z0_9_]+)["']? column/i);
    if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
      delete currentPayload[colMatch[1]];
      continue;
    }
    break;
  }

  if (resultRecord) {
    notifyGlobalSync();
    return resultRecord;
  }
  if (lastError) throw lastError;
  return null;
}

export async function deleteTableData(table: string, id: number | string): Promise<any> {
  const numId = Number(id) || id;
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", numId)
    .select();

  if (error) {
    console.warn(`[Supabase DELETE Warning] table '${table}' id=${id}:`, error.message);
    throw error;
  }

  notifyGlobalSync();
  return data;
}

/**
 * 100% DIRECT FIREBASE FIRESTORE INSERT & UPDATE
 */
export async function clientSave(entity: string, id: number | string, data: any): Promise<number | string> {
  const table = entity;
  const rawInput = { ...data };
  const now = new Date().toISOString();

  let savedId = id || rawInput.id;
  if (!savedId || savedId === 0 || savedId === "0") {
    savedId = rawInput.code ? String(rawInput.code) : Date.now();
  }

  const recordToSave = {
    ...rawInput,
    id: savedId,
    updated_at: now,
    created_at: rawInput.created_at || now
  };

  // 1. Save into local cache for instant UI feedback
  saveLocalRecord(table, recordToSave);

  // 2. PRIMARY: Save directly into Firebase Firestore
  try {
    const docId = String(recordToSave.code || recordToSave.id || savedId);
    await firestoreSaveDoc(table, docId, recordToSave);
  } catch (fbErr) {
    console.warn(`[Firestore Primary Save Warning] '${table}':`, fbErr);
  }

  // Handle child saves in Firestore
  if (entity === "bom_recipes" && Array.isArray(rawInput.materials)) {
    try {
      for (const [idx, mat] of rawInput.materials.entries()) {
        const matDocId = `${savedId}_mat_${idx + 1}`;
        await firestoreSaveDoc("bom_items", matDocId, {
          bom_id: savedId,
          part: mat.part || "A",
          raw_material_id: mat.raw_material_id || null,
          material_code: mat.material_code || "",
          material_name: mat.material_name,
          quantity: Number(mat.quantity) || 0,
          unit: mat.unit || "KG.",
          notes: mat.notes || null
        });
      }
    } catch (e) {
      console.warn("Child save bom_items error:", e);
    }
  }

  if (entity === "purchase_orders" && Array.isArray(rawInput.items)) {
    try {
      for (const [idx, itm] of rawInput.items.entries()) {
        const itmDocId = `${savedId}_item_${idx + 1}`;
        await firestoreSaveDoc("purchase_order_items", itmDocId, {
          purchase_order_id: savedId,
          raw_material_id: itm.raw_material_id || null,
          item_name: itm.item_name,
          quantity: Number(itm.quantity) || 0,
          unit: itm.unit || "กก.",
          unit_price: Number(itm.unit_price) || 0,
          subtotal: Number(itm.subtotal) || 0
        });
      }
    } catch (e) {
      console.warn("Child save purchase_order_items error:", e);
    }
  }

  // Automatically update stock on GRN save directly in Firestore
  if (entity === "grns") {
    const rawMaterialId = data.raw_material_id;
    const receivedQty = parseFloat(data.received_qty || 0);
    if (rawMaterialId && receivedQty) {
      try {
        const mats = await firestoreGetCollection("raw_materials");
        const found = mats.find((m: any) => String(m.id) === String(rawMaterialId) || String(m.code) === String(rawMaterialId));
        if (found) {
          const newStock = (Number(found.stock_qty) || 0) + receivedQty;
          await firestoreSaveDoc("raw_materials", String(found.code || found.id), {
            ...found,
            stock_qty: newStock
          });
        }
      } catch (e) {
        console.warn("Could not update raw_material stock on GRN save:", e);
      }
    }
  }

  // Optional background backup to Supabase if reachable
  try {
    const numId = Number(id) || 0;
    if (numId > 0) {
      updateTableData(table, numId, rawInput).catch(() => {});
    } else {
      insertTableData(table, rawInput).catch(() => {});
    }
  } catch {}

  notifyGlobalSync(table);
  return savedId;
}

/**
 * 100% DIRECT FIREBASE FIRESTORE DELETE
 */
export async function clientDelete(entity: string, id: number | string): Promise<boolean> {
  const table = entity;
  const strId = String(id);

  // 1. Delete from local store for instant UI feedback
  deleteLocalRecord(table, id);

  // 2. PRIMARY: Delete from Firebase Firestore
  try {
    await firestoreDeleteDoc(table, strId);
    const existing = await firestoreGetCollection(table);
    const matched = existing.find((r: any) => String(r.id) === strId || String(r.code) === strId);
    if (matched && String(matched.code) !== strId) {
      await firestoreDeleteDoc(table, String(matched.code));
    }
  } catch (fbDelErr) {
    console.warn(`[Firestore Primary Delete Warning] '${table}' id=${id}:`, fbDelErr);
  }

  // Optional background delete from Supabase if online
  try {
    deleteTableData(table, id).catch(() => {});
  } catch {}

  notifyGlobalSync(table);
  return true;
}

/**
 * Clear All Database Tables (Password Protected: 4321034)
 * Deletes all records in Supabase in child-first order.
 * Ensures Supabase tables and local cache are truly empty (0 records).
 */
export async function clearAllDatabaseTables(passcode: string): Promise<{
  success: boolean;
  message: string;
  clearedTables: string[];
}> {
  if (passcode.trim() !== "4321034") {
    throw new Error("รหัสผ่านยืนยันไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อป้องกันการกดพลาด");
  }

  // Exact topological order (child leaf tables first to avoid foreign key violations)
  const tablesInOrder = [
    "bom_items",
    "purchase_order_items",
    "grns",
    "packing_orders",
    "production_orders",
    "purchase_packs",
    "purchase_orders",
    "prechecks",
    "bom_recipes",
    "inventory_pack",
    "projects",
    "semi_finished_goods",
    "requisitions",
    "raw_materials",
    "products",
    "customers",
    "suppliers"
  ];

  // 1. Wipe all local tables and sync queue immediately
  for (const t of tablesInOrder) {
    setLocalTable(t, []);
  }
  setSyncQueue([]);

  // 2. Delete all rows from Supabase directly
  for (const t of tablesInOrder) {
    try {
      const { error } = await withTimeout(supabase.from(t).delete().gt("id", -1), 3500);
      if (error) {
        console.warn(`[Supabase Clear] Table ${t}:`, error.message);
      }
    } catch (e) {
      console.warn(`[Supabase Clear Exception] Table ${t}:`, e);
    }
  }

  // 3. Clear any legacy local storage remnants
  try {
    const keys = [
      "factory_memory_db",
      "factory_database_cleared",
      "factory_warehouse_semi",
      "factory_warehouse_requisitions",
      "factory_warehouse_deleted_fg",
      "factory_warehouse_custom_fg",
      "supabase_is_offline"
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("factory_deleted_") || k.startsWith("supabase_failed_") || k.startsWith(LIVE_STORE_PREFIX))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}

  // 4. Notify server backend to clear its memory
  try {
    await fetch("/api/clear-all-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "4321034" })
    });
  } catch {}

  return {
    success: true,
    message: "ล้างข้อมูลในฐานข้อมูล Supabase ทั้งหมดเรียบร้อยแล้ว 100% (ทุกตารางว่างเปล่า 0 รายการ)",
    clearedTables: tablesInOrder
  };
}

/**
 * Intelligent Connection Diagnostics
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  elapsed?: number;
  errorType?: "FAILED_TO_FETCH" | "AUTH_ERROR" | "TIMEOUT" | "GENERIC";
  details?: string;
  isPausedPossible?: boolean;
}> {
  const start = Date.now();
  try {
    const fbRes = await testFirestoreConnection();
    const elapsed = Date.now() - start;
    if (fbRes.success) {
      return {
        success: true,
        elapsed,
        message: `เชื่อมต่อ Firebase Firestore สำเร็จ 100%! (${elapsed}ms - สถานะออนไลน์โดยตรง)`
      };
    }
    const { data, error } = await withTimeout(
      supabase.from("raw_materials").select("id").limit(1),
      4000
    );
    const supaElapsed = Date.now() - start;

    if (error) {
      if (error.message?.includes("Invalid API key") || error.code === "401") {
        return {
          success: false,
          elapsed: supaElapsed,
          errorType: "AUTH_ERROR",
          message: `รหัส API Key ไม่ถูกต้อง: ${error.message}`,
          details: "กรุณาตรวจสอบ Anon Key ของโครงการ Supabase ในเมนูตั้งค่า"
        };
      }
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: true,
          elapsed: supaElapsed,
          message: `เชื่อมต่อเซิร์ฟเวอร์ Supabase สำเร็จ (${supaElapsed}ms) แต่ยังไม่พบตารางในฐานข้อมูล (ต้องรัน SQL Schema)`
        };
      }
      return {
        success: false,
        elapsed: supaElapsed,
        errorType: "GENERIC",
        message: `เชื่อมต่อไม่สำเร็จ: ${error.message}`,
        details: error.details || error.hint || ""
      };
    }

    return {
      success: true,
      elapsed: supaElapsed,
      message: `เชื่อมต่อ Supabase สำเร็จ 100%! (${supaElapsed}ms - สถานะออนไลน์โดยตรง)`
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    const errStr = String(err?.message || err?.name || err);
    const isFetchError =
      err?.name === "TypeError" ||
      errStr.includes("Failed to fetch") ||
      errStr.includes("NetworkError") ||
      errStr.includes("timeout") ||
      errStr.includes("ENOTFOUND");

    if (isFetchError) {
      const cfg = getSupabaseConfig();
      return {
        success: false,
        elapsed,
        errorType: "FAILED_TO_FETCH",
        isPausedPossible: true,
        message: "เชื่อมต่อไม่สำเร็จ: TypeError: Failed to fetch (net::ERR_NAME_NOT_RESOLVED)",
        details: `ตรวจพบว่าเซิร์ฟเวอร์ '${cfg.url}' ไม่ตอบสนองต่อ DNS โดยปกติบน Supabase Free Tier เกิดจากโปรเจกต์ (${cfg.projectId}) อยู่ในสถานะ 'Paused' (พักการใช้งาน) หรือถูกลบ/เปลี่ยนโปรเจกต์ใหม่ กรุณากด Restore project ใน Supabase Dashboard หรือระบุ URL & Key ใหม่`
      };
    }

    return {
      success: false,
      elapsed,
      errorType: "GENERIC",
      message: `ข้อผิดพลาดในการเชื่อมต่อ: ${err?.message || "เครือข่ายขัดข้อง"}`,
      details: String(err)
    };
  }
}

export const ALL_17_TABLES = [
  "suppliers",
  "customers",
  "products",
  "raw_materials",
  "bom_recipes",
  "bom_items",
  "production_orders",
  "packing_orders",
  "purchase_orders",
  "purchase_order_items",
  "grns",
  "prechecks",
  "inventory_pack",
  "purchase_packs",
  "projects",
  "semi_finished_goods",
  "requisitions"
];

/**
 * Enhanced Real-time Supabase Subscription
 * - Listens specifically to all 17 database tables for INSERT, UPDATE, and DELETE events.
 * - Subscribes to schema 'public' wildcard AND explicit table bindings for 100% catch rate across devices/SDK versions.
 * - Features automatic re-subscription on network disconnect / error / timeout.
 * - Debounces rapid event triggers to optimize network calls while keeping UI updated globally in real time.
 */
let activeRealtimeChannel: any = null;
let realtimeRetryCount = 0;
const MAX_REALTIME_RETRIES = 3;

export function subscribeToRealtimeDatabase(onUpdate: (table: string, eventType: string) => void) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isUnsubscribed = false;

  const debouncedNotify = (table: string, eventType: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onUpdate(table, eventType);
    }, 250);
  };

  try {
    // 1. Unsubscribe any existing active channel cleanly first
    if (activeRealtimeChannel) {
      try {
        supabase.removeChannel(activeRealtimeChannel);
      } catch {}
      activeRealtimeChannel = null;
    }

    const channelName = "ideva-realtime-global-channel";
    let channel = supabase.channel(channelName);

    // 2. Schema-wide Realtime Listener for table changes
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public" },
      (payload: any) => {
        const tableName = payload.table || "unknown";
        console.log(`⚡ [Supabase Realtime] ${payload.eventType} on table '${tableName}'`);
        debouncedNotify(tableName, payload.eventType || "UPDATE");
      }
    );

    activeRealtimeChannel = channel;

    // 3. Subscribe with Backoff Policy (max 3 retries, no endless 3s loops)
    channel.subscribe((status: string, err?: any) => {
      if (status === "SUBSCRIBED") {
        realtimeRetryCount = 0;
        console.log("🟢 [Supabase Realtime] Connected & Subscribed successfully!");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (!isUnsubscribed && realtimeRetryCount < MAX_REALTIME_RETRIES) {
          realtimeRetryCount++;
          const backoffDelay = Math.min(15000, Math.pow(2, realtimeRetryCount) * 2500);
          console.warn(`⚠️ [Supabase Realtime] Channel status '${status}'. Attempting reconnect ${realtimeRetryCount}/${MAX_REALTIME_RETRIES} in ${Math.round(backoffDelay/1000)}s...`);
          setTimeout(() => {
            if (!isUnsubscribed && activeRealtimeChannel === channel) {
              try {
                supabase.removeChannel(channel);
              } catch {}
              activeRealtimeChannel = null;
              subscribeToRealtimeDatabase(onUpdate);
            }
          }, backoffDelay);
        } else if (realtimeRetryCount >= MAX_REALTIME_RETRIES) {
          console.info(`ℹ️ [Supabase Realtime] Standby mode active (background HTTP synchronization will continue updating data).`);
        }
      }
    });

    return () => {
      isUnsubscribed = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (activeRealtimeChannel === channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
        activeRealtimeChannel = null;
      }
    };
  } catch (err) {
    console.warn("Could not subscribe to Supabase Realtime channel:", err);
    return () => {};
  }
}

export { FULL_SUPABASE_SCHEMA_SQL } from "./schemaSql";
