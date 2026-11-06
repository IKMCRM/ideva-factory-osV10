import React, { useState } from "react";
import { X, Printer, Settings, Database, ClipboardCheck, Tag, Sparkles, Download, FileText, CheckCircle2 } from "lucide-react";
import { BomRecipe, Customer, RawMaterial } from "../types";

interface BomPrintProps {
  bom: BomRecipe;
  customers: Customer[];
  rawMaterials: RawMaterial[];
  initialPieceSize?: number;
  initialPieceCount?: number;
  initialBatchQty?: number;
  initialCustomerId?: number | "";
  onClose: () => void;
}

export default function BomPrint({
  bom,
  customers,
  rawMaterials,
  initialPieceSize,
  initialPieceCount,
  initialBatchQty,
  initialCustomerId,
  onClose
}: BomPrintProps) {
  // 1. Config States for printing
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(initialCustomerId || "");
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [customCustomerCode, setCustomCustomerCode] = useState("");

  // Production Size (ml/g) & Quantity (pcs) & Total (Kg)
  const [pieceSize, setPieceSize] = useState<number>(initialPieceSize || 50);
  const [pieceCount, setPieceCount] = useState<number>(initialPieceCount || 1000);
  const [batchSize, setBatchSize] = useState<number>(
    initialBatchQty || parseFloat((((initialPieceSize || 50) * (initialPieceCount || 1000)) / 1000).toFixed(2))
  );
  const [batchUnit, setBatchUnit] = useState<string>(bom.product_type === "Powder" ? "กก." : "ลิตร");
  const [lotNo, setLotNo] = useState<string>("001");
  const [productType, setProductType] = useState<string>(bom.product_type || "Liquid");

  // Editable Special Notes / Precautions
  const defaultNote =
    bom.notes && !bom.notes.trim().startsWith("[")
      ? bom.notes
      : "สวมใส่อุปกรณ์ป้องกันภัยส่วนบุคคล (PPE) อาทิ แว่นตานิรภัย หน้ากากกรองสารเคมี และถุงมือยางกันสารเคมีทุกครั้งขณะทำการจัดเตรียม และดำเนินกระบวนการกวนผสมสูตรผลิตภัณฑ์เคมีโรงงาน";
  const [specialNotes, setSpecialNotes] = useState<string>(defaultNote);

  // Print mode tab: all (3 pages) | bpr (page 1) | weigh (page 2) | labels (page 3)
  const [activePrintTab, setActivePrintTab] = useState<"all" | "bpr" | "weigh" | "labels">("all");

  // Unit overrides per material index: "G." or "KG."
  const [customUnits, setCustomUnits] = useState<Record<number, "G." | "KG.">>({});

  // Determine Customer details
  const matchedCustomer = customers.find((c) => c.id === Number(selectedCustomerId));
  const customerName = matchedCustomer ? matchedCustomer.name : (customCustomerName || "ทั่วไป");
  const customerCode = matchedCustomer ? matchedCustomer.code : (customCustomerCode || "C-TEMP");

  // Format Instructions parsed from BOM notes JSON or raw string
  let instructions: Array<{ instruction: string }> = [];
  if (bom.notes) {
    try {
      if (bom.notes.trim().startsWith("[")) {
        instructions = JSON.parse(bom.notes);
      }
    } catch {
      // ignore
    }
  }
  // Fill up with standard instructions if empty
  if (instructions.length === 0 || (instructions.length === 1 && !instructions[0].instruction)) {
    instructions = [
      { instruction: "เตรียมภาชนะสะอาดและเครื่องชั่งตรวจสอบความถูกต้องก่อนชั่งสารเคมี" },
      { instruction: "เติมสาร Part A ลำดับแรก กวนผสมช้าๆ จนสารละลายจนหมดและเนื้อเข้ากันดี" },
      { instruction: "ค่อยๆ เติมสาร Part B/C แต่งกลิ่นและสี กวนต่อด้วยความเร็วสม่ำเสมอเป็นเวลา 15-20 นาที" },
      { instruction: "ตรวจสอบลักษณะทางกายภาพ ค่าความหนืด และค่า pH ให้ได้ตามเกณฑ์มาตรฐาน" }
    ];
  }

  // Handle Size change -> update batchSize
  const handlePieceSizeChange = (val: number) => {
    const size = Math.max(0.01, val);
    setPieceSize(size);
    const newKg = parseFloat(((size * pieceCount) / 1000).toFixed(3));
    setBatchSize(newKg);
  };

  // Handle Count change -> update batchSize
  const handlePieceCountChange = (val: number) => {
    const count = Math.max(1, val);
    setPieceCount(count);
    const newKg = parseFloat(((pieceSize * count) / 1000).toFixed(3));
    setBatchSize(newKg);
  };

  // Handle direct batchSize (Kg) change -> update count if size > 0
  const handleBatchSizeChange = (val: number) => {
    const kg = Math.max(0.01, val);
    setBatchSize(kg);
    if (pieceSize > 0) {
      setPieceCount(Math.round((kg * 1000) / pieceSize));
    }
  };

  // Toggle unit for a specific material
  const toggleMaterialUnit = (idx: number, currentUnit: "G." | "KG.") => {
    const nextUnit = currentUnit === "KG." ? "G." : "KG.";
    setCustomUnits((prev) => ({ ...prev, [idx]: nextUnit }));
  };

  // Set all materials unit to G. or KG.
  const setAllUnits = (unit: "G." | "KG.") => {
    const next: Record<number, "G." | "KG."> = {};
    (bom.materials || []).forEach((_, idx) => {
      next[idx] = unit;
    });
    setCustomUnits(next);
  };

  // 2. Calculate Materials totals and ratio accurately
  const materialsList = bom.materials || [];
  const totalBOMQty = materialsList.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0) || 100;

  const printMaterials = materialsList.map((m, idx) => {
    const rawQty = Number(m.quantity) || 0;
    const ratio = totalBOMQty > 0 ? rawQty / totalBOMQty : 0;
    const wPercent = ratio * 100;
    const oneKgGrams = ratio * 1000; // grams per 1 kg of mixture

    // Batch calculations in Kg and Grams
    const batchWeightKg = ratio * batchSize;
    const batchWeightGrams = batchWeightKg * 1000;

    // Unit resolution: "G." vs "KG."
    const explicitUnit = customUnits[idx];
    const mUnitUpper = (m.unit || "").toUpperCase();
    const isBOMGrams = mUnitUpper.includes("G") && !mUnitUpper.includes("KG");

    // Smart default: if explicitUnit is set, use it.
    // Else: if BOM unit is explicitly G. OR if required weight in Kg < 1.0 (e.g. 0.05 Kg = 50 G), default to G.
    // Otherwise default to KG.
    const displayUnit: "G." | "KG." = explicitUnit || (isBOMGrams || batchWeightKg < 1.0 ? "G." : "KG.");
    const isKg = displayUnit === "KG.";

    // Formatted display values
    const displayQty = isKg
      ? batchWeightKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })
      : batchWeightGrams.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Raw material code
    const matchedRm = rawMaterials.find(
      (rm) =>
        rm.name.toLowerCase() === (m.material_name || "").toLowerCase() ||
        (m.material_code && rm.code.toLowerCase() === m.material_code.toLowerCase())
    );
    const materialCode = m.material_code || (matchedRm ? matchedRm.code : "RM-N/A");

    // Part grouping
    let part = m.part || "A";
    if (!m.part) {
      if (idx >= 3) part = "B";
      if (idx >= 6) part = "C";
    }

    return {
      idx,
      no: idx + 1,
      part,
      code: materialCode,
      name: m.material_name,
      percent: wPercent,
      oneKgGrams,
      batchWeightKg,
      batchWeightGrams,
      displayUnit,
      isKg,
      displayQty,
      notes: m.notes || ""
    };
  });

  // Dedicated Print Function supporting Direct Printer & Save as PDF
  const handlePrint = () => {
    const printContent = document.getElementById("print-area");
    if (!printContent) {
      window.print();
      return;
    }

    try {
      let iframe = document.getElementById("direct-print-iframe") as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "direct-print-iframe";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
          .map((s) => s.outerHTML)
          .join("\n");

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="th">
            <head>
              <meta charset="utf-8" />
              <title>${bom.product_name || "BOM"}_Lot_${lotNo || "001"}_เอกสารการผลิต</title>
              ${styles}
              <style>
                @page {
                  size: A4 portrait;
                  margin: 6mm 8mm;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  box-sizing: border-box;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  font-family: system-ui, -apple-system, sans-serif;
                  color: #0f172a;
                }
                .page-break {
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .bpr-page, .weigh-page, .labels-page {
                  width: 100% !important;
                  max-width: 210mm !important;
                  margin: 0 auto !important;
                  padding: 4mm 6mm !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                #print-area {
                  margin: 0 !important;
                  padding: 0 !important;
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.warn("Iframe print error, falling back to window.print", e);
            window.print();
          }
        }, 350);
        return;
      }
    } catch (err) {
      console.warn("Iframe setup error, falling back to window.print", err);
    }

    window.print();
  };

  // Export standalone HTML file for offline printing or PDF generation
  const handleDownloadHtml = () => {
    const printContent = document.getElementById("print-area");
    if (!printContent) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${bom.product_name || "BOM"}_${lotNo || "001"}_เอกสารการผลิต_A4</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .page-container { max-width: 210mm; margin: 0 auto; background: white; }
    .page-break { page-break-after: always; break-after: page; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .page-container { width: 100% !important; max-width: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:210mm; margin:0 auto 16px; padding:12px 18px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
    <div>
      <strong style="color:#1e3a8a; font-size:14px;">เอกสารการผลิตมาตรฐาน A4 — ${bom.product_name || "BOM"}</strong>
      <p style="margin:2px 0 0; font-size:11px; color:#64748b;">กดปุ่มด้านขวา หรือกด Ctrl + P บนแป้นพิมพ์เพื่อพิมพ์ออกเครื่องพิมพ์ หรือเลือก "บันทึกเป็น PDF"</p>
    </div>
    <button onclick="window.print()" style="padding:8px 18px; background:#2563eb; color:white; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">
      🖨️ พิมพ์ออกเครื่องพิมพ์ / บันทึก PDF
    </button>
  </div>
  <div class="page-container">
    ${printContent.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `เอกสารการผลิต_${bom.product_code || "BOM"}_Lot_${lotNo || "001"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:z-0">
      {/* Configuration Form panel - Container stays visible on print so print-area prints! */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none print:overflow-visible print:p-0 print:m-0">
        
        {/* Header - HIDDEN ON PRINT */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
                เครื่องมือพิมพ์เอกสารการผลิต (BPR / ใบชั่ง / ฉลากชั่งวัตถุดิบ)
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {bom.product_code || "BOM"}
                </span>
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500">
                รองรับการพิมพ์ออกเครื่องพิมพ์ A4 โดยตรง หรือบันทึกเป็นไฟล์ PDF (Save as PDF)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setup layout */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 print:overflow-visible print:block print:divide-none">
          
          {/* LEFT: Config form panel - HIDDEN ON PRINT */}
          <div className="w-full lg:w-96 p-4 sm:p-5 bg-slate-50/70 space-y-4 flex-shrink-0 overflow-y-auto max-h-[85vh] print:hidden">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-blue-600" /> ตั้งค่าแบทช์และคำนวณการผลิต
              </span>
            </div>

            {/* Print Selection Tabs */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">เลือกส่วนที่ต้องการพิมพ์</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActivePrintTab("all")}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activePrintTab === "all"
                      ? "bg-white text-blue-700 shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📄 ทั้งหมด (3 หน้า)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePrintTab("bpr")}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activePrintTab === "bpr"
                      ? "bg-white text-blue-700 shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📝 บันทึกการผลิต (BPR)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePrintTab("weigh")}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activePrintTab === "weigh"
                      ? "bg-white text-blue-700 shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⚖️ ใบชั่งสารสำหรับผลิต
                </button>
                <button
                  type="button"
                  onClick={() => setActivePrintTab("labels")}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activePrintTab === "labels"
                      ? "bg-white text-blue-700 shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🏷️ ฉลากชั่งวัตถุดิบ
                </button>
              </div>
            </div>

            {/* Customer select */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">ลูกค้า / แบรนด์สั่งผลิต</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- ลูกค้าทั่วไป / กำหนดเอง --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} {c.contact ? `(${c.contact})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {!selectedCustomerId && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">รหัสลูกค้า</label>
                  <input
                    type="text"
                    value={customCustomerCode}
                    onChange={(e) => setCustomCustomerCode(e.target.value)}
                    placeholder="เช่น C-099"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">ชื่อแบรนด์/ลูกค้า</label>
                  <input
                    type="text"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    placeholder="แบรนด์พรีเมียม"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* Calculation Parameters: ขนาด (ml) + จำนวน (ชิ้น) ต่อด้วย Kg    */}
            {/* ============================================================== */}
            <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl space-y-3">
              <div className="text-[11px] font-extrabold text-blue-900 flex items-center justify-between">
                <span>คำนวณขนาดและยอดผลิต</span>
                <span className="text-[9px] font-bold bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-md">
                  สูตรแปลงค่าอัตโนมัติ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. ขนาด...ml ที่ผลิต */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    ขนาดที่ผลิต (ml หรือ g) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={pieceSize}
                      onChange={(e) => handlePieceSizeChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">ml</span>
                  </div>
                </div>

                {/* 2. จำนวนที่ผลิต ...ชิ้น */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    จำนวนที่ผลิต (ชิ้น) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={pieceCount}
                      onChange={(e) => handlePieceCountChange(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">ชิ้น</span>
                  </div>
                </div>
              </div>

              {/* 3. ต่อด้วย Kg (น้ำหนักรวมผลิต) */}
              <div>
                <label className="block text-[10px] font-extrabold text-blue-900 uppercase mb-1">
                  รวมน้ำหนักผลิต (ต่อด้วย Kg) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={batchSize}
                      onChange={(e) => handleBatchSizeChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-10 border-2 border-blue-400 rounded-lg text-xs font-mono font-extrabold text-right bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] font-bold text-blue-600">Kg</span>
                  </div>
                  <select
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    className="w-24 px-2 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="กก.">กก. (Kg)</option>
                    <option value="ลิตร">ลิตร (L)</option>
                    <option value="แกลลอน">แกลลอน</option>
                  </select>
                </div>
              </div>

              {/* Formula explanation badge */}
              <div className="text-[10px] text-blue-800 bg-white/80 p-2 rounded-lg border border-blue-200 font-mono">
                💡 ขนาด <strong>{pieceSize}</strong> ml x <strong>{pieceCount.toLocaleString()}</strong> ชิ้น ={" "}
                <strong className="text-red-600 text-xs">
                  {batchSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg
                </strong>
              </div>
            </div>

            {/* Lot No & Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">เลขที่ Lot ผลิต</label>
                <input
                  type="text"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  placeholder="เช่น 001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">ลักษณะผลิตภัณฑ์</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="Liquid">Liquid (ของเหลว)</option>
                  <option value="Powder">Powder (ผงเคมี)</option>
                  <option value="Gel">Gel (เจล)</option>
                  <option value="Cream">Cream (ครีม)</option>
                </select>
              </div>
            </div>

            {/* Quick unit switch for ingredients (G. vs KG.) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-600 uppercase">
                  สลับหน่วยสารเคมี (G. / KG.)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAllUnits("G.")}
                    className="text-[9px] px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold"
                  >
                    ทั้งหมดเป็น G.
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllUnits("KG.")}
                    className="text-[9px] px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold"
                  >
                    ทั้งหมดเป็น KG.
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                * ค่าเริ่มต้น: สารเคมี &lt; 1 Kg หรือกลิ่น/สีจะแสดงหน่วย <strong>G.</strong> สารปริมาณมากจะแสดงเป็น{" "}
                <strong className="text-red-600">KG. (สีแดง)</strong>
              </p>
            </div>

            {/* Editable Special Notes */}
            <div className="space-y-1 pt-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase">
                หมายเหตุ / ข้อควรระวังพิเศษ (แก้ไขได้)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                rows={3}
                placeholder="ระบุข้อความหมายเหตุ หรือข้อควรระวังในการผลิต..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setSpecialNotes(
                      "สวมใส่อุปกรณ์ป้องกันภัยส่วนบุคคล (PPE) อาทิ แว่นตานิรภัย หน้ากากกรองสารเคมี และถุงมือยางกันสารเคมีทุกครั้ง"
                    )
                  }
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                >
                  มาตรฐาน PPE
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSpecialNotes(
                      "ควบคุมอุณหภูมิการกวนผสมระหว่าง 50-60°C หลีกเลี่ยงความร้อนสูงเกินมาตรฐาน และกวนผสมอย่างต่อเนื่อง 20 นาที"
                    )
                  }
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                >
                  คุมอุณหภูมิ 50-60°C
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSpecialNotes(
                      "สารเคมีไวไฟ ห้ามให้มีประกายไฟในบริเวณผสม และตรวจสอบระบบสายดินของถังกวนก่อนเริ่มปั๊มสาร"
                    )
                  }
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                >
                  ระวังสารไวไฟ
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* Print & PDF Action Buttons & Instructions                      */}
            {/* ============================================================== */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> สั่งพิมพ์เอกสารออกกระดาษ (A4) / บันทึก PDF
              </button>

              <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl space-y-1.5 text-[9.5px] text-blue-900 leading-relaxed">
                <div className="font-extrabold flex items-center gap-1.5 text-blue-950">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> แนะนำการพิมพ์ หรือบันทึก PDF:
                </div>
                <ul className="list-disc list-inside space-y-1 pl-0.5 text-slate-700">
                  <li>
                    <strong>พิมพ์ออกเครื่องพิมพ์โดยตรง:</strong> ในหน้าต่างพิมพ์ ให้เลือกเครื่องพิมพ์ของท่านในช่อง{" "}
                    <em>ปลายทาง (Destination)</em> แล้วกดพิมพ์
                  </li>
                  <li>
                    <strong>บันทึกเป็นไฟล์ PDF:</strong> ให้เลือกปลายทางเป็น{" "}
                    <strong className="text-blue-700">"บันทึกเป็น PDF" (Save as PDF)</strong> แล้วกดบันทึก
                  </li>
                  <li>
                    <strong>ตั้งค่าหน้ากระดาษ:</strong> ขนาด <strong>A4</strong>, แนวตั้ง (Portrait), ระยะขอบ <strong>ไม่มี (None)</strong> หรือค่าเริ่มต้น
                  </li>
                  <li>
                    <strong>แสดงสีไฮไลท์ชัดเจน:</strong> ติ๊กเปิด{" "}
                    <strong className="text-amber-800">"กราฟิกพื้นหลัง" (Background graphics)</strong> เพื่อให้สีเหลืองอ่อนและตัวหนังสือสีแดงคมชัด
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-300 cursor-pointer"
                title="ดาวน์โหลดไฟล์เอกสาร A4 สำหรับเปิดพิมพ์หรือสำรองข้อมูลภายนอก"
              >
                <Download className="w-4 h-4 text-slate-600" /> ดาวน์โหลดไฟล์เอกสาร A4 (.html)
              </button>
            </div>
          </div>

          {/* RIGHT: Live Interactive Print Preview */}
          <div className="flex-1 p-4 sm:p-6 bg-slate-100 overflow-y-auto space-y-8 print:p-0 print:m-0 print:bg-white print:overflow-visible">
            <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center justify-between print:hidden">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ตัวอย่างหน้ากระดาษ A4 เสมือนจริง (Live Print Preview)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded text-[9px]">
                  แถวปริมาณผลิต: สีเหลืองอ่อน (Kg = ตัวหนังสือสีแดง)
                </span>
              </div>
            </div>

            {/* PREVIEW CONTAINER (PRINT AREA) */}
            <div id="print-area" className="mx-auto space-y-12 print:space-y-0 print:m-0 print:p-0">
              
              {/* ============================================================== */}
              {/* PAGE 1: BPR (Batch Processing Record - ใบบันทึกการผลิต)        */}
              {/* ============================================================== */}
              {(activePrintTab === "all" || activePrintTab === "bpr") && (
                <div className="bpr-page bg-white border border-slate-300 p-[12mm] sm:p-[15mm] w-[210mm] min-h-[297mm] shadow-lg font-sans text-slate-900 mx-auto box-border page-break print:border-none print:shadow-none print:p-[8mm_6mm] print:m-0 print:w-full print:max-w-[210mm]">
                  {/* Header Section */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5">
                    <div className="text-left">
                      <h1 className="text-lg font-extrabold tracking-tight font-serif text-slate-900">IDEVA GROUP</h1>
                      <p className="text-[9px] font-mono text-slate-500 font-bold">IDEVA GROUP CO., LTD.</p>
                    </div>
                    <div className="text-center flex-1">
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">ใบบันทึกการผลิต</h2>
                      <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        BATCH PROCESSING RECORD (BPR)
                      </h3>
                    </div>
                    <div className="text-right text-[10px] font-mono border border-slate-300 p-1 bg-slate-50">
                      <strong>FM-PD-01</strong>
                    </div>
                  </div>

                  {/* Metadata Grid Table */}
                  <div className="mt-3.5 border border-slate-950 text-[10px] w-full">
                    {/* Row 1: Start/End Time without pre-filled date */}
                    <div className="flex border-b border-slate-950">
                      <div className="w-1/2 p-1.5 border-r border-slate-950">
                        <strong>วัน/เวลา ชั่งสาร (เริ่ม-สิ้นสุด) :</strong> .............................................................
                      </div>
                      <div className="w-1/2 p-1.5">
                        <strong>วัน/เวลา ผสม (เริ่ม-สิ้นสุด) :</strong> .............................................................
                      </div>
                    </div>

                    {/* Row 2: Product Name & Code */}
                    <div className="flex border-b border-slate-950">
                      <div className="w-1/2 p-1.5 border-r border-slate-950">
                        <strong>ชื่อผลิตภัณฑ์ :</strong> <span className="font-bold">{bom.product_name || "-"}</span>
                      </div>
                      <div className="w-1/2 p-1.5">
                        <strong>รหัสผลิตภัณฑ์ :</strong> <span className="font-mono font-bold">{bom.product_code || "-"}</span>
                      </div>
                    </div>

                    {/* Row 3: Customer & Production Batch Specs */}
                    <div className="flex border-b border-slate-950">
                      <div className="w-1/3 p-1.5 border-r border-slate-950">
                        <strong>ชื่อลูกค้า :</strong> <span className="font-bold">{customerName}</span>
                      </div>
                      <div className="w-1/3 p-1.5 border-r border-slate-950">
                        <strong>รหัสลูกค้า :</strong> <span className="font-mono font-bold">{customerCode}</span>
                      </div>
                      <div className="w-1/3 p-1.5">
                        <strong>ขนาดบรรจุที่ผลิต :</strong>{" "}
                        <span className="font-mono font-bold text-blue-700">{pieceSize} ml</span>
                      </div>
                    </div>

                    {/* Row 4: Quantity & Total Batch Size */}
                    <div className="flex border-b border-slate-950">
                      <div className="w-1/3 p-1.5 border-r border-slate-950">
                        <strong>จำนวนที่ผลิต :</strong>{" "}
                        <span className="font-mono font-bold text-slate-800">{pieceCount.toLocaleString()} ชิ้น</span>
                      </div>
                      <div className="w-1/3 p-1.5 border-r border-slate-950 bg-yellow-50" style={{ backgroundColor: "#fef9c3" }}>
                        <strong>ปริมาณรุ่นที่ผลิตรวม :</strong>{" "}
                        <span className="font-mono font-extrabold text-red-600" style={{ color: "#dc2626" }}>
                          {batchSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          {batchUnit}
                        </span>
                      </div>
                      <div className="w-1/3 p-1.5">
                        <strong>ลักษณะผลิตภัณฑ์ :</strong> <span className="font-bold">{productType}</span>
                      </div>
                    </div>

                    {/* Row 5: Lot No */}
                    <div className="flex">
                      <div className="w-full p-1.5">
                        <strong>เลขที่ Lot ผลิต :</strong>{" "}
                        <span className="font-mono font-bold text-indigo-700">{lotNo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section Title: ปริมาณชั่ง */}
                  <h4 className="mt-3.5 text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-blue-600" /> ปริมาณชั่งสารเคมี (Ingredient Formulation Sheet)
                    </span>
                    <span className="text-[9px] font-normal text-slate-500 print:hidden">
                      * คอลัมน์ปริมาณผลิตไฮไลท์สีเหลืองอ่อน (หน่วย Kg ตัวหนังสือสีแดง)
                    </span>
                  </h4>

                  {/* Materials List Table */}
                  <table className="mt-1.5 w-full border-collapse border border-slate-950 text-[9px]">
                    <thead>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th className="border border-slate-950 p-1 w-8">ลำดับ</th>
                        <th className="border border-slate-950 p-1 w-20">Lot.วัตถุดิบ</th>
                        <th className="border border-slate-950 p-1 w-8">Part</th>
                        <th className="border border-slate-950 p-1 w-20">รหัสวัตถุดิบ</th>
                        <th className="border border-slate-950 p-1">ชื่อวัตถุดิบเคมีภัณฑ์</th>
                        <th className="border border-slate-950 p-1 w-12">(% w/w)</th>
                        <th className="border border-slate-950 p-1 w-16">1 KG (g)</th>
                        {/* ปริมาณผลิต Header */}
                        <th
                          className="border border-slate-950 p-1 w-28 bg-[#fef9c3] text-slate-900 font-extrabold"
                          style={{ backgroundColor: "#fef9c3" }}
                        >
                          ปริมาณผลิต ({batchSize} {batchUnit})
                        </th>
                        <th className="border border-slate-950 p-1 w-12">ผู้ชั่ง</th>
                        <th className="border border-slate-950 p-1 w-12">ผู้ทวนสอบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printMaterials.map((m) => (
                        <tr key={m.no} className="h-7 text-center">
                          <td className="border border-slate-950 p-1 font-mono text-slate-500">{m.no}</td>
                          <td className="border border-slate-950 p-1 font-mono text-[8px] text-slate-400">..................</td>
                          <td className="border border-slate-950 p-1 font-bold">{m.part}</td>
                          <td className="border border-slate-950 p-1 font-mono text-left">{m.code}</td>
                          <td className="border border-slate-950 p-1 text-left font-semibold">{m.name}</td>
                          <td className="border border-slate-950 p-1 font-mono">{m.percent.toFixed(2)}%</td>
                          <td className="border border-slate-950 p-1 font-mono">{m.oneKgGrams.toFixed(2)}</td>

                          {/* ปริมาณผลิต Cell: สีเหลืองอ่อน และหากหน่วยเป็น Kg ให้ใส่ตัวหนังสือสีแดง */}
                          <td
                            className={`border border-slate-950 p-1 font-mono text-right bg-[#fef9c3] print:bg-[#fef9c3] ${
                              m.isKg ? "text-red-600 font-extrabold" : "text-slate-900 font-bold"
                            }`}
                            style={{ backgroundColor: "#fef9c3", color: m.isKg ? "#dc2626" : "#0f172a" }}
                          >
                            <span className="flex items-center justify-end gap-1">
                              <span>{m.displayQty}</span>
                              <span className={m.isKg ? "text-red-600 font-extrabold" : "text-slate-700 font-bold"}>
                                {m.displayUnit}
                              </span>
                              {/* Toggle unit button visible only on preview screen */}
                              <button
                                type="button"
                                onClick={() => toggleMaterialUnit(m.idx, m.displayUnit)}
                                title="สลับหน่วย G. / KG."
                                className="print:hidden text-[8px] px-1 py-0.2 bg-white/80 hover:bg-white text-slate-600 rounded border border-slate-300 ml-1 cursor-pointer"
                              >
                                ⇄
                              </button>
                            </span>
                          </td>

                          <td className="border border-slate-950 p-1"></td>
                          <td className="border border-slate-950 p-1"></td>
                        </tr>
                      ))}

                      {/* Sum row */}
                      <tr className="bg-slate-50 font-bold text-right h-7">
                        <td colSpan={5} className="border border-slate-950 p-1 text-center font-bold">
                          รวมสูตรผสมมาตรฐาน ({pieceSize} ml x {pieceCount.toLocaleString()} ชิ้น)
                        </td>
                        <td className="border border-slate-950 p-1 text-center font-mono">100.00%</td>
                        <td className="border border-slate-950 p-1 text-center font-mono">1,000.00</td>
                        <td
                          className="border border-slate-950 p-1 font-mono text-right bg-[#fef9c3] text-red-600 font-extrabold"
                          style={{ backgroundColor: "#fef9c3", color: "#dc2626" }}
                        >
                          {batchSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          {batchUnit}
                        </td>
                        <td colSpan={2} className="border border-slate-950 bg-slate-100"></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Section Title: วิธีการผลิต */}
                  <h4 className="mt-3.5 text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" /> วิธีการผลิต (Manufacturing Instructions & Steps)
                  </h4>

                  {/* Instruction Steps Table */}
                  <table className="mt-1.5 w-full border-collapse border border-slate-950 text-[9px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-950 p-1 w-10 text-center">ลำดับ</th>
                        <th className="border border-slate-950 p-1 text-left">วิธีการผลิต / ขั้นตอนผสมสารเคมีสำเร็จรูป</th>
                        <th className="border border-slate-950 p-1 w-24 text-center">ผลการดำเนินงาน</th>
                        <th className="border border-slate-950 p-1 w-16 text-center">ผู้บันทึก</th>
                        <th className="border border-slate-950 p-1 w-16 text-center">ผู้ตรวจสอบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructions.map((inst, index) => (
                        <tr key={index} className="h-8">
                          <td className="border border-slate-950 p-1 text-center font-mono font-bold">{index + 1}</td>
                          <td className="border border-slate-950 p-1 text-left font-medium leading-relaxed max-w-sm">
                            {inst.instruction}
                          </td>
                          <td className="border border-slate-950 p-1 text-center text-[8px] text-slate-400">
                            ........................
                          </td>
                          <td className="border border-slate-950 p-1"></td>
                          <td className="border border-slate-950 p-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Production result validation box */}
                  <div className="mt-3 border border-slate-950 text-[9px]">
                    <div className="flex bg-slate-50 font-bold border-b border-slate-950 text-center">
                      <div className="w-1/4 p-1 border-r border-slate-950">ปริมาณตามทฤษฎี</div>
                      <div className="w-1/4 p-1 border-r border-slate-950">ปริมาณที่ควรผลิตได้</div>
                      <div className="w-1/4 p-1 border-r border-slate-950">ปริมาณที่ผลิตได้จริง</div>
                      <div className="w-1/4 p-1">ผู้บันทึกสรุป</div>
                    </div>
                    <div className="flex text-center h-6 items-center">
                      <div className="w-1/4 p-1 border-r border-slate-950 font-mono font-bold text-slate-800">
                        {batchSize.toLocaleString()} {batchUnit}
                      </div>
                      <div className="w-1/4 p-1 border-r border-slate-950 font-mono text-[8px] text-slate-400">
                        ...........................
                      </div>
                      <div className="w-1/4 p-1 border-r border-slate-950 font-mono text-[8px] text-slate-400">
                        ...........................
                      </div>
                      <div className="w-1/4 p-1 font-mono text-[8px] text-slate-400">...........................</div>
                    </div>
                  </div>

                  {/* หมายเหตุ / ข้อควรระวังพิเศษ - Dynamically editable */}
                  <div className="mt-3 p-2 border border-slate-950 rounded bg-slate-50 text-[9px] leading-relaxed text-slate-800">
                    <strong>หมายเหตุ / ข้อควรระวังพิเศษ :</strong> {specialNotes || "-"}
                  </div>

                  {/* Signatures Section with blank dates for operator handwriting */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-[9px]">
                    <div className="border border-slate-950 p-2 text-center space-y-2.5">
                      <div className="font-bold underline">ผู้บันทึกกระบวนการผลิต</div>
                      <div className="pt-2 text-slate-400">............................................................</div>
                      <div>ตำแหน่ง : ............................................</div>
                      <div>วันที่ : ......... / ......... / .............</div>
                    </div>
                    <div className="border border-slate-950 p-2 text-center space-y-2.5">
                      <div className="font-bold underline">ผู้ตรวจสอบ (QA/QC Auditor)</div>
                      <div className="pt-2 text-slate-400">............................................................</div>
                      <div>ตำแหน่ง : ............................................</div>
                      <div>วันที่ : ......... / ......... / .............</div>
                    </div>
                    <div className="border border-slate-950 p-2 text-center space-y-2.5">
                      <div className="font-bold underline">ผู้อนุมัติการปล่อยล็อตสินค้า</div>
                      <div className="pt-2 text-slate-400">............................................................</div>
                      <div>ตำแหน่ง : ............................................</div>
                      <div>วันที่ : ......... / ......... / .............</div>
                    </div>
                  </div>

                  {/* Page Footer */}
                  <div className="mt-4 flex justify-between text-[8px] text-slate-400 font-mono font-bold border-t border-slate-200 pt-1.5">
                    <span>IDEVA FACTORY SYSTEM (BOM OS)</span>
                    <span>FM-PD-01 BPR ใบบันทึกการผลิต Rev.02 บังคับใช้ 01.09.2566</span>
                    <span>หน้า 1/3</span>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PAGE 2: WEIGHING SHEET (ใบชั่งสารสำหรับผลิต)                    */}
              {/* ============================================================== */}
              {(activePrintTab === "all" || activePrintTab === "weigh") && (
                <div className="weigh-page bg-white border border-slate-300 p-[12mm] sm:p-[15mm] w-[210mm] min-h-[297mm] shadow-lg font-sans text-slate-900 mx-auto box-border page-break print:border-none print:shadow-none print:p-[8mm_6mm] print:m-0 print:w-full print:max-w-[210mm]">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5">
                    <div className="text-left">
                      <h1 className="text-lg font-extrabold tracking-tight font-serif text-slate-900">IDEVA GROUP</h1>
                      <p className="text-[9px] font-mono text-slate-500 font-bold">IDEVA GROUP CO., LTD.</p>
                    </div>
                    <div className="text-center flex-1">
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">ชั่งสารสำหรับผลิต</h2>
                      <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Weighing for Production Sheet
                      </h3>
                    </div>
                    <div className="text-right text-[10px] font-mono border border-slate-300 p-1 bg-slate-50">
                      <strong>FM-PD-02</strong>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3.5 border border-slate-950 text-[10px] w-full">
                    <div className="flex border-b border-slate-950">
                      <div className="w-1/2 p-2 border-r border-slate-950">
                        <strong>ชื่อผลิตภัณฑ์ :</strong> <span className="font-bold">{bom.product_name || "-"}</span>
                      </div>
                      <div className="w-1/2 p-2">
                        <strong>รหัสผลิตภัณฑ์ :</strong> <span className="font-mono font-bold">{bom.product_code || "-"}</span>
                      </div>
                    </div>
                    <div className="flex border-b border-slate-950">
                      <div className="w-1/2 p-2 border-r border-slate-950">
                        <strong>ชื่อลูกค้า/แบรนด์ :</strong> <span className="font-bold">{customerName}</span>
                      </div>
                      <div className="w-1/2 p-2">
                        <strong>ขนาดที่ผลิต :</strong>{" "}
                        <span className="font-mono font-bold text-blue-700">
                          {pieceSize} ml x {pieceCount.toLocaleString()} ชิ้น
                        </span>
                      </div>
                    </div>
                    <div className="flex border-b border-slate-950">
                      <div
                        className="w-1/2 p-2 border-r border-slate-950 bg-yellow-50"
                        style={{ backgroundColor: "#fef9c3" }}
                      >
                        <strong>ปริมาณที่ผลิตรวม :</strong>{" "}
                        <span className="font-mono font-extrabold text-red-600" style={{ color: "#dc2626" }}>
                          {batchSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          {batchUnit}
                        </span>
                      </div>
                      <div className="w-1/2 p-2">
                        <strong>เลขที่ Lot :</strong>{" "}
                        <span className="font-mono font-bold text-indigo-700">{lotNo}</span>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-full p-2">
                        <strong>วันที่ชั่งสาร/ผลิต :</strong>{" "}
                        <span className="font-mono text-slate-500">
                          ............................................................. (บันทึกวันจริงที่เริ่มชั่ง)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weighing Table */}
                  <table className="mt-5 w-full border-collapse border border-slate-950 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th className="border border-slate-950 p-2 w-10">NO.</th>
                        <th className="border border-slate-950 p-2 w-28">RM CODE</th>
                        <th className="border border-slate-950 p-2">RM NAME (ชื่อวัตถุดิบเคมีดิบ)</th>
                        {/* แถวปริมาณผลิตให้ใส่สีเหลืองอ่อน */}
                        <th
                          className="border border-slate-950 p-2 w-32 bg-[#fef9c3] text-slate-900 font-extrabold text-right"
                          style={{ backgroundColor: "#fef9c3" }}
                        >
                          ปริมาณการผลิต
                        </th>
                        <th
                          className="border border-slate-950 p-2 w-16 bg-[#fef9c3] text-slate-900 font-extrabold"
                          style={{ backgroundColor: "#fef9c3" }}
                        >
                          หน่วย
                        </th>
                        <th className="border border-slate-950 p-2 w-32">ปริมาณที่ชั่งได้จริง</th>
                        <th className="border border-slate-950 p-2 w-16">หน่วย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printMaterials.map((m, idx) => (
                        <tr key={idx} className="h-8 text-center">
                          <td className="border border-slate-950 p-2 font-mono text-slate-500">{idx + 1}</td>
                          <td className="border border-slate-950 p-2 font-mono text-left">{m.code}</td>
                          <td className="border border-slate-950 p-2 text-left font-bold text-slate-800">{m.name}</td>

                          {/* ปริมาณการผลิต: พื้นหลังสีเหลืองอ่อน หากเป็น Kg ให้ใส่ตัวหนังสือสีแดง */}
                          <td
                            className={`border border-slate-950 p-2 text-right font-mono bg-[#fef9c3] print:bg-[#fef9c3] ${
                              m.isKg ? "text-red-600 font-extrabold text-xs" : "text-slate-900 font-bold"
                            }`}
                            style={{ backgroundColor: "#fef9c3", color: m.isKg ? "#dc2626" : "#0f172a" }}
                          >
                            {m.displayQty}
                          </td>
                          <td
                            className={`border border-slate-950 p-2 font-bold bg-[#fef9c3] print:bg-[#fef9c3] ${
                              m.isKg ? "text-red-600 font-extrabold" : "text-slate-900 font-bold"
                            }`}
                            style={{ backgroundColor: "#fef9c3", color: m.isKg ? "#dc2626" : "#0f172a" }}
                          >
                            {m.displayUnit}
                          </td>

                          <td className="border border-slate-950 p-2 text-center text-slate-300 font-mono">
                            ...........................
                          </td>
                          <td className="border border-slate-950 p-2 text-center text-slate-600 font-mono font-semibold">
                            {m.displayUnit}
                          </td>
                        </tr>
                      ))}

                      {/* Sum row */}
                      <tr className="bg-slate-50 font-bold h-8">
                        <td colSpan={3} className="border border-slate-950 p-2 text-center">
                          ยอดรวมชั่งสารวัตถุดิบทั้งหมด ({pieceCount.toLocaleString()} ชิ้น)
                        </td>
                        <td
                          className="border border-slate-950 p-2 text-right font-mono bg-[#fef9c3] text-red-600 font-extrabold"
                          style={{ backgroundColor: "#fef9c3", color: "#dc2626" }}
                        >
                          {batchSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          className="border border-slate-950 p-2 text-center bg-[#fef9c3] text-red-600 font-extrabold"
                          style={{ backgroundColor: "#fef9c3", color: "#dc2626" }}
                        >
                          {batchUnit}
                        </td>
                        <td className="border border-slate-950 p-2 text-center text-slate-300 font-mono">
                          ...........................
                        </td>
                        <td className="border border-slate-950 p-2 text-center">{batchUnit}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Validation Note */}
                  <div className="mt-6 p-2.5 border border-slate-950 bg-slate-50 text-[9.5px] leading-relaxed rounded text-slate-700">
                    <strong>ข้อกำหนดในการทวนสอบการชั่งสารเคมี :</strong> ผู้ทำการจัดตวงและชั่งสารเคมีดิบหลัก
                    ต้องบันทึกรายงานผลการชั่งน้ำหนักสารเคมีในระบบใบตรวจสอบ พร้อมให้เจ้าหน้าที่วิเคราะห์คุณภาพ (QC Analyst)
                    หรือผู้ได้รับมอบหมาย ร่วมทวนสอบลายเซ็นกำกับยอดจริงทุกรายการเพื่อรับประกันความถูกต้องแม่นยำสูงสุดก่อนเข้าสู่วาล์วถังผสมโรงงาน
                  </div>

                  {/* Signature box with blank dates */}
                  <div className="mt-8 grid grid-cols-2 gap-8 text-[10px]">
                    <div className="border border-slate-950 p-3 text-center space-y-3 rounded">
                      <div className="font-bold underline uppercase">ลงชื่อผู้ชั่งสาร (Weighed By)</div>
                      <div className="pt-3 text-slate-400">
                        ................................................................................
                      </div>
                      <div>วันที่ (Date) : ......... / ......... / .............</div>
                    </div>
                    <div className="border border-slate-950 p-3 text-center space-y-3 rounded">
                      <div className="font-bold underline uppercase">ลงชื่อผู้ทวนสอบ (Double Checked By)</div>
                      <div className="pt-3 text-slate-400">
                        ................................................................................
                      </div>
                      <div>วันที่ (Date) : ......... / ......... / .............</div>
                    </div>
                  </div>

                  {/* Page Footer */}
                  <div className="mt-12 flex justify-between text-[8px] text-slate-400 font-mono font-bold border-t border-slate-200 pt-2">
                    <span>IDEVA FACTORY SYSTEM (BOM OS)</span>
                    <span>FM-PD-02 WEIGHING SHEET Rev.02 บังคับใช้ 01.09.2566</span>
                    <span>หน้า 2/3</span>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PAGE 3: WEIGHING LABELS (2. ฉลากชั่งวัตถุดิบ)                  */}
              {/* ============================================================== */}
              {(activePrintTab === "all" || activePrintTab === "labels") && (
                <div className="labels-page bg-white border border-slate-300 p-[12mm] sm:p-[15mm] w-[210mm] min-h-[297mm] shadow-lg font-sans text-slate-900 mx-auto box-border print:border-none print:shadow-none print:p-[8mm_6mm] print:m-0 print:w-full print:max-w-[210mm]">
                  {/* Header title */}
                  <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                      <Tag className="w-4 h-4 text-blue-600" /> ฉลากสำหรับระบุการชั่งสารเคมีวัตถุดิบรายถุง / ถัง
                    </h2>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      WEIGHING LABELS REPORT (FM-PD-04) — ขนาด {pieceSize} ml x {pieceCount.toLocaleString()} ชิ้น ({batchSize} Kg)
                    </h3>
                  </div>

                  {/* Grid of labels: 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                    {printMaterials.map((m, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-950 p-3 flex flex-col justify-between text-[9px] bg-white rounded-lg relative overflow-hidden h-[126mm] box-border shadow-xs print:shadow-none"
                      >
                        {/* Label header */}
                        <div className="border-b border-slate-400 pb-1.5 flex justify-between items-center bg-slate-50 -m-3 p-2.5 mb-2 font-bold text-slate-800">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-blue-600" /> ฉลากชั่งวัตถุดิบ
                          </span>
                          <span className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            NO. {idx + 1} / PART {m.part}
                          </span>
                        </div>

                        {/* Label Body metadata */}
                        <div className="space-y-1.5 flex-1">
                          <div>
                            <strong className="text-slate-500">ชื่อผลิตภัณฑ์ :</strong>{" "}
                            <span className="font-semibold text-slate-900">{bom.product_name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                            <div>
                              <strong className="text-slate-500">รหัสสินค้า :</strong>{" "}
                              <span className="font-mono font-bold">{bom.product_code}</span>
                            </div>
                            <div>
                              <strong className="text-slate-500">Batch/Lot No :</strong>{" "}
                              <span className="font-mono font-bold text-indigo-700">{lotNo}</span>
                            </div>
                          </div>
                          <div className="text-[8px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                            ขนาดผลิต: <strong>{pieceSize} ml</strong> x <strong>{pieceCount.toLocaleString()} ชิ้น</strong>{" "}
                            (รวมแบทช์ {batchSize} Kg)
                          </div>

                          <div className="border-t border-dashed border-slate-300 my-1 pt-1">
                            <div className="font-semibold bg-blue-50/70 p-1 text-[9.5px] text-blue-900 border border-blue-100 rounded">
                              <strong className="text-blue-700">รหัสวัตถุดิบ :</strong>{" "}
                              <span className="font-mono font-bold">{m.code}</span>
                            </div>
                          </div>

                          <div>
                            <strong className="text-slate-500">ชื่อวัตถุดิบ :</strong>{" "}
                            <span className="font-bold text-slate-900 text-[10px] block leading-tight">{m.name}</span>
                          </div>

                          <div>
                            <strong className="text-slate-500">Lot วัตถุดิบเคมีดิบ :</strong>{" "}
                            <span className="font-mono text-slate-400">...................................................</span>
                          </div>

                          {/* Highlighted Weight Box: Light Yellow background with red text if Kg */}
                          <div
                            className="grid grid-cols-2 gap-2 bg-[#fef9c3] p-1.5 border border-yellow-300 rounded my-1 font-mono print:bg-[#fef9c3]"
                            style={{ backgroundColor: "#fef9c3" }}
                          >
                            <div className="border-r border-yellow-300 pr-1">
                              <strong className="text-slate-700">นน.ภาชนะ (Tare) :</strong>
                              <p className="text-slate-400 text-[8px] mt-0.5">......................... Kg/g</p>
                            </div>
                            <div className="pl-1">
                              <strong className="text-slate-800">นน.สารเป้าหมาย :</strong>
                              <p
                                className={`font-extrabold text-[11px] mt-0.5 ${
                                  m.isKg ? "text-red-600" : "text-slate-900"
                                }`}
                                style={{ color: m.isKg ? "#dc2626" : "#0f172a" }}
                              >
                                {m.displayQty} {m.displayUnit}
                              </p>
                            </div>
                          </div>

                          <div>
                            <strong className="text-slate-500">นน.สารที่ชั่งได้จริง :</strong>{" "}
                            <span className="font-mono text-slate-400">
                              .................................. {m.displayUnit}
                            </span>
                          </div>
                        </div>

                        {/* Label Signatures with blank dates for operator handwriting */}
                        <div className="border-t border-slate-300 pt-1.5 mt-1 space-y-1 text-[8px]">
                          <div className="flex justify-between items-center">
                            <span>
                              <strong>ผู้ทำการชั่งสาร :</strong> ............................
                            </span>
                            <span>
                              <strong>วันที่ชั่ง :</strong> ....../....../......
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              <strong>ผู้ตรวจสอบ :</strong> ............................
                            </span>
                            <span>
                              <strong>วันที่ตรวจ :</strong> ....../....../......
                            </span>
                          </div>
                        </div>

                        {/* Label Footer document code */}
                        <div className="text-[7.5px] text-slate-400 font-mono text-right mt-1 border-t border-slate-100 pt-0.5">
                          FM-PD-04 REV.02 บังคับใช้ 01.09.2566
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Page Footer */}
                  <div className="mt-6 flex justify-between text-[8px] text-slate-400 font-mono font-bold border-t border-slate-200 pt-2">
                    <span>IDEVA FACTORY SYSTEM (BOM OS)</span>
                    <span>FM-PD-04 WEIGHING LABELS Rev.02 บังคับใช้ 01.09.2566</span>
                    <span>หน้า 3/3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS Inject to customize printing behavior beautifully */}
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Hide non-print UI */
          .print\\:hidden {
            display: none !important;
          }
          #print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
          }
          .bpr-page, .weigh-page, .labels-page {
            width: 100% !important;
            max-width: 210mm !important;
            min-height: auto !important;
            margin: 0 auto !important;
            padding: 6mm 8mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          /* Ensure light yellow and red text colors are printed */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          input, select, textarea {
            border: none !important;
            outline: none !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}
