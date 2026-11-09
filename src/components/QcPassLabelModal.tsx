import React, { useRef, useState, useEffect } from "react";
import { 
  Printer, 
  Download, 
  X, 
  CheckSquare, 
  Square, 
  Barcode as BarcodeIcon, 
  ShieldCheck, 
  Edit3, 
  Layers,
  Sparkles,
  QrCode,
  Tag,
  Box,
  Sliders,
  Check,
  Copy
} from "lucide-react";
import { QcInspection, RawMaterialLot, Grn, ProductionOrder, PackingOrder, Product, RawMaterial } from "../types";

export interface QcPassLabelCustomData {
  category?: "raw_material" | "packaging" | "product";
  productCode?: string;
  productName?: string;
  receivingNo?: string;
  totalPieces?: number;
  currentPiece?: number;
  supplierName?: string;
  appearance?: string;
  retestDate?: string;
  receiveDate?: string;
  expiryDate?: string;
  inspector?: string;
  approver?: string;
  barcodeValue?: string;
}

interface QcPassLabelModalProps {
  inspection?: QcInspection | null;
  lot?: RawMaterialLot | null;
  grn?: Grn | null;
  productionOrder?: ProductionOrder | null;
  packingOrder?: PackingOrder | null;
  product?: Product | null;
  rawMaterial?: RawMaterial | null;
  customData?: QcPassLabelCustomData | null;
  availableProducts?: Product[];
  availableMaterials?: RawMaterial[];
  availableProductions?: ProductionOrder[];
  availableGrns?: Grn[];
  onClose: () => void;
}

import { encodeCode128B } from "../lib/code128";

// Generate standard ISO/IEC 15417 Code-128 (Subset B) SVG barcode with quiet zones and modulo 103 checksum
function SvgBarcode({ value }: { value: string }) {
  const result = encodeCode128B(value || "IDEVA-QC-PASS", 10);
  
  return (
    <svg 
      className="w-full h-8 sm:h-9" 
      viewBox={`0 0 ${result.totalWidth} 36`} 
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <rect x="0" y="0" width={result.totalWidth} height="36" fill="#ffffff" />
      {result.bars.map((bar, idx) => {
        if (!bar.isBlack) return null;
        return (
          <rect
            key={idx}
            x={bar.x}
            y="0"
            width={bar.width}
            height="36"
            fill="#000000"
          />
        );
      })}
    </svg>
  );
}

export default function QcPassLabelModal({ 
  inspection, 
  lot, 
  grn, 
  productionOrder,
  packingOrder,
  product,
  rawMaterial,
  customData,
  availableProducts = [],
  availableMaterials = [],
  availableProductions = [],
  availableGrns = [],
  onClose 
}: QcPassLabelModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Format short Thai date: DD/MM/YY
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

  // Determine initial category
  const getInitialCategory = (): "raw_material" | "packaging" | "product" => {
    if (customData?.category) return customData.category;
    if (packingOrder || inspection?.material_code?.startsWith("PAC")) return "packaging";
    if (productionOrder || product) return "product";
    return "raw_material";
  };

  const [category, setCategory] = useState<"raw_material" | "packaging" | "product">(getInitialCategory());

  // Determine initial fields based on provided prop
  const initialCode = customData?.productCode ||
    productionOrder?.product_code ||
    product?.code ||
    inspection?.material_code || 
    lot?.material_code || 
    grn?.material_code || 
    rawMaterial?.code || 
    "RMFL-0257";

  const initialName = customData?.productName ||
    productionOrder?.product_name ||
    packingOrder?.item_name ||
    product?.name ||
    inspection?.material_name || 
    lot?.material_name || 
    grn?.material_name || 
    rawMaterial?.name || 
    "TS34520 KYLVANILLA";

  const initialReceivingNo = customData?.receivingNo ||
    productionOrder?.code ||
    packingOrder?.code ||
    (grn?.code || inspection?.grn_no || "6162960").replace(/^GRN-/, "");

  const initialSupplier = customData?.supplierName ||
    productionOrder?.customer_name ||
    inspection?.supplier_name || 
    lot?.supplier_name || 
    grn?.supplier_name || 
    rawMaterial?.supplier_name || 
    rawMaterial?.supplier || 
    "IDEVA / De Roma";

  const initialAppearance = customData?.appearance ||
    inspection?.appearance || 
    lot?.appearance || 
    grn?.appearance || 
    "ของเหลว";

  const [productCode, setProductCode] = useState(initialCode);
  const [productName, setProductName] = useState(initialName);
  const [receivingNo, setReceivingNo] = useState(initialReceivingNo);
  const [currentPiece, setCurrentPiece] = useState<number>(customData?.currentPiece || 1);
  const [totalPieces, setTotalPieces] = useState<number>(customData?.totalPieces || inspection?.label_pieces || 1);
  const [supplierName, setSupplierName] = useState(initialSupplier);
  const [appearance, setAppearance] = useState(initialAppearance);

  const initialReceiveDate = formatShortThaiDate(
    customData?.receiveDate ||
    productionOrder?.date ||
    inspection?.inspection_date || 
    grn?.receive_date || 
    new Date().toISOString().slice(0, 10)
  );

  const initialExpiryDate = formatShortThaiDate(
    customData?.expiryDate ||
    productionOrder?.due_date ||
    inspection?.expiry_date || 
    grn?.expiry_date || 
    "2027-08-23"
  );

  const initialRetestDate = formatShortThaiDate(
    customData?.retestDate ||
    inspection?.retest_date || 
    grn?.retest_date || 
    "2026-10-14"
  );

  const [receiveDate, setReceiveDate] = useState(initialReceiveDate);
  const [expiryDate, setExpiryDate] = useState(initialExpiryDate);
  const [retestDate, setRetestDate] = useState(initialRetestDate);
  const [inspector, setInspector] = useState(customData?.inspector || inspection?.inspector || "สุรัสวดี");
  const [approver, setApprover] = useState(customData?.approver || inspection?.approver || "ณ");
  const [approvalDate, setApprovalDate] = useState(receiveDate);

  // Mode and formatting controls
  const [isEditMode, setIsEditMode] = useState(false);
  const [printAllMode, setPrintAllMode] = useState(false);
  const [labelSize, setLabelSize] = useState<"standard" | "compact" | "a4_grid">("standard");
  const [selectedQuickPreset, setSelectedQuickPreset] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick Preset Selector Handler
  const handleSelectPreset = (value: string) => {
    setSelectedQuickPreset(value);
    if (!value) return;

    const [type, idStr] = value.split(":");
    const id = Number(idStr);

    if (type === "prod") {
      const p = availableProductions.find((po) => po.id === id);
      if (p) {
        setCategory("product");
        setProductCode(p.product_code || `PRD-${p.id}`);
        setProductName(p.product_name || "ชิ้นงานสั่งผลิต");
        setReceivingNo(p.code);
        setSupplierName(p.customer_name || "โรงงาน IDEVA");
        setTotalPieces(Math.ceil((p.quantity || 1) / 50) || 1);
        setCurrentPiece(1);
        setReceiveDate(formatShortThaiDate(p.date));
        setExpiryDate(formatShortThaiDate(p.due_date));
      }
    } else if (type === "fg") {
      const fg = availableProducts.find((p) => p.id === id);
      if (fg) {
        setCategory("product");
        setProductCode(fg.code);
        setProductName(fg.name);
        setReceivingNo(`LOT-${fg.code}`);
        setSupplierName("IDEVA FACTORY OS");
      }
    } else if (type === "mat") {
      const rm = availableMaterials.find((m) => m.id === id);
      if (rm) {
        setCategory("raw_material");
        setProductCode(rm.code);
        setProductName(rm.name);
        setSupplierName(rm.supplier_name || rm.supplier || "ซัพพลายเออร์เคมีภัณฑ์");
        setReceivingNo(`GRN-${String(rm.id).padStart(6, "0")}`);
      }
    } else if (type === "grn") {
      const g = availableGrns.find((gr) => gr.id === id);
      if (g) {
        setCategory("raw_material");
        setProductCode(g.material_code || "RM-CHEM");
        setProductName(g.material_name || "สารเคมีรับเข้า");
        setReceivingNo(g.code.replace(/^GRN-/, ""));
        setSupplierName(g.supplier_name || "IDEVA / De Roma");
        setAppearance(g.appearance || "ของเหลว");
        setReceiveDate(formatShortThaiDate(g.receive_date));
        setExpiryDate(formatShortThaiDate(g.expiry_date));
      }
    }
  };

  const barcodeValue = `LOT-${productCode}-${receivingNo}-P${currentPiece}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Generate pieces array
  const piecesArray = Array.from({ length: totalPieces }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                พิมพ์ป้ายชี้บ่งแปะชิ้นงาน (QC PASS & IDENTIFICATION LABEL)
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                แบบฟอร์ม FM-QC-17 REV:01 ตามมาตรฐานป้ายสีเขียวชี้บ่งชิ้นงาน
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditMode 
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm" 
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditMode ? "ดูตัวอย่างป้าย" : "ปรับแต่งข้อความป้าย"}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" /> พิมพ์ป้ายชิ้นงาน (Print)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workpiece Selector Strip & Controls */}
        <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick Item Picker */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1">
              <Box className="w-3.5 h-3.5 text-blue-600" /> ดึงชิ้นงาน:
            </span>
            <select
              value={selectedQuickPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="">-- เลือกชิ้นงานสั่งผลิต / สินค้า / วัตถุดิบในระบบ --</option>
              {availableProductions.length > 0 && (
                <optgroup label="🏭 ใบสั่งผลิต (Production Work Orders)">
                  {availableProductions.map((po) => (
                    <option key={`prod:${po.id}`} value={`prod:${po.id}`}>
                      {po.code} - {po.product_name} ({po.quantity} {po.unit})
                    </option>
                  ))}
                </optgroup>
              )}
              {availableProducts.length > 0 && (
                <optgroup label="📦 สินค้าสำเร็จรูป (Finished Goods)">
                  {availableProducts.map((p) => (
                    <option key={`fg:${p.id}`} value={`fg:${p.id}`}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {availableMaterials.length > 0 && (
                <optgroup label="🧪 วัตถุดิบสารเคมี (Raw Materials)">
                  {availableMaterials.map((m) => (
                    <option key={`mat:${m.id}`} value={`mat:${m.id}`}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {availableGrns.length > 0 && (
                <optgroup label="📥 ใบรับเข้าคลัง (GRN)">
                  {availableGrns.map((g) => (
                    <option key={`grn:${g.id}`} value={`grn:${g.id}`}>
                      {g.code} - {g.material_name} (Lot: {g.lot_number || g.supplier_lot_no})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Label Size Mode Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-slate-600 text-[11px]">ขนาดป้าย:</span>
            <button
              type="button"
              onClick={() => setLabelSize("standard")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                labelSize === "standard"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
              title="ขนาด 100x75 มม. เหมาะสำหรับติดถัง แกลลอน ลัง กล่องใหญ่"
            >
              มาตรฐาน 100x75mm
            </button>
            <button
              type="button"
              onClick={() => setLabelSize("compact")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                labelSize === "compact"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
              title="ขนาด 80x50 มม. เหมาะสำหรับติดขวด หรือชิ้นงานขนาดเล็ก"
            >
              กะทัดรัด 80x50mm
            </button>
            <button
              type="button"
              onClick={() => setLabelSize("a4_grid")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                labelSize === "a4_grid"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
              title="จัดพิมพ์หลายดวงต่อแผ่น A4 สำหรับกระดาษสติ๊กเกอร์"
            >
              แผ่น A4 (หลายดวง)
            </button>
          </div>
        </div>

        {/* Edit Panel Drawer */}
        {isEditMode && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ประเภทชิ้นงาน</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              >
                <option value="raw_material">สารวัตถุดิบ (Ø)</option>
                <option value="packaging">บรรจุภัณฑ์ (Ø)</option>
                <option value="product">ชิ้นงาน / สำเร็จรูป (Ø)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">รหัสสินค้า / รหัสชิ้นงาน</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชื่อสินค้า / ชิ้นงาน</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">เลขที่รับ / แบทช์ (Receiving No.)</label>
              <input
                type="text"
                value={receivingNo}
                onChange={(e) => setReceivingNo(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชิ้นที่ / จำนวนชิ้นงานทั้งหมด</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={currentPiece}
                  onChange={(e) => setCurrentPiece(parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-center"
                />
                <span className="font-bold">/</span>
                <input
                  type="number"
                  min="1"
                  value={totalPieces}
                  onChange={(e) => setTotalPieces(parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ผู้ผลิต ผู้จำหน่าย / แบรนด์</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ลักษณะสินค้า (Appearance)</label>
              <input
                type="text"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">วันที่ทดสอบซ้ำ</label>
              <input
                type="text"
                value={retestDate}
                onChange={(e) => setRetestDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">วันที่รับเข้า / ผลิต</label>
              <input
                type="text"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">วันหมดอายุ</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ผู้ตรวจสอบ (Inspector)</label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ผู้อนุมัติ (Approver)</label>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        )}

        {/* Piece Selector & Print-All Toggle */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">เลือกชิ้นงานที่ต้องการพิมพ์ (Workpiece No.):</span>
            <div className="flex items-center gap-1">
              {piecesArray.slice(0, 8).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPiece(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentPiece === p
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
              {totalPieces > 8 && (
                <span className="text-slate-400 font-bold px-1">... ถึง {totalPieces}</span>
              )}
              <button
                type="button"
                onClick={() => setTotalPieces(totalPieces + 1)}
                className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                title="เพิ่มจำนวนชิ้นงาน/ถัง"
              >
                + เพิ่มชิ้น
              </button>
            </div>
          </div>

          <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <input
              type="checkbox"
              checked={printAllMode}
              onChange={(e) => setPrintAllMode(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>พิมพ์ทุกชิ้นงานพร้อมกัน (ชิ้นที่ 1 ถึง {totalPieces})</span>
          </label>
        </div>

        {/* Printable Label View Area */}
        <div className={`p-6 overflow-y-auto bg-slate-200/80 flex flex-1 gap-6 ${
          labelSize === "a4_grid" 
            ? "flex-wrap justify-center items-start" 
            : "flex-col items-center justify-start"
        }`}>
          {(printAllMode ? piecesArray : [currentPiece]).map((pieceNum) => (
            <div
              key={pieceNum}
              ref={pieceNum === currentPiece ? printRef : undefined}
              className={`printable-qc-label-item rounded-xl border-3 border-emerald-950 p-4 sm:p-5 shadow-xl font-sans relative overflow-hidden select-none transition-all ${
                labelSize === "compact"
                  ? "w-full max-w-[380px] text-[11px]"
                  : labelSize === "a4_grid"
                  ? "w-[46%] min-w-[340px] max-w-[420px]"
                  : "w-full max-w-[480px]"
              }`}
              style={{
                backgroundColor: "#52d265", // Spring green exact match S__95477832.jpg
                color: "#052e16",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)"
              }}
            >
              {/* Header Title: ป้ายชี้บ่ง */}
              <div className="text-center mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-emerald-950 inline-block px-4">
                  ป้ายชี้บ่ง
                </h1>
              </div>

              {/* Radio Selector Row: Ø สารวัตถุดิบ   O บรรจุภัณฑ์   O ชิ้นงาน/สำเร็จรูป */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm font-extrabold my-1.5 text-emerald-950 flex-wrap">
                <div 
                  onClick={() => setCategory("raw_material")}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                >
                  <span className="text-lg sm:text-xl font-black font-mono">
                    {category === "raw_material" ? "Ø" : "O"}
                  </span>
                  <span className={category === "raw_material" ? "underline underline-offset-4 decoration-2" : ""}>
                    สารวัตถุดิบ
                  </span>
                </div>
                <div 
                  onClick={() => setCategory("packaging")}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                >
                  <span className="text-lg sm:text-xl font-black font-mono">
                    {category === "packaging" ? "Ø" : "O"}
                  </span>
                  <span className={category === "packaging" ? "underline underline-offset-4 decoration-2" : ""}>
                    บรรจุภัณฑ์
                  </span>
                </div>
                {category === "product" && (
                  <div 
                    onClick={() => setCategory("product")}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
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
                  <span className="font-black text-xs sm:text-sm text-emerald-950 truncate max-w-[260px] sm:max-w-[300px]">
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
                  <span className="font-black text-xs sm:text-sm text-emerald-950 truncate max-w-[260px] sm:max-w-[300px]">
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

              {/* Barcode Graphic Section for Stock Count */}
              <div className="my-2 bg-white/95 p-1.5 sm:p-2 rounded-lg border-2 border-emerald-950 flex flex-col items-center justify-center">
                <SvgBarcode value={`LOT-${productCode}-${receivingNo}-P${pieceNum}`} />
                <div className="font-mono text-[10px] sm:text-xs font-black text-emerald-950 tracking-wider mt-0.5">
                  *LOT-{productCode}-${receivingNo}-P{pieceNum}*
                </div>
              </div>

              {/* Footer Approved Standard Code */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-black pt-1 text-emerald-950">
                <span className="uppercase tracking-wider">อนุมัติ (Approved)</span>
                <span className="font-mono tracking-widest">FM-QC-17 REV:01</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[11px]">
              รหัสบาร์โค้ดติดชิ้นงาน: <strong className="text-slate-800">{barcodeValue}</strong>
            </span>
            <button
              type="button"
              onClick={handleCopyBarcode}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer transition-colors"
              title="คัดลอกรหัสบาร์โค้ด"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4" /> 
              {printAllMode 
                ? `พิมพ์ครบทั้งหมด ${totalPieces} ชิ้นงาน` 
                : `พิมพ์ป้ายชิ้นที่ ${currentPiece}`}
            </button>
          </div>
        </div>
      </div>

      {/* Print Stylesheet for Thermal and A4 Stickers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-qc-label-item, .printable-qc-label-item * {
            visibility: visible !important;
          }
          .printable-qc-label-item {
            position: relative !important;
            margin: 0 auto 20px auto !important;
            page-break-after: always !important;
            width: 100% !important;
            max-width: 500px !important;
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
