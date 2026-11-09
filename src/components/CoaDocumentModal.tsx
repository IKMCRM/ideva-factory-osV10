import React, { useState } from "react";
import { 
  FileText, 
  Upload, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Link as LinkIcon, 
  Calendar, 
  Building2, 
  FlaskConical,
  Save,
  Trash2
} from "lucide-react";
import { Grn, RawMaterialLot, QcInspection } from "../types";

interface CoaDocumentModalProps {
  grn?: Grn | null;
  lot?: RawMaterialLot | null;
  inspection?: QcInspection | null;
  onClose: () => void;
  onSaveCoa: (payload: {
    grnId?: number;
    lotId?: number;
    inspectionId?: number;
    coaUrl: string;
    coaStatus: "Attached" | "Missing COA";
    coaData?: any;
  }) => Promise<void>;
}

export default function CoaDocumentModal({
  grn,
  lot,
  inspection,
  onClose,
  onSaveCoa
}: CoaDocumentModalProps) {
  const currentCoaUrl = grn?.coa_url || lot?.coa_url || "";
  const [coaUrl, setCoaUrl] = useState<string>(currentCoaUrl);
  const [fileName, setFileName] = useState<string>("");
  const [labName, setLabName] = useState<string>(
    grn?.supplier_name || lot?.supplier_name || inspection?.supplier_name || "IDEVA Laboratory / De Roma QA Dept"
  );
  const [issueDate, setIssueDate] = useState<string>(
    grn?.receive_date || new Date().toISOString().slice(0, 10)
  );
  const [purityPercent, setPurityPercent] = useState<string>("99.85");
  const [specificGravity, setSpecificGravity] = useState<string>("0.985 - 1.015");
  const [refractiveIndex, setRefractiveIndex] = useState<string>("1.4520 - 1.4580");
  const [heavyMetals, setHeavyMetals] = useState<string>("PASS (<10 ppm)");
  const [odorAppearance, setOdorAppearance] = useState<string>(
    grn?.appearance || lot?.appearance || "ตรงตามสเปกตรัมมาตรฐาน (Liquid / Pale Yellow)"
  );
  const [certifierName, setCertifierName] = useState<string>(
    inspection?.inspector || "ภญ. วรรณภา / ผู้ควบคุมคุณภาพเคมี"
  );
  const [remarks, setRemarks] = useState<string>(
    "ผลการวิเคราะห์ทางห้องปฏิบัติการผ่านเกณฑ์มาตรฐานอุตสาหกรรมเครื่องสำอางและน้ำหอม (Cosmetic Grade)"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "specs" | "preview">("upload");

  // File Upload handler via FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCoaUrl(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coaUrl && !remarks) {
      alert("กรุณาแนบไฟล์ COA หรือระบุ URL เอกสาร");
      return;
    }

    const coaData = {
      labName,
      issueDate,
      purityPercent,
      specificGravity,
      refractiveIndex,
      heavyMetals,
      odorAppearance,
      certifierName,
      remarks,
      updatedAt: new Date().toISOString()
    };

    await onSaveCoa({
      grnId: grn?.id,
      lotId: lot?.id,
      inspectionId: inspection?.id,
      coaUrl: coaUrl || "ATTACHED_SPEC_DATA",
      coaStatus: coaUrl ? "Attached" : "Missing COA",
      coaData
    });

    onClose();
  };

  const handleRemoveCoa = async () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร COA นี้?")) {
      setCoaUrl("");
      setFileName("");
      await onSaveCoa({
        grnId: grn?.id,
        lotId: lot?.id,
        inspectionId: inspection?.id,
        coaUrl: "",
        coaStatus: "Missing COA"
      });
      onClose();
    }
  };

  const materialCode = grn?.material_code || lot?.material_code || inspection?.material_code || "RM-CHEM";
  const materialName = grn?.material_name || lot?.material_name || inspection?.material_name || "เคมีภัณฑ์รับเข้า";
  const lotNo = grn?.lot_number || grn?.supplier_lot_no || lot?.supplier_lot_no || inspection?.supplier_lot_no || "-";
  const grnNo = grn?.code || inspection?.grn_no || "-";

  return (
    <div className="fixed inset-0 bg-black/60 z-[9995] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                จัดเก็บเอกสารใบรับรองผลวิเคราะห์ (COA Document)
              </h3>
              <p className="text-[11px] text-slate-300">
                Certificate of Analysis | ล็อต {lotNo} | GRN: {grnNo}
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

        {/* Info Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold">วัตถุดิบเคมีดิบ</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mr-1.5">
              {materialCode}
            </span>
            <strong className="text-slate-800">{materialName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-bold">สถานะ COA:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              coaUrl 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {coaUrl ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
              {coaUrl ? "แนบเอกสารแล้ว (Attached)" : "รอเอกสาร (Missing COA)"}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            1. แนบไฟล์ / ลิงก์เอกสาร COA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === "specs"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            2. สเปกผลวิเคราะห์ทางแล็บ (Lab Parameters)
          </button>
          {coaUrl && (
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              3. ตัวอย่างเอกสาร (Preview)
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "upload" && (
            <div className="space-y-4">
              {/* File Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="p-3 bg-blue-100 text-blue-700 rounded-full mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์ COA มาวางที่นี่
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  รองรับไฟล์ PDF, JPG, PNG, WEBP (ขนาดไม่เกิน 15 MB)
                </p>
                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {fileName}
                  </div>
                )}
                {isUploading && (
                  <div className="mt-2 text-xs text-blue-600 font-bold animate-pulse">
                    กำลังประมวลผลไฟล์...
                  </div>
                )}
              </div>

              {/* URL or Cloud link Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> หรือระบุ URL ลิงก์เอกสาร COA ภายนอก (Google Drive, Cloud Storage)
                </label>
                <input
                  type="text"
                  value={coaUrl}
                  onChange={(e) => setCoaUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/... หรือ data:image/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Lab / Issuer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ชื่อห้องแล็บ / ผู้ผลิตที่ออกใบ COA
                  </label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    วันที่ออกใบรับรอง (Issue Date)
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  บันทึกพารามิเตอร์เคมีวิเคราะห์สำคัญจากใบ COA เพื่อใช้อ้างอิงการผลิตและตรวจสอบย้อนกลับ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ความบริสุทธิ์ (Assay / Purity %)</label>
                  <input
                    type="text"
                    value={purityPercent}
                    onChange={(e) => setPurityPercent(e.target.value)}
                    placeholder="เช่น 99.85%"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ความถ่วงจำเพาะ (Specific Gravity @ 25°C)</label>
                  <input
                    type="text"
                    value={specificGravity}
                    onChange={(e) => setSpecificGravity(e.target.value)}
                    placeholder="เช่น 0.985 - 1.015"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ดัชนีหักเหของแสง (Refractive Index @ 20°C)</label>
                  <input
                    type="text"
                    value={refractiveIndex}
                    onChange={(e) => setRefractiveIndex(e.target.value)}
                    placeholder="เช่น 1.4520 - 1.4580"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">โลหะหนักและสารปนเปื้อน (Heavy Metals)</label>
                  <input
                    type="text"
                    value={heavyMetals}
                    onChange={(e) => setHeavyMetals(e.target.value)}
                    placeholder="PASS (<10 ppm)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ลักษณะทางกายภาพและกลิ่น (Odor & Appearance)</label>
                  <input
                    type="text"
                    value={odorAppearance}
                    onChange={(e) => setOdorAppearance(e.target.value)}
                    placeholder="ของเหลวใส กลิ่นหอมเฉพาะตัว ไม่มีตะกอน"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ผู้ตรวจวิเคราะห์ / รับรองผลแล็บ (QC Chemist / Authorized Signer)</label>
                  <input
                    type="text"
                    value={certifierName}
                    onChange={(e) => setCertifierName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-3">
              {coaUrl ? (
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex flex-col items-center">
                  {coaUrl.startsWith("data:image/") || coaUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                    <img
                      src={coaUrl}
                      alt="Certificate of Analysis Preview"
                      className="max-h-96 rounded-xl shadow-md border border-slate-200 object-contain"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">เอกสารใบรับรองผล COA พร้อมใช้งาน</p>
                      <a
                        href={coaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> เปิดดูเอกสารต้นฉบับในแท็บใหม่
                      </a>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={coaUrl}
                      download={`COA-${materialCode}-${lotNo}.png`}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> ดาวน์โหลดเอกสาร
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 italic">
                  ยังไม่ได้แนบไฟล์เอกสาร
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ / สรุปความเห็นเอกสาร COA
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              placeholder="ระบุข้อสังเกต หรือผลการตรวจสอบเอกสาร..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {coaUrl ? (
              <button
                type="button"
                onClick={handleRemoveCoa}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบเอกสาร COA
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> บันทึกเอกสาร COA
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
