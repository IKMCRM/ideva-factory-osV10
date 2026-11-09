import React, { useState, useRef, useEffect } from "react";
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
  X
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
  const [category, setCategory] = useState<"raw_material" | "packaging" | "product">("raw_material");
  const [productCode, setProductCode] = useState<string>("RMFL-0257");
  const [productName, setProductName] = useState<string>("TS34520 KYLVANILLA");
  const [receivingNo, setReceivingNo] = useState<string>("6162960");
  const [currentPiece, setCurrentPiece] = useState<number>(1);
  const [totalPieces, setTotalPieces] = useState<number>(1);
  const [supplierName, setSupplierName] = useState<string>("IDEVA / De Roma");
  const [appearance, setAppearance] = useState<string>("ของเหลว");
  const [retestDate, setRetestDate] = useState<string>(formatShortThaiDate("2026-10-14"));
  const [receiveDate, setReceiveDate] = useState<string>(formatShortThaiDate("2026-10-07"));
  const [expiryDate, setExpiryDate] = useState<string>(formatShortThaiDate("2027-08-23"));
  const [inspector, setInspector] = useState<string>("สุรัสวดี");
  const [approver, setApprover] = useState<string>("ณ");
  const [approvalDate, setApprovalDate] = useState<string>(formatShortThaiDate("2026-10-07"));
  const [printAllPieces, setPrintAllPieces] = useState<boolean>(false);
  const [printerPaperSize, setPrinterPaperSize] = useState<"thermal_100x75" | "thermal_80x50" | "thermal_100x150" | "a4_sheet">("thermal_100x75");
  const [customBarcodeText, setCustomBarcodeText] = useState<string>("");
  const [copiedBarcode, setCopiedBarcode] = useState<boolean>(false);

  // Quick preset loader
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
      }
    } else if (type === "prod") {
      const p = productionOrders.find((x) => x.id === id);
      if (p) {
        setCategory("product");
        setProductCode(p.product_code || `PRD-${p.id}`);
        setProductName(p.product_name || "ชิ้นงานสั่งผลิต");
        setReceivingNo(p.code);
        setSupplierName(p.customer_name || "โรงงาน IDEVA");
        setTotalPieces(Math.ceil((p.quantity || 1) / 25) || 1);
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
      }
    }
  };

  const generatedBarcode = customBarcodeText || `LOT-${productCode}-${receivingNo}-P${currentPiece}`;

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

  // Focus scanner input on load or tab change
  useEffect(() => {
    if (activeTab === "scanner_counter") {
      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);

  // Find barcode matching function
  const handlePerformBarcodeLookup = (query: string) => {
    const clean = query.trim();
    if (!clean) return;

    // Normalize for lookups (e.g., stripping * or LOT- prefix)
    const upper = clean.toUpperCase();
    const stripped = upper.replace(/^LOT-/, "").replace(/\*+/g, "");

    // 1. Try matching raw_material_lots
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
        (clean.includes(matCode) && clean.includes(grn))
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
      setStatusMessage({ text: `พบข้อมูลล็อตสารเคมี: ${matchedLot.material_name} (${matchedLot.lot_id_code})`, type: "success" });
      return;
    }

    // 2. Try matching raw_materials master
    const matchedMat = rawMaterials.find((m) => {
      const code = (m.code || "").toUpperCase();
      const name = (m.name || "").toUpperCase();
      return code === upper || stripped.includes(code) || name.includes(upper);
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
      setStatusMessage({ text: `พบรายการเคมีดิบ: ${matchedMat.name} (${matchedMat.code})`, type: "success" });
      return;
    }

    // 3. Try matching GRN
    const matchedGrn = grns.find((g) => {
      const code = (g.code || "").toUpperCase();
      const lot = (g.lot_number || g.supplier_lot_no || "").toUpperCase();
      return code === upper || lot === upper || clean.includes(code);
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
      setStatusMessage({ text: `พบเอกสารรับเข้า: ${matchedGrn.code}`, type: "success" });
      return;
    }

    // 4. Try matching Production Orders
    const matchedPo = productionOrders.find((p) => {
      const code = (p.code || "").toUpperCase();
      const pCode = (p.product_code || "").toUpperCase();
      return code === upper || clean.includes(code) || pCode === upper;
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
      setStatusMessage({ text: `พบใบสั่งผลิต: ${matchedPo.code}`, type: "success" });
      return;
    }

    // 5. Try matching Products (FG)
    const matchedProd = products.find((p) => {
      const code = (p.code || "").toUpperCase();
      return code === upper || clean.includes(code);
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
      setStatusMessage({ text: `พบสินค้าสำเร็จรูป: ${matchedProd.name}`, type: "success" });
      return;
    }

    // Not found
    if (soundEnabled) playScannerBeep("error");
    setStatusMessage({ text: `ไม่พบข้อมูลสำหรับบาร์โค้ด "${clean}" ในฐานข้อมูล Firebase`, type: "error" });
  };

  // Barcode input key press handler (barcode scanners typically emit Enter after scan)
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

      // Add to session history
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

      // Reset input for next scan
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

  // Array of pieces for multi-piece print
  const piecesToPrint = printAllPieces ? Array.from({ length: totalPieces }, (_, i) => i + 1) : [currentPiece];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>FM-QC-17 REV:01 STANDARD SYSTEM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              ศูนย์ออกบาร์โค้ด & พิมพ์ป้ายชี้บ่งผ่าน QC
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ระบบออกรหัสบาร์โค้ดมาตรฐาน Code-128 (ISO/IEC 15417) พิมพ์ป้ายสีเขียวชี้บ่งชิ้นงานผ่าน QC ตามแบบตัวอย่าง 
              รองรับเครื่องพิมพ์ความร้อน (Thermal Label Printer) และเครื่องยิงสแกนเนอร์สำหรับตรวจนับสต็อกแบบเรียลไทม์
            </p>
          </div>

          {/* Quick Stats / Status */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls & Configuration Sidebar (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Quick Presets Picker Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-600" /> ดึงข้อมูลชิ้นงานอัตโนมัติ
                </h3>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  1-คลิกใส่ฟอร์ม
                </span>
              </div>
              
              <select
                onChange={(e) => handleSelectPreset(e.target.value)}
                defaultValue=""
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="">-- เลือกรายการชิ้นงาน / ใบรับเข้า / สั่งผลิตในระบบ --</option>
                {grns.length > 0 && (
                  <optgroup label="📥 ใบรับเข้าสารเคมี (GRN & Lots)">
                    {grns.map((g) => (
                      <option key={`grn:${g.id}`} value={`grn:${g.id}`}>
                        {g.code} - {g.material_name} (Lot: {g.lot_number || g.supplier_lot_no || "N/A"})
                      </option>
                    ))}
                  </optgroup>
                )}
                {rawMaterialLots.length > 0 && (
                  <optgroup label="🧪 ล็อตวัตถุดิบเคมีภัณฑ์ (Raw Material Lots)">
                    {rawMaterialLots.map((l) => (
                      <option key={`lot:${l.id}`} value={`lot:${l.id}`}>
                        {l.lot_id_code} - {l.material_name} ({l.qc_status})
                      </option>
                    ))}
                  </optgroup>
                )}
                {productionOrders.length > 0 && (
                  <optgroup label="🏭 ใบสั่งผลิตชิ้นงาน (Production Orders)">
                    {productionOrders.map((po) => (
                      <option key={`prod:${po.id}`} value={`prod:${po.id}`}>
                        {po.code} - {po.product_name} ({po.quantity} {po.unit})
                      </option>
                    ))}
                  </optgroup>
                )}
                {products.length > 0 && (
                  <optgroup label="📦 สินค้าสำเร็จรูป (Finished Goods)">
                    {products.map((p) => (
                      <option key={`fg:${p.id}`} value={`fg:${p.id}`}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Printer Hardware Preset Selection */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ขนาดกระดาษ & เครื่องพิมพ์สติ๊กเกอร์ (Thermal Printer Preset):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrinterPaperSize("thermal_100x75")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      printerPaperSize === "thermal_100x75"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>100 × 75 มม.</span>
                      {printerPaperSize === "thermal_100x75" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">มาตรฐานติดถังเคมี/ลัง</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterPaperSize("thermal_80x50")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      printerPaperSize === "thermal_80x50"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>80 × 50 มม.</span>
                      {printerPaperSize === "thermal_80x50" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">กะทัดรัด ติดกระปุก/ขวด</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterPaperSize("thermal_100x150")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      printerPaperSize === "thermal_100x150"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>100 × 150 มม.</span>
                      {printerPaperSize === "thermal_100x150" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ป้ายพาเลท / ขนส่ง</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterPaperSize("a4_sheet")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      printerPaperSize === "a4_sheet"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>แผ่น A4 หลายดวง</span>
                      {printerPaperSize === "a4_sheet" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">พิมพ์บนสติ๊กเกอร์ A4</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Detailed Form Inputs Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" /> ข้อมูลบนป้ายชี้บ่ง (FM-QC-17 REV:01)
              </h3>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ชิ้นที่ (Piece):</label>
                  <input
                    type="number"
                    min="1"
                    value={currentPiece}
                    onChange={(e) => setCurrentPiece(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">จำนวนชิ้นทั้งหมด:</label>
                  <input
                    type="number"
                    min="1"
                    value={totalPieces}
                    onChange={(e) => setTotalPieces(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-center"
                  />
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

              {/* Batch Print All Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={printAllPieces}
                    onChange={(e) => setPrintAllPieces(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>พิมพ์ทุกชิ้นงานพร้อมกัน (ชิ้นที่ 1 ถึง {totalPieces})</span>
                </label>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" /> สั่งพิมพ์สติ๊กเกอร์ (Print)
                </button>
              </div>
            </div>
          </div>

          {/* Label Visual Preview & Thermal Output (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-100 rounded-3xl p-6 border border-slate-300 shadow-inner flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ตัวอย่างป้ายก่อนพิมพ์ (Live Sticker Preview)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
                    {printerPaperSize === "thermal_100x75" ? "100x75mm Thermal" :
                     printerPaperSize === "thermal_80x50" ? "80x50mm Thermal" :
                     printerPaperSize === "thermal_100x150" ? "100x150mm Pallet" : "A4 Multi-Sticker"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedBarcode);
                      setCopiedBarcode(true);
                      setTimeout(() => setCopiedBarcode(false), 2000);
                    }}
                    className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="คัดลอกรหัสบาร์โค้ด"
                  >
                    {copiedBarcode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBarcode ? "คัดลอกแล้ว" : "คัดลอกรหัส"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> พิมพ์ทันที
                  </button>
                </div>
              </div>

              {/* Printable container matching S__95477832.jpg */}
              <div className={`space-y-6 w-full flex flex-col items-center ${
                printerPaperSize === "a4_sheet" ? "max-w-2xl" : "max-w-md"
              }`}>
                {piecesToPrint.map((pieceNum) => {
                  const itemBarcode = `LOT-${productCode}-${receivingNo}-P${pieceNum}`;
                  const encoded = encodeCode128B(itemBarcode, 10);

                  return (
                    <div
                      key={pieceNum}
                      className="printable-qc-label-item rounded-xl border-3 border-emerald-950 p-5 shadow-2xl font-sans relative overflow-hidden select-none w-full"
                      style={{
                        backgroundColor: "#52d265", // Exact spring lime green from S__95477832.jpg
                        color: "#052e16",
                        maxWidth: printerPaperSize === "thermal_80x50" ? "360px" : "480px"
                      }}
                    >
                      {/* Header Title: ป้ายชี้บ่ง */}
                      <div className="text-center mb-1">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-emerald-950 inline-block px-4">
                          ป้ายชี้บ่ง
                        </h2>
                      </div>

                      {/* Radio Selector Row: Ø สารวัตถุดิบ   O บรรจุภัณฑ์ */}
                      <div className="flex items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm font-extrabold my-1.5 text-emerald-950">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg sm:text-xl font-black font-mono">
                            {category === "raw_material" ? "Ø" : "O"}
                          </span>
                          <span className={category === "raw_material" ? "underline underline-offset-4 decoration-2" : ""}>
                            สารวัตถุดิบ
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg sm:text-xl font-black font-mono">
                            {category === "packaging" ? "Ø" : "O"}
                          </span>
                          <span className={category === "packaging" ? "underline underline-offset-4 decoration-2" : ""}>
                            บรรจุภัณฑ์
                          </span>
                        </div>
                        {category === "product" && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg sm:text-xl font-black font-mono">Ø</span>
                            <span className="underline underline-offset-4 decoration-2">
                              ชิ้นงาน/สำเร็จรูป
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Form Content Lines matching S__95477832.jpg */}
                      <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm font-bold border-t-2 border-b-2 border-emerald-950 py-2">
                        {/* 1. รหัสสินค้า (Product Code) */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <span className="shrink-0 text-emerald-950 font-black">
                            รหัสสินค้า(Product Code):
                          </span>
                          <span className="font-mono font-black text-sm sm:text-base text-emerald-950 tracking-wider">
                            {productCode}
                          </span>
                        </div>

                        {/* 2. ชื่อสินค้า (Product Name) */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <span className="shrink-0 text-emerald-950 font-black">
                            ชื่อสินค้า(Product Name):
                          </span>
                          <span className="font-black text-xs sm:text-sm text-emerald-950 truncate max-w-[240px] sm:max-w-[280px]">
                            {productName}
                          </span>
                        </div>

                        {/* 3. เลขที่รับ (Receiving No.) & ชิ้นที่ */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              เลขที่รับ(Receiving No.):
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                              {receivingNo}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              ชิ้นที่:
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                              {pieceNum} / {totalPieces}
                            </span>
                          </div>
                        </div>

                        {/* 4. ผู้ผลิต ผู้จำหน่าย */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <span className="shrink-0 text-emerald-950 font-black">
                            ผู้ผลิต ผู้จำหน่าย :
                          </span>
                          <span className="font-black text-xs sm:text-sm text-emerald-950 truncate max-w-[240px] sm:max-w-[280px]">
                            {supplierName}
                          </span>
                        </div>

                        {/* 5. ลักษณะสินค้า (Appearance) */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <span className="shrink-0 text-emerald-950 font-black">
                            ลักษณะสินค้า (Appearance):
                          </span>
                          <span className="font-black text-xs sm:text-sm text-emerald-950">
                            {appearance}
                          </span>
                        </div>

                        {/* 6. วันที่ทดสอบซ้ำ */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <span className="shrink-0 text-emerald-950 font-black">
                            วันที่ทดสอบซ้ำ :
                          </span>
                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                            {retestDate}
                          </span>
                        </div>

                        {/* 7. วันที่รับเข้า & วันหมดอายุ */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              วันที่รับเข้า:
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                              {receiveDate}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              วันหมดอายุ:
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                              {expiryDate}
                            </span>
                          </div>
                        </div>

                        {/* 8. ผู้ตรวจสอบ & วันที่ */}
                        <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              ผู้ตรวจสอบ:
                            </span>
                            <span className="font-black text-xs sm:text-sm text-emerald-950">
                              {inspector}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              วันที่:
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                              {receiveDate}
                            </span>
                          </div>
                        </div>

                        {/* 9. ผู้อนุมัติ & วันที่ */}
                        <div className="flex items-baseline justify-between pb-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              ผู้อนุมัติ:
                            </span>
                            <span className="font-black text-xs sm:text-sm text-emerald-950">
                              {approver}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="shrink-0 text-emerald-950 font-black">
                              วันที่:
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950">
                              {approvalDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 100% Optical Barcode Section (ISO/IEC 15417 Code-128 with Quiet Zones) */}
                      <div className="my-2 bg-white p-2 rounded-lg border-2 border-emerald-950 flex flex-col items-center justify-center">
                        <svg
                          className="w-full h-9 sm:h-10"
                          viewBox={`0 0 ${encoded.totalWidth} 40`}
                          preserveAspectRatio="none"
                          style={{ display: "block" }}
                        >
                          <rect x="0" y="0" width={encoded.totalWidth} height="40" fill="#ffffff" />
                          {encoded.bars.map((b, i) => {
                            if (!b.isBlack) return null;
                            return (
                              <rect
                                key={i}
                                x={b.x}
                                y="0"
                                width={b.width}
                                height="40"
                                fill="#000000"
                              />
                            );
                          })}
                        </svg>
                        <div className="font-mono text-[10px] sm:text-xs font-black text-emerald-950 tracking-wider mt-0.5">
                          *{itemBarcode}*
                        </div>
                      </div>

                      {/* Footer Approved Standard Code */}
                      <div className="flex items-center justify-between text-[11px] sm:text-xs font-black pt-1 text-emerald-950">
                        <span className="uppercase tracking-wider">อนุมัติ (Approved)</span>
                        <span className="font-mono tracking-widest">FM-QC-17 REV:01</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions Callout */}
              <div className="mt-5 text-center text-xs text-slate-500 max-w-md">
                💡 <strong>คำแนะนำการพิมพ์:</strong> ตั้งค่าขนาดกระดาษในคำสั่งพิมพ์ (Print Dialog) 
                ให้ตรงกับขนาดสติ๊กเกอร์ม้วนความร้อน (100x75 มม. หรือ 80x50 มม.) 
                พร้อมเปิดตัวเลือก <em>"Background graphics (พิมพ์สีกราฟิกพื้นหลัง)"</em>
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
          {/* Active Scanner Control Center (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Main Scanner Input Box */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-lg space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-md">
                    <Scan className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      จุดยิงสแกนเนอร์นับสต็อก (Barcode Gun Scanner)
                    </h3>
                    <p className="text-xs text-slate-500">
                      ยิงบาร์โค้ดจากป้ายชิ้นงาน หรือพิมพ์รหัสเพื่อค้นหาและนับสต็อกทันที
                    </p>
                  </div>
                </div>

                {/* Sound Toggle Button */}
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

              {/* Barcode Gun Input Field */}
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

              {/* Status Message Banner */}
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

              {/* Matched Item Details Panel */}
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

                  {/* Physical Count Adjustment Box */}
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

                    {/* Numeric Input & Quick Step Buttons */}
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

                    {/* Additional Notes & Inspector */}
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

                    {/* Save Stock Adjustment Button */}
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

          {/* Session History & Fast Selection (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Session Scanned History */}
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

            {/* Quick Test Barcode Clicker */}
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

          {/* Master Table */}
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
      {/* THERMAL PRINT MEDIA CSS (Hardware exact sizing for 100x75, 80x50, A4)      */}
      {/* ========================================================================= */}
      <style>{`
        @media print {
          @page {
            ${
              printerPaperSize === "thermal_100x75"
                ? "size: 100mm 75mm; margin: 0mm;"
                : printerPaperSize === "thermal_80x50"
                ? "size: 80mm 50mm; margin: 0mm;"
                : printerPaperSize === "thermal_100x150"
                ? "size: 100mm 150mm; margin: 0mm;"
                : "size: A4 portrait; margin: 10mm;"
            }
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
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: page !important;
            width: 100% !important;
            background-color: #52d265 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 3px solid #052e16 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
