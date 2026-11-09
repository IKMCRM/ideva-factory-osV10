import React, { useState, useEffect, useRef } from "react";
import { 
  Barcode as BarcodeIcon, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  ArrowRight, 
  Save, 
  History, 
  Layers, 
  Printer, 
  Check, 
  TrendingUp, 
  TrendingDown,
  Camera,
  PackageCheck
} from "lucide-react";
import { RawMaterial, RawMaterialLot, Grn, AuditLog } from "../types";

interface StockCountModalProps {
  rawMaterials: RawMaterial[];
  lots: RawMaterialLot[];
  grns: Grn[];
  onClose: () => void;
  onSaveStockCount: (params: {
    materialId: number;
    lotId?: number;
    countedQtyKg: number;
    varianceKg: number;
    reason: string;
    countedBy: string;
    location: string;
  }) => Promise<void>;
  auditLogs?: AuditLog[];
}

export default function StockCountModal({
  rawMaterials,
  lots,
  grns,
  onClose,
  onSaveStockCount,
  auditLogs = []
}: StockCountModalProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedLot, setSelectedLot] = useState<RawMaterialLot | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [countedQty, setCountedQty] = useState<number | "">("");
  const [countedBy, setCountedBy] = useState("สมศักดิ์ คลังสินค้า");
  const [location, setLocation] = useState("RACK-A1-SHELF-02");
  const [reason, setReason] = useState("การตรวจนับสต็อกรอบประจำสัปดาห์ (Cycle Count)");
  const [activeTab, setActiveTab] = useState<"count" | "history">("count");
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [activeTab]);

  // Handle barcode match logic
  const handleBarcodeLookup = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    // 1. Try matching lot barcode or lot number or GRN
    let foundLot = lots.find(
      (l) =>
        (l.barcode && l.barcode.toUpperCase() === clean) ||
        (l.supplier_lot_no && l.supplier_lot_no.toUpperCase() === clean) ||
        (l.grn_no && l.grn_no.toUpperCase() === clean) ||
        (l.lot_code && l.lot_code.toUpperCase() === clean) ||
        clean.includes(l.supplier_lot_no?.toUpperCase() || "___")
    );

    // 2. Try matching raw material code
    let foundMat = rawMaterials.find(
      (m) =>
        m.code.toUpperCase() === clean ||
        m.name.toUpperCase().includes(clean)
    );

    if (foundLot) {
      setSelectedLot(foundLot);
      const matchedMat = rawMaterials.find((m) => m.id === foundLot?.material_id || m.code === foundLot?.material_code);
      setSelectedMaterial(matchedMat || null);
      
      // Default counted qty to current lot remaining
      const currentKg = (foundLot.remaining_qty || 0) / (matchedMat?.unit?.toLowerCase().includes("kg") ? 1000 : 1);
      setCountedQty(parseFloat(currentKg.toFixed(2)));
      setScanMessage(`สแกนพบล็อต: ${foundLot.material_code} (${foundLot.supplier_lot_no})`);
    } else if (foundMat) {
      setSelectedMaterial(foundMat);
      const matLots = lots.filter((l) => l.material_id === foundMat?.id || l.material_code === foundMat?.code);
      if (matLots.length > 0) {
        setSelectedLot(matLots[0]);
        const currentKg = (matLots[0].remaining_qty || 0) / 1000;
        setCountedQty(parseFloat(currentKg.toFixed(2)));
      } else {
        setSelectedLot(null);
        setCountedQty(foundMat.stock_qty || 0);
      }
      setScanMessage(`สแกนพบวัตถุดิบ: ${foundMat.code} - ${foundMat.name}`);
    } else {
      setScanMessage("ไม่พบรายการจากบาร์โค้ดนี้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarcodeLookup(barcodeInput);
    }
  };

  // Calculations
  const systemQtyKg = selectedLot 
    ? (selectedLot.remaining_qty ? selectedLot.remaining_qty / 1000 : selectedLot.received_qty || 0)
    : (selectedMaterial?.stock_qty ? selectedMaterial.stock_qty / 1000 : 0);

  const physicalCount = typeof countedQty === "number" ? countedQty : 0;
  const variance = physicalCount - systemQtyKg;
  const variancePercent = systemQtyKg > 0 ? (variance / systemQtyKg) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial && !selectedLot) {
      alert("กรุณาสแกนหรือเลือกวัตถุดิบที่ต้องการนับสต็อก");
      return;
    }

    const matId = selectedMaterial?.id || (selectedLot ? selectedLot.material_id : 0);
    if (!matId) return;

    await onSaveStockCount({
      materialId: matId,
      lotId: selectedLot?.id,
      countedQtyKg: physicalCount,
      varianceKg: variance,
      reason,
      countedBy,
      location
    });

    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
    }, 2000);
  };

  // Stock counting audit logs filter
  const stockCountLogs = auditLogs.filter(
    (log) => log.action === "STOCK_COUNT_ADJUST" || log.module === "StockCount"
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-[9996] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                สแกนบาร์โค้ดนับสต็อกวัตถุดิบเคมี (Barcode Stock Counter)
              </h3>
              <p className="text-[11px] text-slate-300">
                รองรับเครื่องยิงบาร์โค้ด USB/Bluetooth, ค้นหา Lot No, GRN No และกระทบยอดสต็อกจริง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("count")}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "count"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PackageCheck className="w-4 h-4" /> สแกนและนับสต็อก (Scan & Count)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-4 h-4" /> ประวัติการตรวจนับ ({stockCountLogs.length})
          </button>
        </div>

        {activeTab === "count" ? (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Barcode Gun Search Strip */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
              <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BarcodeIcon className="w-4 h-4 text-emerald-600" /> 
                  ยิงบาร์โค้ด หรือพิมพ์รหัสที่ต้องการค้นหา (Barcode Gun Ready)
                </span>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-200/50 px-2 py-0.5 rounded">
                  กด Enter เพื่อค้นหาทันที
                </span>
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="สแกนป้ายชี้บ่งสีเขียว เช่น LOT-RMFL-0257 หรือ GRN-6162960..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeLookup(barcodeInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  ค้นหา
                </button>
              </div>

              {scanMessage && (
                <div className="mt-2 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {scanMessage}
                </div>
              )}
            </div>

            {/* Quick Pick Lots Buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                หรือเลือกล็อตวัตถุดิบเคมีที่อยู่ในคลัง:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {lots.slice(0, 8).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedLot(l);
                      const m = rawMaterials.find((rm) => rm.id === l.material_id || rm.code === l.material_code);
                      setSelectedMaterial(m || null);
                      const currentKg = (l.remaining_qty || 0) / 1000;
                      setCountedQty(parseFloat(currentKg.toFixed(2)));
                      setScanMessage(`เลือกล็อต: ${l.material_code} (${l.supplier_lot_no})`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                      selectedLot?.id === l.id
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {l.material_code} | {l.supplier_lot_no}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Material & Lot Details Card */}
            {(selectedLot || selectedMaterial) && (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded mr-2">
                        {selectedMaterial?.code || selectedLot?.material_code}
                      </span>
                      <strong className="text-sm font-bold text-slate-900">
                        {selectedMaterial?.name || selectedLot?.material_name}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">สถานะ QC:</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                        {selectedLot?.qc_status || "QC Passed"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">เลขที่รับเข้า (GRN)</span>
                      <span className="font-mono font-bold text-slate-800">{selectedLot?.grn_no || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Supplier Lot No</span>
                      <span className="font-mono font-bold text-slate-800">{selectedLot?.supplier_lot_no || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">วันหมดอายุ</span>
                      <span className="font-mono font-bold text-slate-800">{selectedLot?.expiry_date || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">ผู้ผลิต/ผู้จำหน่าย</span>
                      <span className="font-semibold text-slate-800 truncate block">{selectedLot?.supplier_name || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Counting & Variance Input Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* System Stock Card */}
                  <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500">ยอดคงเหลือในระบบ (System)</span>
                    <div className="mt-1">
                      <span className="text-2xl font-black font-mono text-slate-800">
                        {systemQtyKg.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-bold ml-1.5">KG</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">อ้างอิงจากฐานข้อมูล Firebase</span>
                  </div>

                  {/* Physical Count Input Card */}
                  <div className="p-3.5 bg-blue-50/70 border-2 border-blue-400/50 rounded-2xl flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-blue-900 block">
                      ยอดตรวจนับจริง (Physical Count) *
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={countedQty}
                        onChange={(e) => setCountedQty(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-full px-3 py-1.5 text-xl font-black font-mono text-blue-900 bg-white border border-blue-300 rounded-xl focus:outline-none focus:border-blue-600 text-right"
                      />
                      <span className="text-xs text-blue-800 font-bold ml-2">KG</span>
                    </div>
                    <span className="text-[10px] text-blue-600 mt-1">ใส่น้ำหนักที่ชั่ง/นับได้จริง</span>
                  </div>

                  {/* Variance Card */}
                  <div className={`p-3.5 border rounded-2xl flex flex-col justify-between ${
                    variance === 0
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : variance < 0
                      ? "bg-red-50 border-red-300 text-red-800"
                      : "bg-indigo-50 border-indigo-300 text-indigo-800"
                  }`}>
                    <span className="text-[11px] font-bold flex items-center justify-between">
                      <span>ผลต่างการนับ (Variance)</span>
                      {variance === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : variance < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                      )}
                    </span>
                    <div className="mt-1">
                      <span className="text-2xl font-black font-mono">
                        {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold ml-1.5">KG</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold mt-1">
                      {variance === 0 
                        ? "ตรงกันสมบูรณ์ 100%" 
                        : `${variancePercent > 0 ? "+" : ""}${variancePercent.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* Additional Metadata Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ตำแหน่งจัดเก็บ (Rack / Bin)</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">พนักงานผู้ตรวจนับ</label>
                    <input
                      type="text"
                      value={countedBy}
                      onChange={(e) => setCountedBy(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เหตุผลการปรับปรุงสต็อก</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="การตรวจนับสต็อกรอบประจำสัปดาห์ (Cycle Count)">การตรวจนับสต็อกรอบประจำสัปดาห์ (Cycle Count)</option>
                      <option value="ตรวจนับสิ้นเดือน (Monthly Physical Audit)">ตรวจนับสิ้นเดือน (Monthly Physical Audit)</option>
                      <option value="ปรับลดยอดจากการสูญเสีย/ระเหย (Evaporation Loss)">ปรับลดยอดจากการสูญเสีย/ระเหย (Evaporation Loss)</option>
                      <option value="ปรับปรุงยอดตามสต็อกจริง (Physical Stock Adjustment)">ปรับปรุงยอดตามสต็อกจริง (Physical Stock Adjustment)</option>
                      <option value="พบของเสียหาย/ชำรุด (Damaged Lot)">พบของเสียหาย/ชำรุด (Damaged Lot)</option>
                    </select>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono">
                    Lot Barcode: {selectedLot?.barcode || `LOT-${selectedMaterial?.code}-${selectedLot?.supplier_lot_no}`}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLot(null);
                        setSelectedMaterial(null);
                        setBarcodeInput("");
                        barcodeInputRef.current?.focus();
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      ล้างการเลือก
                    </button>
                    <button
                      type="submit"
                      disabled={isSavedSuccess}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavedSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          บันทึกยอดสำเร็จแล้ว!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          บันทึกผลการนับและอัปเดตสต็อกจริง
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" /> บันทึกประวัติการตรวจนับสต็อก (Stock Count Audit Logs)
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="p-2.5">วัน-เวลา</th>
                    <th className="p-2.5">รหัสสารเคมี / Lot</th>
                    <th className="p-2.5">ผู้ตรวจนับ</th>
                    <th className="p-2.5 text-right">ยอดปรับปรุง</th>
                    <th className="p-2.5">เหตุผล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {stockCountLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString("th-TH")}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">
                        {log.material_code} {log.lot_number ? `(${log.lot_number})` : ""}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{log.user}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                        {log.new_value}
                      </td>
                      <td className="p-2.5 text-slate-600 text-[11px]">{log.reason}</td>
                    </tr>
                  ))}
                  {stockCountLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                        ยังไม่มีประวัติการนับสต็อกด้วยบาร์โค้ด
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
