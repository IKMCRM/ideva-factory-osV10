import React, { useRef } from "react";
import { Printer, Download, X, CheckSquare, Square, Barcode as BarcodeIcon, ShieldCheck } from "lucide-react";
import { QcInspection, RawMaterialLot } from "../types";

interface QcPassLabelModalProps {
  inspection: QcInspection | null;
  lot?: RawMaterialLot | null;
  onClose: () => void;
}

export default function QcPassLabelModal({ inspection, lot, onClose }: QcPassLabelModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!inspection) return null;

  const productCode = inspection.material_code || "RMFL-0257";
  const productName = inspection.material_name || "TS3459 KYL VANILLA";
  const receivingNo = inspection.grn_no ? inspection.grn_no.replace("GRN-", "") : "6162960";
  const supplierName = inspection.supplier_name || "IDEVA / De Roma";
  const appearance = inspection.appearance || "ของเหลว";
  const receiveDate = inspection.inspection_date || new Date().toISOString().slice(0, 10);
  const expiryDate = inspection.expiry_date || "2027-08-23";
  const retestDate = inspection.retest_date || receiveDate;
  const inspector = inspection.inspector || "สุรตน์";
  const approver = inspection.approver || "ดน";
  const approvalDate = inspection.approval_date || receiveDate;
  const pieceText = `${inspection.label_pieces || 1} / ${inspection.label_pieces || 1}`;
  const barcodeValue = lot?.barcode || `LOT-${inspection.material_code}-${inspection.supplier_lot_no}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Controls */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                พิมพ์ป้ายชี้บ่งผ่าน QC (QC PASS LABEL)
              </h3>
              <p className="text-[11px] text-slate-300">
                แบบฟอร์ม FM-QC-17 REV:01 ตามมาตรฐานป้ายสีเขียวคลังสินค้า
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
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

        {/* Printable Label View */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center items-center flex-1">
          {/* Printable Container */}
          <div
            ref={printRef}
            id="printable-qc-label"
            className="w-[520px] bg-[#22c55e] text-slate-950 p-5 rounded-lg border-2 border-slate-950 shadow-2xl font-sans relative overflow-hidden select-none"
            style={{
              backgroundColor: "#22c55e",
              color: "#020617",
              fontFamily: "'Sukhumvit Set', 'Prompt', 'Kanit', 'Noto Sans Thai', sans-serif"
            }}
          >
            {/* Header Title */}
            <div className="text-center mb-2">
              <h1 className="text-2xl font-black tracking-wide text-slate-950 border-b-2 border-slate-950 pb-1 inline-block px-4">
                ป้ายชี้บ่ง
              </h1>
            </div>

            {/* Checkbox Category Row */}
            <div className="flex items-center justify-center gap-8 text-sm font-extrabold my-2">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold">Ø</span>
                <span>สารวัตถุดิบ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold">O</span>
                <span>บรรจุภัณฑ์</span>
              </div>
            </div>

            {/* Table-like Lines Content */}
            <div className="space-y-2 text-sm font-bold border-t-2 border-b-2 border-slate-950 py-2.5">
              {/* Product Code */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <span className="shrink-0 text-slate-950 font-black">รหัสสินค้า (Product Code):</span>
                <span className="font-mono font-black text-lg text-slate-950 underline decoration-slate-950 decoration-2 underline-offset-4">
                  {productCode}
                </span>
              </div>

              {/* Product Name */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <span className="shrink-0 text-slate-950 font-black">ชื่อสินค้า (Product Name):</span>
                <span className="font-extrabold text-base text-slate-950 underline decoration-slate-950 underline-offset-4">
                  {productName}
                </span>
              </div>

              {/* Receiving No. & Piece No. */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">เลขที่รับ (Receiving No.):</span>
                  <span className="font-mono font-black text-base underline decoration-slate-950 underline-offset-4">
                    {receivingNo}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="shrink-0 text-slate-950 font-black">ชิ้นที่:</span>
                  <span className="font-mono font-black text-base underline decoration-slate-950 underline-offset-4">
                    {pieceText}
                  </span>
                </div>
              </div>

              {/* Supplier / Manufacturer Name (Module 10 Customer Requirement) */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <span className="shrink-0 text-slate-950 font-black">ผู้ผลิต ผู้จำหน่าย :</span>
                <span className="font-extrabold text-base text-slate-950 underline decoration-slate-950 underline-offset-4">
                  {supplierName}
                </span>
              </div>

              {/* Appearance */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <span className="shrink-0 text-slate-950 font-black">ลักษณะสินค้า (Appearance):</span>
                <span className="font-extrabold text-base text-slate-950 underline decoration-slate-950 underline-offset-4">
                  {appearance}
                </span>
              </div>

              {/* Retest Date */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <span className="shrink-0 text-slate-950 font-black">วันที่ทดสอบซ้ำ :</span>
                <span className="font-mono font-black text-base text-slate-950 underline decoration-slate-950 underline-offset-4">
                  {retestDate}
                </span>
              </div>

              {/* Receive Date & Expiry Date */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">วันที่รับเข้า:</span>
                  <span className="font-mono font-black text-base underline decoration-slate-950 underline-offset-4">
                    {receiveDate}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">วันหมดอายุ:</span>
                  <span className="font-mono font-black text-base underline decoration-slate-950 underline-offset-4">
                    {expiryDate}
                  </span>
                </div>
              </div>

              {/* Inspector & Date */}
              <div className="flex items-baseline justify-between border-b border-slate-950/70 pb-1">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">ผู้ตรวจสอบ:</span>
                  <span className="font-extrabold text-base underline decoration-slate-950 underline-offset-4">
                    {inspector}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">วันที่</span>
                  <span className="font-mono font-black text-base underline decoration-slate-950 underline-offset-4">
                    {approvalDate}
                  </span>
                </div>
              </div>

              {/* Approver & Date */}
              <div className="flex items-baseline justify-between pb-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">ผู้อนุมัติ:</span>
                  <span className="font-extrabold text-base underline decoration-slate-950 underline-offset-4">
                    {approver}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-950 font-black">วันที่</span>
                  <span className="font-mono font-black text-base underline decoration-slate-950 underline-offset-4">
                    {approvalDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Barcode Graphic Section */}
            <div className="my-2 bg-white/90 p-2 rounded border border-slate-950 flex flex-col items-center justify-center">
              <div className="font-mono font-black tracking-widest text-lg text-slate-950 select-all">
                |||||| | |||||||| ||| ||||||| |||||||
              </div>
              <div className="font-mono text-[11px] font-bold text-slate-900 mt-0.5">
                {barcodeValue}
              </div>
            </div>

            {/* Footer Form Standard Code */}
            <div className="flex items-center justify-between text-xs font-black pt-1">
              <span className="uppercase text-slate-950">อนุมัติ (Approved)</span>
              <span className="font-mono tracking-wider text-slate-950">FM-QC-17 REV:01</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">
            Lot Barcode: {barcodeValue}
          </span>
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
              <Printer className="w-4 h-4" /> พิมพ์ป้ายชี้บ่งสีเขียว
            </button>
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qc-label, #printable-qc-label * {
            visibility: visible;
          }
          #printable-qc-label {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 600px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
