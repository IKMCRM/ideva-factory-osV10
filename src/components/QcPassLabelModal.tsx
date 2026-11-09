import React, { useRef, useState } from "react";
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
  QrCode
} from "lucide-react";
import { QcInspection, RawMaterialLot, Grn } from "../types";

interface QcPassLabelModalProps {
  inspection?: QcInspection | null;
  lot?: RawMaterialLot | null;
  grn?: Grn | null;
  onClose: () => void;
}

// Generate realistic Code128-like SVG bars based on barcode string
function SvgBarcode({ value }: { value: string }) {
  // Deterministic bar widths based on character charcodes
  const bars: { width: number; isBlack: boolean }[] = [];
  let isBlack = true;
  
  // Start guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const pattern = [(code % 3) + 1, ((code >> 2) % 3) + 1, ((code >> 4) % 3) + 1, ((code >> 6) % 2) + 1];
    pattern.forEach((w) => {
      bars.push({ width: w, isBlack });
      isBlack = !isBlack;
    });
  }

  // Stop guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 3, isBlack: true });
  bars.push({ width: 1, isBlack: false });

  let currentX = 0;
  return (
    <svg className="w-full h-10" viewBox="0 0 320 40" preserveAspectRatio="none">
      {bars.map((bar, idx) => {
        const x = currentX;
        currentX += bar.width * 2.2;
        if (!bar.isBlack) return null;
        return (
          <rect
            key={idx}
            x={x}
            y="0"
            width={bar.width * 2.2}
            height="40"
            fill="#052e16"
          />
        );
      })}
    </svg>
  );
}

export default function QcPassLabelModal({ inspection, lot, grn, onClose }: QcPassLabelModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Initial values mapped from inspection, lot, or grn
  const initialCategory = inspection?.material_code?.startsWith("PAC") ? "packaging" : "raw_material";
  const [category, setCategory] = useState<"raw_material" | "packaging">(initialCategory);

  const [productCode, setProductCode] = useState(
    inspection?.material_code || lot?.material_code || grn?.material_code || "RMFL-0257"
  );
  const [productName, setProductName] = useState(
    inspection?.material_name || lot?.material_name || grn?.material_name || "TS34520 KYLVANILLA"
  );
  const [receivingNo, setReceivingNo] = useState(
    (grn?.code || inspection?.grn_no || "6162960").replace(/^GRN-/, "")
  );
  const [currentPiece, setCurrentPiece] = useState<number>(1);
  const [totalPieces, setTotalPieces] = useState<number>(inspection?.label_pieces || 1);
  const [supplierName, setSupplierName] = useState(
    inspection?.supplier_name || lot?.supplier_name || grn?.supplier_name || "IDEVA / De Roma"
  );
  const [appearance, setAppearance] = useState(
    inspection?.appearance || lot?.appearance || grn?.appearance || "ของเหลว"
  );
  
  // Format dates: DD/MM/YY as shown in physical sticker
  const formatShortThaiDate = (dateStr?: string) => {
    if (!dateStr) return "7/10/26";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear() + 43).slice(-2); // Buddhist era 2569 -> 26 or Gregorian short
    return `${day}/${month}/${year}`;
  };

  const [receiveDate, setReceiveDate] = useState(
    formatShortThaiDate(inspection?.inspection_date || grn?.receive_date || new Date().toISOString().slice(0, 10))
  );
  const [expiryDate, setExpiryDate] = useState(
    formatShortThaiDate(inspection?.expiry_date || grn?.expiry_date || "2027-08-23")
  );
  const [retestDate, setRetestDate] = useState(
    formatShortThaiDate(inspection?.retest_date || grn?.retest_date || "2026-10-14")
  );
  const [inspector, setInspector] = useState(inspection?.inspector || "สุรัสวดี");
  const [approver, setApprover] = useState(inspection?.approver || "ณ");
  const [approvalDate, setApprovalDate] = useState(receiveDate);

  const [isEditMode, setIsEditMode] = useState(false);
  const [printAllMode, setPrintAllMode] = useState(false);

  const barcodeValue = lot?.barcode || `LOT-${productCode}-${receivingNo}-P${currentPiece}`;

  const handlePrint = () => {
    window.print();
  };

  // Generate array of pieces for bulk printing
  const piecesArray = Array.from({ length: totalPieces }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                พิมพ์ป้ายชี้บ่งผ่าน QC สีเขียว (QC PASS LABEL)
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                แบบฟอร์ม FM-QC-17 REV:01 | ป้ายชี้บ่งอนุมัติติดภาชนะบรรจุสารเคมี
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
              {isEditMode ? "ดูตัวอย่างป้าย" : "แก้ไขข้อมูลป้าย"}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" /> พิมพ์ป้าย (Print)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Panel Drawer */}
        {isEditMode && (
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ประเภทสินค้า</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              >
                <option value="raw_material">สารวัตถุดิบ (Ø)</option>
                <option value="packaging">บรรจุภัณฑ์ (Ø)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">รหัสสินค้า</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชื่อสินค้า</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">เลขที่รับ (Receiving No.)</label>
              <input
                type="text"
                value={receivingNo}
                onChange={(e) => setReceivingNo(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชิ้นที่ / ทั้งหมด</label>
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
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ลักษณะสินค้า (Appearance)</label>
              <input
                type="text"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ผู้ตรวจสอบ (Inspector)</label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ผู้อนุมัติ (Approver)</label>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        )}

        {/* Piece Selector Bar */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">เลือกชิ้นภาชนะ (Drum / Container):</span>
            <div className="flex items-center gap-1">
              {piecesArray.map((p) => (
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
              <button
                type="button"
                onClick={() => setTotalPieces(totalPieces + 1)}
                className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                title="เพิ่มจำนวนถัง/ชิ้นที่รับ"
              >
                + เพิ่มชิ้น
              </button>
            </div>
          </div>

          <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={printAllMode}
              onChange={(e) => setPrintAllMode(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>พิมพ์ทุกชิ้นพร้อมกัน (1 ถึง {totalPieces})</span>
          </label>
        </div>

        {/* Printable Label Section */}
        <div className="p-6 overflow-y-auto bg-slate-200/70 flex flex-col items-center justify-start flex-1 gap-6">
          {(printAllMode ? piecesArray : [currentPiece]).map((pieceNum) => (
            <div
              key={pieceNum}
              ref={pieceNum === currentPiece ? printRef : undefined}
              className="printable-qc-label-item w-full max-w-[480px] rounded-xl border-3 border-emerald-950 p-5 shadow-xl font-sans relative overflow-hidden select-none"
              style={{
                backgroundColor: "#52d265", // Matching physical lime-spring green in S__95477832.jpg
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

              {/* Radio Selector Row: Ø สารวัตถุดิบ    O บรรจุภัณฑ์ */}
              <div className="flex items-center justify-center gap-8 text-sm sm:text-base font-extrabold my-1.5 text-emerald-950">
                <div 
                  onClick={() => setCategory("raw_material")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                >
                  <span className="text-xl font-black font-mono">
                    {category === "raw_material" ? "Ø" : "O"}
                  </span>
                  <span className={category === "raw_material" ? "underline underline-offset-4 decoration-2" : ""}>
                    สารวัตถุดิบ
                  </span>
                </div>
                <div 
                  onClick={() => setCategory("packaging")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                >
                  <span className="text-xl font-black font-mono">
                    {category === "packaging" ? "Ø" : "O"}
                  </span>
                  <span className={category === "packaging" ? "underline underline-offset-4 decoration-2" : ""}>
                    บรรจุภัณฑ์
                  </span>
                </div>
              </div>

              {/* Content Lines Matching Physical Form */}
              <div className="space-y-1.5 text-xs sm:text-sm font-bold border-t-2 border-b-2 border-emerald-950 py-2">
                {/* 1. รหัสสินค้า (Product Code) */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <span className="shrink-0 text-emerald-950 font-black">
                    รหัสสินค้า(Product Code):
                  </span>
                  <span className="font-mono font-black text-base sm:text-lg text-emerald-950 tracking-wider">
                    {productCode}
                  </span>
                </div>

                {/* 2. ชื่อสินค้า (Product Name) */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <span className="shrink-0 text-emerald-950 font-black">
                    ชื่อสินค้า(Product Name):
                  </span>
                  <span className="font-black text-sm sm:text-base text-emerald-950 truncate max-w-[280px]">
                    {productName}
                  </span>
                </div>

                {/* 3. เลขที่รับ (Receiving No.) & ชิ้นที่ */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 text-emerald-950 font-black">
                      เลขที่รับ(Receiving No.):
                    </span>
                    <span className="font-mono font-black text-base text-emerald-950">
                      {receivingNo}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="shrink-0 text-emerald-950 font-black">
                      ชิ้นที่:
                    </span>
                    <span className="font-mono font-black text-base text-emerald-950">
                      {pieceNum} / {totalPieces}
                    </span>
                  </div>
                </div>

                {/* 4. ผู้ผลิต ผู้จำหน่าย */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <span className="shrink-0 text-emerald-950 font-black">
                    ผู้ผลิต ผู้จำหน่าย :
                  </span>
                  <span className="font-black text-sm text-emerald-950 truncate max-w-[280px]">
                    {supplierName}
                  </span>
                </div>

                {/* 5. ลักษณะสินค้า (Appearance) */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <span className="shrink-0 text-emerald-950 font-black">
                    ลักษณะสินค้า (Appearance):
                  </span>
                  <span className="font-black text-sm text-emerald-950">
                    {appearance}
                  </span>
                </div>

                {/* 6. วันที่ทดสอบซ้ำ */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <span className="shrink-0 text-emerald-950 font-black">
                    วันที่ทดสอบซ้ำ :
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-950">
                    {retestDate}
                  </span>
                </div>

                {/* 7. วันที่รับเข้า & วันหมดอายุ */}
                <div className="flex items-baseline justify-between border-b border-emerald-900/60 pb-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="shrink-0 text-emerald-950 font-black">
                      วันที่รับเข้า:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-950">
                      {receiveDate}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="shrink-0 text-emerald-950 font-black">
                      วันหมดอายุ:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-950">
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
                    <span className="font-black text-sm text-emerald-950">
                      {inspector}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="shrink-0 text-emerald-950 font-black">
                      วันที่:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-950">
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
                    <span className="font-black text-sm text-emerald-950">
                      {approver}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="shrink-0 text-emerald-950 font-black">
                      วันที่:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-950">
                      {approvalDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barcode & Stock Taking Code Section */}
              <div className="my-2 bg-white/95 p-2 rounded-lg border-2 border-emerald-950 flex flex-col items-center justify-center">
                <SvgBarcode value={`LOT-${productCode}-${receivingNo}-P${pieceNum}`} />
                <div className="font-mono text-xs font-black text-emerald-950 tracking-wider mt-0.5">
                  *LOT-{productCode}-{receivingNo}-P{pieceNum}*
                </div>
              </div>

              {/* Footer Approved & Form Code */}
              <div className="flex items-center justify-between text-xs font-black pt-1 text-emerald-950">
                <span className="uppercase tracking-wider">อนุมัติ (Approved)</span>
                <span className="font-mono tracking-widest">FM-QC-17 REV:01</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            บาร์โค้ดสำหรับสแกนนับสต็อก: <strong className="text-slate-800">{barcodeValue}</strong>
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
              {printAllMode ? `พิมพ์ครบ ${totalPieces} ชิ้น` : `พิมพ์ป้ายชิ้นที่ ${currentPiece}`}
            </button>
          </div>
        </div>
      </div>

      {/* Print Stylesheet for Thermal and Standard Printers */}
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
