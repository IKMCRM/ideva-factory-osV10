import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import Boms from "./components/Boms";
import UserManual from "./components/UserManual";
import Warehouse from "./components/Warehouse";
import Projects from "./components/Projects";
import DatabaseModal from "./components/DatabaseModal";
import SettingsPage from "./components/SettingsPage";
import { 
  clientGetList, 
  clientSave, 
  clientDelete, 
  subscribeToRealtimeDatabase,
  testSupabaseConnection,
  getSupabaseConfig,
  processSyncQueue,
  getSyncQueue,
  broadcastSyncChannel,
  getLocalTable,
  invalidateCache
} from "./lib/supabaseClient";
import { testFirestoreConnection } from "./lib/firebaseClient";
import { 
  PrecheckPage, 
  ProductionPage, 
  PackingPage, 
  PurchasePage, 
  GrnsPage, 
  ReportPage 
} from "./components/OtherPages";
import IncomingQcPage from "./components/IncomingQcPage";
import AuditLogPage from "./components/AuditLogPage";
import TestCasesPage from "./components/TestCasesPage";
import { 
  Customer, 
  Product, 
  RawMaterial, 
  RawMaterialLot,
  QcInspection,
  AuditLog,
  BomRecipe, 
  ProductionOrder, 
  PackingOrder, 
  PurchaseOrder, 
  Grn, 
  Precheck, 
  InventoryPack, 
  Project, 
  Supplier, 
  SemiFinishedGood, 
  RequisitionSlip 
} from "./types";
import { 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

const THEMES = [
  {
    id: "blue",
    name: "ฟ้าพาสเทล",
    color: "#3b82f6",
    primary: "#3b82f6",
    hover: "#2563eb",
    light: "#f0f6ff",
    border: "#dbeafe",
    dark: "#1d4ed8",
    brand: "#60a5fa"
  },
  {
    id: "sage",
    name: "เขียวพาสเทล",
    color: "#10b981",
    primary: "#10b981",
    hover: "#059669",
    light: "#f0fdf4",
    border: "#d1fae5",
    dark: "#047857",
    brand: "#34d399"
  },
  {
    id: "rose",
    name: "ชมพูพาสเทล",
    color: "#f43f5e",
    primary: "#f43f5e",
    hover: "#e11d48",
    light: "#fff1f2",
    border: "#ffe4e6",
    dark: "#be123c",
    brand: "#fb7185"
  },
  {
    id: "lavender",
    name: "ม่วงพาสเทล",
    color: "#8b5cf6",
    primary: "#8b5cf6",
    hover: "#7c3aed",
    light: "#f5f3ff",
    border: "#ede9fe",
    dark: "#6d28d9",
    brand: "#a78bfa"
  },
  {
    id: "amber",
    name: "พีชพาสเทล",
    color: "#f59e0b",
    primary: "#f59e0b",
    hover: "#d97706",
    light: "#fffbeb",
    border: "#fef3c7",
    dark: "#b45309",
    brand: "#fbbf24"
  }
];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("factory_theme") || "blue");

  // Core database states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [rawMaterialLots, setRawMaterialLots] = useState<RawMaterialLot[]>([]);
  const [qcInspections, setQcInspections] = useState<QcInspection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [bomRecipes, setBomRecipes] = useState<BomRecipe[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [packingOrders, setPackingOrders] = useState<PackingOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<Grn[]>([]);
  const [prechecks, setPrechecks] = useState<Precheck[]>([]);
  const [inventoryPacks, setInventoryPacks] = useState<InventoryPack[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [semiGoods, setSemiGoods] = useState<SemiFinishedGood[]>([]);
  const [requisitions, setRequisitions] = useState<RequisitionSlip[]>([]);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // UI Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [dbStatus, setDbStatus] = useState<{ useMySQL: boolean; host: string; database: string; user: string } | null>(null);

  // Supabase Connection Health State
  const initialCfg = getSupabaseConfig();
  const [dbHealth, setDbHealth] = useState<{
    tested: boolean;
    online: boolean;
    errorType?: string;
    message?: string;
    details?: string;
    projectId: string;
    url: string;
  }>({
    tested: false,
    online: false,
    projectId: initialCfg.projectId,
    url: initialCfg.url
  });

  const [_isRetryingDb, setIsRetryingDb] = useState(false);
  const [_syncPendingCount, setSyncPendingCount] = useState<number>(() => getSyncQueue().length);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Actively test Supabase connection health with auto-healing fallback
  const verifyDbHealth = async () => {
    setIsRetryingDb(true);
    try {
      const cfg = getSupabaseConfig();
      let res = await testSupabaseConnection();



      const activeCfg = getSupabaseConfig();
      if (res.success) {
        setDbHealth({
          tested: true,
          online: true,
          projectId: "Firebase Firestore Enterprise",
          url: "Cloud Firestore (asia-south1)"
        });
        setDbStatus({
          useMySQL: false,
          host: "Firebase Firestore",
          database: "ai-studio-remix04nov26idev-12bdae26-5e2b-429e-b6be-7cd412e3f0b7",
          user: "client-direct"
        });
        return true;
      } else {
        // If Supabase is paused or offline, check Firebase Firestore as active primary cloud database
        const fbRes = await testFirestoreConnection();
        if (fbRes.success) {
          setDbHealth({
            tested: true,
            online: true,
            projectId: "gen-lang-client-0655565816 (Firebase Firestore)",
            url: "Cloud Firestore Enterprise (asia-south1)"
          });
          setDbStatus({
            useMySQL: false,
            host: "Firebase Firestore",
            database: "ai-studio-remix04nov26idev-12bdae26-5e2b-429e-b6be-7cd412e3f0b7",
            user: "client-direct"
          });
          return true;
        }

        setDbHealth({
          tested: true,
          online: false,
          errorType: res.errorType || "GENERIC",
          message: res.message,
          details: res.details,
          projectId: activeCfg.projectId,
          url: activeCfg.url
        });
        setDbStatus(null);
        return false;
      }
    } catch (e: any) {
      try {
        const fbRes = await testFirestoreConnection();
        if (fbRes.success) {
          setDbHealth({
            tested: true,
            online: true,
            projectId: "gen-lang-client-0655565816 (Firebase Firestore)",
            url: "Cloud Firestore Enterprise (asia-south1)"
          });
          setDbStatus({
            useMySQL: false,
            host: "Firebase Firestore",
            database: "ai-studio-remix04nov26idev-12bdae26-5e2b-429e-b6be-7cd412e3f0b7",
            user: "client-direct"
          });
          return true;
        }
      } catch {}

      const activeCfg = getSupabaseConfig();
      setDbHealth({
        tested: true,
        online: false,
        errorType: "FAILED_TO_FETCH",
        message: e?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูลได้",
        projectId: activeCfg.projectId,
        url: activeCfg.url
      });
      setDbStatus(null);
      return false;
    } finally {
      setIsRetryingDb(false);
    }
  };



  // Page-Targeted Table Dependencies: Fetch tables required by the active view
  const PAGE_TABLE_DEPENDENCIES: Record<string, string[]> = {
    dashboard: ["production_orders", "raw_materials", "packing_orders", "prechecks", "products", "purchase_orders", "suppliers"],
    projects: ["projects", "customers"],
    customer: ["customers", "production_orders", "bom_recipes"],
    bom: ["bom_recipes", "products", "raw_materials", "production_orders", "customers", "suppliers"],
    precheck: ["prechecks"],
    production: ["production_orders", "products", "customers"],
    packing: ["packing_orders", "production_orders"],
    purchase: ["purchase_orders", "raw_materials", "suppliers"],
    grn: ["grns", "raw_materials", "purchase_orders", "suppliers"],
    inventory: ["raw_materials", "inventory_pack", "production_orders", "bom_recipes", "products", "suppliers", "semi_finished_goods", "requisitions", "grns", "purchase_orders"],
    incoming_qc: ["qc_inspections", "raw_material_lots", "raw_materials", "grns", "suppliers"],
    audit_log: ["audit_logs"],
    test_cases: ["raw_materials", "raw_material_lots", "suppliers", "qc_inspections"],
    report: ["production_orders", "purchase_orders", "raw_materials", "products", "customers", "grns", "packing_orders", "prechecks", "suppliers"],
    manual: [],
    settings: ["projects", "customers", "bom_recipes", "prechecks", "production_orders", "packing_orders", "purchase_orders", "grns", "raw_materials", "inventory_pack", "suppliers", "products", "semi_finished_goods", "requisitions"]
  };

  // Helper to format BOM recipes
  const enrichBomRecipes = (rawRecipes: any[], prodsList: any[]) => {
    const enriched = rawRecipes.map((r: any) => {
      const matchedProd = prodsList.find((p: any) => p.id === r.product_id);
      return {
        ...r,
        materials: Array.isArray(r.materials) ? r.materials : [],
        product_code: r.product_code || (matchedProd ? matchedProd.code : "-"),
        product_name: r.product_name || (matchedProd ? matchedProd.name : "-"),
        product_type: r.product_type || (matchedProd ? matchedProd.type : "Finished Goods")
      };
    });
    enriched.sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0));
    return enriched;
  };

  // Helper to load state immediately from local storage cache (0ms instant render)
  const loadLocalImmediateState = () => {
    const custs = getLocalTable("customers");
    const prods = getLocalTable("products");
    const mats = getLocalTable("raw_materials");
    const sups = getLocalTable("suppliers");
    const lotsList = getLocalTable("raw_material_lots");
    const qcList = getLocalTable("qc_inspections");
    const logList = getLocalTable("audit_logs");
    const recipes = getLocalTable("bom_recipes");
    const semiList = getLocalTable("semi_finished_goods");
    const pos = getLocalTable("production_orders");
    const packOrders = getLocalTable("packing_orders");
    const pOrders = getLocalTable("purchase_orders");
    const grnLogs = getLocalTable("grns");
    const checks = getLocalTable("prechecks");
    const packs = getLocalTable("inventory_pack");
    const projs = getLocalTable("projects");
    const reqList = getLocalTable("requisitions");

    setCustomers(custs);
    setProducts(prods);
    setRawMaterials(mats);
    setRawMaterialLots(lotsList);
    setQcInspections(qcList);
    setAuditLogs(logList);
    setBomRecipes(enrichBomRecipes(recipes, prods));
    setProductionOrders(pos);
    setPackingOrders(packOrders);
    setPurchaseOrders(pOrders);
    setGrns(grnLogs);
    setPrechecks(checks);
    setInventoryPacks(packs);
    setProjects(projs);
    setSuppliers(sups);
    setSemiGoods(semiList);
    setRequisitions(reqList);
  };

  // Refresh a single table into state (Targeted, Low-Bandwidth, Ultra-Fast)
  const refreshTable = async (table: string, forceFresh = false): Promise<any[]> => {
    try {
      const data = await clientGetList(table, forceFresh);
      switch (table) {
        case "customers": setCustomers(data); break;
        case "products": setProducts(data); break;
        case "raw_materials": setRawMaterials(data); break;
        case "suppliers": setSuppliers(data); break;
        case "raw_material_lots": setRawMaterialLots(data); break;
        case "qc_inspections": setQcInspections(data); break;
        case "audit_logs": setAuditLogs(data); break;
        case "bom_recipes": setBomRecipes(enrichBomRecipes(data, products)); break;
        case "semi_finished_goods": setSemiGoods(data); break;
        case "production_orders": setProductionOrders(data); break;
        case "packing_orders": setPackingOrders(data); break;
        case "purchase_orders": setPurchaseOrders(data); break;
        case "grns": setGrns(data); break;
        case "prechecks": setPrechecks(data); break;
        case "inventory_pack": setInventoryPacks(data); break;
        case "projects": setProjects(data); break;
        case "requisitions": setRequisitions(data); break;
      }
      return data;
    } catch (err) {
      console.warn("Table refresh warning on", table, err);
      return [];
    }
  };

  // Load only tables required by the active view
  const loadPageData = async (page: string, forceFresh = false) => {
    const deps = PAGE_TABLE_DEPENDENCIES[page] || [];
    if (deps.length === 0) return;
    await Promise.allSettled(deps.map((t) => refreshTable(t, forceFresh)));
  };

  // Global loader: used on startup and on explicit refresh click
  const loadAllData = async () => {
    loadLocalImmediateState();
    const allTables = [
      "customers", "products", "raw_materials", "suppliers", "raw_material_lots",
      "qc_inspections", "audit_logs", "bom_recipes", "semi_finished_goods",
      "production_orders", "packing_orders", "purchase_orders", "grns", "prechecks",
      "inventory_pack", "projects", "requisitions"
    ];
    await Promise.allSettled(allTables.map((t) => refreshTable(t, true)));
  };

  useEffect(() => {
    localStorage.setItem("factory_theme", activeTheme);
    const config = THEMES.find(t => t.id === activeTheme) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--primary-color", config.primary);
    root.style.setProperty("--primary-hover", config.hover);
    root.style.setProperty("--primary-light", config.light);
    root.style.setProperty("--primary-border", config.border);
    root.style.setProperty("--primary-dark", config.dark);
    root.style.setProperty("--primary-brand", config.brand);
  }, [activeTheme]);

  // Load page data whenever activePage changes
  useEffect(() => {
    loadPageData(activePage, false);
  }, [activePage]);

  useEffect(() => {
    // ⚡ 1. Fetch all tables from direct Supabase database
    loadLocalImmediateState();
    loadAllData();

    // ⚡ 2. Realtime subscription (debounced, updates ONLY the changed table)
    let realtimeUnsub: (() => void) | null = null;
    const setupRealtime = () => {
      if (realtimeUnsub) {
        try { realtimeUnsub(); } catch {}
      }
      realtimeUnsub = subscribeToRealtimeDatabase((table, eventType) => {
        if (table && table !== "unknown") {
          refreshTable(table, true);
        } else {
          loadPageData(activePage, true);
        }
      });
    };

    setupRealtime();

    // ⚡ 3. Check health and process any pending sync queue on startup
    verifyDbHealth().then(async (isOnline) => {
      if (isOnline) {
        const synced = await processSyncQueue();
        if (synced > 0) {
          loadPageData(activePage, true);
        }
      }
      setSyncPendingCount(getSyncQueue().length);
    });

    // ⚡ Test Firebase Firestore database connection on boot
    testFirestoreConnection().then((fbRes) => {
      console.log("🔥 Firebase Firestore Status:", fbRes.message);
    });

    const handleConfigChange = () => {
      setupRealtime();
      verifyDbHealth().then((ok) => {
        if (ok) {
          processSyncQueue().then(() => loadPageData(activePage, true));
        }
      });
    };
    window.addEventListener("supabase_config_changed", handleConfigChange);

    // ⚡ 4. Broadcast Channel for Instant Multi-Tab Sync
    if (broadcastSyncChannel) {
      broadcastSyncChannel.onmessage = (event) => {
        if (event.data?.type === "DATA_MUTATED") {
          if (event.data.table) {
            refreshTable(event.data.table, true);
          } else {
            loadPageData(activePage, true);
          }
        }
      };
    }

    // ⚡ 5. Window Focus: only refresh active page if stale
    const handleFocus = () => {
      loadPageData(activePage, false);
      verifyDbHealth();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // ⚡ 6. Periodic Queue Sync (Only syncs pending queue items, does NOT spam 17 tables)
    const syncInterval = setInterval(async () => {
      const currentQueue = getSyncQueue();
      setSyncPendingCount(currentQueue.length);
      if (currentQueue.length > 0) {
        const synced = await processSyncQueue();
        if (synced > 0) {
          setSyncPendingCount(getSyncQueue().length);
          loadPageData(activePage, true);
        }
      }
    }, 15000);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      if (realtimeUnsub) {
        try { realtimeUnsub(); } catch {}
      }
      window.removeEventListener("supabase_config_changed", handleConfigChange);
    };
  }, []);

  // Post / Save endpoints helpers (Targeted update: only refreshes modified table)
  const handleSave = async (entity: string, payload: any, successMsg: string): Promise<void> => {
    try {
      await clientSave(entity, payload.id || 0, payload);
      showToast(successMsg, "success");
      await refreshTable(entity, true);
      
      // Cascade-refresh related tables
      if (entity === "purchase_orders" || entity === "production_orders") {
        refreshTable("raw_materials", true);
      } else if (entity === "grns") {
        refreshTable("raw_materials", true);
        refreshTable("raw_material_lots", true);
        refreshTable("qc_inspections", true);
      } else if (entity === "products") {
        refreshTable("bom_recipes", true);
      }

      setSyncPendingCount(getSyncQueue().length);
      processSyncQueue().then((synced) => {
        if (synced > 0) setSyncPendingCount(getSyncQueue().length);
      });
    } catch (e: any) {
      console.warn("Save completed with fallback:", e);
      showToast(successMsg, "success");
      await refreshTable(entity, true);
      setSyncPendingCount(getSyncQueue().length);
    }
  };

  const handleDelete = async (entity: string, id: number | string, successMsg: string) => {
    try {
      // 1. Optimistic React state update: remove immediately so user sees instant reaction
      const strId = String(id);
      if (entity === "projects") setProjects(prev => prev.filter(p => String(p.id) !== strId));
      else if (entity === "customers") setCustomers(prev => prev.filter(c => String(c.id) !== strId));
      else if (entity === "bom_recipes") setBomRecipes(prev => prev.filter(b => String(b.id) !== strId));
      else if (entity === "prechecks") setPrechecks(prev => prev.filter(p => String(p.id) !== strId));
      else if (entity === "production_orders") setProductionOrders(prev => prev.filter(po => String(po.id) !== strId));
      else if (entity === "packing_orders") setPackingOrders(prev => prev.filter(pk => String(pk.id) !== strId));
      else if (entity === "purchase_orders") setPurchaseOrders(prev => prev.filter(po => String(po.id) !== strId));
      else if (entity === "grns") setGrns(prev => prev.filter(g => String(g.id) !== strId));
      else if (entity === "raw_materials") setRawMaterials(prev => prev.filter(rm => String(rm.id) !== strId));
      else if (entity === "inventory_pack") setInventoryPacks(prev => prev.filter(ip => String(ip.id) !== strId));
      else if (entity === "products") setProducts(prev => prev.filter(p => String(p.id) !== strId));
      else if (entity === "suppliers") setSuppliers(prev => prev.filter(s => String(s.id) !== strId));
      else if (entity === "semi_finished_goods") setSemiGoods(prev => prev.filter(s => String(s.id) !== strId));
      else if (entity === "requisitions") setRequisitions(prev => prev.filter(r => String(r.id) !== strId));

      await clientDelete(entity, id);
      showToast(successMsg, "success");
      await refreshTable(entity, true);
      setSyncPendingCount(getSyncQueue().length);
      processSyncQueue().then(() => setSyncPendingCount(getSyncQueue().length));
    } catch (e: any) {
      console.warn("Delete completed with fallback:", e);
      showToast(successMsg, "success");
      await refreshTable(entity, true);
      setSyncPendingCount(getSyncQueue().length);
    }
  };

  // Triggered when GRN is created (adds chemical lot and sends to QC)
  const handleAddGrn = async (grn: any) => {
    await handleSave("grns", grn, "บันทึกใบ GRN และสร้างล็อตรับเข้าเพื่อส่งเข้าตรวจ QC สำเร็จ!");
    
    const matId = Number(grn.raw_material_id);
    const qty = parseFloat(grn.received_qty) || 0;
    const mat = rawMaterials.find(rm => rm.id === matId);
    
    if (mat) {
      const lotCode = `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(rawMaterialLots.length + 1).padStart(3, "0")}`;
      const supplierLotNo = grn.supplier_lot_no || grn.lot_number || `LOT-SUP-${Date.now().toString().slice(-4)}`;
      const unitPricePerKg = Number(grn.unit_price) || Number(mat.unit_price) || 1000;
      const totalVal = (qty * unitPricePerKg);

      // 1. Save RawMaterialLot
      const newLot: Partial<RawMaterialLot> = {
        lot_id_code: lotCode,
        material_id: mat.id,
        material_code: mat.code,
        material_name: mat.name,
        supplier_lot_no: supplierLotNo,
        grn_no: grn.code || `GRN-${Date.now().toString().slice(-6)}`,
        po_number: grn.po_number || "",
        supplier_name: grn.supplier_name || mat.supplier_name || mat.supplier || "IDEVA / De Roma",
        received_date: grn.receive_date || new Date().toISOString().slice(0, 10),
        expiry_date: grn.expiry_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10),
        received_qty: qty,
        remaining_qty: qty * (mat.unit?.toLowerCase().includes("kg") ? 1000 : 1), // Base unit G or ML
        purchase_unit: grn.unit || mat.default_unit || "KG.",
        unit_price_per_kg: unitPricePerKg,
        total_purchase_value: totalVal,
        currency: "THB",
        qc_status: "Pending QC",
        appearance: grn.appearance || "ของเหลว ใส ไม่มีตะกอน",
        coa_status: grn.coa_url ? "Attached" : "Missing COA",
        barcode: `BAR-${mat.code}-${supplierLotNo}`,
        stock_status: "Quarantine", // Until QC Passed!
        created_by: grn.receiver || "คลังสินค้า"
      };

      await clientSave("raw_material_lots", 0, newLot);

      // 2. Save QcInspection entry
      const newQc: Partial<QcInspection> = {
        grn_no: grn.code || `GRN-${Date.now().toString().slice(-6)}`,
        material_id: mat.id,
        material_code: mat.code,
        material_name: mat.name,
        lot_id: Date.now(),
        lot_code: lotCode,
        supplier_lot_no: supplierLotNo,
        supplier_name: grn.supplier_name || mat.supplier_name || mat.supplier || "IDEVA / De Roma",
        received_qty: qty,
        purchase_unit: grn.unit || mat.default_unit || "KG.",
        expiry_date: grn.expiry_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10),
        appearance: grn.appearance || "ของเหลว ใส ไม่มีตะกอน",
        coa_status: grn.coa_url ? "Attached" : "Missing COA",
        qc_status: "Pending QC",
        inspector: "สุรตน์",
        inspection_date: new Date().toISOString().slice(0, 10),
        approver: "ดน",
        remarks: "รอดำเนินการสุ่มตรวจวิเคราะห์ตามมาตรฐานโรงงาน"
      };

      await clientSave("qc_inspections", 0, newQc);

      // 3. Save Audit Log
      await clientSave("audit_logs", 0, {
        user: grn.receiver || "คลังสินค้า",
        timestamp: new Date().toISOString(),
        action: "GRN_RECEIVE_LOT",
        module: "GRN",
        material_code: mat.code,
        lot_number: supplierLotNo,
        new_value: `${qty} ${grn.unit || 'KG.'} @ ฿${unitPricePerKg}/KG`,
        reason: "รับเข้าวัตถุดิบล็อตใหม่และส่งรอตรวจ QC",
        ref_doc: grn.code
      });

      await loadAllData();
    }
  };

  // Render subpage views
  const renderActivePageContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard 
            productionOrders={productionOrders}
            rawMaterials={rawMaterials}
            packingOrders={packingOrders}
            prechecks={prechecks}
            setActivePage={setActivePage}
          />
        );
      case "projects":
        return (
          <Projects 
            projects={projects}
            customers={customers}
            onSaveProject={async (p) => handleSave("projects", p, "บันทึกข้อมูลโปรเจคเรียบร้อยแล้ว!")}
            onDeleteProject={async (id) => handleDelete("projects", id, "ลบข้อมูลโปรเจคเรียบร้อยแล้ว!")}
          />
        );
      case "customer":
        return (
          <Customers 
            customers={customers}
            onSaveCustomer={async (c) => handleSave("customers", c, "บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว!")}
            onDeleteCustomer={async (id) => handleDelete("customers", id, "ลบข้อมูลลูกค้าเรียบร้อยแล้ว!")}
            productionOrders={productionOrders}
            bomRecipes={bomRecipes}
          />
        );
      case "bom":
        return (
          <Boms 
            bomRecipes={bomRecipes}
            products={products}
            rawMaterials={rawMaterials}
            productionOrders={productionOrders}
            customers={customers}
            onSaveBom={async (b) => handleSave("bom_recipes", b, "บันทึกสูตรการผลิต (BOM) เรียบร้อยแล้ว!")}
            onDeleteBom={async (id) => handleDelete("bom_recipes", id, "ลบสูตรการผลิต (BOM) เรียบร้อยแล้ว!")}
            onSaveProduct={async (p) => handleSave("products", p, "เพิ่มรายการสินค้าสำเร็จ!")}
            onSaveProductionOrder={async (po) => handleSave("production_orders", po, "จองวัตถุดิบและบันทึกประวัติการสั่งผลิตสำเร็จ!")}
            onSaveRawMaterial={async (rm) => {
              await clientSave("raw_materials", rm.id, rm);
              await loadAllData();
            }}
            onSavePurchaseOrder={async (po) => handleSave("purchase_orders", po, "สร้างรายการขอสั่งซื้อเคมีภัณฑ์สำเร็จ!")}
            setActivePage={setActivePage}
          />
        );
      case "precheck":
        return (
          <PrecheckPage 
            prechecks={prechecks}
            onSavePrecheck={async (p) => handleSave("prechecks", p, "บันทึกผลตรวจสอบสารเคมีเรียบร้อยแล้ว!")}
            onDeletePrecheck={async (id) => handleDelete("prechecks", id, "ลบใบวิเคราะห์สารเคมีเรียบร้อยแล้ว!")}
          />
        );
      case "production":
        return (
          <ProductionPage 
            productionOrders={productionOrders}
            products={products}
            customers={customers}
            onSaveProduction={async (po) => handleSave("production_orders", po, "ออกใบสั่งประกอบการผลิตสำเร็จ!")}
            onDeleteProduction={async (id) => handleDelete("production_orders", id, "ยกเลิกใบสั่งผลิตสำเร็จ!")}
          />
        );
      case "packing":
        return (
          <PackingPage 
            packingOrders={packingOrders}
            productionOrders={productionOrders}
            onSavePacking={async (pk) => handleSave("packing_orders", pk, "บันทึกคิวไลน์บรรจุขวดสำเร็จ!")}
            onDeletePacking={async (id) => handleDelete("packing_orders", id, "ลบคิวไลน์บรรจุขวดเรียบร้อยแล้ว!")}
          />
        );
      case "purchase":
        return (
          <PurchasePage 
            purchaseOrders={purchaseOrders}
            rawMaterials={rawMaterials}
            suppliers={suppliers}
            onAddPurchase={async (po) => handleSave("purchase_orders", po, "ออกใบสั่งสั่งซื้อเคมีภัณฑ์เสร็จสิ้น!")}
            onSavePurchase={async (po) => handleSave("purchase_orders", po, "บันทึกแก้ไขใบสั่งซื้อเรียบร้อยแล้ว!")}
            onDeletePurchase={async (id) => handleDelete("purchase_orders", id, "ลบใบสั่งซื้อเคมีภัณฑ์เรียบร้อยแล้ว!")}
            onReceivePurchase={async (po) => {
              try {
                // 1. Mark PO as received
                const updatedPo = { ...po, status: "received" };
                await clientSave("purchase_orders", po.id, updatedPo);
                
                // 2. Add raw materials to stock
                if (po.items && po.items.length > 0) {
                  for (const item of po.items) {
                    const matId = item.raw_material_id;
                    const qty = item.quantity;
                    if (matId && qty) {
                      const mat = rawMaterials.find(rm => rm.id === matId);
                      if (mat) {
                        const updatedMat = { ...mat, stock_qty: parseFloat(String(mat.stock_qty || 0)) + parseFloat(String(qty)) };
                        await clientSave("raw_materials", mat.id, updatedMat);
                      }
                    }
                  }
                }

                // 3. Create a GRN record automatically
                if (po.items && po.items.length > 0) {
                  for (const item of po.items) {
                    const grnCode = `GRN-2026-${String(grns.length + 20).padStart(4, "0")}`;
                    const lotNum = `L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-AUTO`;
                    const expDate = new Date(Date.now() + 365*2*24*60*60*1000).toISOString().slice(0, 10);
                    
                    await clientSave("grns", 0, {
                      code: grnCode,
                      purchase_order_id: po.id,
                      raw_material_id: item.raw_material_id,
                      lot_number: lotNum,
                      expiry_date: expDate,
                      received_qty: item.quantity,
                      receiver: "ระบบอัตโนมัติ (รับเข้าคลัง)",
                      receive_date: new Date().toISOString().slice(0, 10)
                    });
                  }
                }
                
                showToast("รับเคมีภัณฑ์เข้าคลังและเพิ่มสต็อกเรียบร้อยแล้ว!", "success");
                await loadAllData();
              } catch (e: any) {
                showToast(e.message || "เกิดข้อผิดพลาดในการรับของเข้าสต็อก", "error");
              }
            }}
          />
        );
      case "grn":
        return (
          <GrnsPage 
            grns={grns}
            rawMaterials={rawMaterials}
            purchaseOrders={purchaseOrders}
            onAddGrn={handleAddGrn}
            onDeleteGrn={async (id) => handleDelete("grns", id, "ลบรายการรับเข้า (GRN) เรียบร้อยแล้ว!")}
          />
        );
      case "inventory":
        return (
          <Warehouse 
            rawMaterials={rawMaterials}
            inventoryPacks={inventoryPacks}
            productionOrders={productionOrders}
            bomRecipes={bomRecipes}
            products={products}
            suppliers={suppliers}
            semiGoods={semiGoods}
            requisitions={requisitions}
            grns={grns}
            purchaseOrders={purchaseOrders}
            setActivePage={setActivePage}
            onSavePurchaseOrder={async (payload) => {
              await handleSave("purchase_orders", payload, "สร้างใบสั่งซื้อเคมีภัณฑ์สำเร็จ!");
            }}
            onSaveRawMaterial={async (payload) => {
              await handleSave("raw_materials", payload, "บันทึกข้อมูลวัตถุดิบเคมีดิบเรียบร้อยแล้ว!");
            }}
            onDeleteRawMaterial={async (id) => {
              await handleDelete("raw_materials", id, "ลบข้อมูลวัตถุดิบเคมีดิบเรียบร้อยแล้ว!");
            }}
            onSaveInventoryPack={async (payload) => {
              await handleSave("inventory_pack", payload, "บันทึกข้อมูลบรรจุภัณฑ์สำเร็จ!");
            }}
            onDeleteInventoryPack={async (id) => {
              await handleDelete("inventory_pack", id, "ลบข้อมูลบรรจุภัณฑ์สำเร็จ!");
            }}
            onSaveSupplier={async (payload) => {
              await handleSave("suppliers", payload, "บันทึกข้อมูลผู้จำหน่ายสำเร็จ!");
            }}
            onDeleteSupplier={async (id) => {
              await handleDelete("suppliers", id, "ลบข้อมูลผู้จำหน่ายเรียบร้อยแล้ว!");
            }}
            onSaveProduct={async (payload) => {
              await handleSave("products", payload, "บันทึกข้อมูลสินค้าสำเร็จรูปสำเร็จ!");
            }}
            onDeleteProduct={async (id) => {
              await handleDelete("products", id, "ลบข้อมูลสินค้าสำเร็จรูปเรียบร้อยแล้ว!");
            }}
            onSaveSemiGood={async (payload) => {
              await handleSave("semi_finished_goods", payload, "บันทึกสินค้ากึ่งสำเร็จรูปสำเร็จ!");
            }}
            onDeleteSemiGood={async (id) => {
              await handleDelete("semi_finished_goods", id, "ลบสินค้ากึ่งสำเร็จรูปเรียบร้อยแล้ว!");
            }}
            onSaveRequisition={async (payload) => {
              await handleSave("requisitions", payload, "บันทึกใบเบิกพัสดุสำเร็จ!");
            }}
            onDeleteRequisition={async (id) => {
              await handleDelete("requisitions", id, "ลบใบเบิกพัสดุเรียบร้อยแล้ว!");
            }}
          />
        );
      case "incoming_qc":
        return (
          <IncomingQcPage 
            qcInspections={qcInspections}
            lots={rawMaterialLots}
            rawMaterials={rawMaterials}
            grns={grns}
            onSaveQcInspection={async (qc) => handleSave("qc_inspections", qc, "บันทึกผลการอนุมัติ QC เรียบร้อยแล้ว!")}
            onUpdateLotStatus={async (lotId, qcStatus, stockStatus) => {
              const targetLot = rawMaterialLots.find(l => l.id === lotId || String(l.id) === String(lotId));
              if (targetLot) {
                const updated = { ...targetLot, qc_status: qcStatus, stock_status: stockStatus };
                await clientSave("raw_material_lots", targetLot.id, updated);
                
                // If QC Passed, update master raw_materials stock
                if (qcStatus === "QC Passed") {
                  const mat = rawMaterials.find(rm => rm.id === targetLot.material_id);
                  if (mat) {
                    const addQtyG = targetLot.remaining_qty || (targetLot.received_qty * 1000);
                    const updatedMat = { ...mat, stock_qty: Number(mat.stock_qty || 0) + addQtyG };
                    await clientSave("raw_materials", mat.id, updatedMat);
                  }
                }
                await loadAllData();
              }
            }}
            onLogAudit={async (log) => {
              await clientSave("audit_logs", 0, log);
              await loadAllData();
            }}
          />
        );
      case "audit_log":
        return (
          <AuditLogPage 
            logs={auditLogs}
          />
        );
      case "test_cases":
        return (
          <TestCasesPage 
            rawMaterials={rawMaterials}
            lots={rawMaterialLots}
            suppliers={suppliers}
            qcInspections={qcInspections}
          />
        );
      case "report":
        return (
          <ReportPage 
            productionOrders={productionOrders}
            purchaseOrders={purchaseOrders}
            rawMaterials={rawMaterials}
            products={products}
            customers={customers}
            grns={grns}
            packingOrders={packingOrders}
            prechecks={prechecks}
          />
        );
      case "manual":
        return (
          <UserManual 
            onNavigate={(page) => setActivePage(page)}
          />
        );
      case "settings":
        return (
          <SettingsPage 
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            themes={THEMES}
            tableStats={{
              projects: projects.length,
              customers: customers.length,
              bomRecipes: bomRecipes.length,
              prechecks: prechecks.length,
              productionOrders: productionOrders.length,
              packingOrders: packingOrders.length,
              purchaseOrders: purchaseOrders.length,
              grns: grns.length,
              rawMaterials: rawMaterials.length,
              inventoryPacks: inventoryPacks.length,
              suppliers: suppliers.length,
              products: products.length,
              semiGoods: semiGoods.length,
              requisitions: requisitions.length
            }}
            onRefreshData={loadAllData}
            onOpenDbModal={() => setIsDbModalOpen(true)}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            ขออภัย ไม่พบหน้าที่คุณร้องขอในสารระบบ
          </div>
        );
    }
  };

  const lowStockCount = rawMaterials.filter(m => m.stock_qty <= m.min_stock).length;

  // Real-time active alerts & updates
  const notifications: {
    id: string;
    type: "warning" | "info" | "error" | "success";
    title: string;
    description: string;
    page: string;
  }[] = [];

  // 1. Low stock raw materials
  rawMaterials.forEach((m) => {
    if (m.stock_qty <= m.min_stock) {
      notifications.push({
        id: `stock-${m.id}`,
        type: "warning",
        title: `วัตถุดิบต่ำกว่าเกณฑ์: ${m.name}`,
        description: `คงเหลือ ${m.stock_qty} ${m.unit} (ขั้นต่ำ ${m.min_stock})`,
        page: "inventory"
      });
    }
  });

  // 2. Running production orders
  productionOrders.forEach((po) => {
    if (po.status === "running") {
      notifications.push({
        id: `prod-${po.id}`,
        type: "info",
        title: `กำลังดำเนินการผลิต: ${po.code}`,
        description: `สั่งผลิตจำนวน ${po.quantity} ${po.unit}`,
        page: "production"
      });
    }
  });

  // 3. Pending purchase orders
  purchaseOrders.forEach((po) => {
    if (po.status === "pending") {
      notifications.push({
        id: `purch-${po.id}`,
        type: "warning",
        title: `ใบสั่งซื้อรอรับของ: ${po.code}`,
        description: `ซัพพลายเออร์: ${po.supplier}`,
        page: "purchase"
      });
    }
  });

  // 4. Failed or pending prechecks
  prechecks.forEach((c) => {
    if (c.result === "fail") {
      notifications.push({
        id: `check-${c.id}`,
        type: "error",
        title: `ผลตรวจไม่ผ่าน: ${c.material}`,
        description: `ล็อต: ${c.lot} โดยผู้ตรวจ ${c.inspector}`,
        page: "precheck"
      });
    } else if (c.result === "pending") {
      notifications.push({
        id: `check-pend-${c.id}`,
        type: "info",
        title: `รอตรวจสารเคมี: ${c.material}`,
        description: `ล็อต: ${c.lot} ได้รับลงทะเบียนเรียบร้อย`,
        page: "precheck"
      });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onOpenDbModal={() => setIsDbModalOpen(true)}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Topbar 
          activePage={activePage} 
          setSidebarOpen={setSidebarOpen} 
          lowStockCount={lowStockCount}
          dbStatus={dbStatus}
          notifications={notifications}
          onNavigate={setActivePage}
          onOpenDbModal={() => setIsDbModalOpen(true)}
        />





        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActivePageContent()}
        </main>
      </div>

      {/* Database Direct Link & Health Check Modal (Protected by Passcode) */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        tableStats={{
          projects: projects.length,
          customers: customers.length,
          bomRecipes: bomRecipes.length,
          prechecks: prechecks.length,
          productionOrders: productionOrders.length,
          packingOrders: packingOrders.length,
          purchaseOrders: purchaseOrders.length,
          grns: grns.length,
          rawMaterials: rawMaterials.length,
          inventoryPacks: inventoryPacks.length,
          suppliers: suppliers.length,
          products: products.length,
          semiGoods: semiGoods.length,
          requisitions: requisitions.length
        }}
        onRefreshData={loadAllData}
      />

      {/* Toast Alert Popups */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`
            flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold
            ${toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
            }
          `}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
