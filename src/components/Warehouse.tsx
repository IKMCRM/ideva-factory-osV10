import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  MessageCircle,
  X,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  ArrowRight,
  ShoppingCart,
  Layers
} from "lucide-react";
import { 
  RawMaterial, 
  InventoryPack, 
  ProductionOrder, 
  Grn, 
  PurchaseOrder, 
  BomRecipe, 
  Product,
  Supplier,
  SemiFinishedGood,
  RequisitionSlip
} from "../types";

import { clientSave, getLocalTable } from "../lib/supabaseClient";
import { OFFICIAL_SUPPLIERS } from "../lib/firebaseClient";

// ============================================================================
// EXACT SOLID ICONS MATCHING USER SCREENSHOT WITH PASTEL ACCENT SUPPORT
// ============================================================================

// 1. Truck Icon (ผู้จำหน่ายวัตถุดิบ)
const TruckIcon = ({ className = "w-9 h-9 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M18 18.5a2.5 2.5 0 0 1-5 0h-2a2.5 2.5 0 0 1-5 0H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v2h2.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V17.5a1 1 0 0 1-1 1H18zm-2.5-7.5H19l-2.5-2.5V11zM8.5 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  </svg>
);

// 2. Solid Tag Icon (วัตถุดิบ, สินค้ากึ่งสำเร็จ, สินค้าสำเร็จ, วัสดุสิ้นเปลือง)
const TagIcon = ({ className = "w-8 h-8 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9A2 2 0 0 0 13 22a2 2 0 0 0 1.41-.59l7-7a2 2 0 0 0 0-2.83zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z" />
  </svg>
);

// 3. Stacked Discs / Database Icon (นำเข้าวัตถุดิบ, นำเข้าสินค้ากึ่งสำเร็จ, นำเข้าสินค้าสำเร็จ, นำเข้าวัสดุสิ้นเปลือง)
const DatabaseIcon = ({ className = "w-8 h-8 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 3.34 2 5s4.48 3 10 3 10-1.34 10-3-4.48-3-10-3z" />
    <path d="M22 8.5c0 1.66-4.48 3-10 3s-10-1.34-10-3V11c0 1.66 4.48 3 10 3s10-1.34 10-3V8.5z" />
    <path d="M22 14.5c0 1.66-4.48 3-10 3s-10-1.34-10-3V17c0 1.66 4.48 3 10 3s10-1.34 10-3v-2.5z" />
  </svg>
);

// 4. Calculator Icon (การคำนวนเบื้องต้น)
const CalculatorIcon = ({ className = "w-8 h-8 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 3H6v3h12V6zm-9 6H6v2h3v-2zm5 0h-3v2h3v-2zm4 0h-2v2h2v-2zm-9 4H6v2h3v-2zm5 0h-3v2h3v-2zm4 0h-2v2h2v-2z" clipRule="evenodd" />
  </svg>
);

// 5. Solid Rising Bar Chart Icon "lil" (รายงานวัตถุดิบ, รายงานสินค้ากึ่งสำเร็จ, รายงานสินค้าสำเร็จ, รายงานวัสดุสิ้นเปลือง, รายงานการนำออก)
const BarChartIcon = ({ className = "w-8 h-8 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 3a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h16a1 1 0 1 0 0-2H5V4a1 1 0 0 0-1-1z" />
    <rect x="7" y="11" width="3" height="7" rx="0.5" />
    <rect x="12" y="8" width="3" height="10" rx="0.5" />
    <rect x="17" y="5" width="3" height="13" rx="0.5" />
  </svg>
);

// 6. Solid Building Icon (รายงานคลังสินค้า)
const BuildingIcon = ({ className = "w-8 h-8 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4 2a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H4zm3 3h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-12h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-12h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" clipRule="evenodd" />
  </svg>
);

// 7. 3 Isometric Cubes Icon (ใบเบิก, วัตถุดิบที่ขาด)
const CubesIcon = ({ className = "w-9 h-9 fill-current" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    {/* Top Cube */}
    <path d="M12 2l-3.5 2 3.5 2 3.5-2L12 2z" opacity="0.9" />
    <path d="M8.5 4.3v4l3.5 2v-4l-3.5-2z" opacity="0.75" />
    <path d="M15.5 4.3l-3.5 2v4l3.5-2v-4z" />
    
    {/* Bottom Left Cube */}
    <path d="M7 10.5l-3.5 2 3.5 2 3.5-2-3.5-2z" opacity="0.9" />
    <path d="M3.5 12.8v4l3.5 2v-4l-3.5-2z" opacity="0.75" />
    <path d="M10.5 12.8l-3.5 2v4l3.5-2v-4z" />
    
    {/* Bottom Right Cube */}
    <path d="M17 10.5l-3.5 2 3.5 2 3.5-2-3.5-2z" opacity="0.9" />
    <path d="M13.5 12.8v4l3.5 2v-4l-3.5-2z" opacity="0.75" />
    <path d="M20.5 12.8l-3.5 2v4l3.5-2v-4z" />
  </svg>
);

// ============================================================================
// UNIT & TOTAL VALUE CALCULATION HELPERS
// ============================================================================

export const isGramUnit = (unit?: string): boolean => {
  if (!unit) return false;
  const u = unit.trim().toLowerCase();
  return u === "g" || u === "g." || u === "gram" || u === "grams" || u === "กรัม";
};

export const calculateMaterialTotalValue = (qty: number, unitPrice: number, unit?: string): number => {
  const safeQty = Number(qty) || 0;
  const safePrice = Number(unitPrice) || 0;
  if (isGramUnit(unit)) {
    return (safeQty / 1000) * safePrice;
  }
  return safeQty * safePrice;
};

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface WarehouseProps {
  rawMaterials: RawMaterial[];
  inventoryPacks: InventoryPack[];
  productionOrders: ProductionOrder[];
  bomRecipes?: BomRecipe[];
  products?: Product[];
  suppliers?: Supplier[];
  semiGoods?: SemiFinishedGood[];
  requisitions?: RequisitionSlip[];
  grns?: Grn[];
  purchaseOrders?: PurchaseOrder[];
  onSaveRawMaterial?: (rm: any) => Promise<void>;
  onDeleteRawMaterial?: (id: number | string) => Promise<void>;
  onSaveInventoryPack?: (ip: any) => Promise<void>;
  onDeleteInventoryPack?: (id: number | string) => Promise<void>;
  onSaveSupplier?: (sup: any) => Promise<void>;
  onDeleteSupplier?: (id: number | string) => Promise<void>;
  onSaveProduct?: (p: any) => Promise<void>;
  onDeleteProduct?: (id: number | string) => Promise<void>;
  onSaveSemiGood?: (sg: any) => Promise<void>;
  onDeleteSemiGood?: (id: number | string) => Promise<void>;
  onSaveRequisition?: (req: any) => Promise<void>;
  onDeleteRequisition?: (id: number | string) => Promise<void>;
  onSavePurchaseOrder?: (po: any) => Promise<void>;
  setActivePage?: (page: string) => void;
}

export default function Warehouse({
  rawMaterials,
  inventoryPacks,
  productionOrders,
  bomRecipes = [],
  products = [],
  suppliers = [],
  semiGoods = [],
  requisitions = [],
  grns = [],
  purchaseOrders = [],
  onSaveRawMaterial,
  onDeleteRawMaterial,
  onSaveInventoryPack,
  onDeleteInventoryPack,
  onSaveSupplier,
  onDeleteSupplier,
  onSaveProduct,
  onDeleteProduct,
  onSaveSemiGood,
  onDeleteSemiGood,
  onSaveRequisition,
  onDeleteRequisition,
  onSavePurchaseOrder,
  setActivePage
}: WarehouseProps) {
  // Navigation: null = Main Grid Portal (matches screenshot), or specific subview ID
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Search state within active views
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");

  // Raw Material Modal
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [editingRaw, setEditingRaw] = useState<RawMaterial | null>(null);
  const [rawForm, setRawForm] = useState({
    code: "",
    name: "",
    unit: "KG.",
    stock_qty: 0,
    min_stock: 20,
    unit_price: 0,
    supplier_name: "",
    image_url: "",
    status: "active"
  });

  const [warehouseToast, setWarehouseToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showWarehouseToast = (message: string, type: "success" | "error" = "success") => {
    setWarehouseToast({ message, type });
    setTimeout(() => setWarehouseToast(null), 3000);
  };

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number | string;
    name: string;
    type: "raw" | "semi" | "pack" | "fg" | "req" | "supplier";
  } | null>(null);

  // Packaging Modal state
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<InventoryPack | null>(null);
  const [packForm, setPackForm] = useState({
    code: "",
    name: "",
    type: "ขวด",
    qty: 0,
    unit: "ชิ้น",
    status: "active"
  });

  // Supplier Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    code: "",
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    status: "active"
  });

  // Supplier Search & Filter state
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  // Product / Finished Goods Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    code: "",
    name: "",
    type: "Finished Goods",
    version: "v1.0",
    status: "active"
  });

  // Semi-Finished Goods Modal state
  const [isSemiModalOpen, setIsSemiModalOpen] = useState(false);
  const [editingSemi, setEditingSemi] = useState<SemiFinishedGood | null>(null);
  const [semiForm, setSemiForm] = useState({
    code: "",
    name: "",
    batch_no: "",
    qty: 100,
    unit: "KG.",
    tank_no: "TANK-01",
    mfg_date: new Date().toISOString().slice(0, 10),
    status: "active"
  });

  // Requisition Modal state
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    code: "",
    date: new Date().toISOString().slice(0, 10),
    department: "ฝ่ายผสมเคมี",
    requester: "หัวหน้าฝ่ายผลิต",
    purpose: "เบิกสำหรับสายการผลิต",
    item_name: "Ethanol 96%",
    qty: 50,
    unit: "L."
  });

  // Import Forms
  const [importType, setImportType] = useState<"raw" | "semi" | "fg" | "consumable">("raw");
  const [importForm, setImportForm] = useState({
    item_id: 0,
    lot_number: "",
    qty: 0,
    unit_price: 0,
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    receiver: "เจ้าหน้าที่คลังสินค้า",
    notes: ""
  });

  // Lot History Modal State
  const [selectedLotMaterial, setSelectedLotMaterial] = useState<RawMaterial | null>(null);

  // Calculator State
  const [selectedBomId, setSelectedBomId] = useState<number | "">("");
  const [calcGrams, setCalcGrams] = useState<number>(30);
  const [calcPcs, setCalcPcs] = useState<number>(1000);
  const [calcLoss, setCalcLoss] = useState<number>(3); // % loss
  const [isExportingCalc, setIsExportingCalc] = useState(false);

  // Finished Goods list (Products from Supabase + completed production orders)
  const finishedGoods = products.map((prod) => {
    const matchingOrders = productionOrders.filter(
      (po) => po.product_id === prod.id && (po.status === "done" || po.status === "completed")
    );
    const completedQty = matchingOrders.reduce((sum, po) => sum + (Number(po.quantity) || 0), 0);
    return {
      id: prod.id,
      product_id: prod.id,
      code: prod.code,
      name: prod.name,
      type: prod.type,
      version: prod.version,
      status: prod.status,
      qty: completedQty,
      unit: "ชิ้น",
      lot: matchingOrders[0]?.code ? `LOT-${matchingOrders[0].code.split("-").pop()}` : "LOT-STOCK"
    };
  });

  // Display suppliers list directly from Firebase Firestore 100%
  const activeSuppliers: Supplier[] = (suppliers && suppliers.length > 0)
    ? suppliers
    : (getLocalTable("suppliers").length > 0 ? getLocalTable("suppliers") : OFFICIAL_SUPPLIERS);

  const supplierStatsMap = useMemo(() => {
    const map: Record<string, { count: number; totalVal: number }> = {};
    for (const rm of rawMaterials) {
      const sId = rm.supplier_id ? `id_${rm.supplier_id}` : null;
      const sName = (rm.supplier_name || rm.supplier || "").trim();
      const sCode = ((rm as any).supplier_code || "").trim();
      const val = calculateMaterialTotalValue(rm.stock_qty, rm.unit_price || 0, rm.unit);

      if (sId) {
        if (!map[sId]) map[sId] = { count: 0, totalVal: 0 };
        map[sId].count += 1;
        map[sId].totalVal += val;
      }
      if (sName) {
        if (!map[sName]) map[sName] = { count: 0, totalVal: 0 };
        map[sName].count += 1;
        map[sName].totalVal += val;
      }
      if (sCode) {
        if (!map[sCode]) map[sCode] = { count: 0, totalVal: 0 };
        map[sCode].count += 1;
        map[sCode].totalVal += val;
      }
    }
    return map;
  }, [rawMaterials]);

  const supplierList = Array.from(new Set(activeSuppliers.map(s => s.name)));

  // Shortage items
  const shortageMaterials = rawMaterials.filter((rm) => rm.stock_qty <= rm.min_stock);

  // 18 Cards exact match from screenshot with pastel themes and live counts
  const totalWarehouseItems = rawMaterials.length + semiGoods.length + finishedGoods.length + inventoryPacks.length;

  const menuCards = [
    // Row 1
    {
      id: "supplier",
      label: "ผู้จำหน่ายวัตถุดิบ",
      desc: "ซัพพลายเออร์เคมีภัณฑ์",
      icon: <TruckIcon className="w-8 h-8 text-sky-600 fill-current" />,
      count: activeSuppliers.length,
      unit: "ราย",
      pastel: {
        cardBg: "bg-gradient-to-b from-sky-50/90 to-blue-50/40 hover:from-sky-100 hover:to-blue-100/60",
        border: "border-sky-200/90 hover:border-sky-400",
        iconBox: "bg-white/95 text-sky-600 border border-sky-200/80 shadow-xs",
        badge: "bg-sky-100/90 text-sky-800 border-sky-200/90",
        accent: "text-sky-600"
      }
    },
    {
      id: "raw",
      label: "วัตถุดิบ",
      desc: "เคมีดิบในคลัง",
      icon: <TagIcon className="w-8 h-8 text-emerald-600 fill-current" />,
      count: rawMaterials.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-emerald-50/90 to-teal-50/40 hover:from-emerald-100 hover:to-teal-100/60",
        border: "border-emerald-200/90 hover:border-emerald-400",
        iconBox: "bg-white/95 text-emerald-600 border border-emerald-200/80 shadow-xs",
        badge: "bg-emerald-100/90 text-emerald-800 border-emerald-200/90",
        accent: "text-emerald-600"
      }
    },
    {
      id: "import_raw",
      label: "นำเข้าวัตถุดิบ",
      desc: "รับเคมีดิบเข้าสต็อก",
      icon: <DatabaseIcon className="w-8 h-8 text-teal-600 fill-current" />,
      count: rawMaterials.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-teal-50/90 to-cyan-50/40 hover:from-teal-100 hover:to-cyan-100/60",
        border: "border-teal-200/90 hover:border-teal-400",
        iconBox: "bg-white/95 text-teal-600 border border-teal-200/80 shadow-xs",
        badge: "bg-teal-100/90 text-teal-800 border-teal-200/90",
        accent: "text-teal-600"
      }
    },
    {
      id: "semi",
      label: "สินค้ากึ่งสำเร็จ",
      desc: "สารผสม Bulk WIP",
      icon: <TagIcon className="w-8 h-8 text-amber-600 fill-current" />,
      count: semiGoods.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-amber-50/90 to-orange-50/40 hover:from-amber-100 hover:to-orange-100/60",
        border: "border-amber-200/90 hover:border-amber-400",
        iconBox: "bg-white/95 text-amber-600 border border-amber-200/80 shadow-xs",
        badge: "bg-amber-100/90 text-amber-800 border-amber-200/90",
        accent: "text-amber-600"
      }
    },
    {
      id: "import_semi",
      label: "นำเข้าสินค้ากึ่งสำเร็จ",
      desc: "รับสารกึ่งสำเร็จเข้าถัง",
      icon: <DatabaseIcon className="w-8 h-8 text-orange-600 fill-current" />,
      count: semiGoods.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-orange-50/90 to-amber-50/40 hover:from-orange-100 hover:to-amber-100/60",
        border: "border-orange-200/90 hover:border-orange-400",
        iconBox: "bg-white/95 text-orange-600 border border-orange-200/80 shadow-xs",
        badge: "bg-orange-100/90 text-orange-800 border-orange-200/90",
        accent: "text-orange-600"
      }
    },

    // Row 2
    {
      id: "fg",
      label: "สินค้าสำเร็จ",
      desc: "สินค้าพร้อมส่งมอบ",
      icon: <TagIcon className="w-8 h-8 text-indigo-600 fill-current" />,
      count: finishedGoods.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-indigo-50/90 to-blue-50/40 hover:from-indigo-100 hover:to-blue-100/60",
        border: "border-indigo-200/90 hover:border-indigo-400",
        iconBox: "bg-white/95 text-indigo-600 border border-indigo-200/80 shadow-xs",
        badge: "bg-indigo-100/90 text-indigo-800 border-indigo-200/90",
        accent: "text-indigo-600"
      }
    },
    {
      id: "import_fg",
      label: "นำเข้าสินค้าสำเร็จ",
      desc: "รับสินค้าเสร็จเข้าคลัง",
      icon: <DatabaseIcon className="w-8 h-8 text-violet-600 fill-current" />,
      count: finishedGoods.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-violet-50/90 to-purple-50/40 hover:from-violet-100 hover:to-purple-100/60",
        border: "border-violet-200/90 hover:border-violet-400",
        iconBox: "bg-white/95 text-violet-600 border border-violet-200/80 shadow-xs",
        badge: "bg-violet-100/90 text-violet-800 border-violet-200/90",
        accent: "text-violet-600"
      }
    },
    {
      id: "consumable",
      label: "วัสดุสิ้นเปลือง",
      desc: "ขวด ฝา ฉลาก กล่อง",
      icon: <TagIcon className="w-8 h-8 text-rose-600 fill-current" />,
      count: inventoryPacks.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-rose-50/90 to-pink-50/40 hover:from-rose-100 hover:to-pink-100/60",
        border: "border-rose-200/90 hover:border-rose-400",
        iconBox: "bg-white/95 text-rose-600 border border-rose-200/80 shadow-xs",
        badge: "bg-rose-100/90 text-rose-800 border-rose-200/90",
        accent: "text-rose-600"
      }
    },
    {
      id: "import_consumable",
      label: "นำเข้าวัสดุสิ้นเปลือง",
      desc: "รับบรรจุภัณฑ์เข้าสต็อก",
      icon: <DatabaseIcon className="w-8 h-8 text-pink-600 fill-current" />,
      count: inventoryPacks.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-pink-50/90 to-rose-50/40 hover:from-pink-100 hover:to-rose-100/60",
        border: "border-pink-200/90 hover:border-pink-400",
        iconBox: "bg-white/95 text-pink-600 border border-pink-200/80 shadow-xs",
        badge: "bg-pink-100/90 text-pink-800 border-pink-200/90",
        accent: "text-pink-600"
      }
    },
    {
      id: "calc",
      label: "การคำนวนเบื้องต้น",
      desc: "คำนวณวัตถุดิบตาม BOM",
      icon: <CalculatorIcon className="w-8 h-8 text-purple-600 fill-current" />,
      count: bomRecipes.length,
      unit: "สูตร",
      pastel: {
        cardBg: "bg-gradient-to-b from-purple-50/90 to-indigo-50/40 hover:from-purple-100 hover:to-indigo-100/60",
        border: "border-purple-200/90 hover:border-purple-400",
        iconBox: "bg-white/95 text-purple-600 border border-purple-200/80 shadow-xs",
        badge: "bg-purple-100/90 text-purple-800 border-purple-200/90",
        accent: "text-purple-600"
      }
    },

    // Row 3
    {
      id: "report_raw",
      label: "รายงานวัตถุดิบ",
      desc: "สรุปสต็อกและมูลค่าเคมี",
      icon: <BarChartIcon className="w-8 h-8 text-lime-700 fill-current" />,
      count: rawMaterials.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-lime-50/90 to-emerald-50/40 hover:from-lime-100 hover:to-emerald-100/60",
        border: "border-lime-200/90 hover:border-lime-400",
        iconBox: "bg-white/95 text-lime-700 border border-lime-200/80 shadow-xs",
        badge: "bg-lime-100/90 text-lime-800 border-lime-200/90",
        accent: "text-lime-700"
      }
    },
    {
      id: "report_semi",
      label: "รายงานสินค้ากึ่งสำเร็จ",
      desc: "สรุปสารผสมในถังพัก",
      icon: <BarChartIcon className="w-8 h-8 text-yellow-700 fill-current" />,
      count: semiGoods.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-yellow-50/90 to-amber-50/40 hover:from-yellow-100 hover:to-amber-100/60",
        border: "border-yellow-200/90 hover:border-yellow-400",
        iconBox: "bg-white/95 text-yellow-700 border border-yellow-200/80 shadow-xs",
        badge: "bg-yellow-100/90 text-yellow-800 border-yellow-200/90",
        accent: "text-yellow-700"
      }
    },
    {
      id: "report_fg",
      label: "รายงานสินค้าสำเร็จ",
      desc: "สรุปสต็อกพร้อมจำหน่าย",
      icon: <BarChartIcon className="w-8 h-8 text-blue-600 fill-current" />,
      count: finishedGoods.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-blue-50/90 to-sky-50/40 hover:from-blue-100 hover:to-sky-100/60",
        border: "border-blue-200/90 hover:border-blue-400",
        iconBox: "bg-white/95 text-blue-600 border border-blue-200/80 shadow-xs",
        badge: "bg-blue-100/90 text-blue-800 border-blue-200/90",
        accent: "text-blue-600"
      }
    },
    {
      id: "report_consumable",
      label: "รายงานวัสดุสิ้นเปลือง",
      desc: "สรุปยอดคงเหลือบรรจุภัณฑ์",
      icon: <BarChartIcon className="w-8 h-8 text-fuchsia-600 fill-current" />,
      count: inventoryPacks.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-fuchsia-50/90 to-pink-50/40 hover:from-fuchsia-100 hover:to-pink-100/60",
        border: "border-fuchsia-200/90 hover:border-fuchsia-400",
        iconBox: "bg-white/95 text-fuchsia-600 border border-fuchsia-200/80 shadow-xs",
        badge: "bg-fuchsia-100/90 text-fuchsia-800 border-fuchsia-200/90",
        accent: "text-fuchsia-600"
      }
    },
    {
      id: "report_dispatch",
      label: "รายงานการนำออก",
      desc: "ประวัติการเบิกจ่ายสินค้า",
      icon: <BarChartIcon className="w-8 h-8 text-slate-700 fill-current" />,
      count: requisitions.length,
      unit: "รายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-slate-100/90 to-gray-50/50 hover:from-slate-200/90 hover:to-gray-100/70",
        border: "border-slate-300/90 hover:border-slate-400",
        iconBox: "bg-white/95 text-slate-700 border border-slate-300/80 shadow-xs",
        badge: "bg-slate-200/90 text-slate-800 border-slate-300/90",
        accent: "text-slate-700"
      }
    },

    // Row 4
    {
      id: "report_warehouse",
      label: "รายงานคลังสินค้า",
      desc: "ภาพรวมคลังสินค้าทั้งระบบ",
      icon: <BuildingIcon className="w-8 h-8 text-teal-700 fill-current" />,
      count: totalWarehouseItems,
      unit: "รวมรายการ",
      pastel: {
        cardBg: "bg-gradient-to-b from-teal-50/95 to-emerald-50/50 hover:from-teal-100 hover:to-emerald-100/70",
        border: "border-teal-300/90 hover:border-teal-500",
        iconBox: "bg-white/95 text-teal-700 border border-teal-300/80 shadow-xs",
        badge: "bg-teal-100/90 text-teal-900 border-teal-300/90",
        accent: "text-teal-700"
      }
    },
    {
      id: "requisition",
      label: "ใบเบิก",
      desc: "สลิปเบิกของสายการผลิต",
      icon: <CubesIcon className="w-9 h-9 text-indigo-600 fill-current" />,
      count: requisitions.length,
      unit: "ฉบับ",
      pastel: {
        cardBg: "bg-gradient-to-b from-indigo-50/90 to-violet-50/40 hover:from-indigo-100 hover:to-violet-100/60",
        border: "border-indigo-200/90 hover:border-indigo-400",
        iconBox: "bg-white/95 text-indigo-600 border border-indigo-200/80 shadow-xs",
        badge: "bg-indigo-100/90 text-indigo-800 border-indigo-200/90",
        accent: "text-indigo-600"
      }
    },
    {
      id: "shortage",
      label: "วัตถุดิบที่ขาด",
      desc: "ต่ำกว่าเกณฑ์ขั้นต่ำ",
      icon: <CubesIcon className={`w-9 h-9 ${shortageMaterials.length > 0 ? "text-red-600" : "text-rose-500"} fill-current`} />,
      count: shortageMaterials.length,
      unit: "รายการ",
      pastel: {
        cardBg: shortageMaterials.length > 0 ? "bg-gradient-to-b from-red-50/95 to-rose-50/60 hover:from-red-100 hover:to-rose-100/80" : "bg-gradient-to-b from-rose-50/90 to-pink-50/40 hover:from-rose-100 hover:to-pink-100/60",
        border: shortageMaterials.length > 0 ? "border-red-300 hover:border-red-500" : "border-rose-200/90 hover:border-rose-400",
        iconBox: "bg-white/95 text-red-600 border border-red-200/80 shadow-xs",
        badge: shortageMaterials.length > 0 ? "bg-red-200 text-red-950 border-red-300 font-extrabold" : "bg-rose-100/90 text-rose-800 border-rose-200/90",
        accent: "text-red-600"
      }
    }
  ];

  // Helper actions for Raw Material
  const openRawModal = (rm: RawMaterial | null = null) => {
    if (rm) {
      setEditingRaw(rm);
      setRawForm({
        code: rm.code,
        name: rm.name,
        unit: rm.unit || "KG.",
        stock_qty: rm.stock_qty,
        min_stock: rm.min_stock,
        unit_price: rm.unit_price || 0,
        supplier_name: rm.supplier_name || rm.supplier || "",
        image_url: rm.image_url || "",
        status: rm.status
      });
    } else {
      const existingCodes = new Set(rawMaterials.map((r) => (r.code || "").trim().toUpperCase()));
      let codeNum = rawMaterials.length + 1;
      let candidateCode = `RM-${String(codeNum).padStart(3, "0")}`;
      while (existingCodes.has(candidateCode.toUpperCase())) {
        codeNum++;
        candidateCode = `RM-${String(codeNum).padStart(3, "0")}`;
      }
      setEditingRaw(null);
      setRawForm({
        code: candidateCode,
        name: "",
        unit: "KG.",
        stock_qty: 0,
        min_stock: 20,
        unit_price: 0,
        supplier_name: "",
        image_url: "",
        status: "active"
      });
    }
    setIsRawModalOpen(true);
  };

  const handleSaveRaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawForm.code.trim() || !rawForm.name.trim()) return;
    if (onSaveRawMaterial) {
      await onSaveRawMaterial({
        id: editingRaw ? editingRaw.id : 0,
        code: rawForm.code.trim(),
        name: rawForm.name.trim(),
        unit: rawForm.unit,
        stock_qty: Number(rawForm.stock_qty) || 0,
        min_stock: Number(rawForm.min_stock) || 0,
        unit_price: Number(rawForm.unit_price) || 0,
        supplier_name: rawForm.supplier_name.trim(),
        image_url: rawForm.image_url.trim(),
        status: rawForm.status
      });
      showWarehouseToast("✓ บันทึกข้อมูลวัตถุดิบเรียบร้อยแล้ว!");
    }
    setIsRawModalOpen(false);
  };

  // Helper actions for Packaging
  const openPackModal = (ip: InventoryPack | null = null) => {
    if (ip) {
      setEditingPack(ip);
      setPackForm({
        code: ip.code,
        name: ip.name,
        type: ip.type,
        qty: ip.qty,
        unit: ip.unit,
        status: ip.status
      });
    } else {
      const nextNum = inventoryPacks.length > 0
        ? Math.max(...inventoryPacks.map(p => {
            const numStr = (p.code || "").replace("PK-", "");
            return parseInt(numStr, 10) || 0;
          })) + 1
        : 1;
      setEditingPack(null);
      setPackForm({
        code: `PK-${String(nextNum).padStart(3, "0")}`,
        name: "",
        type: "ขวด",
        qty: 0,
        unit: "ชิ้น",
        status: "active"
      });
    }
    setIsPackModalOpen(true);
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packForm.code.trim() || !packForm.name.trim()) return;
    if (onSaveInventoryPack) {
      await onSaveInventoryPack({
        id: editingPack ? editingPack.id : 0,
        code: packForm.code.trim(),
        name: packForm.name.trim(),
        type: packForm.type,
        qty: Number(packForm.qty) || 0,
        unit: packForm.unit,
        status: packForm.status
      });
      showWarehouseToast("✓ บันทึกข้อมูลบรรจุภัณฑ์เรียบร้อยแล้ว!");
    }
    setIsPackModalOpen(false);
  };

  // Helper actions for Suppliers
  const openSupplierModal = (sup: Supplier | null = null) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupplierForm({
        code: sup.code || "",
        name: sup.name,
        contact: sup.contact || "",
        phone: sup.phone || "",
        email: sup.email || "",
        address: sup.address || "",
        status: sup.status || "active"
      });
    } else {
      const nextNum = (suppliers?.length || 0) + 1;
      setEditingSupplier(null);
      setSupplierForm({
        code: `SUP-${String(nextNum).padStart(4, "0")}`,
        name: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        status: "active"
      });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    if (onSaveSupplier) {
      await onSaveSupplier({
        id: editingSupplier ? editingSupplier.id : 0,
        code: supplierForm.code.trim() || `SUP-${Date.now().toString().slice(-4)}`,
        name: supplierForm.name.trim(),
        contact: supplierForm.contact.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim(),
        address: supplierForm.address.trim(),
        status: supplierForm.status
      });
      showWarehouseToast("✓ บันทึกข้อมูลผู้จำหน่ายสำเร็จแล้ว!");
    }
    setIsSupplierModalOpen(false);
  };

  // Helper actions for Finished Goods Products
  const openProductModal = (prod: any | null = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        code: prod.code || "",
        name: prod.name || "",
        type: prod.type || "Finished Goods",
        version: prod.version || "v1.0",
        status: prod.status || "active"
      });
    } else {
      const nextNum = (products?.length || 0) + 1;
      setEditingProduct(null);
      setProductForm({
        code: `P-${String(nextNum).padStart(3, "0")}`,
        name: "",
        type: "Finished Goods",
        version: "v1.0",
        status: "active"
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;
    if (onSaveProduct) {
      await onSaveProduct({
        id: editingProduct ? editingProduct.id : 0,
        code: productForm.code.trim() || `P-${Date.now().toString().slice(-4)}`,
        name: productForm.name.trim(),
        type: productForm.type,
        version: productForm.version,
        status: productForm.status
      });
      showWarehouseToast("✓ บันทึกข้อมูลสินค้าสำเร็จรูปสำเร็จแล้ว!");
    }
    setIsProductModalOpen(false);
  };

  // Helper actions for Semi-Finished Goods
  const openSemiModal = (sg: SemiFinishedGood | null = null) => {
    if (sg) {
      setEditingSemi(sg);
      setSemiForm({
        code: sg.code,
        name: sg.name,
        batch_no: sg.batch_no,
        qty: sg.qty,
        unit: sg.unit,
        tank_no: sg.tank_no,
        mfg_date: sg.mfg_date,
        status: sg.status
      });
    } else {
      const nextNum = (semiGoods?.length || 0) + 1;
      setEditingSemi(null);
      setSemiForm({
        code: `SF-${String(nextNum).padStart(3, "0")}`,
        name: "",
        batch_no: `BATCH-${Date.now().toString().slice(-4)}`,
        qty: 100,
        unit: "KG.",
        tank_no: "TANK-01",
        mfg_date: new Date().toISOString().slice(0, 10),
        status: "active"
      });
    }
    setIsSemiModalOpen(true);
  };

  const handleSaveSemi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semiForm.name.trim()) return;
    if (onSaveSemiGood) {
      await onSaveSemiGood({
        id: editingSemi ? editingSemi.id : 0,
        code: semiForm.code.trim(),
        name: semiForm.name.trim(),
        batch_no: semiForm.batch_no.trim(),
        qty: Number(semiForm.qty) || 0,
        unit: semiForm.unit,
        tank_no: semiForm.tank_no,
        mfg_date: semiForm.mfg_date,
        status: semiForm.status
      });
      showWarehouseToast("✓ บันทึกข้อมูลสินค้ากึ่งสำเร็จรูปเรียบร้อยแล้ว!");
    }
    setIsSemiModalOpen(false);
  };

  // Helper actions for Requisitions
  const openReqModal = () => {
    const nextNum = (requisitions?.length || 0) + 1;
    setReqForm({
      code: `REQ-2026-${String(nextNum).padStart(3, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      department: "ฝ่ายผสมเคมี",
      requester: "หัวหน้าฝ่ายผลิต",
      purpose: "เบิกสำหรับสายการผลิต",
      item_name: rawMaterials[0]?.name || "Ethanol 96%",
      qty: 50,
      unit: rawMaterials[0]?.unit || "L."
    });
    setIsReqModalOpen(true);
  };

  const handleSaveReq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.item_name.trim()) return;
    if (onSaveRequisition) {
      await onSaveRequisition({
        id: 0,
        code: reqForm.code.trim(),
        date: reqForm.date,
        department: reqForm.department.trim(),
        requester: reqForm.requester.trim(),
        purpose: reqForm.purpose.trim(),
        status: "approved",
        items: [{ item_name: reqForm.item_name.trim(), qty: Number(reqForm.qty) || 1, unit: reqForm.unit }]
      });
      showWarehouseToast(`✓ บันทึกออกใบเบิก ${reqForm.code} สำเร็จแล้ว!`);
    }
    setIsReqModalOpen(false);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.qty || importForm.qty <= 0) {
      showWarehouseToast("กรุณากรอกจำนวนที่รับเข้าให้ถูกต้อง", "error");
      return;
    }

    if (importType === "raw") {
      const target = rawMaterials.find((rm) => rm.id === Number(importForm.item_id));
      if (!target || !onSaveRawMaterial) return;

      const lotNum = importForm.lot_number.trim() || `LOT-${Date.now().toString().slice(-6)}`;
      const lotUnitPrice = Number(importForm.unit_price) > 0 ? Number(importForm.unit_price) : Number(target.unit_price || 0);

      // 1. Record Goods Receive Note (GRN) lot receiving record
      try {
        await clientSave("grns", 0, {
          code: `GRN-2026-${String((grns?.length || 0) + 1).padStart(4, "0")}`,
          raw_material_id: target.id,
          supplier_name: target.supplier_name || target.supplier || "",
          lot_number: lotNum,
          expiry_date: importForm.expiry_date,
          received_qty: Number(importForm.qty),
          unit_price: lotUnitPrice,
          unit: target.unit || "KG.",
          receiver: importForm.receiver || "เจ้าหน้าที่คลังสินค้า",
          receive_date: new Date().toISOString().slice(0, 10),
          status: "completed",
          notes: importForm.notes || ""
        });
      } catch (e) {
        console.warn("Could not save GRN lot record:", e);
      }

      // 2. Update Raw Material total stock and lot price
      await onSaveRawMaterial({
        id: target.id,
        code: target.code,
        name: target.name,
        unit: target.unit,
        stock_qty: Number(target.stock_qty || 0) + Number(importForm.qty),
        min_stock: target.min_stock,
        unit_price: lotUnitPrice,
        supplier_name: target.supplier_name || target.supplier || "",
        status: target.status,
        image_url: target.image_url || ""
      });
      showWarehouseToast(`✓ รับเข้าวัตถุดิบ ${target.name} ล็อต ${lotNum} จำนวน ${importForm.qty} ${target.unit} (ราคา ฿${lotUnitPrice}/หน่วย) สำเร็จแล้ว!`);
      setActiveSection("raw");
    } else if (importType === "consumable") {
      const target = inventoryPacks.find((ip) => ip.id === Number(importForm.item_id));
      if (!target || !onSaveInventoryPack) return;
      await onSaveInventoryPack({
        id: target.id,
        code: target.code,
        name: target.name,
        type: target.type,
        qty: Number(target.qty || 0) + Number(importForm.qty),
        unit: target.unit,
        status: target.status
      });
      showWarehouseToast(`✓ รับเข้าวัสดุสิ้นเปลือง ${target.name} จำนวน ${importForm.qty} ${target.unit} สำเร็จแล้ว!`);
      setActiveSection("consumable");
    } else if (importType === "semi") {
      if (onSaveSemiGood) {
        await onSaveSemiGood({
          id: 0,
          code: `SF-${String((semiGoods?.length || 0) + 1).padStart(3, "0")}`,
          name: importForm.notes || "สารผสมกึ่งสำเร็จรูปล็อตใหม่",
          batch_no: importForm.lot_number || `BATCH-${Date.now().toString().slice(-4)}`,
          qty: Number(importForm.qty),
          unit: "KG.",
          tank_no: "TANK-HOLD",
          mfg_date: new Date().toISOString().slice(0, 10),
          status: "พักรอตรวจ QC"
        });
      }
      showWarehouseToast(`✓ บันทึกรับเข้าสินค้ากึ่งสำเร็จรูป ${importForm.qty} KG. เรียบร้อยแล้ว!`);
      setActiveSection("semi");
    } else if (importType === "fg") {
      if (onSaveProduct) {
        await onSaveProduct({
          id: 0,
          code: `P-FG-${Date.now().toString().slice(-4)}`,
          name: importForm.notes || "สินค้าสำเร็จรูปรับเข้าใหม่",
          type: "Finished Goods",
          version: importForm.lot_number || `LOT-${Date.now().toString().slice(-4)}`,
          status: "active"
        });
      }
      showWarehouseToast(`✓ บันทึกรับเข้าสินค้าสำเร็จรูปเรียบร้อยแล้ว!`);
      setActiveSection("fg");
    }
  };

  // Export to CSV helper
  const exportToCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...data.map((row) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[85vh] bg-[#eaedf1] p-3 sm:p-5 md:p-6 rounded-2xl flex flex-col space-y-4 relative">
      {/* Top Header matching screenshot */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm sm:text-base font-bold text-[#4a5568] tracking-tight">
          การจัดการคลังสินค้า
          {activeSection && (
            <span className="text-blue-600 font-medium text-xs sm:text-sm ml-2">
              / {menuCards.find((c) => c.id === activeSection)?.label}
            </span>
          )}
        </h1>

        {activeSection && (
          <button
            onClick={() => setActiveSection(null)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับเมนูหลัก
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN GRID PORTAL - EXACT 18 CARDS MATCHING SCREENSHOT                  */}
      {/* ========================================================================= */}
      {!activeSection && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-4.5">
          {menuCards.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id.startsWith("import_")) {
                  const type = item.id.replace("import_", "") as "raw" | "semi" | "fg" | "consumable";
                  setImportType(type);
                  setActiveSection("import");
                } else {
                  setActiveSection(item.id);
                }
              }}
              className={`rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between text-center transition-all duration-200 border shadow-xs hover:shadow-md hover:-translate-y-1 group cursor-pointer min-h-[160px] sm:min-h-[175px] relative overflow-hidden ${item.pastel.cardBg} ${item.pastel.border}`}
            >
              {/* Top Count Badge & Indicator */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider">
                  #{item.id.replace("report_", "rep_").slice(0, 8)}
                </span>
                
                {/* Count Pill Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs transition-transform group-hover:scale-105 ${item.pastel.badge}`}
                >
                  <span className="text-[13px] sm:text-sm font-extrabold">{item.count.toLocaleString()}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium opacity-90">{item.unit}</span>
                </span>
              </div>

              {/* Pastel Icon Box */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 mb-2.5 ${item.pastel.iconBox}`}
              >
                {item.icon}
              </div>

              {/* Label & Description */}
              <div className="w-full">
                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-slate-900 block leading-tight">
                  {item.label}
                </span>
                <span className={`text-[11px] font-medium block mt-1 truncate ${item.pastel.accent}`}>
                  {item.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-VIEW: ผู้จำหน่ายวัตถุดิบ                                             */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. SUB-VIEW: ผู้จำหน่ายวัตถุดิบ (Suppliers)                                */}
      {/* ========================================================================= */}
      {activeSection === "supplier" && (
        <div className="bg-white rounded-2xl border border-slate-250 shadow-md overflow-hidden space-y-0 animate-in fade-in duration-150">
          {/* Google Sheets Inspired Toolbar Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
                <TruckIcon className="w-7 h-7 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                    รายชื่อผู้จำหน่ายวัตถุดิบเคมีภัณฑ์ (Suppliers Sheet)
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {activeSuppliers.length} รายการ
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ตารางฐานข้อมูลคู่ค้าและผู้จัดจำหน่ายเคมีภัณฑ์ดิบ (100% Realtime Database View)
                </p>
              </div>
            </div>

            {/* Quick Actions & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้จำหน่าย, รหัส, เบอร์โทร..."
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const dataToExport = activeSuppliers.map((s) => {
                    const stats = supplierStatsMap[`id_${s.id}`] || 
                      supplierStatsMap[s.name] || 
                      supplierStatsMap[(s.name || "").trim()] || 
                      supplierStatsMap[s.code] || 
                      supplierStatsMap[(s.code || "").trim()] || 
                      { count: 0, totalVal: 0 };
                    return [s.code, s.name, s.contact || "-", s.phone || "-", s.email || "-", s.address || "-", stats.count, stats.totalVal];
                  });
                  exportToCSV(
                    dataToExport,
                    ["รหัส", "ชื่อบริษัท/ซัพพลายเออร์", "ผู้ติดต่อ", "เบอร์โทร", "อีเมล", "ที่อยู่", "จำนวนรายการเคมี", "มูลค่าในสต็อก"],
                    "Suppliers_Sheet"
                  );
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span>ส่งออก Sheet (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => openSupplierModal()}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มผู้จำหน่ายใหม่</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Column Letter Header Bar */}
          <div className="bg-slate-200 border-b border-slate-300 px-3 py-1 flex items-center text-[10px] font-mono text-slate-600 font-bold select-none overflow-x-auto">
            <span className="w-10 text-center border-r border-slate-300 shrink-0">#</span>
            <span className="w-24 text-center border-r border-slate-300 shrink-0">A (รหัส)</span>
            <span className="flex-1 min-w-[180px] px-2 border-r border-slate-300">B (ชื่อบริษัท / ซัพพลายเออร์)</span>
            <span className="w-28 px-2 border-r border-slate-300 shrink-0">C (ผู้ติดต่อ)</span>
            <span className="w-28 px-2 border-r border-slate-300 shrink-0">D (เบอร์โทร)</span>
            <span className="w-36 px-2 border-r border-slate-300 shrink-0">E (อีเมล)</span>
            <span className="w-48 px-2 border-r border-slate-300 shrink-0">F (ที่อยู่จัดส่ง/ติดต่อ)</span>
            <span className="w-28 text-center border-r border-slate-300 shrink-0">G (เคมีดิบ)</span>
            <span className="w-32 text-right px-2 border-r border-slate-300 shrink-0">H (มูลค่าสต็อก)</span>
            <span className="w-32 text-center shrink-0">I (ดำเนินการ)</span>
          </div>

          {/* Google Sheets Styled Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-700 border-b border-slate-300 uppercase tracking-wider">
                  <th className="p-2 border border-slate-300 text-center w-10 bg-slate-200/80 font-mono">ลำดับ</th>
                  <th className="p-2 border border-slate-300 w-24">รหัสผู้จำหน่าย</th>
                  <th className="p-2 border border-slate-300 min-w-[180px]">ชื่อบริษัท / ร้านค้าซัพพลายเออร์</th>
                  <th className="p-2 border border-slate-300 w-28">ผู้ติดต่อ</th>
                  <th className="p-2 border border-slate-300 w-28">เบอร์โทรศัพท์</th>
                  <th className="p-2 border border-slate-300 w-36">อีเมล</th>
                  <th className="p-2 border border-slate-300 w-48">ที่อยู่จัดส่ง / ติดต่อ</th>
                  <th className="p-2 border border-slate-300 text-center w-28">รายการเคมีดิบ</th>
                  <th className="p-2 border border-slate-300 text-right w-32">มูลค่าในสต็อก</th>
                  <th className="p-2 border border-slate-300 text-center w-36 bg-slate-200/50">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {activeSuppliers
                  .filter((sup) => {
                    if (!supplierSearchTerm) return true;
                    const query = supplierSearchTerm.toLowerCase();
                    return (
                      (sup.code && sup.code.toLowerCase().includes(query)) ||
                      (sup.name && sup.name.toLowerCase().includes(query)) ||
                      (sup.contact && sup.contact.toLowerCase().includes(query)) ||
                      (sup.phone && sup.phone.toLowerCase().includes(query)) ||
                      (sup.email && sup.email.toLowerCase().includes(query))
                    );
                  })
                  .map((sup, idx) => {
                    const stats = supplierStatsMap[`id_${sup.id}`] || 
                      supplierStatsMap[sup.name] || 
                      supplierStatsMap[(sup.name || "").trim()] || 
                      supplierStatsMap[sup.code] || 
                      supplierStatsMap[(sup.code || "").trim()] || 
                      { count: 0, totalVal: 0 };
                    const itemsBySupCount = stats.count;
                    const totalSupVal = stats.totalVal;

                    return (
                      <tr 
                        key={sup.id} 
                        className="odd:bg-white even:bg-[#f4f9f5] hover:bg-emerald-50/70 transition-colors group"
                      >
                        {/* Index */}
                        <td className="p-2 border border-slate-200 text-center font-mono text-slate-400 bg-slate-50/80 font-bold">
                          {idx + 1}
                        </td>

                        {/* Code */}
                        <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700">
                          {sup.code || `SUP-${String(idx + 1).padStart(4, "0")}`}
                        </td>

                        {/* Name */}
                        <td className="p-2 border border-slate-200">
                          <div className="font-bold text-slate-800">{sup.name}</div>
                          {sup.status === "suspended" && (
                            <span className="inline-block text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold mt-0.5">
                              ระงับชั่วคราว
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="p-2 border border-slate-200 text-slate-700 font-semibold">
                          {sup.contact || "-"}
                        </td>

                        {/* Phone */}
                        <td className="p-2 border border-slate-200 font-mono font-semibold text-slate-700">
                          {sup.phone ? (
                            <a href={`tel:${sup.phone}`} className="hover:text-blue-600 hover:underline">
                              {sup.phone}
                            </a>
                          ) : "-"}
                        </td>

                        {/* Email */}
                        <td className="p-2 border border-slate-200 font-mono text-slate-600 text-[11px] truncate max-w-[150px]" title={sup.email || ""}>
                          {sup.email || "-"}
                        </td>

                        {/* Address */}
                        <td className="p-2 border border-slate-200 text-slate-500 text-[11px] truncate max-w-[200px]" title={sup.address || ""}>
                          {sup.address || "-"}
                        </td>

                        {/* Chemical Count */}
                        <td className="p-2 border border-slate-200 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSupplierFilter(sup.name);
                              setActiveSection("raw");
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                          >
                            <span>{itemsBySupCount} รายการ</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>

                        {/* Inventory Value */}
                        <td className="p-2 border border-slate-200 text-right font-mono font-bold text-emerald-700 text-xs">
                          ฿{totalSupVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Action Column Buttons (ปุ่มดำเนินการ) */}
                        <td className="p-2 border border-slate-200 text-center bg-slate-50/50">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSupplierFilter(sup.name);
                                setActiveSection("raw");
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
                              title="ดูรายการเคมีดิบจากผู้จำหน่ายนี้"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openSupplierModal(sup)}
                              className="p-1 text-amber-600 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
                              title="แก้ไขข้อมูลผู้จำหน่าย"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ id: sup.id, name: sup.name, type: "supplier" })}
                              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                              title="ลบข้อมูลผู้จำหน่าย"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {activeSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 bg-slate-50">
                      ไม่พบข้อมูลผู้จำหน่ายวัตถุดิบเคมีในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Action Bar (ส่วนท้ายเพิ่มปุ่มดำเนินการ) */}
          <div className="bg-slate-100 border-t border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Left summary stats */}
            <div className="flex items-center gap-4 text-slate-600 font-semibold flex-wrap">
              <span className="flex items-center gap-1.5">
                <TruckIcon className="w-4 h-4 text-emerald-600 fill-current" />
                <span>รวมซัพพลายเออร์: <strong className="text-slate-900 font-mono">{activeSuppliers.length}</strong> ราย</span>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                มูลค่าสต็อกเคมีภัณฑ์รวม: <strong className="text-emerald-700 font-mono text-sm">
                  ฿{activeSuppliers.reduce((sum, s) => {
                    const items = rawMaterials.filter((rm) => (rm.supplier_name || rm.supplier) === s.name);
                    return sum + items.reduce((iSum, rm) => iSum + calculateMaterialTotalValue(rm.stock_qty, rm.unit_price || 0, rm.unit), 0);
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
            </div>

            {/* Right Action Buttons Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => openSupplierModal()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มผู้จำหน่ายใหม่</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (setActivePage) setActivePage("purchase");
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ออกใบสั่งซื้อ PO ใหม่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: วัตถุดิบ (Raw Materials Table)                                */}
      {/* ========================================================================= */}
      {activeSection === "raw" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสารเคมี, รหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">ผู้จำหน่าย: ทั้งหมด</option>
                {supplierList.map((sup, idx) => (
                  <option key={idx} value={sup}>{sup}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setImportType("raw");
                  setActiveSection("import");
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <DatabaseIcon /> นำเข้าวัตถุดิบ
              </button>
              <button
                onClick={() => openRawModal()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> เพิ่มวัตถุดิบใหม่
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-2.5">รหัสเคมีดิบ</th>
                  <th className="p-2.5">ชื่อสารเคมี</th>
                  <th className="p-2.5">ผู้จำหน่าย (Supplier)</th>
                  <th className="p-2.5 text-right">ราคา/หน่วย</th>
                  <th className="p-2.5 text-right">จำนวนคงคลัง</th>
                  <th className="p-2.5 text-center">หน่วยนับ</th>
                  <th className="p-2.5 text-right">มูลค่ารวม</th>
                  <th className="p-2.5 text-center">สถานะสต็อก</th>
                  <th className="p-2.5 text-center w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawMaterials
                  .filter((rm) => {
                    const matchSearch = (rm.code + " " + rm.name).toLowerCase().includes(searchTerm.toLowerCase());
                    const matchSup = supplierFilter === "all" || (rm.supplier_name || rm.supplier) === supplierFilter;
                    return matchSearch && matchSup;
                  })
                  .map((rm) => {
                    const isLow = rm.stock_qty <= rm.min_stock;
                    const totalVal = calculateMaterialTotalValue(rm.stock_qty, rm.unit_price || 0, rm.unit);
                    return (
                      <tr key={rm.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold font-mono text-blue-700">{rm.code}</td>
                        <td className="p-2.5 font-bold text-slate-800">{rm.name}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{rm.supplier_name || rm.supplier || "-"}</td>
                        <td className="p-2.5 text-right font-mono">฿{(rm.unit_price || 0).toLocaleString()}</td>
                        <td className={`p-2.5 text-right font-bold font-mono ${isLow ? "text-red-600" : "text-slate-800"}`}>
                          {rm.stock_qty.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">{rm.unit || "KG."}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          ฿{totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isLow ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isLow ? "ต่ำกว่าเกณฑ์" : "พร้อมใช้"}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedLotMaterial(rm)}
                              className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
                              title="ดูประวัติล็อตและราคาที่เคยรับเข้า"
                            >
                              ประวัติล็อต
                            </button>
                            <button
                              onClick={() => openRawModal(rm)}
                              className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: rm.id, name: rm.name, type: "raw" })}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors active:scale-95"
                              title="ลบวัตถุดิบเคมีดิบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: นำเข้าสต็อก (วัตถุดิบ / สินค้ากึ่งสำเร็จ / สินค้าสำเร็จ / สิ้นเปลือง)*/}
      {/* ========================================================================= */}
      {activeSection === "import" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl mx-auto w-full space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <DatabaseIcon />
              บันทึกการนำเข้าสต็อก - {
                importType === "raw" ? "วัตถุดิบเคมีดิบ" :
                importType === "semi" ? "สินค้ากึ่งสำเร็จรูป" :
                importType === "fg" ? "สินค้าสำเร็จรูป (FG)" : "วัสดุสิ้นเปลือง / บรรจุภัณฑ์"
              }
            </h2>
            <div className="flex gap-1">
              {(["raw", "semi", "fg", "consumable"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setImportType(t)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                    importType === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t === "raw" ? "วัตถุดิบ" : t === "semi" ? "กึ่งสำเร็จ" : t === "fg" ? "สำเร็จรูป" : "สิ้นเปลือง"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            {importType === "raw" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เลือกวัตถุดิบเคมีดิบ *</label>
                <select
                  required
                  value={importForm.item_id}
                  onChange={(e) => setImportForm({ ...importForm, item_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">-- กรุณาเลือกสารเคมี --</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.code} - {rm.name} (คงเหลือ: {rm.stock_qty} {rm.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {importType === "consumable" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เลือกบรรจุภัณฑ์ / วัสดุสิ้นเปลือง *</label>
                <select
                  required
                  value={importForm.item_id}
                  onChange={(e) => setImportForm({ ...importForm, item_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">-- กรุณาเลือกบรรจุภัณฑ์ --</option>
                  {inventoryPacks.map((ip) => (
                    <option key={ip.id} value={ip.id}>
                      {ip.code} - {ip.name} (คงเหลือ: {ip.qty} {ip.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนที่นำเข้า *</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={importForm.qty || ""}
                  onChange={(e) => setImportForm({ ...importForm, qty: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  placeholder="เช่น 100"
                />
              </div>

              {importType === "raw" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ราคาต่อหน่วยล็อตนี้ (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={importForm.unit_price || ""}
                    onChange={(e) => setImportForm({ ...importForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-emerald-700"
                    placeholder="เช่น 1360.00"
                  />
                </div>
              )}

              <div className={importType === "raw" ? "" : "sm:col-span-1"}>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมายเลขล็อต (Lot / Batch No.)</label>
                <input
                  type="text"
                  value={importForm.lot_number}
                  onChange={(e) => setImportForm({ ...importForm, lot_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  placeholder="เช่น LOT-2026-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันหมดอายุ (Expiry Date)</label>
                <input
                  type="date"
                  value={importForm.expiry_date}
                  onChange={(e) => setImportForm({ ...importForm, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ผู้รับเข้าคลัง</label>
                <input
                  type="text"
                  value={importForm.receiver}
                  onChange={(e) => setImportForm({ ...importForm, receiver: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุ / แหล่งที่มา</label>
              <textarea
                rows={2}
                value={importForm.notes}
                onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                บันทึกการรับเข้าคลังสินค้า
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-VIEW: สินค้ากึ่งสำเร็จ (Semi-Finished Goods)                          */}
      {/* ========================================================================= */}
      {activeSection === "semi" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">สินค้ากึ่งสำเร็จรูป (Semi-Finished / WIP Bulk)</h2>
              <p className="text-xs text-slate-500">สารผสมในถังพักรอกรอกบรรจุ หรือตรวจปล่อย QC</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openSemiModal()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> เพิ่มสินค้ากึ่งสำเร็จรูป
              </button>
              <button
                onClick={() => {
                  setImportType("semi");
                  setActiveSection("import");
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <DatabaseIcon className="w-3.5 h-3.5" /> นำเข้าสินค้ากึ่งสำเร็จ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-2.5">รหัสสินค้ากึ่งสำเร็จ</th>
                  <th className="p-2.5">ชื่อสารกึ่งสำเร็จ</th>
                  <th className="p-2.5">Batch No.</th>
                  <th className="p-2.5 text-right">จำนวนคงคลัง</th>
                  <th className="p-2.5 text-center">หน่วย</th>
                  <th className="p-2.5 text-center">ถังพัก (Tank)</th>
                  <th className="p-2.5 text-center">วันที่ผสม</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                  <th className="p-2.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {semiGoods.map((sg) => (
                  <tr key={sg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-blue-700">{sg.code}</td>
                    <td className="p-2.5 font-bold text-slate-800">{sg.name}</td>
                    <td className="p-2.5 font-mono text-slate-600">{sg.batch_no}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">{sg.qty.toLocaleString()}</td>
                    <td className="p-2.5 text-center">{sg.unit}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-purple-700 bg-purple-50 rounded-md">
                      {sg.tank_no}
                    </td>
                    <td className="p-2.5 text-center text-slate-500">{sg.mfg_date}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        {sg.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openSemiModal(sg)}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="แก้ไขสินค้ากึ่งสำเร็จรูป"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: sg.id, name: `${sg.name} (${sg.batch_no})`, type: "semi" })}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors active:scale-95"
                          title="ลบสินค้ากึ่งสำเร็จรูป"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {semiGoods.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">
                      ยังไม่มีรายการสินค้ากึ่งสำเร็จรูปในคลัง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-VIEW: สินค้าสำเร็จ (Finished Goods - FG)                             */}
      {/* ========================================================================= */}
      {activeSection === "fg" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">สินค้าสำเร็จรูป (Finished Goods - FG)</h2>
              <p className="text-xs text-slate-500">สินค้าบรรจุเสร็จพร้อมจัดส่งให้ลูกค้าหรือตัวแทน</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openProductModal()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> เพิ่มสินค้าสำเร็จรูป
              </button>
              <button
                onClick={() => {
                  setImportType("fg");
                  setActiveSection("import");
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <DatabaseIcon className="w-3.5 h-3.5" /> นำเข้าสินค้าสำเร็จ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-2.5">รหัสสินค้า</th>
                  <th className="p-2.5">ชื่อผลิตภัณฑ์</th>
                  <th className="p-2.5 text-right">จำนวนในคลัง</th>
                  <th className="p-2.5 text-center">หน่วยนับ</th>
                  <th className="p-2.5 text-center">ล็อตผลิต</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                  <th className="p-2.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finishedGoods.map((fg) => (
                  <tr key={fg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-blue-700">{fg.code}</td>
                    <td className="p-2.5 font-bold text-slate-800">{fg.name}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{fg.qty.toLocaleString()}</td>
                    <td className="p-2.5 text-center">{fg.unit}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600">{fg.lot}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {fg.status === "active" ? "พร้อมส่งมอบ" : fg.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openProductModal(fg)}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="แก้ไขข้อมูลสินค้า"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: fg.id, name: fg.name, type: "fg" })}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors active:scale-95"
                          title="ลบสินค้าสำเร็จรูป"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {finishedGoods.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      ยังไม่มีรายการสินค้าสำเร็จรูปในคลัง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-VIEW: วัสดุสิ้นเปลือง (Consumables & Packaging)                      */}
      {/* ========================================================================= */}
      {activeSection === "consumable" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">วัสดุสิ้นเปลืองและบรรจุภัณฑ์ (Packaging & Supplies)</h2>
              <p className="text-xs text-slate-500">ขวด, ฝา, ฟอยล์, ฉลากสติกเกอร์, และอุปกรณ์สิ้นเปลือง</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openPackModal()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> เพิ่มบรรจุภัณฑ์ใหม่
              </button>
              <button
                onClick={() => {
                  setImportType("consumable");
                  setActiveSection("import");
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <DatabaseIcon className="w-3.5 h-3.5" /> นำเข้าวัสดุสิ้นเปลือง
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-2.5">รหัสพัสดุ</th>
                  <th className="p-2.5">หมวดหมู่</th>
                  <th className="p-2.5">ชื่อบรรจุภัณฑ์/วัสดุสิ้นเปลือง</th>
                  <th className="p-2.5 text-right">จำนวนคงคลัง</th>
                  <th className="p-2.5 text-center">หน่วยนับ</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                  <th className="p-2.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryPacks.map((ip) => (
                  <tr key={ip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-blue-700">{ip.code}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                        {ip.type}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">{ip.name}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">{ip.qty.toLocaleString()}</td>
                    <td className="p-2.5 text-center">{ip.unit}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        พร้อมใช้
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openPackModal(ip)}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="แก้ไขบรรจุภัณฑ์"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: ip.id, name: ip.name, type: "pack" })}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors active:scale-95"
                          title="ลบรายการบรรจุภัณฑ์"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {inventoryPacks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      ยังไม่มีรายการบรรจุภัณฑ์หรือวัสดุสิ้นเปลือง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUB-VIEW: การคำนวนเบื้องต้น (Preliminary Calculator with BOM Selector)    */}
      {/* ========================================================================= */}
      {activeSection === "calc" && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="border-b border-slate-150 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <CalculatorIcon />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  เครื่องมือการคำนวนเบื้องต้น (Preliminary Production & BOM Calculator)
                </h2>
                <p className="text-xs text-slate-500">
                  เลือกสูตรการผลิต (BOM) เพื่อคำนวณปริมาณสารเคมีดิบ ตรวจสอบสต็อกคงคลังอัตโนมัติ และคำนวณบรรจุภัณฑ์
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {setActivePage && (
                <button
                  type="button"
                  onClick={() => setActivePage("bom")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  จัดการสูตร BOM
                </button>
              )}
            </div>
          </div>

          {/* 1. BOM Recipe Selector Bar */}
          {(() => {
            const selectedBom = bomRecipes.find((b) => b.id === Number(selectedBomId));
            const materialsList = selectedBom?.materials || [];
            const totalFormulaSum = materialsList.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0) || 100;

            const netWeightKg = (calcGrams * calcPcs) / 1000;
            const grossWeightKg = netWeightKg * (1 + calcLoss / 100);
            const totalBottles = Math.ceil(calcPcs * (1 + calcLoss / 100));
            const totalCaps = totalBottles;
            const totalLabels = totalBottles;
            const totalCartons = Math.ceil(totalBottles / 24);

            // Calculations per ingredient
            const calculatedIngredients = materialsList.map((m, idx) => {
              const rawQty = Number(m.quantity) || 0;
              const ratio = totalFormulaSum > 0 ? rawQty / totalFormulaSum : 0;
              const percent = ratio * 100;
              const netKg = ratio * netWeightKg;
              const grossKg = ratio * grossWeightKg;
              const grossGrams = grossKg * 1000;

              const mName = (m.material_name || "").trim().toLowerCase();
              const mCode = (m.material_code || "").trim().toLowerCase();
              const matchedRm = rawMaterials.find(
                (rm) =>
                  rm.name.toLowerCase() === mName ||
                  (mCode && rm.code.toLowerCase() === mCode)
              );

              const stockVal = matchedRm ? Number(matchedRm.stock_qty || 0) : 0;
              const rmUnit = (matchedRm?.unit || m.unit || "KG.").toUpperCase();
              const isKgUnit = rmUnit.includes("KG") || rmUnit.includes("กก");
              const stockKg = isKgUnit ? stockVal : stockVal / 1000;

              const isSufficient = stockKg >= grossKg;
              const shortageKg = isSufficient ? 0 : grossKg - stockKg;

              const unitPrice = matchedRm?.unit_price || m.unit_price || 0;
              const cost = grossKg * unitPrice;

              return {
                idx,
                part: m.part || (idx >= 6 ? "C" : idx >= 3 ? "B" : "A"),
                material_code: m.material_code || (matchedRm ? matchedRm.code : "-"),
                material_name: m.material_name,
                unit: m.unit || "KG.",
                rawQty,
                ratio,
                percent,
                netKg,
                grossKg,
                grossGrams,
                matchedRm,
                stockVal,
                stockKg,
                isKgUnit,
                isSufficient,
                shortageKg,
                unitPrice,
                cost
              };
            });

            const totalBatchCost = calculatedIngredients.reduce((sum, item) => sum + item.cost, 0);
            const costPerPiece = calcPcs > 0 ? totalBatchCost / calcPcs : 0;
            const shortageCount = calculatedIngredients.filter((i) => !i.isSufficient).length;
            const allSufficient = selectedBom ? shortageCount === 0 : true;

            const handleExportCalcCSV = () => {
              if (selectedBom) {
                const headers = [
                  "Part",
                  "รหัสสารเคมี",
                  "ชื่อสารเคมี/วัตถุดิบ",
                  "สัดส่วนสูตร (%)",
                  "ปริมาณสุทธิ (Kg)",
                  "ปริมาณรวม Loss (Kg)",
                  "สต็อกในคลัง (Kg)",
                  "สถานะความพร้อม",
                  "ขาดสต็อก (Kg)",
                  "ราคาต่อหน่วย (฿)",
                  "มูลค่าต้นทุน (฿)"
                ];
                const rows = calculatedIngredients.map((item) => [
                  item.part,
                  item.material_code,
                  item.material_name,
                  item.percent.toFixed(2) + "%",
                  item.netKg.toFixed(4),
                  item.grossKg.toFixed(4),
                  item.stockKg.toFixed(2),
                  item.isSufficient ? "สต็อกเพียงพอ" : "ขาดสต็อก",
                  item.shortageKg > 0 ? item.shortageKg.toFixed(4) : "0",
                  item.unitPrice.toFixed(2),
                  item.cost.toFixed(2)
                ]);
                // Add summary rows
                rows.push([]);
                rows.push([
                  "สรุปผลการคำนวณ",
                  selectedBom.product_code || "",
                  selectedBom.product_name || "",
                  `ขนาดบรรจุ: ${calcGrams}g`,
                  `จำนวนผลิต: ${calcPcs} ชิ้น`,
                  `รวมน้ำหนักสุทธิ: ${netWeightKg.toFixed(2)} Kg`,
                  `รวมน้ำหนักเผื่อ Loss: ${grossWeightKg.toFixed(2)} Kg`,
                  `ต้นทุนเคมีรวม: ${totalBatchCost.toFixed(2)} ฿`,
                  `ต้นทุนต่อชิ้น: ${costPerPiece.toFixed(2)} ฿`,
                  `ขวด/ซอง: ${totalBottles} ใบ`,
                  `สถานะ: ${allSufficient ? "พร้อมผลิต" : `ขาดวัตถุดิบ ${shortageCount} รายการ`}`
                ]);
                exportToCSV(rows, headers, `BOM_Calculation_${selectedBom.product_code || "Calc"}`);
              } else {
                const headers = ["หัวข้อ", "ค่าที่คำนวณได้", "หน่วย"];
                const rows = [
                  ["ขนาดบรรจุต่อชิ้น", calcGrams, "กรัม/มล."],
                  ["จำนวนสั่งผลิต", calcPcs, "ชิ้น"],
                  ["เผื่อสูญเสีย (% Loss)", calcLoss, "%"],
                  ["น้ำหนักสุทธิ", netWeightKg.toFixed(2), "Kg"],
                  ["น้ำหนักรวมสูญเสีย", grossWeightKg.toFixed(2), "Kg"],
                  ["ขวด/ซองที่ต้องเตรียม", totalBottles, "ใบ"],
                  ["ฝา & ฉลากที่ต้องเตรียม", totalCaps, "ชุด"],
                  ["กล่องบรรจุภัณฑ์ (24ชิ้น/กล่อง)", totalCartons, "กล่อง"]
                ];
                exportToCSV(rows, headers, "Production_Calculation_Manual");
              }
            };

            return (
              <div className="space-y-5">
                {/* Selector Header */}
                <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm font-extrabold text-blue-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                      เลือกสูตรการผลิต (BOM Recipe) เพื่อนำมาคำนวณปริมาณ
                    </label>
                    {selectedBom && (
                      <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                        สูตร: {selectedBom.version || "v1.0"} | Part No: {selectedBom.part_no || "PART-001"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={selectedBomId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : "";
                        setSelectedBomId(val);
                      }}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer transition-all"
                    >
                      <option value="">-- ไม่ระบุสูตร (คำนวณน้ำหนักและบรรจุภัณฑ์ทั่วไปแบบกำหนดเอง) --</option>
                      {bomRecipes.map((b) => (
                        <option key={b.id} value={b.id}>
                          📌 [{b.product_code || "BOM"}] {b.product_name || "ไม่มีชื่อสูตร"} ({b.version || "v1.0"}) — {(b.materials || []).length} ส่วนผสมเคมี
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Formula Details Pill */}
                  {selectedBom ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-blue-200/60">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded-md text-[11px]">
                          {selectedBom.product_code || "-"}
                        </span>
                        <span className="font-extrabold text-slate-800 text-sm">
                          {selectedBom.product_name}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({materialsList.length} ส่วนผสมในสูตร)
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            selectedBom.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {selectedBom.status === "active" ? "เปิดใช้งาน" : selectedBom.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          ต้นทุนประเมินเดิม:{" "}
                          <strong className="text-emerald-700 font-mono">
                            ฿{(selectedBom.estimated_unit_cost || 0).toFixed(2)}
                          </strong>
                        </span>
                        {setActivePage && (
                          <button
                            type="button"
                            onClick={() => setActivePage("bom")}
                            className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            ดูสูตรเต็ม <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      เลือกสูตร BOM เพื่อคำนวณปริมาณสารเคมีดิบทุกรายการ ตรวจสอบสต็อกคงเหลือ และประเมินต้นทุนรวม
                    </div>
                  )}
                </div>

                {/* 2. Parameters Grid */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> พารามิเตอร์การผลิตและขนาดสั่งทำ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* ขนาดบรรจุ */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        ขนาดต่อชิ้น/ก้อน (g หรือ ml) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={calcGrams}
                          onChange={(e) => setCalcGrams(Math.max(0.1, parseFloat(e.target.value) || 0))}
                          className="w-full px-3 py-2 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">g</span>
                      </div>
                    </div>

                    {/* จำนวนที่ผลิต */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        จำนวนที่สั่งผลิต (ชิ้น/ก้อน) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={calcPcs}
                          onChange={(e) => setCalcPcs(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 pr-10 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">ชิ้น</span>
                      </div>
                    </div>

                    {/* รวมน้ำหนักสุทธิ */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        น้ำหนักเนื้อสารสุทธิ (Net Kg)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={netWeightKg.toFixed(2)}
                          onChange={(e) => {
                            const kg = Math.max(0.01, parseFloat(e.target.value) || 0);
                            if (calcPcs > 0) {
                              setCalcGrams(Math.round((kg * 1000) / calcPcs));
                            }
                          }}
                          className="w-full px-3 py-2 pr-10 text-xs sm:text-sm bg-blue-50/60 border border-blue-300 rounded-xl font-extrabold font-mono text-blue-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-blue-600">KG</span>
                      </div>
                    </div>

                    {/* เผื่อสูญเสีย */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        เผื่อการสูญเสียในสายการผลิต (% Loss)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="25"
                          value={calcLoss}
                          onChange={(e) => setCalcLoss(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-3 py-2 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. KPI Cards Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* น้ำหนักรวม */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-200/70 shadow-xs">
                    <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">
                      น้ำหนักผลิตรวม Loss
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-blue-900 block mt-0.5">
                      {grossWeightKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      (สุทธิ {netWeightKg.toFixed(2)} Kg + Loss {calcLoss}%)
                    </span>
                  </div>

                  {/* ต้นทุนเคมีภัณฑ์รวม */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200/70 shadow-xs">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                      ประมาณการต้นทุนเคมี
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-800 block mt-0.5">
                      {selectedBom ? `฿${totalBatchCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                    </span>
                    <span className="text-[10px] text-emerald-600 mt-1 block">
                      {selectedBom ? `เฉลี่ย ฿${costPerPiece.toFixed(2)} / ชิ้น` : "ต้องเลือกสูตร BOM เพื่อคำนวณ"}
                    </span>
                  </div>

                  {/* ขวด / บรรจุภัณฑ์ */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 p-4 rounded-2xl border border-purple-200/70 shadow-xs">
                    <span className="text-[10px] text-purple-700 font-bold block uppercase tracking-wider">
                      ขวด/ซองที่ต้องเตรียม
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-purple-900 block mt-0.5">
                      {totalBottles.toLocaleString()} ใบ
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      ฝา & ฉลาก {totalCaps.toLocaleString()} ชุด ({totalCartons} กล่อง)
                    </span>
                  </div>

                  {/* สถานะสต็อก */}
                  <div
                    className={`p-4 rounded-2xl border shadow-xs ${
                      !selectedBom
                        ? "bg-slate-50 border-slate-200"
                        : allSufficient
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold block uppercase tracking-wider ${
                        !selectedBom
                          ? "text-slate-500"
                          : allSufficient
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      ความพร้อมวัตถุดิบ
                    </span>
                    <span
                      className={`text-sm sm:text-base font-extrabold block mt-1 flex items-center gap-1.5 ${
                        !selectedBom
                          ? "text-slate-600"
                          : allSufficient
                          ? "text-emerald-800"
                          : "text-red-700"
                      }`}
                    >
                      {!selectedBom ? (
                        "ยังไม่เลือกสูตร"
                      ) : allSufficient ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> พร้อมผลิตทันที
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-600" /> ขาด {shortageCount} รายการ
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {selectedBom
                        ? allSufficient
                          ? "สารเคมีในคลังมีครบทุกตัว"
                          : "สต็อกไม่เพียงพอต่อการผลิต"
                        : "เลือกสูตรเพื่อตรวจสอบสต็อก"}
                    </span>
                  </div>
                </div>

                {/* 4. Chemical Ingredients Breakdown Table (เมื่อเลือกสูตร BOM) */}
                {selectedBom && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
                    <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-600" />
                          ตารางแจกแจงสัดส่วนและการใช้วัตถุดิบเคมีภัณฑ์ ({calculatedIngredients.length} รายการ)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          คำนวณตามสัดส่วน % w/w และเผื่อสูญเสีย {calcLoss}% พร้อมตรวจสอบกับยอดสต็อกคงคลังปัจจุบัน
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportCalcCSV}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          ส่งออก CSV
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600 border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-[11px] text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider">
                            <th className="p-2.5 text-center w-14">Part</th>
                            <th className="p-2.5">รหัสสาร</th>
                            <th className="p-2.5">ชื่อวัตถุดิบเคมีภัณฑ์</th>
                            <th className="p-2.5 text-right w-24">สัดส่วนสูตร</th>
                            <th className="p-2.5 text-right w-28">ปริมาณสุทธิ</th>
                            <th className="p-2.5 text-right w-32 bg-[#fef9c3] text-amber-950 font-extrabold border-x border-amber-300">
                              ปริมาณรวม Loss
                            </th>
                            <th className="p-2.5 text-right w-28">สต็อกในคลัง</th>
                            <th className="p-2.5 text-center w-28">สถานะสต็อก</th>
                            <th className="p-2.5 text-right w-28">ต้นทุนประเมิน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {calculatedIngredients.map((item) => (
                            <tr
                              key={item.idx}
                              className={`transition-colors hover:bg-slate-50/80 ${
                                !item.isSufficient ? "bg-red-50/40" : ""
                              }`}
                            >
                              {/* Part */}
                              <td className="p-2.5 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    item.part === "A"
                                      ? "bg-blue-100 text-blue-700"
                                      : item.part === "B"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {item.part}
                                </span>
                              </td>

                              {/* รหัสสาร */}
                              <td className="p-2.5 font-mono font-bold text-slate-700 text-[11px]">
                                {item.material_code}
                              </td>

                              {/* ชื่อสาร */}
                              <td className="p-2.5 font-semibold text-slate-800">
                                {item.material_name}
                              </td>

                              {/* สัดส่วนสูตร */}
                              <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                                {item.percent.toFixed(2)}%
                              </td>

                              {/* ปริมาณสุทธิ */}
                              <td className="p-2.5 text-right font-mono text-slate-700">
                                {item.netKg >= 1 ? (
                                  `${item.netKg.toFixed(3)} Kg`
                                ) : (
                                  `${(item.netKg * 1000).toFixed(1)} g`
                                )}
                              </td>

                              {/* ปริมาณรวม Loss: สีเหลืองอ่อน หากหน่วยเป็น Kg ให้ใส่ตัวหนังสือสีแดง */}
                              <td className={`p-2.5 text-right font-mono font-extrabold bg-[#fef9c3] border-x border-amber-200 ${
                                item.grossKg >= 1 ? "text-red-600" : "text-slate-900"
                              }`}>
                                {item.grossKg >= 1 ? (
                                  `${item.grossKg.toFixed(3)} Kg`
                                ) : (
                                  `${item.grossGrams.toFixed(1)} g`
                                )}
                              </td>

                              {/* สต็อกในคลัง */}
                              <td className="p-2.5 text-right font-mono font-bold text-slate-700">
                                {item.stockKg.toFixed(2)} Kg
                              </td>

                              {/* สถานะความพร้อม */}
                              <td className="p-2.5 text-center">
                                {item.isSufficient ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> พอ
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                    <AlertTriangle className="w-3 h-3" /> ขาด {item.shortageKg.toFixed(2)} Kg
                                  </span>
                                )}
                              </td>

                              {/* ต้นทุน */}
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                                ฿{item.cost.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 font-extrabold text-slate-800 text-xs border-t-2 border-slate-300">
                            <td colSpan={3} className="p-3 text-right">
                              รวมทั้งหมด (100% Formulation Total):
                            </td>
                            <td className="p-3 text-right font-mono text-blue-700">100.00%</td>
                            <td className="p-3 text-right font-mono text-slate-800">
                              {netWeightKg.toFixed(2)} Kg
                            </td>
                            <td className="p-3 text-right font-mono bg-[#fef9c3] text-red-600 font-extrabold border-x border-amber-300">
                              {grossWeightKg.toFixed(2)} Kg
                            </td>
                            <td colSpan={2} className="p-3 text-center">
                              {allSufficient ? (
                                <span className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> สต็อกครบพร้อมผลิต
                                </span>
                              ) : (
                                <span className="text-red-700 font-bold text-xs flex items-center justify-center gap-1">
                                  <AlertTriangle className="w-4 h-4" /> ขาดวัตถุดิบ {shortageCount} รายการ
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-800 text-sm">
                              ฿{totalBatchCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Shortage Alert & Quick Purchase Action */}
                    {!allSufficient && (
                      <div className="p-4 bg-red-50 border-t border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-red-900">
                              พบสารเคมีขาดสต็อก {shortageCount} รายการในคลัง
                            </div>
                            <div className="text-[11px] text-red-700">
                              รายการที่ขาด:{" "}
                              {calculatedIngredients
                                .filter((i) => !i.isSufficient)
                                .map((i) => `${i.material_name} (ขาด ${i.shortageKg.toFixed(2)} Kg)`)
                                .join(", ")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSavePurchaseOrder && (
                            <button
                              type="button"
                              onClick={async () => {
                                const shortageItems = calculatedIngredients.filter((i) => !i.isSufficient);
                                const poPayload = {
                                  po_number: `PO-CALC-${Date.now().toString().slice(-4)}`,
                                  supplier_id: shortageItems[0]?.matchedRm?.supplier_id || 1,
                                  supplier_name: shortageItems[0]?.matchedRm?.supplier_name || "บริษัท สารเคมีภัณฑ์ จำกัด",
                                  order_date: new Date().toISOString().slice(0, 10),
                                  expected_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                                  status: "draft",
                                  total_amount: shortageItems.reduce((sum, item) => sum + item.shortageKg * (item.unitPrice || 100), 0),
                                  items: shortageItems.map((item) => ({
                                    raw_material_id: item.matchedRm?.id || null,
                                    item_name: item.material_name,
                                    quantity: Math.ceil(item.shortageKg),
                                    unit: item.unit || "กก.",
                                    unit_price: item.unitPrice || 100,
                                    subtotal: Math.ceil(item.shortageKg) * (item.unitPrice || 100)
                                  }))
                                };
                                await onSavePurchaseOrder(poPayload);
                                alert("สร้างใบขอสั่งซื้อ (PO) สำหรับเคมีภัณฑ์ที่ขาดเรียบร้อยแล้ว!");
                              }}
                              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              สร้างใบสั่งซื้อ PO สารที่ขาด
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Packaging & Consumables Breakdown */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    📦 ประมาณการบรรจุภัณฑ์และวัสดุสิ้นเปลืองสำหรับ Lot นี้
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        ขวด/ตลับ/ซอง บรรจุสินค้า
                      </span>
                      <span className="text-base font-mono font-extrabold text-slate-800 block mt-0.5">
                        {totalBottles.toLocaleString()} ใบ
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (จากเป้าหมาย {calcPcs} ชิ้น + เผื่อสูญเสีย {calcLoss}%)
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        ฝาปิดและสติกเกอร์ฉลากสินค้า
                      </span>
                      <span className="text-base font-mono font-extrabold text-slate-800 block mt-0.5">
                        {totalCaps.toLocaleString()} ชุด
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (ฉลากหน้า-หลัง และฝาครอบพร้อมผลิต)
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        กล่องบรรจุลูกฟูก (Cartons)
                      </span>
                      <span className="text-base font-mono font-extrabold text-slate-800 block mt-0.5">
                        {totalCartons.toLocaleString()} กล่อง
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (บรรจุกล่องละ 24 ชิ้น พร้อมเทปกาวและสายรัด)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    กลับเมนูคลังสินค้า
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCalcCSV}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลดรายงานการคำนวณ (CSV)
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SUB-VIEWS: รายงานต่างๆ (วัตถุดิบ, กึ่งสำเร็จ, สำเร็จรูป, สิ้นเปลือง, นำออก, คลังสินค้า) */}
      {/* ========================================================================= */}
      {(activeSection?.startsWith("report_") || activeSection === "shortage") && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                {activeSection === "shortage" ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <BarChartIcon />
                )}
                {menuCards.find((c) => c.id === activeSection)?.label}
              </h2>
              <p className="text-xs text-slate-500">
                {activeSection === "shortage"
                  ? "รายการวัตถุดิบเคมีดิบที่มีจำนวนสต็อกคงเหลือต่ำกว่าเกณฑ์ความปลอดภัย (Safety Stock)"
                  : "รายงานสรุปข้อมูลคลังสินค้าแบบละเอียด"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const dataToExport =
                    activeSection === "shortage"
                      ? shortageMaterials.map((m) => [m.code, m.name, m.stock_qty, m.min_stock, m.unit, m.supplier_name || "-"])
                      : rawMaterials.map((m) => [m.code, m.name, m.stock_qty, m.min_stock, m.unit, m.unit_price || 0]);
                  exportToCSV(
                    dataToExport,
                    ["รหัส", "ชื่อรายการ", "คงเหลือ", "เกณฑ์ต่ำสุด", "หน่วย", "ราคา"],
                    activeSection
                  );
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> ส่งออก CSV
              </button>

              {activeSection === "shortage" && shortageMaterials.length > 0 && (
                <button
                  onClick={async () => {
                    if (onSavePurchaseOrder) {
                      const poItems = shortageMaterials.map((m) => ({
                        raw_material_id: m.id,
                        item_name: m.name,
                        quantity: Math.max(20, m.min_stock * 2 - m.stock_qty),
                        unit: m.unit || "KG.",
                        unit_price: m.unit_price || 100,
                        subtotal: Math.max(20, m.min_stock * 2 - m.stock_qty) * (m.unit_price || 100)
                      }));
                      await onSavePurchaseOrder({
                        id: 0,
                        code: `PO-${Date.now().toString().slice(-6)}`,
                        supplier: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด",
                        order_date: new Date().toISOString().slice(0, 10),
                        status: "pending",
                        total_amount: poItems.reduce((sum, item) => sum + item.subtotal, 0),
                        items: poItems
                      });
                      showWarehouseToast("✓ สร้างใบขอสั่งซื้อ (PO) สำหรับเคมีภัณฑ์ที่ขาดเรียบร้อยแล้ว!");
                      if (setActivePage) setActivePage("purchase");
                    }
                  }}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  สร้างใบสั่งซื้อเคมีที่ขาดทันที
                </button>
              )}
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-2.5">รหัส</th>
                  <th className="p-2.5">ชื่อรายการ</th>
                  <th className="p-2.5 text-right">จำนวนคงคลัง</th>
                  <th className="p-2.5 text-right">เกณฑ์ความปลอดภัย</th>
                  <th className="p-2.5 text-center">หน่วยนับ</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeSection === "shortage" ? shortageMaterials : rawMaterials).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-blue-700">{item.code}</td>
                    <td className="p-2.5 font-bold text-slate-800">{item.name}</td>
                    <td className={`p-2.5 text-right font-mono font-bold ${item.stock_qty <= item.min_stock ? "text-red-600" : "text-slate-800"}`}>
                      {item.stock_qty.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-500">{item.min_stock.toLocaleString()}</td>
                    <td className="p-2.5 text-center">{item.unit}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.stock_qty <= item.min_stock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.stock_qty <= item.min_stock ? "ขาดสต็อก" : "ปกติ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SUB-VIEW: ใบเบิก (Requisition Slips)                                   */}
      {/* ========================================================================= */}
      {activeSection === "requisition" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">ใบเบิกพัสดุและวัตถุดิบ (Requisition Slips)</h2>
              <p className="text-xs text-slate-500">เอกสารการขอเบิกวัตถุดิบเคมีและบรรจุภัณฑ์ไปใช้ในสายการผลิต</p>
            </div>
            <button
              onClick={() => openReqModal()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> สร้างใบเบิกใหม่
            </button>
          </div>

          <div className="space-y-3">
            {requisitions.map((req) => (
              <div key={req.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-blue-700 text-xs sm:text-sm">{req.code}</span>
                    <span className="text-xs text-slate-500">({req.date})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      อนุมัติแล้ว
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 font-medium">แผนก: <strong>{req.department}</strong> (ผู้เบิก: {req.requester})</span>
                    <button
                      onClick={() => setDeleteTarget({ id: req.id, name: req.code, type: "req" })}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="ลบใบเบิก"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-700">
                  <strong>วัตถุประสงค์:</strong> {req.purpose}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {req.items.map((it, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                      {it.item_name} : <strong className="text-blue-700">{it.qty} {it.unit}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {requisitions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                ยังไม่มีข้อมูลใบเบิกพัสดุและวัตถุดิบ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw Material Add/Edit Modal */}
      {isRawModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingRaw ? "แก้ไขวัตถุดิบเคมีดิบ" : "เพิ่มวัตถุดิบเคมีดิบใหม่"}
              </h3>
              <button onClick={() => setIsRawModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRaw} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสเคมีดิบ *</label>
                  <input
                    type="text"
                    required
                    value={rawForm.code}
                    onChange={(e) => setRawForm({ ...rawForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หน่วยวัด *</label>
                  <select
                    value={rawForm.unit}
                    onChange={(e) => setRawForm({ ...rawForm, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="KG.">KG.</option>
                    <option value="G.">G.</option>
                    <option value="L.">L.</option>
                    <option value="ML.">ML.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสารเคมี *</label>
                <input
                  type="text"
                  required
                  value={rawForm.name}
                  onChange={(e) => setRawForm({ ...rawForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ผู้จำหน่าย (Supplier)</label>
                <input
                  type="text"
                  value={rawForm.supplier_name}
                  onChange={(e) => setRawForm({ ...rawForm, supplier_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="เช่น บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สต็อกคงเหลือ</label>
                  <input
                    type="number"
                    value={rawForm.stock_qty}
                    onChange={(e) => setRawForm({ ...rawForm, stock_qty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เกณฑ์ขั้นต่ำ</label>
                  <input
                    type="number"
                    value={rawForm.min_stock}
                    onChange={(e) => setRawForm({ ...rawForm, min_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ราคา/หน่วย (฿)</label>
                  <input
                    type="number"
                    value={rawForm.unit_price}
                    onChange={(e) => setRawForm({ ...rawForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingRaw ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingRaw.id, name: editingRaw.name, type: "raw" as const };
                      setIsRawModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบวัตถุดิบนี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRawModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packaging / Consumables Modal */}
      {isPackModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingPack ? "แก้ไขข้อมูลบรรจุภัณฑ์/วัสดุสิ้นเปลือง" : "เพิ่มบรรจุภัณฑ์/วัสดุสิ้นเปลืองใหม่"}
              </h3>
              <button onClick={() => setIsPackModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePack} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสพัสดุ *</label>
                  <input
                    type="text"
                    required
                    value={packForm.code}
                    onChange={(e) => setPackForm({ ...packForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่ *</label>
                  <select
                    value={packForm.type}
                    onChange={(e) => setPackForm({ ...packForm, type: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="ขวด">ขวด</option>
                    <option value="ฝา">ฝา</option>
                    <option value="ฟอยล์">ฟอยล์</option>
                    <option value="ฉลาก">ฉลาก</option>
                    <option value="กล่อง">กล่อง</option>
                    <option value="อุปกรณ์">อุปกรณ์</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อรายการบรรจุภัณฑ์ *</label>
                <input
                  type="text"
                  required
                  value={packForm.name}
                  onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  placeholder="เช่น ขวดแก้วดรอปเปอร์ใส 30ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนคงคลัง *</label>
                  <input
                    type="number"
                    value={packForm.qty}
                    onChange={(e) => setPackForm({ ...packForm, qty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หน่วยนับ *</label>
                  <input
                    type="text"
                    required
                    value={packForm.unit}
                    onChange={(e) => setPackForm({ ...packForm, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="เช่น ชิ้น, ใบ, ม้วน"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingPack ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingPack.id, name: editingPack.name, type: "pack" as const };
                      setIsPackModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบรายการนี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPackModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingSupplier ? "แก้ไขข้อมูลผู้จำหน่าย (Supplier)" : "เพิ่มผู้จำหน่ายใหม่ (Supplier)"}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผู้จำหน่าย</label>
                  <input
                    type="text"
                    value={supplierForm.code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                    placeholder="SUP-0001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={supplierForm.contact}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="คุณสมชาย"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อบริษัท / ร้านค้าผู้จำหน่าย *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  placeholder="เช่น บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    placeholder="02-123-4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    placeholder="contact@supplier.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่ / ข้อมูลติดต่อเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingSupplier ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingSupplier.id, name: editingSupplier.name, type: "supplier" as const };
                      setIsSupplierModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบผู้จำหน่ายนี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finished Goods / Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingProduct ? "แก้ไขสินค้าสำเร็จรูป" : "เพิ่มสินค้าสำเร็จรูปใหม่"}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสสินค้า *</label>
                  <input
                    type="text"
                    required
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                    placeholder="P-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เวอร์ชันสูตร</label>
                  <input
                    type="text"
                    value={productForm.version}
                    onChange={(e) => setProductForm({ ...productForm, version: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    placeholder="v1.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสินค้าสำเร็จรูป *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  placeholder="เช่น ไฮยาลูรอน บูสเตอร์ เซรั่ม 30ml"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทสินค้า</label>
                <input
                  type="text"
                  value={productForm.type}
                  onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="Finished Goods"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingProduct.id, name: editingProduct.name, type: "fg" as const };
                      setIsProductModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบสินค้านี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semi-Finished Goods Modal */}
      {isSemiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingSemi ? "แก้ไขสินค้ากึ่งสำเร็จรูป" : "เพิ่มสินค้ากึ่งสำเร็จรูปใหม่"}
              </h3>
              <button onClick={() => setIsSemiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSemi} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสสารกึ่งสำเร็จ *</label>
                  <input
                    type="text"
                    required
                    value={semiForm.code}
                    onChange={(e) => setSemiForm({ ...semiForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                    placeholder="SF-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขแบทช์ผลิต (Batch No.)</label>
                  <input
                    type="text"
                    value={semiForm.batch_no}
                    onChange={(e) => setSemiForm({ ...semiForm, batch_no: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    placeholder="BATCH-2026-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสารกึ่งสำเร็จรูป *</label>
                <input
                  type="text"
                  required
                  value={semiForm.name}
                  onChange={(e) => setSemiForm({ ...semiForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  placeholder="เช่น สารผสมเบสเซรั่มไฮยาเข้มข้น"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ปริมาณคงคลัง *</label>
                  <input
                    type="number"
                    value={semiForm.qty}
                    onChange={(e) => setSemiForm({ ...semiForm, qty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หน่วยนับ *</label>
                  <select
                    value={semiForm.unit}
                    onChange={(e) => setSemiForm({ ...semiForm, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="KG.">KG.</option>
                    <option value="L.">L.</option>
                    <option value="G.">G.</option>
                    <option value="ML.">ML.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ถังเก็บ (Tank)</label>
                  <input
                    type="text"
                    value={semiForm.tank_no}
                    onChange={(e) => setSemiForm({ ...semiForm, tank_no: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    placeholder="TANK-01"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingSemi ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingSemi.id, name: editingSemi.name, type: "semi" as const };
                      setIsSemiModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบรายการนี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSemiModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requisition Slip Modal */}
      {isReqModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                สร้างใบเบิกพัสดุและวัตถุดิบ (Requisition Slip)
              </h3>
              <button onClick={() => setIsReqModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveReq} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขที่ใบเบิก *</label>
                  <input
                    type="text"
                    required
                    value={reqForm.code}
                    onChange={(e) => setReqForm({ ...reqForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วันที่ *</label>
                  <input
                    type="date"
                    required
                    value={reqForm.date}
                    onChange={(e) => setReqForm({ ...reqForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">แผนกที่ขอเบิก *</label>
                  <input
                    type="text"
                    required
                    value={reqForm.department}
                    onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="เช่น ฝ่ายผสมเคมี"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ผู้ขอเบิก *</label>
                  <input
                    type="text"
                    required
                    value={reqForm.requester}
                    onChange={(e) => setReqForm({ ...reqForm, requester: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="เช่น หัวหน้าฝ่ายผลิต"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วัตถุประสงค์ในการเบิก</label>
                <input
                  type="text"
                  value={reqForm.purpose}
                  onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="เช่น เบิกสำหรับผลิตล็อต LOT-2026-01"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700">รายการพัสดุ/วัตถุดิบที่ขอเบิก</div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อรายการ *</label>
                  <input
                    type="text"
                    required
                    value={reqForm.item_name}
                    onChange={(e) => setReqForm({ ...reqForm, item_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                    placeholder="เช่น Ethanol 96% หรือ ขวด 30ml"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">จำนวน *</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step="any"
                      value={reqForm.qty}
                      onChange={(e) => setReqForm({ ...reqForm, qty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">หน่วยนับ *</label>
                    <input
                      type="text"
                      required
                      value={reqForm.unit}
                      onChange={(e) => setReqForm({ ...reqForm, unit: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                      placeholder="L. หรือ ชิ้น หรือ KG."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReqModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  บันทึกออกใบเบิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action / Chat Button at bottom right */}
      {!activeSection && (
        <button
          onClick={() => setActiveSection("calc")}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 transition-all cursor-pointer z-30"
          title="การคำนวนเบื้องต้น"
        >
          <MessageCircle className="w-5 h-5 text-slate-600" />
        </button>
      )}

      {/* In-App Active Delete Confirmation Dialog (NO window.confirm!) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {deleteTarget.type === "raw"
                    ? "ยืนยันการลบวัตถุดิบเคมีดิบ"
                    : deleteTarget.type === "pack"
                    ? "ยืนยันการลบรายการบรรจุภัณฑ์"
                    : deleteTarget.type === "supplier"
                    ? "ยืนยันการลบข้อมูลผู้จำหน่าย"
                    : deleteTarget.type === "fg"
                    ? "ยืนยันการลบสินค้าสำเร็จรูป"
                    : deleteTarget.type === "semi"
                    ? "ยืนยันการลบสินค้ากึ่งสำเร็จรูป"
                    : "ยืนยันการลบใบเบิกพัสดุ"}
                </h3>
                <p className="text-xs text-slate-500">การลบนี้จะนำข้อมูลออกจากฐานข้อมูลถาวร</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <strong className="text-red-600">"{deleteTarget.name}"</strong> ออกจากฐานข้อมูล 100%?
            </p>
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { id, type } = deleteTarget;
                  setDeleteTarget(null);
                  try {
                    if (type === "raw" && onDeleteRawMaterial) {
                      await onDeleteRawMaterial(id);
                    } else if (type === "pack" && onDeleteInventoryPack) {
                      await onDeleteInventoryPack(id);
                    } else if (type === "supplier" && onDeleteSupplier) {
                      await onDeleteSupplier(id);
                    } else if (type === "fg" && onDeleteProduct) {
                      await onDeleteProduct(id);
                    } else if (type === "semi" && onDeleteSemiGood) {
                      await onDeleteSemiGood(id);
                    } else if (type === "req" && onDeleteRequisition) {
                      await onDeleteRequisition(id);
                    }
                    showWarehouseToast("✓ ลบรายการออกจากฐานข้อมูลเรียบร้อยแล้ว!");
                  } catch (err: any) {
                    showWarehouseToast(err?.message || "เกิดข้อผิดพลาดในการลบ", "error");
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> ยืนยันลบออกจากฐานข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOT HISTORY & BATCH PRICING MODAL */}
      {selectedLotMaterial && (
        <div className="fixed inset-0 bg-black/60 z-[9990] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-300 font-bold bg-white/10 px-2 py-0.5 rounded uppercase">
                  {selectedLotMaterial.code}
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-1">
                  ประวัติล็อตและราคาการรับเข้า: {selectedLotMaterial.name}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  บริษัทผู้จำหน่าย: {selectedLotMaterial.supplier_name || selectedLotMaterial.supplier || "ไม่ได้ระบุ"} | คงเหลือปัจจุบัน: <strong className="text-emerald-400 font-mono">{selectedLotMaterial.stock_qty.toLocaleString()} {selectedLotMaterial.unit || "KG."}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedLotMaterial(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Table */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  รายการล็อตที่เคยรับเข้าทั้งหมด ({grns.filter(g => g.raw_material_id === selectedLotMaterial.id).length} ล็อต)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const targetId = selectedLotMaterial.id;
                    setSelectedLotMaterial(null);
                    setImportType("raw");
                    setImportForm({
                      ...importForm,
                      item_id: targetId,
                      unit_price: selectedLotMaterial.unit_price || 0
                    });
                    setActiveSection("import");
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + รับเข้าล็อตใหม่พร้อมราคาใหม่
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[11px] text-slate-700 border-b border-slate-200 uppercase">
                      <th className="p-2.5">เลขที่ GRN</th>
                      <th className="p-2.5">หมายเลขล็อต (Lot No.)</th>
                      <th className="p-2.5 text-center">วันที่รับเข้า</th>
                      <th className="p-2.5 text-center">วันหมดอายุ</th>
                      <th className="p-2.5 text-right">จำนวนที่รับ</th>
                      <th className="p-2.5 text-right text-emerald-800 font-extrabold bg-emerald-50/80">ราคาต่อหน่วยประจำล็อต</th>
                      <th className="p-2.5 text-right font-extrabold">มูลค่ารวมล็อต</th>
                      <th className="p-2.5 text-slate-500">ผู้รับเข้า</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grns
                      .filter(g => g.raw_material_id === selectedLotMaterial.id)
                      .map((g) => {
                        const lotPrice = g.unit_price || selectedLotMaterial.unit_price || 0;
                        const lotTotal = calculateMaterialTotalValue(g.received_qty, lotPrice, selectedLotMaterial.unit);
                        return (
                          <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-bold font-mono text-blue-700">{g.code}</td>
                            <td className="p-2.5 font-extrabold font-mono text-emerald-700">{g.lot_number}</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">{g.receive_date}</td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{g.expiry_date}</td>
                            <td className="p-2.5 text-right font-mono font-bold">{g.received_qty.toLocaleString()} {selectedLotMaterial.unit || "KG."}</td>
                            <td className="p-2.5 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/50">
                              ฿{lotPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              ฿{lotTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-slate-500 text-[11px]">{g.receiver}</td>
                          </tr>
                        );
                      })}
                    {grns.filter(g => g.raw_material_id === selectedLotMaterial.id).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          ยังไม่มีประวัติการบันทึกรับเข้าแยกตามล็อตสำหรับสารเคมีนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLotMaterial(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
