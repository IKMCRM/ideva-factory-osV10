import React, { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShoppingCart, 
  Check, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye, 
  X, 
  Save, 
  ClipboardList, 
  Database,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  Printer,
  Trash
} from "lucide-react";
import { BomRecipe, Product, RawMaterial, ProductionOrder, Customer } from "../types";
import BomPrint from "./BomPrint";
import { clientSave } from "../lib/supabaseClient";

interface BomsProps {
  bomRecipes: BomRecipe[];
  products: Product[];
  rawMaterials: RawMaterial[];
  productionOrders: ProductionOrder[];
  customers: Customer[];
  onSaveBom: (bom: any) => Promise<void>;
  onDeleteBom: (id: number) => Promise<void>;
  onSaveProduct?: (product: any) => Promise<any>;
  onSaveProductionOrder?: (po: any) => Promise<void>;
  onSaveRawMaterial?: (rm: any) => Promise<void>;
  onSavePurchaseOrder?: (po: any) => Promise<void>;
  setActivePage?: (page: string) => void;
}

export default function Boms({
  bomRecipes,
  products,
  rawMaterials,
  productionOrders,
  customers,
  onSaveBom,
  onDeleteBom,
  onSaveProduct,
  onSaveProductionOrder,
  onSaveRawMaterial,
  onSavePurchaseOrder,
  setActivePage
}: BomsProps) {
  const [search, setSearch] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState<BomRecipe | null>(null);
  const [editingBom, setEditingBom] = useState<BomRecipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlySavedId, setNewlySavedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // Production calculation & stock reservation states (e.g. 30g x 100 pcs = 3 Kg)
  const [pieceSizeGrams, setPieceSizeGrams] = useState<number>(30);
  const [pieceCount, setPieceCount] = useState<number>(100);
  const [targetBatchQty, setTargetBatchQty] = useState<number>(3); // Total in Kg
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(customers[0]?.id || "");
  const [isReserving, setIsReserving] = useState(false);

  // Print Popup states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSelectedBom, setPrintSelectedBom] = useState<BomRecipe | null>(null);

  // Form states
  const [productId, setProductId] = useState<number | "">("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [partNo, setPartNo] = useState("");
  const [isProductCodeDropdownOpen, setIsProductCodeDropdownOpen] = useState(false);
  const [isProductNameDropdownOpen, setIsProductNameDropdownOpen] = useState(false);

  // Dropdown indices for each material row
  const [openCodeDropdownIdx, setOpenCodeDropdownIdx] = useState<number | null>(null);
  const [openNameDropdownIdx, setOpenNameDropdownIdx] = useState<number | null>(null);

  const [version, setVersion] = useState("v1.0");
  const [status, setStatus] = useState("active");

  // Dynamic Instructions List (Step-by-Step)
  const [instructions, setInstructions] = useState<Array<{ instruction: string }>>([
    { instruction: "" }
  ]);

  // materials array with part, code, name, quantity, unit
  const [materials, setMaterials] = useState<Array<{ 
    part?: string;
    material_code: string; 
    material_name: string; 
    quantity: number | string; 
    unit: string; 
    notes?: string 
  }>>([
    { part: "A", material_code: "", material_name: "", quantity: "", unit: "KG." }
  ]);

  // Handle Dynamic rows inside formulation
  const handleAddMaterialRow = () => {
    const nextPart = materials.length >= 6 ? "C" : materials.length >= 3 ? "B" : "A";
    setMaterials([...materials, { part: nextPart, material_code: "", material_name: "", quantity: "", unit: "KG." }]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    const updated = [...materials];
    updated.splice(index, 1);
    setMaterials(updated);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    
    // Automatically match code/name/unit if selected raw material matches cache
    if (field === "material_code") {
      const matched = rawMaterials.find(r => r.code.toLowerCase() === value.trim().toLowerCase());
      if (matched) {
        updated[index].material_name = matched.name;
        updated[index].unit = matched.unit || "KG.";
      }
    } else if (field === "material_name") {
      const matched = rawMaterials.find(r => r.name.toLowerCase() === value.trim().toLowerCase());
      if (matched) {
        updated[index].material_code = matched.code;
        updated[index].unit = matched.unit || "KG.";
      }
    }
    setMaterials(updated);
  };

  // Handle Dynamic instructions rows
  const handleAddInstructionRow = () => {
    setInstructions([...instructions, { instruction: "" }]);
  };

  const handleRemoveInstructionRow = (index: number) => {
    const updated = [...instructions];
    updated.splice(index, 1);
    setInstructions(updated);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = { instruction: value };
    setInstructions(updated);
  };

  // List of standard units in English abbreviations
  const standardUnits = ["KG.", "G.", "L.", "ML.", "PCS.", "BAG", "DRUM", "BOX", "CAN", "BOTTLE", "SET"];

  // Filter recipes based on search input
  const filtered = bomRecipes.filter(b => {
    const pCode = (b.product_code || "").toLowerCase();
    const pName = (b.product_name || "").toLowerCase();
    const bNotes = (b.notes || "").toLowerCase();
    const q = search.toLowerCase();
    return pCode.includes(q) || pName.includes(q) || bNotes.includes(q);
  });

  const handleViewDetails = (bom: BomRecipe) => {
    setSelectedBom(bom);
    setIsViewModalOpen(true);
  };

  // Helper function to auto-increment version (e.g., v1.0 -> v1.1, V2.1 -> V2.2)
  const incrementVersion = (currentVersion: string): string => {
    if (!currentVersion) return "v1.0";
    const trimmed = currentVersion.trim();
    
    // Try matching classic v1.0, V1.0, v2.12, version 1.3
    const match = trimmed.match(/^([vV]?|version\s*|Version\s*)(\d+)\.(\d+)(.*)$/);
    if (match) {
      const prefix = match[1] || "v";
      const major = parseInt(match[2], 10);
      const minor = parseInt(match[3], 10) + 1;
      const suffix = match[4] || "";
      return `${prefix}${major}.${minor}${suffix}`;
    }
    
    // Try matching a simple single number e.g. "1", "v2"
    const singleMatch = trimmed.match(/^([vV]?|version\s*|Version\s*)(\d+)(.*)$/);
    if (singleMatch) {
      const prefix = singleMatch[1] || "v";
      const num = parseInt(singleMatch[2], 10) + 1;
      const suffix = singleMatch[3] || "";
      return `${prefix}${num}.0${suffix}`;
    }

    // Fallback
    return trimmed + ".1";
  };

  const openEditModal = (bom: BomRecipe | null = null, clone = false) => {
    if (bom) {
      setEditingBom(clone ? null : bom);
      setProductId(bom.product_id);
      setPartNo(bom.part_no || "");
      
      const matchedProd = products.find(p => p.id === bom.product_id);
      setProductCode(matchedProd ? matchedProd.code : (bom.product_code || ""));
      setProductName(matchedProd ? matchedProd.name : (bom.product_name || ""));
      
      // Auto-increment version if editing, otherwise reset to v1.0 if cloning
      const nextVer = clone ? "v1.0" : incrementVersion(bom.version);
      setVersion(nextVer);
      setStatus(bom.status);
      
      // Parse instructions from bom.notes (JSON or string fallback)
      let parsedInstructions = [{ instruction: "" }];
      if (bom.notes) {
        try {
          if (bom.notes.trim().startsWith("[")) {
            parsedInstructions = JSON.parse(bom.notes);
          } else {
            parsedInstructions = [{ instruction: bom.notes }];
          }
        } catch (e) {
          parsedInstructions = [{ instruction: bom.notes }];
        }
      }
      setInstructions(parsedInstructions);

      // Map materials
      setMaterials(bom.materials.map((m, idx) => {
        const matchedRm = rawMaterials.find(rm => rm.name.toLowerCase() === m.material_name.toLowerCase());
        return {
          part: m.part || (idx >= 6 ? "C" : idx >= 3 ? "B" : "A"),
          material_code: m.material_code || (matchedRm ? matchedRm.code : ""),
          material_name: m.material_name,
          quantity: m.quantity,
          unit: m.unit || "KG.",
          notes: m.notes || ""
        };
      }));
    } else {
      setEditingBom(null);
      setProductId("");
      setPartNo("PART-001");
      setProductCode("");
      setProductName("");
      setVersion("v1.0");
      setStatus("active");
      setInstructions([{ instruction: "" }]);
      setMaterials([{ part: "A", material_code: "", material_name: "", quantity: "", unit: "KG." }]);
    }
    setIsEditModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedCode = (productCode || "").trim();
    const trimmedName = (productName || "").trim();

    if (!trimmedCode && !trimmedName) {
      alert("กรุณาระบุรหัสสินค้าหรือชื่อสินค้าที่ต้องการสร้างสูตร!");
      return;
    }

    const finalCode = trimmedCode || `PRD-${Date.now().toString().slice(-4)}`;
    const finalName = trimmedName || finalCode;

    // Filter out invalid materials (must have name and quantity > 0)
    const validMaterials = materials.filter(m => (m.material_name || "").trim() && Number(m.quantity) > 0);
    if (validMaterials.length === 0) {
      alert("กรุณาระบุวัตถุดิบและใส่ปริมาณส่วนผสมอย่างน้อย 1 รายการ (พิมพ์จุดทศนิยม เช่น 0.01 ได้)!");
      return;
    }

    setIsSubmitting(true);

    // 1. Resolve product_id
    let resolvedProductId = Number(productId);
    if (!resolvedProductId || isNaN(resolvedProductId)) {
      const matchedProd = products.find(
        p => (finalCode && p.code.toLowerCase() === finalCode.toLowerCase()) ||
             (finalName && p.name.toLowerCase() === finalName.toLowerCase())
      );
      if (matchedProd) {
        resolvedProductId = matchedProd.id;
      } else {
        // Automatically create this product in products so it has a real ID
        try {
          if (onSaveProduct) {
            const res = await onSaveProduct({
              code: finalCode,
              name: finalName,
              type: "Finished Goods",
              category: "Finished Goods",
              description: "สร้างอัตโนมัติจากสูตรการผลิต (BOM)",
              unit_price: 0,
              stock_qty: 0,
              min_stock: 10,
              status: "active"
            });
            resolvedProductId = typeof res === "number" ? res : (res?.id || Date.now());
          } else {
            const newId = await clientSave("products", 0, {
              code: finalCode,
              name: finalName,
              type: "Finished Goods",
              category: "Finished Goods",
              description: "สร้างอัตโนมัติจากสูตรการผลิต (BOM)",
              unit_price: 0,
              stock_qty: 0,
              min_stock: 10,
              status: "active"
            });
            resolvedProductId = Number(newId) || Date.now();
          }
        } catch {
          resolvedProductId = Date.now();
        }
      }
    }

    // 2. Filter out empty instruction lines
    const validInstructions = instructions.filter(inst => (inst.instruction || "").trim());

    // 3. Calculate estimated unit cost
    let calculatedCost = 0;
    const formattedMaterials = validMaterials.map((m, idx) => {
      const mName = (m.material_name || "").trim();
      const mCode = (m.material_code || "").trim();
      const matchedRm = rawMaterials.find(
        rm => rm.name.toLowerCase() === mName.toLowerCase() || 
              (mCode && rm.code.toLowerCase() === mCode.toLowerCase())
      );
      const qtyNum = Number(m.quantity) || 0;
      const unitPrice = matchedRm?.unit_price || 0;
      calculatedCost += qtyNum * unitPrice;

      return {
        part: m.part || (idx >= 6 ? "C" : idx >= 3 ? "B" : "A"),
        raw_material_id: matchedRm ? matchedRm.id : null,
        material_code: mCode || (matchedRm ? matchedRm.code : ""),
        material_name: mName,
        quantity: qtyNum,
        unit: m.unit || "KG.",
        unit_price: unitPrice,
        notes: m.notes || ""
      };
    });

    const targetId = editingBom ? editingBom.id : 0;

    try {
      await onSaveBom({
        id: targetId,
        product_id: resolvedProductId,
        product_code: finalCode,
        product_name: finalName,
        part_no: partNo || "PART-001",
        version: version || "v1.0",
        status: status || "active",
        notes: JSON.stringify(validInstructions.length > 0 ? validInstructions : [{ instruction: "ผสมตามขั้นตอนมาตรฐาน" }]),
        estimated_unit_cost: calculatedCost,
        materials: formattedMaterials
      });
      // Clear search to guarantee the newly saved formula appears on screen immediately
      setSearch("");
      setIsEditModalOpen(false);
      if (targetId) {
        setNewlySavedId(targetId);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกสูตร BOM: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number, bomName?: string) => {
    setDeleteTarget({ id, name: bomName || "สูตรการผลิต" });
  };

  // Helper values calculated for a recipe
  const getProductProductionStats = (prodId: number) => {
    const orders = productionOrders.filter(po => po.product_id === prodId && po.status === "done");
    const count = orders.length;
    const qty = orders.reduce((sum, po) => sum + po.quantity, 0);
    return { count, qty };
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสสินค้า, ชื่อสินค้า หรือหมายเหตุสูตร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={() => openEditModal(null)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> สร้างสูตรการผลิตใหม่
        </button>
      </div>

      {/* Formulas Table */}
      <div className="bg-white border border-slate-250 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-[11px] text-slate-700 tracking-wider">
                <th className="p-2 border border-slate-200 font-normal text-center w-12">ลำดับ</th>
                <th className="p-2 border border-slate-200 font-normal">รหัสสินค้า</th>
                <th className="p-2 border border-slate-200 font-normal">ชื่อสินค้าที่ผลิต</th>
                <th className="p-2 border border-slate-200 font-normal text-right w-32">ต้นทุนประมาณการ/หน่วย</th>
                <th className="p-2 border border-slate-200 font-normal text-right w-44">ผลิตไปแล้ว (Already Produced)</th>
                <th className="p-2 border border-slate-200 font-normal text-center w-24">สถานะ</th>
                <th className="p-2 border border-slate-200 font-normal text-center w-48">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, index) => {
                // Production stats
                const stats = getProductProductionStats(b.product_id);
                const hasProduced = stats.qty > 0;
                const estCost = b.estimated_unit_cost || (b.materials || []).reduce((sum, m) => {
                  const rm = rawMaterials.find(r => r.name.toLowerCase() === (m.material_name || "").toLowerCase());
                  return sum + (Number(m.quantity || 0) * (rm?.unit_price || 0));
                }, 0);
                
                const isRecentlySaved = newlySavedId === b.id;

                return (
                  <tr 
                    key={b.id} 
                    className={`transition-colors ${
                      isRecentlySaved 
                        ? "bg-emerald-50 border-emerald-300" 
                        : "odd:bg-white even:bg-[#f2f6fc] hover:bg-blue-50/55"
                    }`}
                  >
                    <td className="p-2 border border-slate-200 text-center font-mono text-slate-500 font-normal">
                      {index + 1}
                      {isRecentlySaved && (
                        <span className="block text-[9px] font-bold text-emerald-600 font-sans">เพิ่งบันทึก</span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-200 font-normal font-mono text-slate-800">{b.product_code || "-"}</td>
                    <td className="p-2 border border-slate-200">
                      <div>
                        <span className="font-semibold text-slate-800">{b.product_name || "-"}</span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold font-mono text-emerald-700">
                      ฿{estCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-normal">
                      {hasProduced ? (
                        <div className="flex flex-col items-end">
                          <span className="text-blue-700 font-normal font-mono">
                            {stats.qty.toLocaleString()} {b.product_type === "Powder" ? "กก." : "ลิตร"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                            (จาก {stats.count} ใบสั่งผลิตเสร็จสิ้น)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal text-[11px] font-sans">ยังไม่มีประวัติการผลิต</span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-normal px-2 py-0.5 rounded-full border ${
                        b.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : b.status === "test"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {b.status === "active" ? "เปิดใช้งาน" : b.status === "test" ? "ทดสอบ" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(b)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-normal flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> ดูสูตร
                        </button>
                        <button
                          onClick={() => {
                            setPrintSelectedBom(b);
                            setIsPrintModalOpen(true);
                          }}
                          title="พิมพ์เอกสาร BPR / ใบชั่ง / ฉลาก"
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all border border-blue-200"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" /> พิมพ์
                        </button>
                        <button
                          onClick={() => openEditModal(b, false)}
                          title="แก้ไขสูตร"
                          className="p-1 text-amber-600 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(b, true)}
                          title="Clone คัดลอกสูตร"
                          className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.product_name)}
                          title="ลบสูตรการผลิต"
                          className="p-1 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 border border-slate-200">
                    ไม่พบสูตรการผลิตที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQ SPECIFIC: "ดูสูตร" (View Recipe Details) Modal with Stock Pre-Check & Auto Converter */}
      {isViewModalOpen && selectedBom && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-150 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">รายละเอียดสูตรการผลิต และ ตรวจสอบสต็อกสารเคมีก่อนผลิต</h3>
                  <p className="text-[10px] text-slate-400">คำนวณปริมาณสารอัตโนมัติตามเป้าหมาย 100% พร้อมระบบจองสารเคมีและสั่งซื้อ</p>
                </div>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Product Header */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-pulse" /> FORMULATION SPECIFICATION
                  </div>
                  <h2 className="text-base font-bold text-slate-800 mt-0.5">
                    {selectedBom.product_name}
                  </h2>
                  <span className="inline-block mt-1 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-300 font-mono text-[10px] font-bold">
                    CODE: {selectedBom.product_code}
                  </span>
                </div>

                {/* Customer selector for reservation */}
                <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-xs flex flex-col gap-1 min-w-[220px]">
                  <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                    ลูกค้า/แบรนด์สั่งผลิต:
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- ไม่ระบุ (ลูกค้าทั่วไป) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculation parameters box */}
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-blue-200/80 pb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h5 className="text-xs font-extrabold text-blue-900">คำนวณปริมาณการผลิต (100% Automatic Formula Calculator)</h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. ขนาดต่อชิ้น/ก้อน */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ขนาดชิ้น/ก้อน (g หรือ ml):</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        value={pieceSizeGrams}
                        onChange={(e) => {
                          const g = Math.max(0.1, parseFloat(e.target.value) || 0);
                          setPieceSizeGrams(g);
                          setTargetBatchQty((g * pieceCount) / 1000);
                        }}
                        className="w-full px-2 py-0.5 text-xs font-bold font-mono text-center focus:outline-none text-slate-800"
                      />
                      <span className="text-[10px] font-bold text-slate-400 px-1">g</span>
                    </div>
                  </div>

                  {/* 2. จำนวนชิ้น */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">จำนวนสั่งผลิต (ชิ้น/ก้อน):</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={pieceCount}
                        onChange={(e) => {
                          const count = Math.max(1, parseInt(e.target.value) || 1);
                          setPieceCount(count);
                          setTargetBatchQty((pieceSizeGrams * count) / 1000);
                        }}
                        className="w-full px-2 py-0.5 text-xs font-bold font-mono text-center focus:outline-none text-slate-800"
                      />
                      <span className="text-[10px] font-bold text-slate-400 px-1">ชิ้น</span>
                    </div>
                  </div>

                  {/* 3. รวมน้ำหนักที่ต้องผลิต */}
                  <div>
                    <label className="block text-[10px] font-bold text-blue-800 mb-1">น้ำหนักรวมต้องผลิต (KG):</label>
                    <div className="flex items-center gap-1 bg-blue-100/80 border border-blue-300 rounded-lg p-1">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={targetBatchQty}
                        onChange={(e) => {
                          const totalKg = Math.max(0.01, parseFloat(e.target.value) || 0);
                          setTargetBatchQty(totalKg);
                          if (pieceCount > 0) {
                            setPieceSizeGrams(Math.round((totalKg * 1000) / pieceCount));
                          }
                        }}
                        className="w-full px-2 py-0.5 text-xs font-extrabold font-mono text-center focus:outline-none text-blue-900"
                      />
                      <span className="text-[10px] font-bold text-blue-700 px-1">KG.</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-blue-700 bg-white/60 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
                  <span>
                    ตัวอย่างสูตร: ลูกค้าสั่ง <strong>{pieceSizeGrams}g</strong> จำนวน <strong>{pieceCount} ชิ้น</strong> = ผลิตรวม <strong>{targetBatchQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg.</strong>
                  </span>
                </div>
              </div>

              {/* Chemical Stock Verification Header & Results Table */}
              {(() => {
                const materialsList = selectedBom.materials || [];
                const totalFormulaSum = materialsList.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0) || 100;
                
                // Calculate feasibility array
                const checkResults = materialsList.map((m, idx) => {
                  const rawQty = Number(m.quantity) || 0;
                  const ratio = rawQty / totalFormulaSum; // % w/w
                  const requiredKg = ratio * targetBatchQty;
                  const requiredGrams = requiredKg * 1000;

                  // Find in rawMaterials
                  const matchedRm = rawMaterials.find(
                    rm => rm.name.toLowerCase() === m.material_name.toLowerCase() ||
                          (m.material_code && rm.code.toLowerCase() === m.material_code.toLowerCase())
                  );

                  const stockVal = matchedRm ? Number(matchedRm.stock_qty || 0) : 0;
                  const rmUnit = (matchedRm?.unit || m.unit || "KG.").toUpperCase();
                  const isKgUnit = rmUnit.includes("KG") || rmUnit.includes("กก");

                  const stockGrams = isKgUnit ? stockVal * 1000 : stockVal;
                  const isSufficient = stockGrams >= requiredGrams;
                  const shortageGrams = isSufficient ? 0 : requiredGrams - stockGrams;
                  const shortageKg = shortageGrams / 1000;

                  return {
                    ...m,
                    matchedRm,
                    ratio,
                    percentStr: (ratio * 100).toFixed(2),
                    requiredKg,
                    requiredGrams,
                    stockVal,
                    stockGrams,
                    isKgUnit,
                    isSufficient,
                    shortageGrams,
                    shortageKg
                  };
                });

                const allSufficient = checkResults.every(r => r.isSufficient);
                const missingCount = checkResults.filter(r => !r.isSufficient).length;

                const handleConfirmReserveStock = async () => {
                  if (!onSaveProductionOrder || !onSaveRawMaterial) {
                    alert("ระบบไม่พบตัวเชื่อมต่อสำหรับจองสต็อก");
                    return;
                  }

                  if (!confirm(`ยืนยันการจองสารเคมีและบันทึกล็อตผลิตจำนวน ${pieceCount} ชิ้น (${targetBatchQty} Kg) หรือไม่?`)) {
                    return;
                  }

                  setIsReserving(true);
                  try {
                    // 1. Deduct stock for each material
                    for (const res of checkResults) {
                      if (res.matchedRm) {
                        const newStockGrams = res.stockGrams - res.requiredGrams;
                        const newStockQty = res.isKgUnit ? newStockGrams / 1000 : newStockGrams;
                        await onSaveRawMaterial({
                          ...res.matchedRm,
                          stock_qty: Math.max(0, newStockQty)
                        });
                      }
                    }

                    // 2. Create production order for customer
                    const cust = customers.find(c => c.id === Number(selectedCustomerId));
                    const custName = cust ? cust.name : "ลูกค้าทั่วไป";

                    await onSaveProductionOrder({
                      id: 0,
                      code: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                      date: new Date().toISOString().slice(0, 10),
                      product_id: selectedBom.product_id,
                      product_name: selectedBom.product_name,
                      customer_id: Number(selectedCustomerId) || null,
                      customer_name: custName,
                      quantity: pieceCount,
                      unit: "ชิ้น",
                      status: "running",
                      notes: `สั่งผลิต ${pieceSizeGrams}g x ${pieceCount} ชิ้น (ใช้สารเคมีรวม ${targetBatchQty.toFixed(2)} Kg) - จองสารเรียบร้อย`
                    });

                    alert(`✓ ทำการจองสารเคมีและบันทึกล็อตการผลิตเข้าประวัติลูกค้า (${custName}) สำเร็จแล้ว!`);
                    setIsViewModalOpen(false);
                  } catch (err: any) {
                    alert("เกิดข้อผิดพลาดในการตัดจองสต็อก: " + (err.message || err));
                  } finally {
                    setIsReserving(false);
                  }
                };

                const handleCreatePOForMissing = async () => {
                  if (!onSavePurchaseOrder) {
                    alert("ไม่พบตัวจัดการออกใบสั่งซื้อ");
                    return;
                  }

                  const missingItems = checkResults
                    .filter(r => !r.isSufficient)
                    .map(r => ({
                      raw_material_id: r.matchedRm?.id || 0,
                      raw_material_code: r.matchedRm?.code || r.material_code || "RM-NEW",
                      raw_material_name: r.material_name,
                      quantity: Math.ceil(r.shortageKg * 100) / 100, // round up to 2 decimals
                      unit: "KG.",
                      unit_price: r.matchedRm?.unit_price || 100,
                      total_price: (Math.ceil(r.shortageKg * 100) / 100) * (r.matchedRm?.unit_price || 100)
                    }));

                  try {
                    await onSavePurchaseOrder({
                      id: 0,
                      code: `PO-${Date.now().toString().slice(-6)}`,
                      po_date: new Date().toISOString().slice(0, 10),
                      supplier_name: "บริษัท เคมีภัณฑ์ จำกัด",
                      status: "pending",
                      notes: `รายการขอซื้อสารเคมีที่ขาดสำหรับผลิต ${selectedBom.product_name} (${targetBatchQty} Kg)`,
                      items: missingItems
                    });

                    alert("✓ สร้างรายการขอสั่งซื้อเคมีภัณฑ์สำหรับส่วนที่ขาดเรียบร้อยแล้ว!");
                    if (setActivePage) {
                      setActivePage("purchase");
                      setIsViewModalOpen(false);
                    }
                  } catch (e: any) {
                    alert("เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ: " + e.message);
                  }
                };

                return (
                  <div className="space-y-3">
                    {/* Feasibility Status Banner */}
                    <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                      allSufficient 
                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-900" 
                        : "bg-red-50/90 border-red-300 text-red-900"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {allSufficient ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 animate-bounce" />
                        )}
                        <div>
                          <h4 className="text-xs font-bold flex items-center gap-1">
                            {allSufficient ? (
                              <span className="text-emerald-700 font-extrabold">✓ วัตถุดิบเคมีภัณฑ์เพียงพอสำหรับผลิต</span>
                            ) : (
                              <span className="text-red-700 font-extrabold">✕ วัตถุดิบเคมีภัณฑ์ไม่เพียงพอ (ขาด {missingCount} รายการ)</span>
                            )}
                          </h4>
                          <p className="text-[10px] opacity-90">
                            {allSufficient 
                              ? `วัตถุดิบทุกตัวในสูตรมีเพียงพอสำหรับผลิต ${pieceCount} ชิ้น (${targetBatchQty.toFixed(2)} Kg) สามารถกดจองวัตถุดิบได้ทันที`
                              : `วัตถุดิบบางรายการในสต็อกคงเหลือไม่พอ กรุณากดสร้างรายการสั่งซื้อเคมีภัณฑ์ส่วนที่ขาดเพิ่ม`}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div>
                        {allSufficient ? (
                          <button
                            type="button"
                            disabled={isReserving}
                            onClick={handleConfirmReserveStock}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" /> ยืนยันสั่งผลิต & จองวัตถุดิบ (Reserve Stock)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCreatePOForMissing}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" /> สร้างรายการสั่งซื้อเคมีภัณฑ์
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Materials Detail Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead>
                          <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] text-slate-700 font-bold uppercase">
                            <th className="p-2.5">ชื่อวัตถุดิบเคมีภัณฑ์</th>
                            <th className="p-2.5 text-right">สูตร (% w/w)</th>
                            <th className="p-2.5 text-right bg-[#fef9c3] text-amber-950 font-extrabold border-x border-amber-300">
                              ต้องใช้ผลิต ({targetBatchQty.toLocaleString(undefined, { minimumFractionDigits: 2 })} Kg)
                            </th>
                            <th className="p-2.5 text-right">สต็อกคงเหลือ</th>
                            <th className="p-2.5 text-center">ผลตรวจสอบความพอเพียง</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {checkResults.map((r, idx) => {
                            const isKg = r.requiredKg >= 1;
                            const requiredDisplay = isKg 
                              ? `${r.requiredKg.toFixed(2)} Kg.` 
                              : `${r.requiredGrams.toFixed(2)} g.`;

                            const stockDisplay = r.isKgUnit 
                              ? `${r.stockVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} Kg.` 
                              : `${r.stockVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} g.`;

                            return (
                              <tr 
                                key={idx} 
                                className={`transition-colors ${
                                  r.isSufficient ? "hover:bg-slate-50" : "bg-red-50/50 hover:bg-red-50"
                                }`}
                              >
                                <td className="p-2.5 font-bold text-slate-800">
                                  {r.material_name}
                                  {r.material_code && (
                                    <span className="ml-1.5 text-[10px] text-slate-400 font-mono font-normal">
                                      ({r.material_code})
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right font-bold font-mono text-slate-700">{r.percentStr}%</td>
                                <td className={`p-2.5 text-right font-extrabold font-mono bg-[#fef9c3] border-x border-amber-200 ${
                                  isKg ? "text-red-600" : "text-slate-900"
                                }`}>
                                  {requiredDisplay}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-600">
                                  {stockDisplay}
                                </td>
                                <td className="p-2.5 text-center font-bold">
                                  {r.isSufficient ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-medium">
                                      ✓ มีพอในสต็อก
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                                      ✕ ไม่พอ (ขาด {r.shortageKg >= 1 ? `${r.shortageKg.toFixed(2)} Kg.` : `${r.shortageGrams.toFixed(2)} g.`})
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {selectedBom.notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-sans">
                  <span className="font-bold text-slate-800">วิธีการผสมและเตรียมสารเคมี:</span>
                  {selectedBom.notes.trim().startsWith("[") ? (
                    <ol className="list-decimal pl-4.5 space-y-1">
                      {JSON.parse(selectedBom.notes).map((inst: any, idx: number) => (
                        <li key={idx} className="font-medium text-slate-600">{inst.instruction}</li>
                      ))}
                    </ol>
                  ) : (
                    <span className="font-medium text-slate-600 block">{selectedBom.notes}</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0 sticky bottom-0 z-10 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setPrintSelectedBom(selectedBom);
                  setIsPrintModalOpen(true);
                  setIsViewModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> พิมพ์ใบชั่งและ BPR
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = { id: selectedBom.id, name: selectedBom.product_name };
                    setIsViewModalOpen(false);
                    setDeleteTarget(target);
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-red-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบสูตรนี้
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulation Create/Edit/Clone Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-150 bg-slate-50/80 flex-shrink-0">
              <h3 className="text-sm md:text-base lg:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                {editingBom ? "แก้ไขสูตรการผลิต (BOM)" : "สร้างสูตรการผลิต (BOM) ใหม่"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-6 md:p-8 space-y-6 flex-1">
                {/* Section 1: Product Selection & Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* รหัสผลิตภัณฑ์ */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">รหัสผลิตภัณฑ์ <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        value={productCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductCode(val);
                          setIsProductCodeDropdownOpen(true);
                          const matched = products.find(p => p.code.toLowerCase() === val.trim().toLowerCase());
                          if (matched) {
                            setProductId(matched.id);
                            setProductName(matched.name);
                          } else {
                            setProductId("");
                          }
                        }}
                        onFocus={() => setIsProductCodeDropdownOpen(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setIsProductCodeDropdownOpen(false);
                          }, 250);
                        }}
                        placeholder="พิมพ์เพื่อค้นหา..."
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs md:text-sm font-bold font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all shadow-sm text-slate-800"
                      />
                    </div>
                    {isProductCodeDropdownOpen && (
                      <div className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl divide-y divide-slate-100">
                        {products
                          .filter(p => (p.code || "").toLowerCase().includes(productCode.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setProductId(p.id);
                                setProductCode(p.code);
                                setProductName(p.name);
                                setIsProductCodeDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 font-sans transition-colors flex flex-col"
                            >
                              <span className="font-bold text-blue-600 font-mono">{p.code}</span>
                              <span className="text-[10px] text-slate-400 truncate">{p.name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* ชื่อผลิตภัณฑ์ */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">ชื่อผลิตภัณฑ์ <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductName(val);
                          setIsProductNameDropdownOpen(true);
                          const matched = products.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
                          if (matched) {
                            setProductId(matched.id);
                            setProductCode(matched.code);
                          } else {
                            setProductId("");
                          }
                        }}
                        onFocus={() => setIsProductNameDropdownOpen(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setIsProductNameDropdownOpen(false);
                          }, 250);
                        }}
                        placeholder="พิมพ์เพื่อค้นหา..."
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all shadow-sm text-slate-800"
                      />
                    </div>
                    {isProductNameDropdownOpen && (
                      <div className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl divide-y divide-slate-100">
                        {products
                          .filter(p => (p.name || "").toLowerCase().includes(productName.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setProductId(p.id);
                                setProductCode(p.code);
                                setProductName(p.name);
                                setIsProductNameDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 font-sans transition-colors flex flex-col"
                            >
                              <span className="font-semibold text-slate-800">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.code}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* สถานะ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">สถานะการใช้งาน</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all shadow-sm text-slate-800 cursor-pointer"
                    >
                      <option value="active">เปิดใช้งาน (Active)</option>
                      <option value="test">สูตรทดลอง (Test)</option>
                      <option value="inactive">ไม่ใช้งาน (Inactive)</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Ingredient List with Split Autocomplete Columns */}
                <div className="space-y-3 border-t border-slate-150 pt-5">
                  <div className="flex items-center justify-between pb-1.5">
                    <h4 className="text-xs md:text-sm lg:text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" /> รายการวัตถุดิบและส่วนผสมสารเคมี <span className="text-xs font-normal text-slate-400">(ต่อหนึ่งถังผลิตมาตรฐาน)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddMaterialRow}
                      className="text-xs md:text-sm text-blue-600 font-extrabold hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100 shadow-sm"
                    >
                      + เพิ่มวัตถุดิบเคมี
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {/* Header Columns for Desktop */}
                    {materials.length > 0 && (
                      <div className="hidden md:flex gap-3 items-center px-3 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="w-20">Part</div>
                        <div className="w-1/4">รหัสวัตถุดิบ</div>
                        <div className="flex-1">ชื่อวัตถุดิบเคมีภัณฑ์ / สารเคมี</div>
                        <div className="w-28 text-right">ปริมาณ (สัดส่วน)</div>
                        <div className="w-24">หน่วยวัด</div>
                        <div className="w-8"></div>
                      </div>
                    )}

                    {materials.map((m, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm relative">
                        
                        {/* 0. Part */}
                        <div className="w-full md:w-20">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Part</label>
                          <input
                            type="text"
                            value={m.part || "A"}
                            onChange={(e) => handleMaterialChange(idx, "part", e.target.value)}
                            placeholder="A / B"
                            className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm text-center font-bold font-mono text-slate-800 focus:outline-none focus:border-blue-500 uppercase"
                          />
                        </div>

                        {/* 1. รหัสวัตถุดิบ (Autocomplete) */}
                        <div className="w-full md:w-1/4 relative">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">รหัสวัตถุดิบ</label>
                          <input
                            type="text"
                            value={m.material_code}
                            onChange={(e) => {
                              handleMaterialChange(idx, "material_code", e.target.value);
                              setOpenCodeDropdownIdx(idx);
                              setOpenNameDropdownIdx(null);
                            }}
                            onFocus={() => {
                              setOpenCodeDropdownIdx(idx);
                              setOpenNameDropdownIdx(null);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setOpenCodeDropdownIdx(null);
                              }, 250);
                            }}
                            placeholder="ค้นหารหัสสาร..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-bold font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />

                          {openCodeDropdownIdx === idx && (
                            <div className="absolute z-[70] left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl divide-y divide-slate-100">
                              {rawMaterials
                                .filter(rm => (rm.code || "").toLowerCase().includes((m.material_code || "").toLowerCase()))
                                .map(rm => (
                                  <button
                                    key={rm.id}
                                    type="button"
                                    onClick={() => {
                                      handleMaterialChange(idx, "material_code", rm.code);
                                      setOpenCodeDropdownIdx(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 font-sans font-medium transition-colors"
                                  >
                                    <div className="font-bold text-blue-600 font-mono">{rm.code}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{rm.name}</div>
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </div>

                        {/* 2. ชื่อวัตถุดิบ (Autocomplete) */}
                        <div className="flex-1 relative">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ชื่อวัตถุดิบ</label>
                          <input
                            type="text"
                            value={m.material_name}
                            onChange={(e) => {
                              handleMaterialChange(idx, "material_name", e.target.value);
                              setOpenNameDropdownIdx(idx);
                              setOpenCodeDropdownIdx(null);
                            }}
                            onFocus={() => {
                              setOpenNameDropdownIdx(idx);
                              setOpenCodeDropdownIdx(null);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setOpenNameDropdownIdx(null);
                              }, 250);
                            }}
                            placeholder="พิมพ์ค้นหาชื่อสารเคมี..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />

                          {openNameDropdownIdx === idx && (
                            <div className="absolute z-[70] left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl divide-y divide-slate-100">
                              {rawMaterials
                                .filter(rm => (rm.name || "").toLowerCase().includes((m.material_name || "").toLowerCase()))
                                .map(rm => (
                                  <button
                                    key={rm.id}
                                    type="button"
                                    onClick={() => {
                                      handleMaterialChange(idx, "material_name", rm.name);
                                      setOpenNameDropdownIdx(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 font-sans font-medium transition-colors"
                                  >
                                    <div className="font-semibold text-slate-800">{rm.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{rm.code}</div>
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </div>

                        {/* 3. ปริมาณ (พิมพ์ 0.01 ได้) */}
                        <div className="w-full md:w-28">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ปริมาณ</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={m.quantity === undefined || m.quantity === null ? "" : m.quantity}
                            onChange={(e) => handleMaterialChange(idx, "quantity", e.target.value)}
                            placeholder="0.01"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm text-right font-bold font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                          />
                        </div>

                        {/* 4. หน่วยวัด */}
                        <div className="w-full md:w-24">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">หน่วยวัด</label>
                          <select
                            value={m.unit}
                            onChange={(e) => handleMaterialChange(idx, "unit", e.target.value)}
                            className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 cursor-pointer"
                          >
                            {standardUnits.map((un, unIdx) => (
                              <option key={unIdx} value={un}>{un}</option>
                            ))}
                          </select>
                        </div>

                        {/* ลบแถว */}
                        <div className="flex items-end justify-end md:items-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                            title="ลบแถววัตถุดิบ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Step-by-Step Manufacturing Instructions (วิธีการผลิต) */}
                <div className="space-y-3 border-t border-slate-150 pt-5">
                  <div className="flex items-center justify-between pb-1.5">
                    <h4 className="text-xs md:text-sm lg:text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-500" /> ขั้นตอนและวิธีการผสมผลิตผลิตภัณฑ์สำเร็จรูป
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddInstructionRow}
                      className="text-xs md:text-sm text-indigo-600 font-extrabold hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-lg transition-all border border-indigo-100 shadow-sm"
                    >
                      + เพิ่มขั้นตอนผลิต
                    </button>
                  </div>

                  <div className="space-y-3">
                    {instructions.map((inst, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/50 hover:border-indigo-200 transition-all">
                        <span className="w-16 text-xs font-bold text-indigo-600 font-mono text-center bg-indigo-50 px-2.5 py-1 rounded-lg">
                          ขั้นตอน {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={inst.instruction}
                          onChange={(e) => handleInstructionChange(idx, e.target.value)}
                          placeholder="ระบุรายละเอียดขั้นตอนการผสม อุณหภูมิ เวลา หรือข้อระวัง..."
                          required
                          className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveInstructionRow(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-5 bg-slate-50 border-t border-slate-150 flex items-center justify-between flex-shrink-0">
                {editingBom ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingBom.id, name: editingBom.product_name || "สูตรการผลิต" };
                      setIsEditModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> ลบสูตรนี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {isSubmitting ? "กำลังบันทึก..." : "บันทึกสูตร (BOM)"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BomPrint integration popup */}
      {isPrintModalOpen && printSelectedBom && (
        <BomPrint
          bom={printSelectedBom}
          rawMaterials={rawMaterials}
          customers={customers}
          initialPieceSize={pieceSizeGrams}
          initialPieceCount={pieceCount}
          initialBatchQty={targetBatchQty}
          initialCustomerId={selectedCustomerId}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* In-App Active Delete Confirmation Modal (NO window.confirm!) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">ยืนยันการลบสูตรการผลิต (BOM)</h3>
                <p className="text-xs text-slate-500">การลบนี้จะนำข้อมูลออกจากระบบถาวร</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบสูตรการผลิต <strong className="text-red-600">"{deleteTarget.name}"</strong> ออกจากระบบ 100%?
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
                  const id = deleteTarget.id;
                  setDeleteTarget(null);
                  await onDeleteBom(id);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> ยืนยันลบสูตร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
