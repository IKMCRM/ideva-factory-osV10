import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Barcode as BarcodeIcon,
  Printer,
  Search,
  Scan,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Tag,
  Box,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
  Save,
  Copy,
  Check,
  Download,
  Sliders,
  Volume2,
  VolumeX,
  History,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  Camera,
  X,
  CheckSquare,
  Square,
  CheckCheck
} from "lucide-react";
import {
  RawMaterial,
  RawMaterialLot,
  Grn,
  ProductionOrder,
  PackingOrder,
  Product,
  Supplier,
  AuditLog,
  QcInspection
} from "../types";
import { encodeCode128B } from "../lib/code128";

interface BarcodeQcCenterProps {
  rawMaterials: RawMaterial[];
  rawMaterialLots: RawMaterialLot[];
  grns: Grn[];
  productionOrders: ProductionOrder[];
  packingOrders: PackingOrder[];
  products: Product[];
  suppliers: Supplier[];
  qcInspections: QcInspection[];
  auditLogs?: AuditLog[];
  onSaveStockCount?: (payload: {
    materialId?: number;
    lotId?: number;
    countedQtyKg: number;
    varianceKg: number;
    reason: string;
    countedBy: string;
    location?: string;
  }) => Promise<void>;
  onSaveQcInspection?: (qc: Partial<QcInspection>) => Promise<void>;
  onLogAudit?: (log: Partial<AuditLog>) => Promise<void>;
}

export type LabelPaperSize = 
  | "thermal_80x50_portrait"   // 50mm Width x 80mm Height แนวตั้ง (Default ตามม้วนสติ๊กเกอร์สีเขียว 80x50mm)
  | "thermal_80x50_landscape"  // 80mm Width x 50mm Height แนวนอน
  | "thermal_100x75"           // 100mm Width x 75mm Height
  | "thermal_100x150"          // 100mm Width x 150mm Height
  | "a4_sheet";                // A4 Sheet multi-grid

export interface BatchItemEntry {
  id: string;
  selected: boolean;
  copies: number;
  category: "raw_material" | "packaging" | "product";
  productCode: string;
  productName: string;
  receivingNo: string;
  supplierName: string;
  appearance: string;
  retestDate: string;
  receiveDate: string;
  expiryDate: string;
  inspector: string;
  approver: string;
  approvalDate: string;
  totalPieces: number;
  selectedPieces: number[];
  sourceType: "lot" | "grn" | "prod" | "fg";
}

// Sound generator using Web Audio API for hardware scanner beep simulation
function playScannerBeep(type: "success" | "error" = "success") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

export default function BarcodeQcCenter({
  rawMaterials,
  rawMaterialLots,
  grns,
  productionOrders,
  packingOrders,
  products,
  suppliers,
  qcInspections,
  auditLogs = [],
  onSaveStockCount,
  onSaveQcInspection,
  onLogAudit
}: BarcodeQcCenterProps) {
  const [activeTab, setActiveTab] = useState<"label_generator" | "scanner_counter" | "barcode_registry">("label_generator");

  // Helper date formatter
  const formatShortThaiDate = (dateStr?: string) => {
    if (!dateStr) {
      const now = new Date();
      return `${now.getDate()}/${now.getMonth() + 1}/${String(now.getFullYear() + 43).slice(-2)}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear() + 43).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // -------------------------------------------------------------
  // TAB 1: QC PASS LABEL DESIGNER & THERMAL PRINTER STATE
  // -------------------------------------------------------------
  // Mode: "single" (ปรับแต่งฟอร์มเดี่ยว) or "multi_select" (ติ๊กถูกเลือกหลายรายการ)
  const [selectionMode, setSelectionMode] = useState<"single" | "multi_select">("multi_select");
  
  // Paper size: Defaults to 80x50 mm แนวตั้ง (50mm wide x 80mm high portrait roll)
  const [printerPaperSize, setPrinterPaperSize] = useState<LabelPaperSize>("thermal_80x50_portrait");

  // Single Item State
  const [category, setCategory] = useState<"raw_material" | "packaging" | "product">("raw_material");
  const [productCode, setProductCode] = useState<string>("RMFL-0257");
  const [productName, setProductName] = useState<string>("TS34520 KYLVANILLA");
  const [receivingNo, setReceivingNo] = useState<string>("6162960");
  const [currentPiece, setCurrentPiece] = useState<number>(1);
  const [totalPieces, setTotalPieces] = useState<number>(1);
  const [selectedSinglePieces, setSelectedSinglePieces] = useState<number[]>([1]);
  const [supplierName, setSupplierName] = useState<string>("IDEVA / De Roma");
  const [appearance, setAppearance] = useState<string>("ของเหลว");
  const [retestDate, setRetestDate] = useState<string>(formatShortThaiDate("2026-10-14"));
  const [receiveDate, setReceiveDate] = useState<string>(formatShortThaiDate("2026-10-07"));
  const [expiryDate, setExpiryDate] = useState<string>(formatShortThaiDate("2027-08-23"));
  const [inspector, setInspector] = useState<string>("สุรัสวดี");
  const [approver, setApprover] = useState<string>("ณ");
  const [approvalDate, setApprovalDate] = useState<string>(formatShortThaiDate("2026-10-07"));
  const [customBarcodeText, setCustomBarcodeText] = useState<string>("");
  const [copiedBarcode, setCopiedBarcode] = useState<boolean>(false);

  // Synchronize single pieces checkboxes when totalPieces changes
  useEffect(() => {
    setSelectedSinglePieces((prev) => {
      const valid = prev.filter((p) => p <= totalPieces);
      return valid.length > 0 ? valid : [1];
    });
  }, [totalPieces]);

  // -------------------------------------------------------------
  // MULTI-ITEM CHECKLIST STATE (ติ๊กถูกเลือกพิมพ์ได้มากกว่า 1 รายการ)
  // -------------------------------------------------------------
  const [multiSearch, setMultiSearch] = useState<string>("");
  const [multiFilterCategory, setMultiFilterCategory] = useState<"all" | "lot" | "grn" | "prod" | "fg">("all");

  // Build master batch checklist from system items
  const [batchItems, setBatchItems] = useState<BatchItemEntry[]>([]);

  // Initialize or re-sync batch items from database records
  useEffect(() => {
    const items: BatchItemEntry[] = [];

    // 1. Raw Material Lots
    rawMaterialLots.forEach((l) => {
      items.push({
        id: `lot-${l.id}`,
        selected: false,
        copies: 1,
        category: "raw_material",
        productCode: l.material_code || `RM-${l.material_id}`,
        productName: l.material_name || "สารเคมีในคลัง",
        receivingNo: l.grn_no ? l.grn_no.replace(/^GRN-/, "") : l.supplier_lot_no,
        supplierName: l.supplier_name || "IDEVA / De Roma",
        appearance: l.appearance || "ของเหลว",
        retestDate: formatShortThaiDate(l.retest_date),
        receiveDate: formatShortThaiDate(l.received_date),
        expiryDate: formatShortThaiDate(l.expiry_date),
        inspector: "สุรัสวดี",
        approver: "ณ",
        approvalDate: formatShortThaiDate(l.received_date),
        totalPieces: 1,
        selectedPieces: [1],
        sourceType: "lot"
      });
    });

    // 2. GRNs
    grns.forEach((g) => {
      items.push({
        id: `grn-${g.id}`,
        selected: false,
        copies: 1,
        category: "raw_material",
        productCode: g.material_code || "RM-CHEM",
        productName: g.material_name || "สารเคมีรับเข้า",
        receivingNo: g.code.replace(/^GRN-/, ""),
        supplierName: g.supplier_name || "IDEVA / De Roma",
        appearance: g.appearance || "ของเหลว",
        retestDate: formatShortThaiDate(g.retest_date || g.expiry_date),
        receiveDate: formatShortThaiDate(g.receive_date),
        expiryDate: formatShortThaiDate(g.expiry_date),
        inspector: "สุรัสวดี",
        approver: "ณ",
        approvalDate: formatShortThaiDate(g.receive_date),
        totalPieces: g.label_pieces || 1,
        selectedPieces: Array.from({ length: g.label_pieces || 1 }, (_, i) => i + 1),
        sourceType: "grn"
      });
    });

    // 3. Production Orders
    productionOrders.forEach((po) => {
      const calcPieces = Math.max(1, Math.ceil((po.quantity || 1) / 25));
      items.push({
        id: `prod-${po.id}`,
        selected: false,
        copies: 1,
        category: "product",
        productCode: po.product_code || `PRD-${po.id}`,
        productName: po.product_name || "ชิ้นงานสั่งผลิต",
        receivingNo: po.code,
        supplierName: po.customer_name || "โรงงาน IDEVA",
        appearance: "สารละลายผสมสำเร็จ",
        retestDate: formatShortThaiDate(po.due_date),
        receiveDate: formatShortThaiDate(po.date),
        expiryDate: formatShortThaiDate(po.due_date),
        inspector: "สุรัสวดี",
        approver: "ณ",
        approvalDate: formatShortThaiDate(po.date),
        totalPieces: calcPieces,
        selectedPieces: Array.from({ length: calcPieces }, (_, i) => i + 1),
        sourceType: "prod"
      });
    });

    // 4. Products (FG)
    products.forEach((p) => {
      items.push({
        id: `fg-${p.id}`,
        selected: false,
        copies: 1,
        category: "product",
        productCode: p.code,
        productName: p.name,
        receivingNo: `LOT-${p.code}`,
        supplierName: "IDEVA FACTORY OS",
        appearance: "สินค้าสำเร็จรูป",
        retestDate: formatShortThaiDate(),
        receiveDate: formatShortThaiDate(),
        expiryDate: formatShortThaiDate(new Date(Date.now() + 365*24*60*60*1000).toISOString()),
        inspector: "สุรัสวดี",
        approver: "ณ",
        approvalDate: formatShortThaiDate(),
        totalPieces: 1,
        selectedPieces: [1],
        sourceType: "fg"
      });
    });

    // Keep first 2 items selected by default for easy demo
    if (items.length > 0) items[0].selected = true;
    if (items.length > 1) items[1].selected = true;

    setBatchItems(items);
  }, [rawMaterialLots, grns, productionOrders, products]);

  // Toggle single item selection
  const handleToggleItemSelect = (id: string) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Change copies count for an item
  const handleChangeItemCopies = (id: string, copies: number) => {
    const val = Math.max(1, Math.min(100, copies || 1));
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, copies: val } : item))
    );
  };

  // Select all or deselect all
  const handleSelectAll = (select: boolean) => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Filtered batch items for checklist display
  const filteredBatchItems = useMemo(() => {
    return batchItems.filter((item) => {
      const matchCat =
        multiFilterCategory === "all" || item.sourceType === multiFilterCategory;
      const q = multiSearch.toLowerCase().trim();
      const matchText =
        !q ||
        item.productCode.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.receivingNo.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [batchItems, multiFilterCategory, multiSearch]);

  // Count total selected labels
  const selectedBatchItems = useMemo(() => {
    return batchItems.filter((i) => i.selected);
  }, [batchItems]);

  const totalSelectedLabelsCount = useMemo(() => {
    return selectedBatchItems.reduce((acc, curr) => {
      // If item has selected pieces, count them times copies
      const piecesCount = (curr.selectedPieces && curr.selectedPieces.length > 0) ? curr.selectedPieces.length : 1;
      return acc + (piecesCount * curr.copies);
    }, 0);
  }, [selectedBatchItems]);

  // Quick single preset loader
  const handleSelectPreset = (value: string) => {
    if (!value) return;
    const [type, idStr] = value.split(":");
    const id = Number(idStr);

    if (type === "grn") {
      const g = grns.find((x) => x.id === id);
      if (g) {
        setCategory("raw_material");
        setProductCode(g.material_code || "RM-CHEM");
        setProductName(g.material_name || "สารเคมีรับเข้า");
        setReceivingNo(g.code.replace(/^GRN-/, ""));
        setSupplierName(g.supplier_name || "IDEVA / De Roma");
        setAppearance(g.appearance || "ของเหลว");
        setReceiveDate(formatShortThaiDate(g.receive_date));
        setExpiryDate(formatShortThaiDate(g.expiry_date));
        setRetestDate(formatShortThaiDate(g.retest_date || g.expiry_date));
        setTotalPieces(g.label_pieces || 1);
        setSelectedSinglePieces(Array.from({ length: g.label_pieces || 1 }, (_, i) => i + 1));
      }
    } else if (type === "lot") {
      const l = rawMaterialLots.find((x) => x.id === id);
      if (l) {
        setCategory("raw_material");
        setProductCode(l.material_code || `RM-${l.material_id}`);
        setProductName(l.material_name || "สารเคมีในคลัง");
        setReceivingNo(l.grn_no ? l.grn_no.replace(/^GRN-/, "") : l.supplier_lot_no);
        setSupplierName(l.supplier_name || "IDEVA");
        setAppearance(l.appearance || "ของเหลว");
        setReceiveDate(formatShortThaiDate(l.received_date));
        setExpiryDate(formatShortThaiDate(l.expiry_date));
        setRetestDate(formatShortThaiDate(l.retest_date));
        setTotalPieces(1);
        setSelectedSinglePieces([1]);
      }
    } else if (type === "prod") {
      const p = productionOrders.find((x) => x.id === id);
      if (p) {
        const count = Math.max(1, Math.ceil((p.quantity || 1) / 25));
        setCategory("product");
        setProductCode(p.product_code || `PRD-${p.id}`);
        setProductName(p.product_name || "ชิ้นงานสั่งผลิต");
        setReceivingNo(p.code);
        setSupplierName(p.customer_name || "โรงงาน IDEVA");
        setTotalPieces(count);
        setSelectedSinglePieces(Array.from({ length: count }, (_, i) => i + 1));
        setCurrentPiece(1);
        setReceiveDate(formatShortThaiDate(p.date));
        setExpiryDate(formatShortThaiDate(p.due_date));
        setAppearance("สารละลายผสมสำเร็จ");
      }
    } else if (type === "fg") {
      const prod = products.find((x) => x.id === id);
      if (prod) {
        setCategory("product");
        setProductCode(prod.code);
        setProductName(prod.name);
        setReceivingNo(`LOT-${prod.code}`);
        setSupplierName("IDEVA FACTORY OS");
        setAppearance("สินค้าสำเร็จรูป");
        setTotalPieces(1);
        setSelectedSinglePieces([1]);
      }
    }
  };

  // -------------------------------------------------------------
  // TAB 2: PHYSICAL SCANNER & STOCK COUNTING STATE
  // -------------------------------------------------------------
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [scannedInput, setScannedInput] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [matchedItem, setMatchedItem] = useState<{
    type: "lot" | "material" | "grn" | "production" | "product";
    title: string;
    code: string;
    lotNo?: string;
    systemStock: number;
    unit: string;
    supplier?: string;
    expiryDate?: string;
    qcStatus?: string;
    originalRef: any;
  } | null>(null);

  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [stockCountReason, setStockCountReason] = useState<string>("นับสต็อกประจำวันด้วยเครื่องยิงบาร์โค้ด");
  const [operatorName, setOperatorName] = useState<string>("เจ้าหน้าที่คลังสินค้า");
  const [isSavingStock, setIsSavingStock] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Session scan log
  const [scanHistory, setScanHistory] = useState<{
    id: string;
    barcode: string;
    itemName: string;
    systemQty: number;
    countedQty: number;
    variance: number;
    unit: string;
    time: string;
    status: "adjusted" | "pending";
  }[]>([]);

  // -------------------------------------------------------------
  // PHYSICAL BARCODE SCANNER HARDWARE DECODER & AUTO-FOCUS ENGINE
  // -------------------------------------------------------------
  const scanBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Global keyboard listener for hardware USB/Wireless barcode guns
  useEffect(() => {
    if (activeTab !== "scanner_counter") return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditingUnrelatedInput =
        activeEl &&
        activeEl !== scannerInputRef.current &&
        (activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl.tagName === "INPUT" &&
            (activeEl as HTMLInputElement).type !== "text" &&
            (activeEl as HTMLInputElement).type !== "number") ||
          activeEl.getAttribute("contenteditable") === "true");

      if (isEditingUnrelatedInput) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Physical barcode scanner guns fire rapid keystrokes (< 80ms interval)
      if (timeDiff > 80) {
        scanBufferRef.current = "";
      }

      if (e.key === "Enter") {
        const rawBuffer = scanBufferRef.current.trim();
        if (rawBuffer.length >= 2) {
          scanBufferRef.current = "";
          setScannedInput(rawBuffer);
          handlePerformBarcodeLookup(rawBuffer);
          e.preventDefault();
        } else if (activeEl === scannerInputRef.current && scannedInput.trim()) {
          handlePerformBarcodeLookup(scannedInput);
          e.preventDefault();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Accumulate scanned character
        scanBufferRef.current += e.key;

        // Auto-redirect focus to scanner input
        if (activeEl !== scannerInputRef.current && scannerInputRef.current) {
          scannerInputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [activeTab, scannedInput, rawMaterialLots, grns, productionOrders, products]);

  // Document click auto-refocus for scanner gun readiness
  useEffect(() => {
    if (activeTab !== "scanner_counter") return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        scannerInputRef.current &&
        !target.closest("button") &&
        !target.closest("input") &&
        !target.closest("select") &&
        !target.closest("textarea")
      ) {
        scannerInputRef.current.focus();
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [activeTab]);

  // Hardware-compatible Barcode Lookup Function
  const handlePerformBarcodeLookup = (query: string) => {
    // Clean control characters (STX/ETX), asterisks (*), and whitespace
    const clean = query.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\*+/g, "").trim();
    if (!clean) return;

    const upper = clean.toUpperCase();

    // Parse composite label barcode format: LOT-[PRODUCT_CODE]-[RECEIVING_NO]-P[PIECE]
    // e.g. LOT-RMFL-0257-6162960-P1
    let parsedProductCode = "";
    let parsedReceivingNo = "";
    if (upper.startsWith("LOT-")) {
      const parts = upper.split("-");
      if (parts.length >= 3) {
        parsedProductCode = parts[1]; // e.g. RMFL or RMFL-0257
        if (parts.length >= 4) {
          parsedProductCode = `${parts[1]}-${parts[2]}`;
          parsedReceivingNo = parts[3];
        } else {
          parsedReceivingNo = parts[2];
        }
      }
    }

    // 1. Try matching raw_material_lots (by barcode string, lot_id_code, supplier_lot_no, or composite parts)
    const matchedLot = rawMaterialLots.find((l) => {
      const bCode = (l.barcode || "").toUpperCase();
      const lotId = (l.lot_id_code || "").toUpperCase();
      const supLot = (l.supplier_lot_no || "").toUpperCase();
      const matCode = (l.material_code || "").toUpperCase();
      const grn = (l.grn_no || "").toUpperCase();

      return (
        bCode === upper ||
        lotId === upper ||
        supLot === upper ||
        upper.includes(lotId) ||
        upper.includes(supLot) ||
        (parsedProductCode && matCode.includes(parsedProductCode)) ||
        (parsedReceivingNo && grn.includes(parsedReceivingNo)) ||
        (clean.length >= 3 && (matCode.includes(upper) || grn.includes(upper)))
      );
    });

    if (matchedLot) {
      if (soundEnabled) playScannerBeep("success");
      const mat = rawMaterials.find((m) => m.id === matchedLot.material_id);
      const sysQty = matchedLot.remaining_qty || matchedLot.received_qty;
      setMatchedItem({
        type: "lot",
        title: matchedLot.material_name || mat?.name || "วัตถุดิบเคมีภัณฑ์",
        code: matchedLot.material_code || mat?.code || "RM",
        lotNo: matchedLot.lot_id_code || matchedLot.supplier_lot_no,
        systemStock: sysQty,
        unit: matchedLot.purchase_unit || mat?.default_unit || "KG",
        supplier: matchedLot.supplier_name || mat?.supplier_name,
        expiryDate: matchedLot.expiry_date,
        qcStatus: matchedLot.qc_status,
        originalRef: matchedLot
      });
      setPhysicalCount(sysQty);
      setStatusMessage({ text: `[ยิงสำเร็จ 100%] พบล็อตสารเคมี: ${matchedLot.material_name} (${matchedLot.lot_id_code})`, type: "success" });
      return;
    }

    // 2. Try matching raw_materials master
    const matchedMat = rawMaterials.find((m) => {
      const code = (m.code || "").toUpperCase();
      const name = (m.name || "").toUpperCase();
      return (
        code === upper ||
        upper.includes(code) ||
        (parsedProductCode && code.includes(parsedProductCode)) ||
        name.includes(upper)
      );
    });

    if (matchedMat) {
      if (soundEnabled) playScannerBeep("success");
      setMatchedItem({
        type: "material",
        title: matchedMat.name,
        code: matchedMat.code,
        systemStock: matchedMat.stock_qty || 0,
        unit: matchedMat.default_unit || "KG",
        supplier: matchedMat.supplier_name || matchedMat.supplier,
        qcStatus: "Active Master",
        originalRef: matchedMat
      });
      setPhysicalCount(matchedMat.stock_qty || 0);
      setStatusMessage({ text: `[ยิงสำเร็จ 100%] พบเคมีดิบ: ${matchedMat.name} (${matchedMat.code})`, type: "success" });
      return;
    }

    // 3. Try matching GRNs
    const matchedGrn = grns.find((g) => {
      const code = (g.code || "").toUpperCase();
      const grnNum = code.replace(/^GRN-/, "");
      const lot = (g.lot_number || g.supplier_lot_no || "").toUpperCase();
      return (
        code === upper ||
        lot === upper ||
        upper.includes(code) ||
        upper.includes(grnNum) ||
        (parsedReceivingNo && (code.includes(parsedReceivingNo) || grnNum.includes(parsedReceivingNo)))
      );
    });

    if (matchedGrn) {
      if (soundEnabled) playScannerBeep("success");
      setMatchedItem({
        type: "grn",
        title: matchedGrn.material_name || "สารเคมีรับเข้า",
        code: matchedGrn.material_code || "RM-GRN",
        lotNo: matchedGrn.code,
        systemStock: matchedGrn.received_qty || 0,
        unit: "KG",
        supplier: matchedGrn.supplier_name,
        expiryDate: matchedGrn.expiry_date,
        qcStatus: matchedGrn.qc_status || "รับเข้าแล้ว",
        originalRef: matchedGrn
      });
      setPhysicalCount(matchedGrn.received_qty || 0);
      setStatusMessage({ text: `[ยิงสำเร็จ 100%] พบเอกสารรับเข้า GRN: ${matchedGrn.code}`, type: "success" });
      return;
    }

    // 4. Try matching Production Orders
    const matchedPo = productionOrders.find((p) => {
      const code = (p.code || "").toUpperCase();
      const pCode = (p.product_code || "").toUpperCase();
      return (
        code === upper ||
        pCode === upper ||
        upper.includes(code) ||
        upper.includes(pCode) ||
        (parsedProductCode && pCode.includes(parsedProductCode))
      );
    });

    if (matchedPo) {
      if (soundEnabled) playScannerBeep("success");
      setMatchedItem({
        type: "production",
        title: matchedPo.product_name || "ชิ้นงานสั่งผลิต",
        code: matchedPo.product_code || matchedPo.code,
        lotNo: matchedPo.code,
        systemStock: matchedPo.quantity || 0,
        unit: matchedPo.unit || "ชิ้น",
        supplier: matchedPo.customer_name,
        qcStatus: matchedPo.status,
        originalRef: matchedPo
      });
      setPhysicalCount(matchedPo.quantity || 0);
      setStatusMessage({ text: `[ยิงสำเร็จ 100%] พบใบสั่งผลิต: ${matchedPo.code}`, type: "success" });
      return;
    }

    // 5. Try matching Finished Goods Products
    const matchedProd = products.find((p) => {
      const code = (p.code || "").toUpperCase();
      return code === upper || upper.includes(code);
    });

    if (matchedProd) {
      if (soundEnabled) playScannerBeep("success");
      setMatchedItem({
        type: "product",
        title: matchedProd.name,
        code: matchedProd.code,
        systemStock: 0,
        unit: "ขวด",
        qcStatus: matchedProd.status,
        originalRef: matchedProd
      });
      setPhysicalCount(0);
      setStatusMessage({ text: `[ยิงสำเร็จ 100%] พบสินค้าสำเร็จรูป: ${matchedProd.name}`, type: "success" });
      return;
    }

    // Not found
    if (soundEnabled) playScannerBeep("error");
    setStatusMessage({ text: `ไม่พบข้อมูลสำหรับบาร์โค้ด "${clean}" ในระบบ Firebase`, type: "error" });
  };

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePerformBarcodeLookup(scannedInput);
    }
  };

  // Save stock adjustment handler
  const handleSaveAdjustment = async () => {
    if (!matchedItem) return;
    setIsSavingStock(true);
    const variance = physicalCount - matchedItem.systemStock;

    try {
      if (onSaveStockCount) {
        await onSaveStockCount({
          lotId: matchedItem.type === "lot" ? matchedItem.originalRef.id : undefined,
          materialId: matchedItem.type === "material" ? matchedItem.originalRef.id : (matchedItem.originalRef.material_id || undefined),
          countedQtyKg: physicalCount,
          varianceKg: variance,
          reason: stockCountReason,
          countedBy: operatorName,
          location: "จุดตรวจนับบาร์โค้ด (Scanner Station)"
        });
      }

      setScanHistory((prev) => [
        {
          id: String(Date.now()),
          barcode: scannedInput || matchedItem.code,
          itemName: matchedItem.title,
          systemQty: matchedItem.systemStock,
          countedQty: physicalCount,
          variance,
          unit: matchedItem.unit,
          time: new Date().toLocaleTimeString("th-TH"),
          status: "adjusted"
        },
        ...prev
      ]);

      if (soundEnabled) playScannerBeep("success");
      setStatusMessage({ text: `ปรับปรุงยอดสต็อกสำเร็จ! บันทึกยอดนับจริง ${physicalCount} ${matchedItem.unit} ลง Firebase แล้ว`, type: "success" });

      setScannedInput("");
      setMatchedItem(null);
      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      if (soundEnabled) playScannerBeep("error");
      setStatusMessage({ text: `เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถบันทึกได้"}`, type: "error" });
    } finally {
      setIsSavingStock(false);
    }
  };

  // Print execution handler
  const handlePrint = () => {
    window.print();
  };

  // Determine list of labels to render for printing
  const labelsToRender = useMemo(() => {
    if (selectionMode === "multi_select") {
      const list: {
        category: "raw_material" | "packaging" | "product";
        productCode: string;
        productName: string;
        receivingNo: string;
        pieceNum: number;
        totalPieces: number;
        supplierName: string;
        appearance: string;
        retestDate: string;
        receiveDate: string;
        expiryDate: string;
        inspector: string;
        approver: string;
        approvalDate: string;
        barcodeText: string;
      }[] = [];

      selectedBatchItems.forEach((item) => {
        const pieces = item.selectedPieces.length > 0 ? item.selectedPieces : [1];
        // Repeat for copies
        for (let copyIdx = 0; copyIdx < (item.copies || 1); copyIdx++) {
          pieces.forEach((pieceNum) => {
            list.push({
              category: item.category,
              productCode: item.productCode,
              productName: item.productName,
              receivingNo: item.receivingNo,
              pieceNum,
              totalPieces: item.totalPieces,
              supplierName: item.supplierName,
              appearance: item.appearance,
              retestDate: item.retestDate,
              receiveDate: item.receiveDate,
              expiryDate: item.expiryDate,
              inspector: item.inspector,
              approver: item.approver,
              approvalDate: item.approvalDate,
              barcodeText: `LOT-${item.productCode}-${item.receivingNo}-P${pieceNum}`
            });
          });
        }
      });
      return list;
    } else {
      // Single Item Mode (selected piece numbers)
      const list = selectedSinglePieces.map((pieceNum) => ({
        category,
        productCode,
        productName,
        receivingNo,
        pieceNum,
        totalPieces,
        supplierName,
        appearance,
        retestDate,
        receiveDate,
        expiryDate,
        inspector,
        approver,
        approvalDate,
        barcodeText: customBarcodeText || `LOT-${productCode}-${receivingNo}-P${pieceNum}`
      }));
      return list.length > 0 ? list : [{
        category,
        productCode,
        productName,
        receivingNo,
        pieceNum: currentPiece,
        totalPieces,
        supplierName,
        appearance,
        retestDate,
        receiveDate,
        expiryDate,
        inspector,
        approver,
        approvalDate,
        barcodeText: customBarcodeText || `LOT-${productCode}-${receivingNo}-P${currentPiece}`
      }];
    }
  }, [
    selectionMode,
    selectedBatchItems,
    selectedSinglePieces,
    category,
    productCode,
    productName,
    receivingNo,
    totalPieces,
    currentPiece,
    supplierName,
    appearance,
    retestDate,
    receiveDate,
    expiryDate,
    inspector,
    approver,
    approvalDate,
    customBarcodeText
  ]);

  const isPortrait80x50 = printerPaperSize === "thermal_80x50_portrait";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>FM-QC-17 REV:01 STANDARD SYSTEM (ขนาด 80x50 MM แนวตั้ง)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              ศูนย์ออกบาร์โค้ด & พิมพ์ป้ายชี้บ่งผ่าน QC
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              รองรับม้วนสติ๊กเกอร์ความร้อน **ขนาด 80x50 MM แนวตั้ง** (สีเขียวตองอ่อน) 
              และระบบติ๊กถูกเลือกพิมพ์ได้หลายรายการพร้อมกัน พิมพ์กี่ใบก็ได้ตามที่เลือก 
              พร้อมรหัสบาร์โค้ด Code-128 สำหรับเครื่องยิงสแกนเนอร์นับสต็อก
            </p>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab("label_generator")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                activeTab === "label_generator"
                  ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-102"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Printer className="w-4 h-4" /> ออกบาร์โค้ด & พิมพ์ป้าย QC
            </button>
            <button
              onClick={() => setActiveTab("scanner_counter")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                activeTab === "scanner_counter"
                  ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-102"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Scan className="w-4 h-4" /> เครื่องยิงสแกนนับสต็อก
            </button>
            <button
              onClick={() => setActiveTab("barcode_registry")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                activeTab === "barcode_registry"
                  ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-102"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <BarcodeIcon className="w-4 h-4" /> ทะเบียนบาร์โค้ด ({rawMaterialLots.length + grns.length + productionOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ออกบาร์โค้ด & พิมพ์ป้ายผ่าน QC (FM-QC-17 REV:01)                      */}
      {/* ========================================================================= */}
      {activeTab === "label_generator" && (
        <div className="space-y-5">
          {/* Top Paper & Print Mode Configuration Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Paper Size Preset Selection (Highlight 80x50 Portrait) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> ขนาดป้ายสติ๊กเกอร์:
              </span>

              {/* 80x50 MM แนวตั้ง (Default & Highlighted) */}
              <button
                type="button"
                onClick={() => setPrinterPaperSize("thermal_80x50_portrait")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                  printerPaperSize === "thermal_80x50_portrait"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span>⭐ 80x50 MM แนวตั้ง (ตามม้วนสีเขียว)</span>
                {printerPaperSize === "thermal_80x50_portrait" && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setPrinterPaperSize("thermal_80x50_landscape")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  printerPaperSize === "thermal_80x50_landscape"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span>80x50 MM แนวนอน</span>
              </button>

              <button
                type="button"
                onClick={() => setPrinterPaperSize("thermal_100x75")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  printerPaperSize === "thermal_100x75"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span>100x75 MM</span>
              </button>

              <button
                type="button"
                onClick={() => setPrinterPaperSize("a4_sheet")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  printerPaperSize === "a4_sheet"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span>แผ่น A4 หลายดวง</span>
              </button>
            </div>

            {/* Selection Mode Switch: Multi-Select vs Single */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectionMode("multi_select")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectionMode === "multi_select"
                    ? "bg-white text-emerald-800 shadow-sm font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>ติ๊กถูกเลือกหลายรายการ ({totalSelectedLabelsCount} ใบ)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectionMode("single")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectionMode === "single"
                    ? "bg-white text-emerald-800 shadow-sm font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>ปรับแต่งฟอร์มเดี่ยว</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Controls or Multi-Select Checklist (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* ================================================================= */}
              {/* MULTI-SELECT CHECKLIST PANEL (ติ๊กถูกเลือกหลายรายการตามต้องการ)   */}
              {/* ================================================================= */}
              {selectionMode === "multi_select" && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600" /> ติ๊กถูกเลือกรายการที่ต้องการพิมพ์
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ติ๊กเลือกรายการใดก็ได้ และกำหนดจำนวนใบที่ต้องการพิมพ์ในแต่ละรายการ
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-300 cursor-pointer"
                      >
                        ปลดทั้งหมด
                      </button>
                    </div>
                  </div>

                  {/* Search & Filter Strip */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={multiSearch}
                        onChange={(e) => setMultiSearch(e.target.value)}
                        placeholder="ค้นหาตามรหัส, ชื่อสินค้า, เลขที่รับ..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setMultiFilterCategory("all")}
                        className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                          multiFilterCategory === "all" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        ทั้งหมด ({batchItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiFilterCategory("lot")}
                        className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                          multiFilterCategory === "lot" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        สารเคมี Lots ({batchItems.filter((i) => i.sourceType === "lot").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiFilterCategory("grn")}
                        className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                          multiFilterCategory === "grn" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        รับเข้า GRN ({batchItems.filter((i) => i.sourceType === "grn").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMultiFilterCategory("prod")}
                        className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                          multiFilterCategory === "prod" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        สั่งผลิต ({batchItems.filter((i) => i.sourceType === "prod").length})
                      </button>
                    </div>
                  </div>

                  {/* Checklist Table of Items */}
                  <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredBatchItems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        ไม่พบรายการที่ตรงกับคำค้นหา
                      </div>
                    ) : (
                      filteredBatchItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all text-xs ${
                            item.selected
                              ? "bg-emerald-50/70 border-emerald-500 shadow-2xs"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-start gap-2.5 flex-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleToggleItemSelect(item.id)}
                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                              />
                              <div className="space-y-0.5 flex-1">
                                <div className="font-bold text-slate-900 line-clamp-1">
                                  {item.productName}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                  <span className="font-bold text-slate-700">{item.productCode}</span>
                                  <span>•</span>
                                  <span>เลขที่รับ: {item.receivingNo}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  ผู้จำหน่าย: {item.supplierName} | หมดอายุ: {item.expiryDate}
                                </div>
                              </div>
                            </label>

                            {/* Copies Counter */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold text-slate-500">จำนวนใบ:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={item.copies}
                                  onChange={(e) => handleChangeItemCopies(item.id, parseInt(e.target.value) || 1)}
                                  className="w-12 px-1.5 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs"
                                  title="จำนวนใบที่ต้องการพิมพ์"
                                />
                                <span className="text-[10px] text-slate-500">ใบ</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Summary Bar & Direct Print Button */}
                  <div className="p-4 bg-emerald-950 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div>
                      <div className="text-xs font-bold text-emerald-300">
                        เลือกแล้ว {selectedBatchItems.length} รายการ (พิมพ์แยกแผ่นละ 1 ใบ)
                      </div>
                      <div className="text-sm font-black text-white">
                        รวมทั้งหมด {totalSelectedLabelsCount} ใบ (ขนาดใบละ 80x50 MM แนวตั้ง)
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={totalSelectedLabelsCount === 0}
                      onClick={handlePrint}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <Printer className="w-4 h-4" /> 🖨️ สั่งพิมพ์ใบละ 80x50 MM แนวตั้ง ({totalSelectedLabelsCount} ใบ)
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SINGLE ITEM DESIGNER (ปรับแต่งฟอร์มเดี่ยว)                          */}
              {/* ================================================================= */}
              {selectionMode === "single" && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600" /> ปรับแต่งข้อมูลป้ายชี้บ่งเดี่ยว
                    </h3>
                  </div>

                  {/* Quick Preset Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">ดึงข้อมูลชิ้นงานอัตโนมัติ:</label>
                    <select
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      defaultValue=""
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="">-- เลือกรายการชิ้นงานในระบบ --</option>
                      {rawMaterialLots.length > 0 && (
                        <optgroup label="🧪 ล็อตวัตถุดิบเคมีภัณฑ์ (Lots)">
                          {rawMaterialLots.map((l) => (
                            <option key={`lot:${l.id}`} value={`lot:${l.id}`}>
                              {l.lot_id_code} - {l.material_name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {grns.length > 0 && (
                        <optgroup label="📥 ใบรับเข้าสารเคมี (GRN)">
                          {grns.map((g) => (
                            <option key={`grn:${g.id}`} value={`grn:${g.id}`}>
                              {g.code} - {g.material_name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {productionOrders.length > 0 && (
                        <optgroup label="🏭 ใบสั่งผลิตชิ้นงาน (Production Orders)">
                          {productionOrders.map((po) => (
                            <option key={`prod:${po.id}`} value={`prod:${po.id}`}>
                              {po.code} - {po.product_name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Category Radio */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">ประเภทชิ้นงาน:</label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setCategory("raw_material")}
                        className={`py-1.5 px-2 rounded-lg font-bold border transition-all cursor-pointer text-center ${
                          category === "raw_material"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        สารวัตถุดิบ (Ø)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategory("packaging")}
                        className={`py-1.5 px-2 rounded-lg font-bold border transition-all cursor-pointer text-center ${
                          category === "packaging"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        บรรจุภัณฑ์ (Ø)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategory("product")}
                        className={`py-1.5 px-2 rounded-lg font-bold border transition-all cursor-pointer text-center ${
                          category === "product"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ชิ้นงานผลิต (Ø)
                      </button>
                    </div>
                  </div>

                  {/* Code & Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">รหัสสินค้า (Product Code):</label>
                      <input
                        type="text"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อสินค้า (Product Name):</label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full px-3 py-1.5 font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Receiving No & Piece Counts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">เลขที่รับ (Receiving No.):</label>
                      <input
                        type="text"
                        value={receivingNo}
                        onChange={(e) => setReceivingNo(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">จำนวนชิ้นงานทั้งหมด (Total Pieces):</label>
                      <input
                        type="number"
                        min="1"
                        value={totalPieces}
                        onChange={(e) => setTotalPieces(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  {/* Individual Piece Checkboxes (ติ๊กเลือกชิ้นที่ต้องการพิมพ์) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        ติ๊กเลือกชิ้นงานที่ต้องการพิมพ์ ({selectedSinglePieces.length} / {totalPieces} ชิ้น):
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedSinglePieces(Array.from({ length: totalPieces }, (_, i) => i + 1))}
                          className="text-emerald-700 hover:underline font-bold cursor-pointer"
                        >
                          เลือกทุกชิ้น
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSinglePieces([1])}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          ชิ้นที่ 1
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalPieces }, (_, i) => i + 1).map((p) => {
                        const isChecked = selectedSinglePieces.includes(p);
                        return (
                          <label
                            key={p}
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                              isChecked
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedSinglePieces(selectedSinglePieces.filter((x) => x !== p));
                                } else {
                                  setSelectedSinglePieces([...selectedSinglePieces, p].sort((a, b) => a - b));
                                }
                              }}
                              className="sr-only"
                            />
                            <span>ชิ้นที่ {p}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Supplier & Appearance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ผู้ผลิต ผู้จำหน่าย:</label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ลักษณะสินค้า (Appearance):</label>
                      <input
                        type="text"
                        value={appearance}
                        onChange={(e) => setAppearance(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">วันที่ทดสอบซ้ำ:</label>
                      <input
                        type="text"
                        value={retestDate}
                        onChange={(e) => setRetestDate(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">วันที่รับเข้า:</label>
                      <input
                        type="text"
                        value={receiveDate}
                        onChange={(e) => setReceiveDate(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">วันหมดอายุ:</label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Inspector & Approver */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ผู้ตรวจสอบ (Inspector):</label>
                      <input
                        type="text"
                        value={inspector}
                        onChange={(e) => setInspector(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ผู้อนุมัติ (Approver):</label>
                      <input
                        type="text"
                        value={approver}
                        onChange={(e) => setApprover(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <Printer className="w-4 h-4" /> สั่งพิมพ์ {labelsToRender.length} ใบ (80x50 แนวตั้ง)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Printable Preview (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-100 rounded-3xl p-5 border border-slate-300 shadow-inner flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      ตัวอย่างป้ายที่จะพิมพ์ ({labelsToRender.length} ใบ)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      {isPortrait80x50 ? "80x50 MM แนวตั้ง (50x80mm Roll)" :
                       printerPaperSize === "thermal_80x50_landscape" ? "80x50 MM แนวนอน" :
                       printerPaperSize === "thermal_100x75" ? "100x75 MM" : "A4 Multi-Sticker"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> 🖨️ สั่งพิมพ์ใบละ 80x50 MM แนวตั้ง ({labelsToRender.length} ใบ)
                  </button>
                </div>

                {/* Printable container displaying labels in 80x50 portrait layout at FULL size */}
                <div className="space-y-6 w-full flex flex-col items-center max-h-[780px] overflow-y-auto pr-1">
                  {labelsToRender.map((label, idx) => {
                    const encoded = encodeCode128B(label.barcodeText, 10);

                    return (
                      <div key={idx} className="w-full max-w-[400px] sm:max-w-[440px] flex flex-col items-center">
                        {/* Sheet Number Badge */}
                        <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-t-xl border-t border-x border-slate-300">
                          <span className="flex items-center gap-1 text-emerald-800">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            แผ่นที่ {idx + 1} / {labelsToRender.length} (เต็มขนาด 80x50 MM แนวตั้ง)
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{label.barcodeText}</span>
                        </div>

                        <div
                          className={`printable-qc-label-item rounded-b-xl border-3 border-emerald-950 p-4 shadow-xl font-sans relative overflow-hidden select-none transition-all w-full text-xs sm:text-sm`}
                          style={{
                            backgroundColor: "#52d265", // Exact spring lime green from S__96083992_4e11784c.jpg
                            color: "#052e16",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)"
                          }}
                        >
                        {/* Header: ป้ายชี้บ่ง */}
                        <div className="text-center mb-0.5">
                          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-emerald-950 inline-block px-3">
                            ป้ายชี้บ่ง
                          </h2>
                        </div>

                        {/* Category Radio: Ø สารวัตถุดิบ   O บรรจุภัณฑ์ */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs font-black my-1 text-emerald-950">
                          <div className="flex items-center gap-1">
                            <span className="text-base font-black font-mono">
                              {label.category === "raw_material" ? "Ø" : "O"}
                            </span>
                            <span className={label.category === "raw_material" ? "underline underline-offset-2 decoration-2" : ""}>
                              สารวัตถุดิบ
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-base font-black font-mono">
                              {label.category === "packaging" ? "Ø" : "O"}
                            </span>
                            <span className={label.category === "packaging" ? "underline underline-offset-2 decoration-2" : ""}>
                              บรรจุภัณฑ์
                            </span>
                          </div>
                          {label.category === "product" && (
                            <div className="flex items-center gap-1">
                              <span className="text-base font-black font-mono">Ø</span>
                              <span className="underline underline-offset-2 decoration-2">
                                ชิ้นงาน
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Form Content Grid matching S__95477832.jpg in 80x50 Portrait */}
                        <div className="space-y-1 text-xs font-bold border-t-2 border-b-2 border-emerald-950 py-1.5">
                          {/* 1. รหัสสินค้า (Product Code) */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <span className="shrink-0 text-emerald-950 font-black text-[11px]">
                              รหัสสินค้า(Product Code):
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950 tracking-wide truncate max-w-[170px] text-right">
                              {label.productCode}
                            </span>
                          </div>

                          {/* 2. ชื่อสินค้า (Product Name) */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <span className="shrink-0 text-emerald-950 font-black text-[11px]">
                              ชื่อสินค้า(Product Name):
                            </span>
                            <span className="font-black text-[11px] sm:text-xs text-emerald-950 truncate max-w-[170px] text-right">
                              {label.productName}
                            </span>
                          </div>

                          {/* 3. เลขที่รับ (Receiving No.) & ชิ้นที่ */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                เลขที่รับ:
                              </span>
                              <span className="font-mono font-black text-[11px] text-emerald-950">
                                {label.receivingNo}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                ชิ้นที่:
                              </span>
                              <span className="font-mono font-black text-[11px] text-emerald-950">
                                {label.pieceNum} / {label.totalPieces}
                              </span>
                            </div>
                          </div>

                          {/* 4. ผู้ผลิต ผู้จำหน่าย */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                              ผู้ผลิต ผู้จำหน่าย:
                            </span>
                            <span className="font-black text-[10px] text-emerald-950 truncate max-w-[160px] text-right">
                              {label.supplierName}
                            </span>
                          </div>

                          {/* 5. ลักษณะสินค้า (Appearance) */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                              ลักษณะสินค้า (Appearance):
                            </span>
                            <span className="font-black text-[10px] text-emerald-950">
                              {label.appearance}
                            </span>
                          </div>

                          {/* 6. วันที่ทดสอบซ้ำ */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                              วันที่ทดสอบซ้ำ :
                            </span>
                            <span className="font-mono font-black text-[10px] text-emerald-950">
                              {label.retestDate}
                            </span>
                          </div>

                          {/* 7. วันที่รับเข้า & วันหมดอายุ */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                วันรับเข้า:
                              </span>
                              <span className="font-mono font-black text-[10px] text-emerald-950">
                                {label.receiveDate}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                หมดอายุ:
                              </span>
                              <span className="font-mono font-black text-[10px] text-emerald-950">
                                {label.expiryDate}
                              </span>
                            </div>
                          </div>

                          {/* 8. ผู้ตรวจสอบ & วันที่ */}
                          <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                ผู้ตรวจสอบ:
                              </span>
                              <span className="font-black text-[10px] text-emerald-950">
                                {label.inspector}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                วันที่:
                              </span>
                              <span className="font-mono font-black text-[10px] text-emerald-950">
                                {label.receiveDate}
                              </span>
                            </div>
                          </div>

                          {/* 9. ผู้อนุมัติ & วันที่ */}
                          <div className="flex items-baseline justify-between pb-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                ผู้อนุมัติ:
                              </span>
                              <span className="font-black text-[10px] text-emerald-950">
                                {label.approver}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="shrink-0 text-emerald-950 font-black text-[10px]">
                                วันที่:
                              </span>
                              <span className="font-mono font-black text-[10px] text-emerald-950">
                                {label.approvalDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Barcode Section for Thermal Printing */}
                        <div className="my-1.5 bg-white p-1.5 rounded-lg border-2 border-emerald-950 flex flex-col items-center justify-center">
                          <svg
                            className="w-full h-7 sm:h-8"
                            viewBox={`0 0 ${encoded.totalWidth} 36`}
                            preserveAspectRatio="none"
                            style={{ display: "block" }}
                          >
                            <rect x="0" y="0" width={encoded.totalWidth} height="36" fill="#ffffff" />
                            {encoded.bars.map((b, i) => {
                              if (!b.isBlack) return null;
                              return (
                                <rect
                                  key={i}
                                  x={b.x}
                                  y="0"
                                  width={b.width}
                                  height="36"
                                  fill="#000000"
                                />
                              );
                            })}
                          </svg>
                          <div className="font-mono text-[9px] sm:text-[10px] font-black text-emerald-950 tracking-wider mt-0.5">
                            *{label.barcodeText}*
                          </div>
                        </div>

                        {/* Footer: Approved FM-QC-17 REV:01 */}
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black pt-0.5 text-emerald-950">
                          <span className="uppercase tracking-wider">อนุมัติ (Approved)</span>
                          <span className="font-mono tracking-widest">FM-QC-17 REV:01</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                <div className="mt-4 text-center text-xs text-slate-500">
                  💡 กำหนดขนาดกระดาษในหน้าต่างพิมพ์เป็น **50mm × 80mm** (หรือเลือกเครื่องพิมพ์ม้วนสติ๊กเกอร์ความร้อน)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: เครื่องยิงสแกนนับสต็อก (Physical Barcode Gun & Stock Counter)        */}
      {/* ========================================================================= */}
      {activeTab === "scanner_counter" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-lg space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-md">
                    <Scan className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-bold text-slate-900">
                        จุดยิงสแกนเนอร์นับสต็อก (Hardware Barcode Gun Station)
                      </h3>
                      <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-black rounded-full flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                        พร้อมรับสัญญาณยิง 100%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      รองรับเครื่องยิงบาร์โค้ด USB/Wireless/Bluetooth ยิงบาร์โค้ดจากป้ายชิ้นงานได้ทันทีโดยไม่ต้องใช้เมาส์
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    soundEnabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}
                  title={soundEnabled ? "ปิดเสียงบี๊บสแกนเนอร์" : "เปิดเสียงบี๊บสแกนเนอร์"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{soundEnabled ? "เสียงบี๊บ: เปิด" : "เสียงบี๊บ: ปิด"}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  ref={scannerInputRef}
                  type="text"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  onKeyDown={handleScannerKeyDown}
                  placeholder="พร้อมรับสัญญาณยิงสแกนเนอร์... (หรือพิมพ์รหัสบาร์โค้ดแล้วกด Enter)"
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border-2 border-emerald-400 focus:border-emerald-600 focus:bg-white rounded-2xl font-mono text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 shadow-inner focus:outline-none transition-all"
                  autoFocus
                />
                <BarcodeIcon className="w-6 h-6 text-emerald-600 absolute left-3.5 top-3.5" />
                
                <button
                  type="button"
                  onClick={() => handlePerformBarcodeLookup(scannedInput)}
                  className="absolute right-2 top-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  ค้นหา (Enter)
                </button>
              </div>

              {statusMessage && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-1 ${
                  statusMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                  statusMessage.type === "error" ? "bg-red-50 text-red-800 border border-red-200" :
                  "bg-blue-50 text-blue-800 border border-blue-200"
                }`}>
                  {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {statusMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                  {statusMessage.type === "info" && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {matchedItem ? (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {matchedItem.type === "lot" ? "ล็อตสารเคมีในคลัง" :
                         matchedItem.type === "material" ? "วัตถุดิบเคมีดิบ" :
                         matchedItem.type === "grn" ? "เอกสารรับเข้า GRN" :
                         matchedItem.type === "production" ? "ใบสั่งผลิต" : "สินค้าสำเร็จรูป"}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">
                        {matchedItem.title}
                      </h4>
                      <p className="text-xs font-mono font-bold text-slate-600">
                        รหัส: {matchedItem.code} {matchedItem.lotNo && `| Lot: ${matchedItem.lotNo}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-bold">ยอดในระบบ (System)</div>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {matchedItem.systemStock.toLocaleString()} <span className="text-xs font-bold">{matchedItem.unit}</span>
                      </div>
                      {matchedItem.qcStatus && (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          matchedItem.qcStatus.includes("Passed") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {matchedItem.qcStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        จำนวนที่นับได้จริงหน้างาน (Physical Count):
                      </label>
                      <div className="text-xs font-bold">
                        ผลต่าง (Variance):{" "}
                        <span className={`font-mono text-sm font-black ${
                          physicalCount - matchedItem.systemStock === 0 ? "text-emerald-600" :
                          physicalCount - matchedItem.systemStock > 0 ? "text-blue-600" : "text-red-600"
                        }`}>
                          {physicalCount - matchedItem.systemStock > 0 ? `+${physicalCount - matchedItem.systemStock}` : physicalCount - matchedItem.systemStock} {matchedItem.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPhysicalCount(Math.max(0, physicalCount - 10))}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhysicalCount(Math.max(0, physicalCount - 1))}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={physicalCount}
                        onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
                        className="flex-1 py-2 text-center font-mono text-lg font-black bg-slate-50 border-2 border-emerald-500 rounded-xl focus:bg-white focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setPhysicalCount(physicalCount + 1)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhysicalCount(physicalCount + 10)}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        +10
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">สาเหตุการปรับยอด / บันทึก:</label>
                        <input
                          type="text"
                          value={stockCountReason}
                          onChange={(e) => setStockCountReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ผู้ตรวจนับ:</label>
                        <input
                          type="text"
                          value={operatorName}
                          onChange={(e) => setOperatorName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setMatchedItem(null)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        disabled={isSavingStock}
                        onClick={handleSaveAdjustment}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                      >
                        {isSavingStock ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> กำลังบันทึก Firebase...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> บันทึกปรับยอดสต็อกลง Firebase ทันที
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <BarcodeIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-600">
                    ยังไม่มีรายการที่กำลังตรวจนับ
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    ยิงสแกนบาร์โค้ดจากป้ายชิ้นงาน หรือเลือกจากรายการล็อตด้านล่างเพื่อเริ่มนับสต็อก
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" /> ประวัติการยิงสแกนรอบนี้ ({scanHistory.length})
                </h3>
                {scanHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScanHistory([])}
                    className="text-[11px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    ล้างประวัติ
                  </button>
                )}
              </div>

              {scanHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  ยังไม่มีประวัติการยิงสแกนในเซสชันนี้
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {scanHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-800 truncate max-w-[180px]">{h.itemName}</span>
                        <span className="font-mono text-slate-500 text-[10px]">{h.time}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>รหัส: <strong className="font-mono">{h.barcode}</strong></span>
                        <span>นับได้: <strong className="text-slate-900 font-mono">{h.countedQty} {h.unit}</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-200">
                        <span className="text-slate-500">ระบบเดิม: {h.systemQty} {h.unit}</span>
                        <span className={`font-mono font-bold ${
                          h.variance === 0 ? "text-emerald-600" : h.variance > 0 ? "text-blue-600" : "text-red-600"
                        }`}>
                          ผลต่าง: {h.variance > 0 ? `+${h.variance}` : h.variance} {h.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> คลิกทดสอบบาร์โค้ดจำลอง (Fast Test Scan):
              </h3>
              <p className="text-[11px] text-slate-500">
                หากยังไม่มีเครื่องยิงบาร์โค้ดต่ออยู่ สามารถคลิกรายการด้านล่างเพื่อจำลองการยิงสแกนได้ทันที
              </p>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {rawMaterialLots.slice(0, 6).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setScannedInput(l.lot_id_code);
                      handlePerformBarcodeLookup(l.lot_id_code);
                    }}
                    className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="truncate max-w-[200px]">
                      <div className="font-bold text-slate-800">{l.material_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{l.lot_id_code}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {l.remaining_qty || l.received_qty} {l.purchase_unit || "KG"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ทะเบียนบาร์โค้ด & ประวัติการออกป้าย (Barcode Master Registry)          */}
      {/* ========================================================================= */}
      {activeTab === "barcode_registry" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarcodeIcon className="w-5 h-5 text-emerald-600" />
                ทะเบียนบาร์โค้ดทั้งหมดในระบบโรงงาน (Barcode Registry)
              </h3>
              <p className="text-xs text-slate-500">
                รวมรหัสบาร์โค้ดทุกล็อตที่รับเข้า สารเคมีดิบ และใบสั่งผลิต พร้อมสั่งพิมพ์ป้ายชี้บ่งทันที
              </p>
            </div>
            
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> พิมพ์ป้ายชี้บ่ง
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">รหัสบาร์โค้ด (Barcode Value)</th>
                  <th className="p-3">ชื่อรายการ / ชิ้นงาน</th>
                  <th className="p-3">เลขที่รับ / แบทช์</th>
                  <th className="p-3 text-right">จำนวนในระบบ</th>
                  <th className="p-3">วันหมดอายุ</th>
                  <th className="p-3 text-center">สถานะ QC</th>
                  <th className="p-3 text-center">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawMaterialLots.map((l) => (
                  <tr key={`lot-${l.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        ล็อตวัตถุดิบเคมี
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {l.barcode || l.lot_id_code}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {l.material_name}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {l.grn_no || l.supplier_lot_no}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {(l.remaining_qty || l.received_qty || 0).toLocaleString()} {l.purchase_unit || "KG"}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {formatShortThaiDate(l.expiry_date)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.qc_status === "QC Passed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {l.qc_status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMode("single");
                          setCategory("raw_material");
                          setProductCode(l.material_code || `RM-${l.material_id}`);
                          setProductName(l.material_name || "สารเคมี");
                          setReceivingNo(l.grn_no ? l.grn_no.replace(/^GRN-/, "") : l.supplier_lot_no);
                          setSupplierName(l.supplier_name || "IDEVA");
                          setAppearance(l.appearance || "ของเหลว");
                          setReceiveDate(formatShortThaiDate(l.received_date));
                          setExpiryDate(formatShortThaiDate(l.expiry_date));
                          setActiveTab("label_generator");
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                      >
                        พิมพ์ป้าย QC
                      </button>
                    </td>
                  </tr>
                ))}

                {productionOrders.map((po) => (
                  <tr key={`po-${po.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        ใบสั่งผลิต
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {`LOT-${po.product_code}-${po.code}-P1`}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {po.product_name}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {po.code}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {po.quantity} {po.unit}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {formatShortThaiDate(po.due_date)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMode("single");
                          setCategory("product");
                          setProductCode(po.product_code || `PRD-${po.id}`);
                          setProductName(po.product_name || "ชิ้นงานสั่งผลิต");
                          setReceivingNo(po.code);
                          setSupplierName(po.customer_name || "โรงงาน IDEVA");
                          setReceiveDate(formatShortThaiDate(po.date));
                          setExpiryDate(formatShortThaiDate(po.due_date));
                          setActiveTab("label_generator");
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                      >
                        พิมพ์ป้าย QC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THERMAL PRINT MEDIA CSS (80x50 MM แนวตั้ง 50mm W x 80mm H EXACT ROLL FIT)  */}
      {/* ========================================================================= */}
      <style>{`
        @media print {
          @page {
            ${
              isPortrait80x50
                ? "size: 50mm 80mm; margin: 0mm;"
                : printerPaperSize === "thermal_80x50_landscape"
                ? "size: 80mm 50mm; margin: 0mm;"
                : printerPaperSize === "thermal_100x75"
                ? "size: 100mm 75mm; margin: 0mm;"
                : printerPaperSize === "thermal_100x150"
                ? "size: 100mm 150mm; margin: 0mm;"
                : "size: A4 portrait; margin: 8mm;"
            }
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            ${isPortrait80x50 ? "width: 50mm !important; height: auto !important;" : ""}
            overflow: visible !important;
          }

          div, section, main, article {
            overflow: visible !important;
            max-height: none !important;
          }

          body * {
            visibility: hidden !important;
          }

          .printable-qc-label-item,
          .printable-qc-label-item * {
            visibility: visible !important;
          }

          .printable-qc-label-item {
            position: relative !important;
            display: block !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            ${
              isPortrait80x50
                ? "width: 50mm !important; min-width: 50mm !important; max-width: 50mm !important; height: 80mm !important; min-height: 80mm !important; max-height: 80mm !important; padding: 2mm !important;"
                : printerPaperSize === "thermal_80x50_landscape"
                ? "width: 80mm !important; min-width: 80mm !important; max-width: 80mm !important; height: 50mm !important; min-height: 50mm !important; max-height: 50mm !important; padding: 2mm !important;"
                : "width: 100% !important; max-width: 500px !important;"
            }
            background-color: #52d265 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 2px solid #052e16 !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
