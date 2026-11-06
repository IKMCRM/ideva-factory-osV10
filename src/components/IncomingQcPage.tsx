import React, { useState } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Printer, 
  Barcode as BarcodeIcon, 
  Edit, 
  Eye, 
  Plus, 
  X, 
  UserCheck, 
  Download, 
  CheckSquare, 
  Upload,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { QcInspection, RawMaterialLot, RawMaterial, Grn, AuditLog } from "../types";
import QcPassLabelModal from "./QcPassLabelModal";
import SearchableSelect from "./SearchableSelect";

interface IncomingQcPageProps {
  qcInspections: QcInspection[];
  lots: RawMaterialLot[];
  rawMaterials: RawMaterial[];
  grns: Grn[];
  onSaveQcInspection: (qc: QcInspection) => Promise<void>;
  onUpdateLotStatus: (lotId: number, qcStatus: any, stockStatus: any) => Promise<void>;
  onLogAudit?: (log: Omit<AuditLog, "id">) => Promise<void>;
}

export default function IncomingQcPage({
  qcInspections,
  lots,
  rawMaterials,
  grns,
  onSaveQcInspection,
  onUpdateLotStatus,
  onLogAudit
}: IncomingQcPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeQcModal, setActiveQcModal] = useState<QcInspection | null>(null);
  const [printLabelModalQc, setPrintLabelModalQc] = useState<QcInspection | null>(null);

  // Form State for Inspection Modal
  const [inspectorName, setInspectorName] = useState("สุรตน์");
  const [approverName, setApproverName] = useState("ดน");
  const [appearanceInput, setAppearanceInput] = useState("ของเหลว ใส ไม่มีตะกอน");
  const [qcStatusInput, setQcStatusInput] = useState<"QC Passed" | "QC Failed" | "Quarantine" | "Under Inspection">("QC Passed");
  const [coaStatusInput, setCoaStatusInput] = useState<"Attached" | "Missing COA">("Attached");
  const [coaFileUrl, setCoaFileUrl] = useState<string>("");
  const [remarksInput, setRemarksInput] = useState("ผ่านการตรวจสอบคุณภาพตามเกณฑ์มาตรฐานโรงงานน้ำหอม");
  const [checklistItems, setChecklistItems] = useState([
    { id: "1", title: "1. ตรวจสอบชื่อวัตถุดิบ (Material Name)", title_en: "Material Name Verification", result: "PASS" as const, remark: "ตรงตามใบสั่งซื้อ" },
    { id: "2", title: "2. ตรวจสอบรหัสสินค้า (Product Code)", title_en: "Product Code Verification", result: "PASS" as const, remark: "รหัสเคมีดิบถูกต้อง" },
    { id: "3", title: "3. ตรวจสอบ Supplier Lot No.", title_en: "Lot Number Check", result: "PASS" as const, remark: "ตรงตามฉลากผู้ผลิต" },
    { id: "4", title: "4. ตรวจสอบวันหมดอายุ (Expiry Date)", title_en: "Expiry Date Check", result: "PASS" as const, remark: "อายุการใช้งาน > 1 ปี" },
    { id: "5", title: "5. ตรวจสอบลักษณะกายภาพ (Appearance)", title_en: "Appearance Check", result: "PASS" as const, remark: "ใส กลิ่นหอมเฉพาะตัว" },
    { id: "6", title: "6. ตรวจสอบสี (Color)", title_en: "Color Verification", result: "PASS" as const, remark: "ตรงตามสเปกตรัมมาตรฐาน" },
    { id: "7", title: "7. ตรวจสอบกลิ่น (Odor / Aroma Profile)", title_en: "Odor Check", result: "PASS" as const, remark: "กลิ่นหอมสมบูรณ์ ไม่มีกลิ่นแปลกปลอม" },
    { id: "8", title: "8. ตรวจสอบปริมาณรับจริง (Quantity)", title_en: "Quantity Verification", result: "PASS" as const, remark: "ครบถ้วนตามน้ำหนักชั่ง" },
    { id: "9", title: "9. ตรวจสอบสภาพภาชนะบรรจุ (Container Condition)", title_en: "Packaging Integrity", result: "PASS" as const, remark: "ซีลสนิท ไม่มีรอยรั่วซึม" },
    { id: "10", title: "10. ตรวจสอบ COA (Certificate of Analysis)", title_en: "COA Document Check", result: "PASS" as const, remark: "มี COA แนบครบถ้วน" },
    { id: "11", title: "11. ตรวจสอบเอกสาร Supplier", title_en: "Supplier Invoice/Docs", result: "PASS" as const, remark: "เอกสารระบุซัพพลายเออร์ชัดเจน" },
    { id: "12", title: "12. ตรวจสอบเงื่อนไขการจัดเก็บ (Storage Condition)", title_en: "Storage Requirement", result: "PASS" as const, remark: "จัดเก็บห้องเย็น/อุณหภูมิห้องตามเกณฑ์" }
  ]);

  const openInspectionModal = (qc: QcInspection) => {
    setActiveQcModal(qc);
    setInspectorName(qc.inspector || "สุรตน์");
    setApproverName(qc.approver || "ดน");
    setAppearanceInput(qc.appearance || "ของเหลว ใส ไม่มีตะกอน");
    setQcStatusInput(qc.qc_status === "Pending QC" ? "QC Passed" : (qc.qc_status as any));
    setCoaStatusInput(qc.coa_status || "Attached");
    setRemarksInput(qc.remarks || "ผ่านการตรวจสอบคุณภาพตามมาตรฐาน");
    if (qc.checklist && qc.checklist.length > 0) {
      setChecklistItems(qc.checklist);
    }
  };

  const handleSaveInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQcModal) return;

    const isPassed = qcStatusInput === "QC Passed";
    const finalQcStatus = qcStatusInput;
    const finalStockStatus = isPassed ? "Available" : "Quarantine";

    const updatedQc: QcInspection = {
      ...activeQcModal,
      qc_status: finalQcStatus,
      appearance: appearanceInput,
      coa_status: coaStatusInput,
      checklist: checklistItems,
      inspector: inspectorName,
      inspection_date: new Date().toISOString().slice(0, 10),
      approver: approverName,
      approval_date: new Date().toISOString().slice(0, 10),
      remarks: remarksInput
    };

    await onSaveQcInspection(updatedQc);

    // Update RawMaterialLot QC status
    if (activeQcModal.lot_id) {
      await onUpdateLotStatus(activeQcModal.lot_id, finalQcStatus, finalStockStatus);
    }

    if (onLogAudit) {
      await onLogAudit({
        user: inspectorName,
        timestamp: new Date().toISOString(),
        action: isPassed ? "QC_APPROVED" : "QC_REJECTED",
        module: "IncomingQC",
        material_code: activeQcModal.material_code,
        lot_number: activeQcModal.supplier_lot_no,
        old_value: activeQcModal.qc_status,
        new_value: finalQcStatus,
        reason: remarksInput,
        ref_doc: activeQcModal.grn_no
      });
    }

    setActiveQcModal(null);
  };

  // Filtered Inspections
  const filteredInspections = qcInspections.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.grn_no.toLowerCase().includes(q) ||
      item.material_code.toLowerCase().includes(q) ||
      item.material_name.toLowerCase().includes(q) ||
      item.supplier_name.toLowerCase().includes(q) ||
      item.supplier_lot_no.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || item.qc_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const totalPending = qcInspections.filter((i) => i.qc_status === "Pending QC" || i.qc_status === "Under Inspection").length;
  const totalPassed = qcInspections.filter((i) => i.qc_status === "QC Passed").length;
  const totalFailed = qcInspections.filter((i) => i.qc_status === "QC Failed" || i.qc_status === "Quarantine").length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/20 w-fit px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> INCOMING QUALITY CONTROL (MODULE 4)
          </div>
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight">
            ระบบตรวจรับคุณภาพวัตถุดิบเคมีและน้ำหอม (Incoming QC)
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            ตรวจสอบวิเคราะห์คุณภาพวัตถุดิบเคมีดิบก่อนรับเข้าสต็อก สุ่มตรวจลักษณะกายภาพ กลิ่น สี เอกสาร COA และอนุมัติป้ายสีเขียว (QC PASS LABEL)
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-center">
            <span className="block text-lg font-mono font-black">{totalPending}</span>
            <span className="text-[10px]">รอตรวจ QC</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold text-center">
            <span className="block text-lg font-mono font-black">{totalPassed}</span>
            <span className="text-[10px]">ผ่านการตรวจ (Passed)</span>
          </div>
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-xl text-xs font-bold text-center">
            <span className="block text-lg font-mono font-black">{totalFailed}</span>
            <span className="text-[10px]">กักกัน (Quarantine)</span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "Pending QC", label: "🟡 รอการตรวจ (Pending)" },
            { id: "Under Inspection", label: "🔵 กำลังตรวจ (Inspecting)" },
            { id: "QC Passed", label: "🟢 ผ่านการตรวจ (Passed)" },
            { id: "QC Failed", label: "🔴 ไม่ผ่าน (Failed)" },
            { id: "Quarantine", label: "🛑 กักกัน (Quarantine)" }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                statusFilter === st.id
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาเลข GRN, รหัสเคมี, Lot No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* QC Inspection Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                <th className="p-3 text-center w-10 font-mono">#</th>
                <th className="p-3">เลขที่ GRN / ล็อต</th>
                <th className="p-3">รหัสสาร / ชื่อเคมีวัตถุดิบ</th>
                <th className="p-3">ผู้จำหน่าย (Supplier)</th>
                <th className="p-3">Supplier Lot No.</th>
                <th className="p-3 text-right">จำนวนรับ</th>
                <th className="p-3 text-center">วันหมดอายุ</th>
                <th className="p-3 text-center">เอกสาร COA</th>
                <th className="p-3 text-center">สถานะ QC</th>
                <th className="p-3 text-center w-40">ดำเนินการตรวจ QC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredInspections.map((qc, idx) => {
                const isPassed = qc.qc_status === "QC Passed";
                const isPending = qc.qc_status === "Pending QC" || qc.qc_status === "Under Inspection";
                const isFailed = qc.qc_status === "QC Failed" || qc.qc_status === "Quarantine";

                return (
                  <tr key={qc.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400 font-bold bg-slate-50/50">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-700">
                      <div>{qc.grn_no}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{qc.lot_code}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                        {qc.material_code}
                      </span>
                      <strong className="text-slate-900 font-bold">{qc.material_name}</strong>
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">{qc.supplier_name}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{qc.supplier_lot_no}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {qc.received_qty.toLocaleString()} {qc.purchase_unit || "KG."}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">{qc.expiry_date}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        qc.coa_status === "Attached"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        <FileText className="w-3 h-3" />
                        {qc.coa_status === "Attached" ? "มี COA" : "Missing COA"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPassed
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : isPending
                          ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}>
                        {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isPending && <ClockIcon className="w-3 h-3 text-amber-600" />}
                        {isFailed && <XCircle className="w-3 h-3 text-red-600" />}
                        {qc.qc_status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openInspectionModal(qc)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          title="บันทึกผลการตรวจ QC"
                        >
                          <Edit className="w-3 h-3" /> ตรวจ QC
                        </button>
                        {isPassed && (
                          <button
                            type="button"
                            onClick={() => setPrintLabelModalQc(qc)}
                            className="p-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            title="พิมพ์ป้ายชี้บ่งสีเขียว (QC PASS LABEL)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInspections.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 bg-slate-50 italic">
                    ไม่พบรายการตรวจรับคุณภาพวัตถุดิบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC INSPECTION MODAL */}
      {activeQcModal && (
        <div className="fixed inset-0 bg-black/60 z-[9990] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">
                    บันทึกผลการตรวจสอบคุณภาพ: {activeQcModal.material_name}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    GRN: {activeQcModal.grn_no} | Supplier Lot No: {activeQcModal.supplier_lot_no} | {activeQcModal.supplier_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveQcModal(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveInspectionSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Material Info Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">รหัสเคมีดิบ</span>
                  <span className="font-mono font-bold text-emerald-700">{activeQcModal.material_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">จำนวนรับจริง</span>
                  <span className="font-mono font-bold text-slate-800">{activeQcModal.received_qty} {activeQcModal.purchase_unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">วันหมดอายุ</span>
                  <span className="font-mono font-bold text-slate-800">{activeQcModal.expiry_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">เอกสาร COA</span>
                  <span className="font-bold text-blue-700">{coaStatusInput}</span>
                </div>
              </div>

              {/* Inspector & Status Config */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ผลการตัดสินใจ QC Status *</label>
                  <select
                    value={qcStatusInput}
                    onChange={(e) => setQcStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="QC Passed">🟢 อนุมัติผ่านการตรวจ (QC Passed)</option>
                    <option value="Under Inspection">🔵 อยู่ระหว่างตรวจสอบ (Under Inspection)</option>
                    <option value="QC Failed">🔴 ไม่ผ่านการตรวจ (QC Failed)</option>
                    <option value="Quarantine">🛑 กักกันวัตถุดิบ (Quarantine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ผู้ตรวจสอบ (Inspector) *</label>
                  <input
                    type="text"
                    required
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ผู้อนุมัติ (Approver) *</label>
                  <input
                    type="text"
                    required
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Appearance & COA Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ลักษณะกายภาพ (Appearance)</label>
                  <input
                    type="text"
                    value={appearanceInput}
                    onChange={(e) => setAppearanceInput(e.target.value)}
                    placeholder="เช่น ของเหลวใส สีเหลืองอ่อน กลิ่นหอมวานิลลา"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สถานะ Certificate of Analysis (COA)</label>
                  <select
                    value={coaStatusInput}
                    onChange={(e) => setCoaStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Attached">✓ แนบเอกสาร COA สมบูรณ์</option>
                    <option value="Missing COA">⚠️ ขาดเอกสาร COA (Missing COA)</option>
                  </select>
                </div>
              </div>

              {/* Checklist Table (12 Checkpoints) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden space-y-0">
                <div className="bg-slate-100 p-2.5 font-bold text-xs text-slate-800 border-b border-slate-200 flex justify-between items-center">
                  <span>รายการตรวจสอบคุณภาพมาตรฐาน (12 Checklist Items)</span>
                  <span className="text-[10px] text-slate-500 font-normal">เลือก PASS / FAIL / N/A แต่ละรายการ</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.title_en}</div>
                      </div>

                      {/* Result Select */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(["PASS", "FAIL", "N/A"] as const).map((res) => (
                          <button
                            key={res}
                            type="button"
                            onClick={() => {
                              const updated = [...checklistItems];
                              updated[index].result = res;
                              setChecklistItems(updated);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                              item.result === res
                                ? res === "PASS"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : res === "FAIL"
                                  ? "bg-red-600 text-white border-red-600 shadow-2xs"
                                  : "bg-slate-700 text-white border-slate-700"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>

                      {/* Remark Input */}
                      <input
                        type="text"
                        value={item.remark || ""}
                        onChange={(e) => {
                          const updated = [...checklistItems];
                          updated[index].remark = e.target.value;
                          setChecklistItems(updated);
                        }}
                        placeholder="หมายเหตุ..."
                        className="w-36 px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">บันทึกเพิ่มเติมจากผู้ตรวจสอบ (Inspection Remarks)</label>
                <textarea
                  rows={2}
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveQcModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    บันทึกผลการอนุมัติ QC
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC PASS LABEL PRINT MODAL */}
      {printLabelModalQc && (
        <QcPassLabelModal
          inspection={printLabelModalQc}
          lot={lots.find((l) => l.grn_no === printLabelModalQc.grn_no) || null}
          onClose={() => setPrintLabelModalQc(null)}
        />
      )}
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
