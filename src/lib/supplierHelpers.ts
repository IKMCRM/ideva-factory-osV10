import {
  MaterialSupplier,
  PurchasePriceHistory,
  RawMaterial,
  RawMaterialSupplierRef,
  Supplier
} from "../types";
import { firestoreGetCollection, OFFICIAL_SUPPLIERS } from "./firebaseClient";
import { clientDelete, clientSave, getLocalTable } from "./supabaseClient";

/**
 * Normalize a supplier/company name for reliable duplicate-free matching.
 */
export function normalizeSupplierName(name?: string | null): string {
  if (!name) return "";
  return String(name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Find the next sequential SUP-XXXX code across all known suppliers.
 */
export function generateNextSupplierCode(existingSuppliers: Supplier[]): string {
  let maxNum = 0;
  for (const s of existingSuppliers) {
    const code = String(s.code || "").trim().toUpperCase();
    const match = code.match(/^SUP-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const existingCodes = new Set(
    existingSuppliers.map((s) => String(s.code || "").trim().toUpperCase())
  );
  let nextNum = maxNum + 1;
  let candidate = `SUP-${String(nextNum).padStart(4, "0")}`;
  while (existingCodes.has(candidate)) {
    nextNum++;
    candidate = `SUP-${String(nextNum).padStart(4, "0")}`;
  }
  return candidate;
}

/**
 * Generate the next unique numeric ID for a new Supplier record.
 */
export function generateNextSupplierNumericId(existingSuppliers: Supplier[]): number {
  let maxId = 0;
  for (const s of existingSuppliers) {
    const n = Number(s.id);
    if (!isNaN(n) && isFinite(n) && n < 1000000000 && n > maxId) {
      maxId = n;
    }
  }
  const existingIds = new Set(existingSuppliers.map((s) => Number(s.id)));
  let nextId = Math.max(maxId + 1, existingSuppliers.length + 1, 10);
  while (existingIds.has(nextId)) {
    nextId++;
  }
  return nextId;
}

/**
 * Generate a unique numeric ID for a new Raw Material record.
 */
export function generateNextMaterialNumericId(existingMaterials: RawMaterial[]): number {
  let maxId = 0;
  for (const m of existingMaterials) {
    const n = Number(m.id);
    if (!isNaN(n) && isFinite(n) && n < 1000000000 && n > maxId) {
      maxId = n;
    }
  }
  const existingIds = new Set(existingMaterials.map((m) => Number(m.id)));
  let nextId = Math.max(maxId + 1, existingMaterials.length + 1, 1);
  while (existingIds.has(nextId)) {
    nextId++;
  }
  return nextId;
}

/**
 * Deterministic safe Firestore/SQL code for a Material_Suppliers link.
 */
export function makeMaterialSupplierCode(
  materialIdOrCode: number | string,
  supplierCodeOrId: number | string
): string {
  const mKey = String(materialIdOrCode || "MAT").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const sKey = String(supplierCodeOrId || "SUP").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return `MS-${mKey}-${sKey}`;
}

/**
 * Find an existing supplier by ID, code, or normalized company/display name.
 */
export function findMatchingSupplier(
  input: { id?: number | string; code?: string; name?: string },
  suppliers: Supplier[]
): Supplier | undefined {
  const inputId =
    input.id !== undefined && input.id !== null && input.id !== "" && input.id !== 0
      ? String(input.id)
      : "";
  const inputCode = String(input.code || "").trim().toUpperCase();
  const inputNorm = normalizeSupplierName(input.name);

  if (inputId) {
    const byId = suppliers.find((s) => String(s.id) === inputId);
    if (byId) return byId;
  }

  if (inputCode && !inputCode.startsWith("AUTO")) {
    const byCode = suppliers.find(
      (s) => String(s.code || "").trim().toUpperCase() === inputCode
    );
    if (byCode) return byCode;
  }

  if (inputNorm) {
    const byName = suppliers.find(
      (s) =>
        normalizeSupplierName(s.name) === inputNorm ||
        normalizeSupplierName(s.company_name) === inputNorm
    );
    if (byName) return byName;
  }

  return undefined;
}

/**
 * Check whether a MaterialSupplier row belongs to a given RawMaterial.
 */
export function doesLinkBelongToMaterial(
  link: Partial<MaterialSupplier>,
  rm: { id?: number | string; code?: string }
): boolean {
  if (
    link.material_id !== undefined &&
    link.material_id !== null &&
    rm.id !== undefined &&
    rm.id !== null &&
    String(link.material_id) === String(rm.id)
  ) {
    return true;
  }
  if (
    link.material_code &&
    rm.code &&
    String(link.material_code).trim().toUpperCase() === String(rm.code).trim().toUpperCase()
  ) {
    return true;
  }
  return false;
}

/**
 * Check whether a MaterialSupplier row belongs to a given Supplier.
 */
export function doesLinkBelongToSupplier(
  link: Partial<MaterialSupplier>,
  sup: Partial<Supplier>
): boolean {
  if (
    link.supplier_id !== undefined &&
    link.supplier_id !== null &&
    sup.id !== undefined &&
    sup.id !== null &&
    String(link.supplier_id) === String(sup.id)
  ) {
    return true;
  }
  if (
    link.supplier_code &&
    sup.code &&
    String(link.supplier_code).trim().toUpperCase() === String(sup.code).trim().toUpperCase()
  ) {
    return true;
  }
  if (
    link.supplier_name &&
    sup.name &&
    normalizeSupplierName(link.supplier_name) === normalizeSupplierName(sup.name)
  ) {
    return true;
  }
  return false;
}

/**
 * Extract legacy/embedded suppliers from a RawMaterial record.
 */
export function getMaterialSuppliers(
  rm: Partial<RawMaterial>,
  allSuppliers: Supplier[] = []
): RawMaterialSupplierRef[] {
  const result: RawMaterialSupplierRef[] = [];
  const seenKeys = new Set<string>();

  const pushRef = (ref: {
    id?: number | string;
    code?: string;
    name?: string;
    is_main?: boolean;
    latest_price?: number;
    last_purchase_date?: string;
  }) => {
    const cleanName = String(ref.name || "").trim();
    const cleanCode = String(ref.code || "").trim();
    if (!cleanName && !cleanCode && !ref.id) return;

    const matched = findMatchingSupplier(
      { id: ref.id, code: cleanCode, name: cleanName },
      allSuppliers
    );
    const resolvedId = matched ? matched.id : ref.id;
    const resolvedCode = matched ? matched.code : cleanCode;
    const resolvedName = matched ? matched.name : cleanName;

    const dedupeKey = resolvedCode
      ? `code:${resolvedCode.toUpperCase()}`
      : `name:${normalizeSupplierName(resolvedName)}`;
    if (!dedupeKey || dedupeKey === "name:" || seenKeys.has(dedupeKey)) return;

    seenKeys.add(dedupeKey);
    result.push({
      id: resolvedId,
      code: resolvedCode,
      name: resolvedName,
      is_main: ref.is_main,
      latest_price: ref.latest_price !== undefined ? Number(ref.latest_price) : undefined,
      last_purchase_date: ref.last_purchase_date
    });
  };

  if (Array.isArray(rm.suppliers_list) && rm.suppliers_list.length > 0) {
    for (const item of rm.suppliers_list) {
      pushRef(item);
    }
  }

  if (result.length === 0 && Array.isArray(rm.supplier_names) && rm.supplier_names.length > 0) {
    rm.supplier_names.forEach((name, idx) => {
      pushRef({
        id: rm.supplier_ids?.[idx],
        code: rm.supplier_codes?.[idx],
        name,
        is_main: idx === 0
      });
    });
  }

  if (
    result.length === 0 &&
    (rm.supplier_name || rm.supplier || rm.supplier_id || rm.supplier_code)
  ) {
    pushRef({
      id: rm.supplier_id,
      code: rm.supplier_code,
      name: rm.supplier_name || rm.supplier,
      is_main: true,
      latest_price: rm.unit_price
    });
  }

  // Ensure Main Supplier is marked and sorted first
  if (result.length > 0) {
    const hasMain = result.some((r) => r.is_main);
    if (!hasMain) {
      result[0].is_main = true;
    } else {
      result.sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
    }
  }

  return result;
}

/**
 * Resolve all linked suppliers for a RawMaterial by prioritizing the relational
 * `material_suppliers` collection, then falling back seamlessly to embedded fields.
 */
export function getResolvedMaterialSuppliers(
  rm: Partial<RawMaterial>,
  materialSuppliers: MaterialSupplier[] = [],
  allSuppliers: Supplier[] = []
): RawMaterialSupplierRef[] {
  const junctionRows = materialSuppliers.filter(
    (ms) => ms.status !== "inactive" && doesLinkBelongToMaterial(ms, rm)
  );

  if (junctionRows.length > 0) {
    const refs: RawMaterialSupplierRef[] = [];
    const seenKeys = new Set<string>();

    for (const row of junctionRows) {
      const matchedSup = findMatchingSupplier(
        { id: row.supplier_id, code: row.supplier_code, name: row.supplier_name },
        allSuppliers
      );
      const code = matchedSup?.code || row.supplier_code || "";
      const name = matchedSup?.name || row.supplier_name || "";
      const id = matchedSup?.id ?? row.supplier_id;

      const key = code ? `code:${code.toUpperCase()}` : `name:${normalizeSupplierName(name)}`;
      if (!key || key === "name:" || seenKeys.has(key)) continue;
      seenKeys.add(key);

      refs.push({
        id,
        code,
        name,
        is_main: Boolean(row.is_main),
        latest_price: Number(row.latest_price) || 0,
        last_purchase_date: row.last_purchase_date
      });
    }

    if (refs.length > 0) {
      if (!refs.some((r) => r.is_main)) {
        refs[0].is_main = true;
      } else {
        refs.sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
      }
      return refs;
    }
  }

  return getMaterialSuppliers(rm, allSuppliers);
}

/**
 * Retrieve all Raw Materials supplied by a specific Supplier ("Supplier 1 ราย จำหน่ายวัตถุดิบได้หลายรายการ").
 */
export function getSupplierSuppliedMaterials(
  supplier: Partial<Supplier>,
  rawMaterials: RawMaterial[],
  materialSuppliers: MaterialSupplier[] = [],
  allSuppliers: Supplier[] = []
): Array<{
  material: RawMaterial;
  linkRef: RawMaterialSupplierRef;
  junctionRow?: MaterialSupplier;
}> {
  const results: Array<{
    material: RawMaterial;
    linkRef: RawMaterialSupplierRef;
    junctionRow?: MaterialSupplier;
  }> = [];

  for (const rm of rawMaterials) {
    const refs = getResolvedMaterialSuppliers(rm, materialSuppliers, allSuppliers);
    const matchedRef = refs.find(
      (r) =>
        (supplier.id !== undefined && r.id !== undefined && String(r.id) === String(supplier.id)) ||
        (supplier.code && r.code && r.code.toUpperCase() === supplier.code.toUpperCase()) ||
        (supplier.name && normalizeSupplierName(r.name) === normalizeSupplierName(supplier.name))
    );
    if (matchedRef) {
      const junctionRow = materialSuppliers.find(
        (ms) => doesLinkBelongToMaterial(ms, rm) && doesLinkBelongToSupplier(ms, supplier)
      );
      results.push({ material: rm, linkRef: matchedRef, junctionRow });
    }
  }

  return results;
}

export interface ResolveSuppliersResult {
  resolvedSuppliers: RawMaterialSupplierRef[];
  existingMatched: Supplier[];
  newlyCreated: Supplier[];
  primarySupplier: RawMaterialSupplierRef | null;
}

export interface MaterialSupplierInputItem {
  id?: number | string;
  code?: string;
  name: string;
  is_main?: boolean;
  latest_price?: number;
  last_purchase_date?: string;
  notes?: string;
}

/**
 * Automatically checks each supplier entry against Firebase Firestore & local state:
 * - If existing supplier is found -> reuses its id, code, and company name immediately.
 * - If supplier is new -> auto-generates sequential SUP-XXXX code & numeric ID,
 *   saves company name into Firebase Firestore `suppliers` collection, and links it.
 */
export async function resolveAndAutoCreateSuppliers(
  supplierInputs: MaterialSupplierInputItem[],
  currentSuppliers: Supplier[]
): Promise<ResolveSuppliersResult> {
  let remoteSuppliers: Supplier[] = [];
  try {
    remoteSuppliers = (await firestoreGetCollection("suppliers")) as Supplier[];
  } catch {
    remoteSuppliers = [];
  }

  const localCached = getLocalTable("suppliers") as Supplier[];

  const mergedMap = new Map<string, Supplier>();
  const addKnown = (sup: Supplier) => {
    if (!sup || (!sup.name && !sup.code)) return;
    const key = sup.code
      ? `code:${String(sup.code).trim().toUpperCase()}`
      : `name:${normalizeSupplierName(sup.name)}`;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, sup);
    }
  };

  remoteSuppliers.forEach(addKnown);
  currentSuppliers.forEach(addKnown);
  localCached.forEach(addKnown);
  if (mergedMap.size === 0) {
    (OFFICIAL_SUPPLIERS as Supplier[]).forEach(addKnown);
  }

  const workingSuppliers: Supplier[] = Array.from(mergedMap.values());
  const resolvedSuppliers: RawMaterialSupplierRef[] = [];
  const existingMatched: Supplier[] = [];
  const newlyCreated: Supplier[] = [];
  const processedKeys = new Set<string>();

  for (const rawInput of supplierInputs) {
    const cleanName = String(rawInput.name || "").trim().replace(/\s+/g, " ");
    if (!cleanName) continue;

    const normKey = normalizeSupplierName(cleanName);
    if (processedKeys.has(normKey)) continue;
    processedKeys.add(normKey);

    const existing = findMatchingSupplier(
      { id: rawInput.id, code: rawInput.code, name: cleanName },
      workingSuppliers
    );

    if (existing) {
      resolvedSuppliers.push({
        id: existing.id,
        code: existing.code,
        name: existing.name,
        is_main: rawInput.is_main,
        latest_price:
          rawInput.latest_price !== undefined ? Number(rawInput.latest_price) : undefined,
        last_purchase_date: rawInput.last_purchase_date
      });
      if (!existingMatched.some((s) => s.code === existing.code)) {
        existingMatched.push(existing);
      }
    } else {
      const nextCode = generateNextSupplierCode(workingSuppliers);
      const nextId = generateNextSupplierNumericId(workingSuppliers);
      const now = new Date().toISOString();

      const newSupplier: Supplier = {
        id: nextId,
        code: nextCode,
        name: cleanName,
        company_name: cleanName,
        contact: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
        created_at: now
      };

      await clientSave("suppliers", newSupplier.id, newSupplier);

      workingSuppliers.push(newSupplier);
      newlyCreated.push(newSupplier);
      resolvedSuppliers.push({
        id: newSupplier.id,
        code: newSupplier.code,
        name: newSupplier.name,
        is_main: rawInput.is_main,
        latest_price:
          rawInput.latest_price !== undefined ? Number(rawInput.latest_price) : undefined,
        last_purchase_date: rawInput.last_purchase_date
      });
    }
  }

  // Normalize single Main Supplier (is_main = true)
  if (resolvedSuppliers.length > 0) {
    const mainIdx = resolvedSuppliers.findIndex((s) => s.is_main);
    const chosenIdx = mainIdx >= 0 ? mainIdx : 0;
    resolvedSuppliers.forEach((s, i) => {
      s.is_main = i === chosenIdx;
    });
    // Sort so Main Supplier is always at index 0
    resolvedSuppliers.sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
  }

  return {
    resolvedSuppliers,
    existingMatched,
    newlyCreated,
    primarySupplier: resolvedSuppliers[0] || null
  };
}

export interface SyncMaterialSuppliersResult extends ResolveSuppliersResult {
  savedLinks: MaterialSupplier[];
  historyCount: number;
}

/**
 * Synchronize the relational `material_suppliers` junction table and record
 * entries into `purchase_price_history` whenever a supplier's price is newly set or changed.
 */
export async function syncMaterialSuppliersAndHistory(params: {
  material: { id: number | string; code: string; name: string; unit?: string };
  supplierInputs: MaterialSupplierInputItem[];
  existingSuppliers: Supplier[];
  existingMaterialSuppliers?: MaterialSupplier[];
  sourceType?: PurchasePriceHistory["source_type"];
  refDoc?: string;
  recordedBy?: string;
}): Promise<SyncMaterialSuppliersResult> {
  const {
    material,
    supplierInputs,
    existingSuppliers,
    existingMaterialSuppliers = [],
    sourceType = "MATERIAL_FORM",
    refDoc = material.code,
    recordedBy = "ผู้ดูแลคลังสินค้า"
  } = params;

  // 1. Resolve / auto-create suppliers in `suppliers`
  const resolved = await resolveAndAutoCreateSuppliers(supplierInputs, existingSuppliers);

  // 2. Load current material_suppliers links for this material
  let remoteLinks: MaterialSupplier[] = [];
  try {
    remoteLinks = (await firestoreGetCollection("material_suppliers")) as MaterialSupplier[];
  } catch {
    remoteLinks = [];
  }
  const allKnownLinks = [...remoteLinks, ...existingMaterialSuppliers];
  const dedupedLinksMap = new Map<string, MaterialSupplier>();
  for (const l of allKnownLinks) {
    const key = String(l.code || l.id);
    if (!dedupedLinksMap.has(key)) dedupedLinksMap.set(key, l);
  }
  const currentForMaterial = Array.from(dedupedLinksMap.values()).filter((l) =>
    doesLinkBelongToMaterial(l, material)
  );

  // 3. Delete links that were removed from this material
  const keepSupKeys = new Set(
    resolved.resolvedSuppliers.map((s) =>
      s.code ? `code:${s.code.toUpperCase()}` : `name:${normalizeSupplierName(s.name)}`
    )
  );
  for (const oldLink of currentForMaterial) {
    const oldKey = oldLink.supplier_code
      ? `code:${String(oldLink.supplier_code).toUpperCase()}`
      : `name:${normalizeSupplierName(oldLink.supplier_name)}`;
    if (!keepSupKeys.has(oldKey)) {
      await clientDelete("material_suppliers", oldLink.code || oldLink.id);
    }
  }

  // 4. Upsert active links & log purchase_price_history when price is newly set or changed
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);
  const savedLinks: MaterialSupplier[] = [];
  let historyCount = 0;

  for (let i = 0; i < resolved.resolvedSuppliers.length; i++) {
    const sup = resolved.resolvedSuppliers[i];
    const existingLink = currentForMaterial.find((l) =>
      doesLinkBelongToSupplier(l, { id: sup.id as any, code: sup.code, name: sup.name })
    );

    const prevPrice = Number(existingLink?.latest_price) || 0;
    const inputPrice =
      sup.latest_price !== undefined ? Number(sup.latest_price) || 0 : prevPrice;
    const effectivePrice = inputPrice > 0 ? inputPrice : prevPrice;
    const linkCode =
      existingLink?.code ||
      makeMaterialSupplierCode(material.id || material.code, sup.code || sup.id || i + 1);

    const isPriceChanged =
      effectivePrice > 0 && (!existingLink || Math.abs(effectivePrice - prevPrice) > 0.0001);

    const linkPayload: MaterialSupplier = {
      id: existingLink?.id || linkCode,
      code: linkCode,
      material_id: material.id,
      material_code: material.code,
      material_name: material.name,
      supplier_id: sup.id ?? sup.code,
      supplier_code: sup.code,
      supplier_name: sup.name,
      is_main: Boolean(sup.is_main),
      latest_price: effectivePrice,
      currency: "THB",
      unit: material.unit || existingLink?.unit || "KG.",
      last_purchase_date: isPriceChanged
        ? todayDate
        : sup.last_purchase_date || existingLink?.last_purchase_date || todayDate,
      last_po_no: existingLink?.last_po_no || "",
      last_grn_no: existingLink?.last_grn_no || "",
      notes: existingLink?.notes || "",
      status: "active",
      created_at: existingLink?.created_at || nowIso,
      updated_at: nowIso
    };

    await clientSave("material_suppliers", linkPayload.id, linkPayload);
    savedLinks.push(linkPayload);

    // Sync normalized effective price back onto resolvedSuppliers summary
    sup.latest_price = effectivePrice;
    sup.last_purchase_date = linkPayload.last_purchase_date;

    if (isPriceChanged) {
      const historyCode = `PH-${Date.now()}-${i + 1}-${Math.floor(Math.random() * 1000)}`;
      const historyPayload: PurchasePriceHistory = {
        id: historyCode,
        code: historyCode,
        material_supplier_id: linkPayload.id,
        material_id: material.id,
        material_code: material.code,
        material_name: material.name,
        supplier_id: sup.id ?? sup.code,
        supplier_code: sup.code,
        supplier_name: sup.name,
        unit_price: effectivePrice,
        previous_price: prevPrice,
        unit: material.unit || "KG.",
        currency: "THB",
        qty: 0,
        purchase_date: todayDate,
        source_type: sourceType,
        ref_doc: refDoc,
        recorded_by: recordedBy,
        notes:
          existingLink && prevPrice > 0
            ? `ปรับราคาซื้อล่าสุดจาก ฿${prevPrice.toLocaleString()} เป็น ฿${effectivePrice.toLocaleString()}`
            : `กำหนดราคาซื้อเริ่มต้นสำหรับ ${sup.name}`,
        created_at: nowIso
      };
      await clientSave("purchase_price_history", historyPayload.id, historyPayload);
      historyCount++;
    }
  }

  return {
    ...resolved,
    savedLinks,
    historyCount
  };
}

/**
 * Record a purchase / GRN / stock import / manual price quote for a (Material, Supplier) pair:
 * - Auto-creates supplier if new
 * - Creates or updates the Material_Suppliers link with latest_price & last_purchase_date
 * - Appends a record to Purchase_Price_History
 * - Keeps parent RawMaterial's supplier summary & main unit_price synced
 */
export async function recordMaterialSupplierPurchase(params: {
  material: RawMaterial;
  supplierName: string;
  unitPrice: number;
  qty?: number;
  unit?: string;
  purchaseDate?: string;
  sourceType: PurchasePriceHistory["source_type"];
  refDoc?: string;
  recordedBy?: string;
  notes?: string;
  setAsMain?: boolean;
  existingSuppliers: Supplier[];
  existingMaterialSuppliers: MaterialSupplier[];
}): Promise<{
  link: MaterialSupplier | null;
  history: PurchasePriceHistory | null;
  newlyCreatedSupplier?: Supplier;
}> {
  const cleanSupplierName = String(params.supplierName || "").trim().replace(/\s+/g, " ");
  if (!cleanSupplierName) return { link: null, history: null };

  const price = Number(params.unitPrice) || 0;
  const purchaseDate = params.purchaseDate || new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  // 1. Ensure supplier exists in `suppliers`
  const resolvedSup = await resolveAndAutoCreateSuppliers(
    [{ name: cleanSupplierName }],
    params.existingSuppliers
  );
  const targetSup = resolvedSup.primarySupplier;
  if (!targetSup) return { link: null, history: null };

  // 2. Find existing Material_Suppliers links for this material
  let remoteLinks: MaterialSupplier[] = [];
  try {
    remoteLinks = (await firestoreGetCollection("material_suppliers")) as MaterialSupplier[];
  } catch {
    remoteLinks = [];
  }
  const combinedLinksMap = new Map<string, MaterialSupplier>();
  [...remoteLinks, ...params.existingMaterialSuppliers].forEach((l) => {
    combinedLinksMap.set(String(l.code || l.id), l);
  });
  const materialLinks = Array.from(combinedLinksMap.values()).filter((l) =>
    doesLinkBelongToMaterial(l, params.material)
  );

  const existingLink = materialLinks.find((l) =>
    doesLinkBelongToSupplier(l, {
      id: targetSup.id as any,
      code: targetSup.code,
      name: targetSup.name
    })
  );

  const prevPrice = Number(existingLink?.latest_price) || 0;
  const effectivePrice = price > 0 ? price : prevPrice;
  const hasAnyMain = materialLinks.some((l) => l.is_main);
  const shouldBeMain = params.setAsMain
    ? true
    : existingLink
      ? Boolean(existingLink.is_main)
      : !hasAnyMain;

  // If setting as main, clear is_main on sibling links
  if (params.setAsMain) {
    for (const sibling of materialLinks) {
      if (sibling.is_main && sibling.code !== existingLink?.code) {
        await clientSave("material_suppliers", sibling.id, {
          ...sibling,
          is_main: false,
          updated_at: nowIso
        });
      }
    }
  }

  const linkCode =
    existingLink?.code ||
    makeMaterialSupplierCode(
      params.material.id || params.material.code,
      targetSup.code || targetSup.id || cleanSupplierName
    );

  const updatedLink: MaterialSupplier = {
    id: existingLink?.id || linkCode,
    code: linkCode,
    material_id: params.material.id,
    material_code: params.material.code,
    material_name: params.material.name,
    supplier_id: targetSup.id ?? targetSup.code,
    supplier_code: targetSup.code,
    supplier_name: targetSup.name,
    is_main: shouldBeMain,
    latest_price: effectivePrice,
    currency: "THB",
    unit: params.unit || params.material.unit || existingLink?.unit || "KG.",
    last_purchase_date: purchaseDate,
    last_po_no:
      params.sourceType === "PURCHASE_ORDER"
        ? params.refDoc || existingLink?.last_po_no || ""
        : existingLink?.last_po_no || "",
    last_grn_no:
      params.sourceType === "GRN_RECEIVE"
        ? params.refDoc || existingLink?.last_grn_no || ""
        : existingLink?.last_grn_no || "",
    notes: params.notes || existingLink?.notes || "",
    status: "active",
    created_at: existingLink?.created_at || nowIso,
    updated_at: nowIso
  };

  await clientSave("material_suppliers", updatedLink.id, updatedLink);

  // 3. Record in purchase_price_history whenever price > 0
  let savedHistory: PurchasePriceHistory | null = null;
  if (effectivePrice > 0) {
    const historyCode = `PH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    savedHistory = {
      id: historyCode,
      code: historyCode,
      material_supplier_id: updatedLink.id,
      material_id: params.material.id,
      material_code: params.material.code,
      material_name: params.material.name,
      supplier_id: targetSup.id ?? targetSup.code,
      supplier_code: targetSup.code,
      supplier_name: targetSup.name,
      unit_price: effectivePrice,
      previous_price: prevPrice,
      unit: params.unit || params.material.unit || "KG.",
      currency: "THB",
      qty: Number(params.qty) || 0,
      purchase_date: purchaseDate,
      source_type: params.sourceType,
      ref_doc: params.refDoc || "",
      recorded_by: params.recordedBy || "ระบบอัตโนมัติ",
      notes:
        params.notes ||
        (prevPrice > 0 && prevPrice !== effectivePrice
          ? `ราคาซื้อจาก ฿${prevPrice.toLocaleString()} -> ฿${effectivePrice.toLocaleString()}`
          : `บันทึกราคาซื้อ ฿${effectivePrice.toLocaleString()}`),
      created_at: nowIso
    };
    await clientSave("purchase_price_history", savedHistory.id, savedHistory);
  }

  // 4. Sync parent RawMaterial summary fields
  const refreshedLinksMap = new Map<string, MaterialSupplier>();
  materialLinks.forEach((l) => refreshedLinksMap.set(l.code, l));
  refreshedLinksMap.set(updatedLink.code, updatedLink);
  const mergedLinks = Array.from(refreshedLinksMap.values()).sort(
    (a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)
  );
  const mainLink = mergedLinks.find((l) => l.is_main) || mergedLinks[0];
  const summaryRefs: RawMaterialSupplierRef[] = mergedLinks.map((l) => ({
    id: l.supplier_id,
    code: l.supplier_code,
    name: l.supplier_name,
    is_main: l.is_main,
    latest_price: l.latest_price,
    last_purchase_date: l.last_purchase_date
  }));

  await clientSave("raw_materials", params.material.id, {
    ...params.material,
    supplier_id:
      mainLink?.supplier_id !== undefined && !isNaN(Number(mainLink.supplier_id))
        ? Number(mainLink.supplier_id)
        : params.material.supplier_id,
    supplier_code: mainLink?.supplier_code || params.material.supplier_code || "",
    supplier_name: mainLink?.supplier_name || params.material.supplier_name || "",
    supplier: mainLink?.supplier_name || params.material.supplier || "",
    supplier_ids: summaryRefs.map((s) => s.id).filter((v) => v !== undefined && v !== null),
    supplier_codes: summaryRefs.map((s) => s.code),
    supplier_names: summaryRefs.map((s) => s.name),
    suppliers_list: summaryRefs,
    unit_price:
      mainLink && mainLink.latest_price > 0
        ? mainLink.latest_price
        : params.material.unit_price || 0
  });

  return {
    link: updatedLink,
    history: savedHistory,
    newlyCreatedSupplier: resolvedSup.newlyCreated[0]
  };
}

/**
 * Switch the Main Supplier (Supplier หลัก) for a RawMaterial across `material_suppliers` and `raw_materials`.
 */
export async function switchMainMaterialSupplier(params: {
  material: RawMaterial;
  targetSupplier: { id?: number | string; code?: string; name: string };
  existingSuppliers: Supplier[];
  existingMaterialSuppliers: MaterialSupplier[];
}): Promise<MaterialSupplier[]> {
  const { material, targetSupplier, existingSuppliers, existingMaterialSuppliers } = params;
  const currentRefs = getResolvedMaterialSuppliers(
    material,
    existingMaterialSuppliers,
    existingSuppliers
  );

  const updatedInputs: MaterialSupplierInputItem[] = currentRefs.map((ref) => {
    const isTarget =
      (targetSupplier.code &&
        ref.code &&
        ref.code.toUpperCase() === targetSupplier.code.toUpperCase()) ||
      normalizeSupplierName(ref.name) === normalizeSupplierName(targetSupplier.name);
    return {
      id: ref.id,
      code: ref.code,
      name: ref.name,
      is_main: isTarget,
      latest_price: ref.latest_price,
      last_purchase_date: ref.last_purchase_date
    };
  });

  const syncRes = await syncMaterialSuppliersAndHistory({
    material: {
      id: material.id,
      code: material.code,
      name: material.name,
      unit: material.unit
    },
    supplierInputs: updatedInputs,
    existingSuppliers,
    existingMaterialSuppliers
  });

  const mainRef = syncRes.primarySupplier;
  await clientSave("raw_materials", material.id, {
    ...material,
    supplier_id:
      mainRef?.id !== undefined && !isNaN(Number(mainRef.id))
        ? Number(mainRef.id)
        : undefined,
    supplier_code: mainRef?.code || "",
    supplier_name: mainRef?.name || "",
    supplier: mainRef?.name || "",
    supplier_ids: syncRes.resolvedSuppliers
      .map((s) => s.id)
      .filter((v) => v !== undefined && v !== null),
    supplier_codes: syncRes.resolvedSuppliers.map((s) => s.code),
    supplier_names: syncRes.resolvedSuppliers.map((s) => s.name),
    suppliers_list: syncRes.resolvedSuppliers,
    unit_price:
      mainRef?.latest_price && mainRef.latest_price > 0
        ? mainRef.latest_price
        : material.unit_price || 0
  });

  return syncRes.savedLinks;
}
