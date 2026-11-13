import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Boxes, 
  Calendar, 
  ArrowRight, 
  X, 
  Save, 
  FileText, 
  Truck, 
  Package, 
  ShoppingCart, 
  ShieldAlert,
  Download,
  Activity,
  UserCheck,
  Coins,
  TrendingUp,
  Printer,
  Filter,
  BarChart3,
  Layers,
  Users,
  Warehouse,
  Barcode as BarcodeIcon,
  ShieldCheck,
  Eye,
  Check,
  Sparkles,
  Clock
} from "lucide-react";
import { 
  Precheck, 
  ProductionOrder, 
  Product, 
  Customer, 
  PackingOrder, 
  PurchaseOrder, 
  RawMaterial, 
  Grn, 
  InventoryPack,
  Supplier,
  MaterialSupplier,
  PurchasePriceHistory,
  QcInspection,
  RawMaterialLot,
  AuditLog
} from "../types";
import QcPassLabelModal from "./QcPassLabelModal";
import CoaDocumentModal from "./CoaDocumentModal";
import StockCountModal from "./StockCountModal";
import { getResolvedMaterialSuppliers, normalizeSupplierName } from "../lib/supplierHelpers";

// Reusable active in-app Delete Confirmation Modal (NO window.confirm!)
export function ConfirmDeleteDialog({
  isOpen,
  title,
  itemName,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  title: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <div className="p-3 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">การลบนี้จะนำข้อมูลออกจากระบบถาวร 100%</p>
          </div>
        </div>
        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
          คุณแน่ใจหรือไม่ว่าต้องการลบ <strong className="text-red-600">"{itemName}"</strong> ออกจากระบบ?
        </p>
        <div className="flex justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> ยืนยันลบข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PRECHECK PAGE
// ============================================================================
interface PrecheckPageProps {
  prechecks: Precheck[];
  onAddPrecheck?: (precheck: any) => Promise<void>;
  onSavePrecheck?: (precheck: any) => Promise<void>;
  onDeletePrecheck?: (id: number) => Promise<void>;
}
export function PrecheckPage({ prechecks, onAddPrecheck, onSavePrecheck, onDeletePrecheck }: PrecheckPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrecheck, setEditingPrecheck] = useState<Precheck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const [material, setMaterial] = useState("");
  const [lot, setLot] = useState("");
  const [expiry, setExpiry] = useState("");
  const [inspector, setInspector] = useState("ดร.สุภา");
  const [result, setResult] = useState("pass");

  const saveHandler = onSavePrecheck || onAddPrecheck;

  const openFormModal = (pre?: Precheck) => {
    if (pre) {
      setEditingPrecheck(pre);
      setMaterial(pre.material);
      setLot(pre.lot);
      setExpiry(pre.expiry || "");
      setInspector(pre.inspector);
      setResult(pre.result);
    } else {
      setEditingPrecheck(null);
      setMaterial("");
      setLot("");
      setExpiry("");
      setInspector("ดร.สุภา");
      setResult("pass");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material.trim() || !lot.trim()) return;
    if (saveHandler) {
      await saveHandler({
        id: editingPrecheck ? editingPrecheck.id : 0,
        material,
        lot,
        expiry,
        inspector,
        result,
        date: editingPrecheck ? editingPrecheck.date : new Date().toISOString().slice(0, 10)
      });
    }
    setIsModalOpen(false);
    setMaterial("");
    setLot("");
    setExpiry("");
  };

  const handleUpdateResult = async (pre: Precheck, newResult: string) => {
    if (saveHandler) {
      await saveHandler({
        ...pre,
        result: newResult
      });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-emerald-600" /> รายการตรวจวิเคราะห์ก่อนผลิต (COA / QC)
        </h3>
        <button
          onClick={() => openFormModal()}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> บันทึกใบวิเคราะห์สาร
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-100">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <th className="p-2.5 border border-slate-200 text-center w-12">ลำดับ</th>
                <th className="p-2.5 border border-slate-200">วันที่ตรวจ</th>
                <th className="p-2.5 border border-slate-200">ชื่อสารเคมี</th>
                <th className="p-2.5 border border-slate-200">Lot Number</th>
                <th className="p-2.5 border border-slate-200">วันหมดอายุ</th>
                <th className="p-2.5 border border-slate-200">ผู้บันทึกตรวจ</th>
                <th className="p-2.5 border border-slate-200 text-center w-28">ผลวิเคราะห์ (QC)</th>
                <th className="p-2.5 border border-slate-200 text-center w-80">ดำเนินการขั้นตอน / แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {prechecks.map((p, index) => (
                <tr key={p.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/30 transition-colors">
                  <td className="p-2 border border-slate-200/60 text-center font-mono text-slate-400">{index + 1}</td>
                  <td className="p-2 border border-slate-200/60 text-slate-400 font-mono">{p.date}</td>
                  <td className="p-2 border border-slate-200/60 font-semibold text-slate-800">{p.material}</td>
                  <td className="p-2 border border-slate-200/60 font-mono font-semibold text-slate-700">{p.lot}</td>
                  <td className="p-2 border border-slate-200/60 text-slate-500 font-mono">{p.expiry || "-"}</td>
                  <td className="p-2 border border-slate-200/60 font-medium text-slate-600">{p.inspector}</td>
                  <td className="p-2 border border-slate-200/60 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.result === "pass"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : p.result === "fail"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {p.result === "pass" ? "🟢 ผ่านเกณฑ์" : p.result === "fail" ? "🔴 ไม่ผ่านเกณฑ์" : "🟡 รอตรวจสอบ"}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-200/60 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Action buttons to update status */}
                      <button
                        onClick={() => handleUpdateResult(p, "pass")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          p.result === "pass"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        ผ่านเกณฑ์
                      </button>
                      <button
                        onClick={() => handleUpdateResult(p, "pending")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          p.result === "pending"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        รอตรวจสอบ
                      </button>
                      <button
                        onClick={() => handleUpdateResult(p, "fail")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          p.result === "fail"
                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                            : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        ไม่ผ่าน
                      </button>

                      <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>

                      {/* Edit Button */}
                      <button
                        onClick={() => openFormModal(p)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="แก้ไขรายละเอียด"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      {onDeletePrecheck && (
                        <button
                          onClick={() => setDeleteTarget({ id: p.id, name: `${p.material} ล็อต ${p.lot}` })}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="ลบรายงานตรวจสาร"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {prechecks.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลรายงานตรวจวิเคราะห์เคมีภัณฑ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                {editingPrecheck ? "แก้ไขผลตรวจสอบทางเคมี (Pre-QC)" : "บันทึกผลตรวจสอบทางเคมี (Pre-QC)"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อเคมีภัณฑ์</label>
                <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} required placeholder="เช่น Ethanol 96%, NaOH" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lot Number</label>
                  <input type="text" value={lot} onChange={(e) => setLot(e.target.value)} required placeholder="L260701" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันหมดอายุสาร</label>
                  <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เจ้าหน้าที่ตรวจ</label>
                  <input type="text" value={inspector} onChange={(e) => setInspector(e.target.value)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ผลการทดสอบ QC</label>
                  <select value={result} onChange={(e) => setResult(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="pass">🟢 ผ่านเกณฑ์มาตรฐาน (Pass)</option>
                    <option value="pending">🟡 กักรอประเมินผล (Pending)</option>
                    <option value="fail">🔴 ตกเกณฑ์/ไม่อนุมัติ (Fail)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                {editingPrecheck ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingPrecheck.id, name: `${editingPrecheck.material} ล็อต ${editingPrecheck.lot}` };
                      setIsModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบผลตรวจนี้
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">ยกเลิก</button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                    {editingPrecheck ? "บันทึกการแก้ไข" : "บันทึกตรวจสาร"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="ยืนยันการลบผลตรวจสารเคมี (Pre-QC)"
        itemName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget && onDeletePrecheck) {
            await onDeletePrecheck(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// PRODUCTION ORDERS PAGE
// ============================================================================
interface ProductionPageProps {
  productionOrders: ProductionOrder[];
  products: Product[];
  customers: Customer[];
  onSaveProduction: (po: any) => Promise<void>;
  onDeleteProduction: (id: number) => Promise<void>;
}
export function ProductionPage({ 
  productionOrders, 
  products, 
  customers, 
  onSaveProduction, 
  onDeleteProduction 
}: ProductionPageProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingPo, setEditingPo] = useState<ProductionOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [printLabelPo, setPrintLabelPo] = useState<ProductionOrder | null>(null);

  const [code, setCode] = useState("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("ลิตร");
  const [staff, setStaff] = useState("สมชาย ใจดี");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");

  const filtered = productionOrders.filter(po => {
    const q = search.toLowerCase();
    const matchesSearch = po.code.toLowerCase().includes(q) ||
      (po.product_name || "").toLowerCase().includes(q) ||
      (po.customer_name || "").toLowerCase().includes(q) ||
      (po.staff || "").toLowerCase().includes(q);
    
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openFormModal = (po?: ProductionOrder) => {
    if (po) {
      setEditingPo(po);
      setCode(po.code);
      setCustomerId(po.customer_id || "");
      setProductId(po.product_id || "");
      setQuantity(po.quantity);
      setUnit(po.unit || "ลิตร");
      setStaff(po.staff || "");
      setStatus(po.status || "pending");
      setDueDate(po.due_date || "");
    } else {
      setEditingPo(null);
      const num = productionOrders.length + 1;
      setCode(`PO-2026-${String(num).padStart(4, "0")}`);
      setCustomerId("");
      setProductId("");
      setQuantity(500);
      setUnit("ลิตร");
      setStaff("สมชาย ใจดี");
      setStatus("pending");
      setDueDate(new Date(Date.now() + 5*24*60*60*1000).toISOString().slice(0, 10));
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !productId || !quantity) return;
    await onSaveProduction({
      id: editingPo ? editingPo.id : 0,
      code,
      customer_id: Number(customerId),
      product_id: Number(productId),
      quantity,
      unit,
      status,
      due_date: dueDate,
      staff,
      date: editingPo ? editingPo.date : new Date().toISOString().slice(0, 10)
    });
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (po: ProductionOrder, newStatus: string) => {
    await onSaveProduction({
      ...po,
      status: newStatus
    });
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "done":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-normal">ผลิตเสร็จ</span>;
      case "running":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-normal animate-pulse">กำลังผลิต</span>;
      case "pending":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-normal">รอผลิต</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-normal">ยกเลิก</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {["all", "pending", "running", "done", "cancelled"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                statusFilter === st 
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st === "all" ? "ทั้งหมด" : st === "pending" ? "รอผลิต" : st === "running" ? "กำลังผลิต" : st === "done" ? "ผลิตเสร็จ" : "ยกเลิก"}
            </button>
          ))}
        </div>
        <button
          onClick={() => openFormModal()}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> สร้างใบสั่งผลิต
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่, ชื่อลูกค้า, หรือชื่อสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-[#cccccc] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3c4043] border-collapse">
            <thead>
              <tr className="bg-[#f1f3f4] text-[11px] text-[#3c4043]">
                <th className="p-2 border border-[#cccccc] font-normal text-center w-12">ลำดับ</th>
                <th className="p-2 border border-[#cccccc] font-normal">เลขที่ใบสั่ง</th>
                <th className="p-2 border border-[#cccccc] font-normal">วันที่เริ่ม</th>
                <th className="p-2 border border-[#cccccc] font-normal">ลูกค้า / แบรนด์</th>
                <th className="p-2 border border-[#cccccc] font-normal">สินค้าที่สั่งผลิต</th>
                <th className="p-2 border border-[#cccccc] font-normal text-right">จำนวนผลิต</th>
                <th className="p-2 border border-[#cccccc] font-normal">ผู้รับผิดชอบ</th>
                <th className="p-2 border border-[#cccccc] font-normal">วันกำหนดส่ง</th>
                <th className="p-2 border border-[#cccccc] font-normal text-center">สถานะ</th>
                <th className="p-2 border border-[#cccccc] font-normal text-center w-80">ดำเนินการขั้นตอน / แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((po, index) => {
                const cust = customers.find(c => c.id === po.customer_id);
                const prod = products.find(p => p.id === po.product_id);
                const custDisp = cust ? `${cust.name} ${cust.contact ? `(${cust.contact})` : ""}` : (po.customer_name || "ไม่ได้ระบุ");
                const prodDisp = prod ? `${prod.name} (${prod.code})` : (po.product_name || "ไม่ได้ระบุ");

                return (
                  <tr key={po.id} className="odd:bg-white even:bg-[#f8f9fa] hover:bg-[#e8f0fe]/70 transition-colors">
                    <td className="p-2 border border-[#e0e0e0] text-center font-mono text-slate-500 font-normal">{index + 1}</td>
                    <td className="p-2 border border-[#e0e0e0] font-normal font-mono text-blue-600">{po.code}</td>
                    <td className="p-2 border border-[#e0e0e0] text-slate-500 font-mono font-normal">{po.date}</td>
                    <td className="p-2 border border-[#e0e0e0] font-normal text-slate-800">{custDisp}</td>
                    <td className="p-2 border-[#e0e0e0] border text-slate-700 font-normal">{prodDisp}</td>
                    <td className="p-2 border border-[#e0e0e0] font-normal font-mono text-right">{po.quantity.toLocaleString()} {po.unit}</td>
                    <td className="p-2 border border-[#e0e0e0] font-normal text-slate-600">{po.staff}</td>
                    <td className="p-2 border border-[#e0e0e0] text-indigo-600 font-normal font-mono">{po.due_date}</td>
                    <td className="p-2 border border-[#e0e0e0] text-center">{getStatusBadge(po.status)}</td>
                    <td className="p-2 border border-[#e0e0e0] text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Status update buttons */}
                        <button
                          onClick={() => handleUpdateStatus(po, "pending")}
                          className={`px-2 py-0.5 rounded text-[10px] font-normal transition-all border ${
                            po.status === "pending"
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                        >
                          รอผลิต
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(po, "running")}
                          className={`px-2 py-0.5 rounded text-[10px] font-normal transition-all border ${
                            po.status === "running"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          }`}
                        >
                          กำลังผลิต
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(po, "done")}
                          className={`px-2 py-0.5 rounded text-[10px] font-normal transition-all border ${
                            po.status === "done"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          ผลิตเสร็จแล้ว
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>

                        {/* Print Label for Workpiece (ป้ายชี้บ่งแปะชิ้นงาน) */}
                        <button
                          onClick={() => setPrintLabelPo(po)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                          title="พิมพ์ป้ายชี้บ่งแปะชิ้นงาน/ถังผสม (FM-QC-17 REV:01)"
                        >
                          <Printer className="w-3 h-3" /> ป้ายชี้บ่ง
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openFormModal(po)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="แก้ไขรายละเอียด"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTarget({ id: po.id, name: `ใบสั่งผลิต ${po.code}` })}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="ลบใบสั่งผลิต"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                {editingPo ? `แก้ไขใบสั่งผลิต (${editingPo.code})` : "ออกใบสั่งประกอบการผลิต (Production Work Order)"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลขที่ใบสั่ง</label>
                  <input type="text" value={code} readOnly className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ผู้รับผิดชอบคุมถังผสม</label>
                  <input type="text" value={staff} onChange={(e) => setStaff(e.target.value)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลือกแบรนด์ลูกค้า</label>
                  <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="">-- กรุณาเลือกลูกค้า --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลือกผลิตภัณฑ์</label>
                  <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="">-- เลือกรหัสสินค้า --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">จำนวนสั่งผลิต</label>
                  <input type="number" value={quantity || ""} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">หน่วยตวง</label>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">กำหนดเสร็จส่ง</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                {editingPo ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingPo.id, name: `ใบสั่งผลิต ${editingPo.code}` };
                      setIsModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบใบสั่งผลิตนี้
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">ยกเลิก</button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                    {editingPo ? "บันทึกการแก้ไข" : "เปิดใบสั่งผลิต"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workpiece Label Modal (FM-QC-17 REV:01) */}
      {printLabelPo && (
        <QcPassLabelModal
          productionOrder={printLabelPo}
          availableProducts={products}
          availableProductions={productionOrders}
          onClose={() => setPrintLabelPo(null)}
        />
      )}

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="ยืนยันการลบใบสั่งผลิต (Production Work Order)"
        itemName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget && onDeleteProduction) {
            await onDeleteProduction(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// PACKING PAGE
// ============================================================================
interface PackingPageProps {
  packingOrders: PackingOrder[];
  productionOrders?: ProductionOrder[];
  onAddPacking?: (pk: any) => Promise<void>;
  onSavePacking?: (pk: any) => Promise<void>;
  onDeletePacking?: (id: number) => Promise<void>;
}
export function PackingPage({ 
  packingOrders, 
  productionOrders = [], 
  onAddPacking, 
  onSavePacking, 
  onDeletePacking 
}: PackingPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPacking, setEditingPacking] = useState<PackingOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [printLabelPacking, setPrintLabelPacking] = useState<PackingOrder | null>(null);

  const [code, setCode] = useState("");
  const [poId, setPoId] = useState<number | "">("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("ขวด");
  const [status, setStatus] = useState("pending");

  const saveHandler = onSavePacking || onAddPacking;

  const openFormModal = (pk?: PackingOrder) => {
    if (pk) {
      setEditingPacking(pk);
      setCode(pk.code);
      setPoId(pk.production_order_id || "");
      setItemName(pk.item_name);
      setQuantity(pk.quantity);
      setUnit(pk.unit || "ขวด");
      setStatus(pk.status || "pending");
    } else {
      setEditingPacking(null);
      setCode(`PK-2026-${String(packingOrders.length + 1).padStart(4, "0")}`);
      setPoId(productionOrders.length > 0 ? productionOrders[0].id : "");
      setItemName("");
      setQuantity(500);
      setUnit("ขวด");
      setStatus("pending");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !quantity) return;
    if (saveHandler) {
      await saveHandler({
        id: editingPacking ? editingPacking.id : 0,
        code,
        production_order_id: poId ? Number(poId) : 1,
        item_name: itemName,
        quantity,
        unit,
        status
      });
    }
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (pk: PackingOrder, newStatus: string) => {
    if (saveHandler) {
      await saveHandler({
        ...pk,
        status: newStatus
      });
    }
  };

  const getPoCode = (pId: number) => {
    const po = productionOrders.find(p => p.id === pId);
    return po ? po.code : `PO-2026-005${pId + 3}`;
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "done":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">🟢 เสร็จสิ้น</span>;
      case "running":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">🔵 กำลังบรรจุ</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">🟡 รอดำเนินการ</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Boxes className="w-4 h-4 text-indigo-600" /> ตารางสั่งบรรจุขวดและหีบห่อ (Packaging Lines)
        </h3>
        <button 
          onClick={() => openFormModal()} 
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> ออกใบสั่งบรรจุ
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-100">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <th className="p-2.5 border border-slate-200 text-center w-12">ลำดับ</th>
                <th className="p-2.5 border border-slate-200">รหัสใบสั่งบรรจุ</th>
                <th className="p-2.5 border border-slate-200">เลขอ้างอิงใบผลิต</th>
                <th className="p-2.5 border border-slate-200">ชื่อสินค้า/ขวดบรรจุ</th>
                <th className="p-2.5 border border-slate-200 text-right">จำนวนผลิตบรรจุ</th>
                <th className="p-2.5 border border-slate-200 text-center">หน่วย</th>
                <th className="p-2.5 border border-slate-200 text-center">สถานะไลน์บรรจุ</th>
                <th className="p-2.5 border border-slate-200 text-center w-80">ดำเนินการขั้นตอน / แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {packingOrders.map((p, index) => (
                <tr key={p.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/30 transition-colors">
                  <td className="p-2 border border-slate-200/60 text-center font-mono text-slate-400">{index + 1}</td>
                  <td className="p-2 border border-slate-200/60 font-bold font-mono text-slate-800">{p.code}</td>
                  <td className="p-2 border border-slate-200/60 font-mono text-slate-500">{getPoCode(p.production_order_id)}</td>
                  <td className="p-2 border border-slate-200/60 font-semibold text-slate-800">{p.item_name}</td>
                  <td className="p-2 border border-slate-200/60 text-right font-bold font-mono text-blue-600">{p.quantity.toLocaleString()}</td>
                  <td className="p-2 border border-slate-200/60 text-center text-slate-500 font-medium">{p.unit}</td>
                  <td className="p-2 border border-slate-200/60 text-center">{getStatusBadge(p.status)}</td>
                  <td className="p-2 border border-slate-200/60 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Status update buttons */}
                      <button
                        onClick={() => handleUpdateStatus(p, "pending")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          p.status === "pending"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        รอดำเนินการ
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(p, "running")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          p.status === "running"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm animate-pulse"
                            : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        กำลังบรรจุ
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(p, "done")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          p.status === "done"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        เสร็จสิ้น
                      </button>

                      <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>

                      {/* Print Label for Workpiece (ป้ายชี้บ่งแปะชิ้นงานบรรจุ) */}
                      <button
                        onClick={() => setPrintLabelPacking(p)}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                        title="พิมพ์ป้ายชี้บ่งแปะกล่อง/ชิ้นงานบรรจุ (FM-QC-17 REV:01)"
                      >
                        <Printer className="w-3 h-3" /> ป้ายชี้บ่ง
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openFormModal(p)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="แก้ไขรายละเอียด"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      {onDeletePacking && (
                        <button
                          onClick={() => setDeleteTarget({ id: p.id, name: `ใบสั่งบรรจุ ${p.code}` })}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="ลบคิวไลน์บรรจุ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {packingOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลใบสั่งบรรจุผลิตภัณฑ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                {editingPacking ? `แก้ไขใบสั่งทำงานไลน์บรรจุ (${editingPacking.code})` : "ออกใบสั่งทำงานไลน์บรรจุภัณฑ์"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">รหัสใบสั่ง</label>
                  <input type="text" value={code} readOnly className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">อ้างอิงใบสั่งผลิต (PO)</label>
                  {productionOrders.length > 0 ? (
                    <select
                      value={poId}
                      onChange={(e) => setPoId(e.target.value ? Number(e.target.value) : "")}
                      required
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                    >
                      <option value="">-- เลือกใบสั่งผลิต --</option>
                      {productionOrders.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.code} - {po.product_name || "ไม่ได้ระบุ"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="number" 
                      value={poId || ""} 
                      onChange={(e) => setPoId(e.target.value ? Number(e.target.value) : "")} 
                      required 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อสินค้า/รูปแบบภาชนะบรรจุ</label>
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} required placeholder="เช่น ขวด HDPE ขนาด 1 ลิตร ตราแบรนด์ A" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">จำนวนบรรจุ</label>
                  <input type="number" value={quantity || ""} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">หน่วยนับ</label>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">สถานะ</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="running">กำลังทำงานบรรจุขวด (Running)</option>
                  <option value="done">บรรจุครบเสร็จสิ้น (Done)</option>
                </select>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                {editingPacking ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingPacking.id, name: `ใบสั่งบรรจุ ${editingPacking.code}` };
                      setIsModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบใบสั่งบรรจุนี้
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">ยกเลิก</button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                    {editingPacking ? "บันทึกการแก้ไข" : "เปิดใบงานบรรจุ"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workpiece Label Modal (FM-QC-17 REV:01) */}
      {printLabelPacking && (
        <QcPassLabelModal
          packingOrder={printLabelPacking}
          onClose={() => setPrintLabelPacking(null)}
        />
      )}

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="ยืนยันการลบใบสั่งบรรจุภัณฑ์"
        itemName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget && onDeletePacking) {
            await onDeletePacking(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// PURCHASE PAGE (ORDERS)
// ============================================================================
interface PurchasePageProps {
  purchaseOrders: PurchaseOrder[];
  rawMaterials: RawMaterial[];
  suppliers?: Supplier[];
  materialSuppliers?: MaterialSupplier[];
  purchasePriceHistory?: PurchasePriceHistory[];
  onAddPurchase?: (po: any) => Promise<void>;
  onSavePurchase?: (po: any) => Promise<void>;
  onDeletePurchase?: (id: number) => Promise<void>;
  onReceivePurchase?: (po: PurchaseOrder) => Promise<void>;
}
export function PurchasePage({ 
  purchaseOrders, 
  rawMaterials, 
  suppliers = [],
  materialSuppliers = [],
  purchasePriceHistory: _purchasePriceHistory = [],
  onAddPurchase,
  onSavePurchase,
  onDeletePurchase,
  onReceivePurchase
}: PurchasePageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const [code, setCode] = useState("");
  const [supplier, setSupplier] = useState("");
  const [materialId, setMaterialId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState("pending");

  const saveHandler = onSavePurchase || onAddPurchase;

  const getSuggestedPriceForSupplier = (rmId: number | "", supName: string): number => {
    if (!rmId) return 0;
    const rm = rawMaterials.find((r) => r.id === Number(rmId));
    if (!rm) return 0;
    const refs = getResolvedMaterialSuppliers(rm, materialSuppliers, suppliers);
    const matchedRef = supName
      ? refs.find((r) => normalizeSupplierName(r.name) === normalizeSupplierName(supName))
      : refs.find((r) => r.is_main) || refs[0];
    if (matchedRef && matchedRef.latest_price && matchedRef.latest_price > 0) {
      return matchedRef.latest_price;
    }
    return rm.unit_price || 0;
  };

  const openFormModal = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPurchase(po);
      setCode(po.code);
      setSupplier(po.supplier);
      const firstItem = po.items?.[0] || { raw_material_id: "", quantity: po.qty || 100, unit_price: po.price || 50 };
      setMaterialId(firstItem.raw_material_id || "");
      setQuantity(firstItem.quantity || po.qty || 100);
      setPrice(firstItem.unit_price || po.price || 50);
      setStatus(po.status || "pending");
    } else {
      setEditingPurchase(null);
      setCode(`PRM-2026-${String(purchaseOrders.length + 22).padStart(4, "0")}`);
      const firstMat = rawMaterials[0];
      const firstRefs = firstMat ? getResolvedMaterialSuppliers(firstMat, materialSuppliers, suppliers) : [];
      const mainRef = firstRefs.find((r) => r.is_main) || firstRefs[0];
      setSupplier(mainRef?.name || "");
      setMaterialId(firstMat ? firstMat.id : "");
      setQuantity(100);
      setPrice((mainRef?.latest_price && mainRef.latest_price > 0 ? mainRef.latest_price : firstMat?.unit_price) || 50);
      setStatus("pending");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() || !materialId || !quantity) return;
    const selectedMat = rawMaterials.find(rm => rm.id === Number(materialId));
    
    if (saveHandler) {
      await saveHandler({
        id: editingPurchase ? editingPurchase.id : 0,
        code,
        supplier,
        order_date: editingPurchase ? editingPurchase.order_date : new Date().toISOString().slice(0, 10),
        status,
        total_amount: quantity * price,
        items: [
          {
            raw_material_id: Number(materialId),
            item_name: selectedMat ? selectedMat.name : "",
            quantity,
            unit: selectedMat ? selectedMat.unit : "ลิตร",
            unit_price: price,
            subtotal: quantity * price
          }
        ]
      });
    }
    setIsModalOpen(false);
  };

  // Sort purchase orders: "received" (เข้าคลัง) goes to the bottom, everything else to the top.
  const sortedPurchaseOrders = [...purchaseOrders].sort((a, b) => {
    const aReceived = a.status === "received" ? 1 : 0;
    const bReceived = b.status === "received" ? 1 : 0;
    
    if (aReceived !== bReceived) {
      return aReceived - bReceived; // 0 (unreceived) first, 1 (received) last
    }
    
    return b.id - a.id; // Newest first for secondary sorting
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4 text-indigo-600" /> รายการสั่งซื้อเคมีภัณฑ์และส่วนผสม
        </h3>
        <button 
          onClick={() => openFormModal()} 
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> บันทึกใบสั่งซื้อใหม่
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-100">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <th className="p-2.5 border border-slate-200 text-center w-12">ลำดับ</th>
                <th className="p-2.5 border border-slate-200">เลขที่ใบสั่งซื้อ</th>
                <th className="p-2.5 border border-slate-200">ผู้จำหน่าย (Supplier)</th>
                <th className="p-2.5 border border-slate-200">วัตถุดิบเคมีที่ซื้อ</th>
                <th className="p-2.5 border border-slate-200 text-right">จำนวนซื้อ</th>
                <th className="p-2.5 border border-slate-200 text-right">ยอดเงินรวม</th>
                <th className="p-2.5 border border-slate-200 text-center w-24">วันที่สั่งซื้อ</th>
                <th className="p-2.5 border border-slate-200 text-center w-36">สถานะตรวจรับเข้าคลัง</th>
                <th className="p-2.5 border border-slate-200 text-center w-[260px]">ดำเนินการขั้นตอน / แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {sortedPurchaseOrders.map((p, index) => {
                const item = p.items?.[0] || { item_name: "เคมีภัณฑ์ย่อย", quantity: p.qty || 0, unit: "หน่วย", subtotal: p.total_amount || 0 };
                return (
                  <tr key={p.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/30 transition-colors">
                    <td className="p-2.5 border border-slate-200 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="p-2.5 border border-slate-200 font-bold font-mono text-slate-800">{p.code}</td>
                    <td className="p-2.5 border border-slate-200 font-semibold text-slate-800">{p.supplier}</td>
                    <td className="p-2.5 border border-slate-200 text-slate-600 font-medium">{item.item_name}</td>
                    <td className="p-2.5 border border-slate-200 text-right font-semibold font-mono text-slate-700">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="p-2.5 border border-slate-200 text-right font-bold font-mono text-indigo-600">฿{p.total_amount.toLocaleString()}</td>
                    <td className="p-2.5 border border-slate-200 text-slate-400 font-mono text-center">{p.order_date}</td>
                    <td className="p-2.5 border border-slate-200 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.status === "received"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : p.status === "transit"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                      }`}>
                        {p.status === "received" ? "🟢 เข้าคลังแล้ว" : p.status === "transit" ? "🔵 อยู่ระหว่างจัดส่ง" : "🟡 รอกลุ่มรับของ"}
                      </span>
                    </td>
                    <td className="p-2.5 border border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Quick Action: Receive goods into warehouse */}
                        {p.status !== "received" && onReceivePurchase && (
                          <button
                            onClick={async () => {
                              await onReceivePurchase(p);
                            }}
                            className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 transition-all shadow-sm shadow-emerald-600/10 cursor-pointer"
                          >
                            📥 รับเข้าคลังสินค้า
                          </button>
                        )}
                        
                        {/* Status controls */}
                        {p.status === "pending" && onSavePurchase && (
                          <button
                            onClick={async () => {
                              await onSavePurchase({ ...p, status: "transit" });
                            }}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            ส่งสินค้า
                          </button>
                        )}

                        <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>

                        {/* Edit Button */}
                        <button
                          onClick={() => openFormModal(p)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="แก้ไขรายละเอียด"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        {onDeletePurchase && (
                          <button
                            onClick={() => setDeleteTarget({ id: p.id, name: `ใบสั่งซื้อ ${p.code}` })}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="ลบใบสั่งซื้อ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลใบสั่งซื้อเคมีภัณฑ์และส่วนผสม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-100">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                {editingPurchase ? `แก้ไขใบส่งสั่งซื้อเคมีภัณฑ์ (${editingPurchase.code})` : "สร้างใบส่งสั่งซื้อสารตั้งต้น (PO Chemicals)"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลข PO จัดซื้อ</label>
                  <input type="text" value={code} readOnly className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 font-mono font-bold text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">บริษัทผู้ขาย (Supplier จากฐานข้อมูล)</label>
                  {suppliers && suppliers.length > 0 ? (
                    <select
                      value={supplier}
                      onChange={(e) => {
                        const nextSup = e.target.value;
                        setSupplier(nextSup);
                        const suggested = getSuggestedPriceForSupplier(materialId, nextSup);
                        if (suggested > 0) setPrice(suggested);
                      }}
                      required
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="">-- เลือกผู้จำหน่าย --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      required
                      placeholder="ระบุบริษัทเคมีภัณฑ์"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วัตถุดิบสารเคมีที่ต้องการสั่งซื้อ</label>
                <select 
                  value={materialId} 
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setMaterialId(id);
                    const selected = rawMaterials.find(rm => rm.id === id);
                    if (selected) {
                      const linked = getResolvedMaterialSuppliers(selected, materialSuppliers, suppliers);
                      const mainRef = linked.find(s => s.is_main) || linked[0];
                      const chosenSup =
                        linked.find(s => normalizeSupplierName(s.name) === normalizeSupplierName(supplier)) ||
                        mainRef;
                      if (mainRef && !supplier) {
                        setSupplier(mainRef.name);
                      } else if ((selected.supplier_name || selected.supplier) && !supplier) {
                        setSupplier(selected.supplier_name || selected.supplier || "");
                      }
                      const nextPrice =
                        chosenSup?.latest_price && chosenSup.latest_price > 0
                          ? chosenSup.latest_price
                          : selected.unit_price || 0;
                      if (nextPrice > 0) {
                        setPrice(nextPrice);
                      }
                    }
                  }} 
                  required 
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="">-- กรุณาเลือกสารเคมี --</option>
                  {rawMaterials.map(rm => {
                    const supNames = getResolvedMaterialSuppliers(rm, materialSuppliers, suppliers).map(s => s.name).join(", ");
                    return (
                      <option key={rm.id} value={rm.id}>
                        {rm.code} - {rm.name} ({supNames || "ไม่ระบุซัพพลายเออร์"})
                      </option>
                    );
                  })}
                </select>
                {(() => {
                  const selectedMat = rawMaterials.find(rm => rm.id === Number(materialId));
                  const linked = selectedMat ? getResolvedMaterialSuppliers(selectedMat, materialSuppliers, suppliers) : [];
                  if (linked.length === 0) return null;
                  return (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">Supplier ของวัตถุดิบนี้:</span>
                      {linked.map((s, idx) => (
                        <button
                          key={`${s.code}_${idx}`}
                          type="button"
                          onClick={() => {
                            setSupplier(s.name);
                            const p = s.latest_price && s.latest_price > 0 ? s.latest_price : (selectedMat?.unit_price || 0);
                            if (p > 0) setPrice(p);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-colors inline-flex items-center gap-1 ${
                            normalizeSupplierName(supplier) === normalizeSupplierName(s.name)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50"
                          }`}
                        >
                          {s.is_main && <span>★ หลัก</span>}
                          <span>{s.code ? `${s.code}: ` : ""}{s.name}</span>
                          {s.latest_price && s.latest_price > 0 ? (
                            <span className={`font-mono ${normalizeSupplierName(supplier) === normalizeSupplierName(s.name) ? "text-blue-100" : "text-emerald-700"}`}>
                              (฿{s.latest_price.toLocaleString()})
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">จำนวนสั่งซื้อ</label>
                  <input type="number" value={quantity || ""} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ราคาซื้อต่อหน่วย (บาท)</label>
                  <input type="number" value={price || ""} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right" />
                </div>
              </div>
              {editingPurchase && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">สถานะ</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} required className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="pending">รอกลุ่มรับของ</option>
                    <option value="transit">อยู่ระหว่างจัดส่ง</option>
                    <option value="received">รับเข้าสต็อกแล้ว</option>
                  </select>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-3">
                {editingPurchase ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingPurchase.id, name: `ใบสั่งซื้อ ${editingPurchase.code}` };
                      setIsModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบใบสั่งซื้อนี้
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">ยกเลิก</button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                    {editingPurchase ? "บันทึกการแก้ไข" : "เปิดใบจัดซื้อเคมี"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="ยืนยันการลบใบสั่งซื้อเคมีภัณฑ์"
        itemName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget && onDeletePurchase) {
            await onDeletePurchase(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// GOODS RECEIVE NOTE (GRN) & INCOMING QC PAGE
// ============================================================================
interface GrnsPageProps {
  grns: Grn[];
  rawMaterials: RawMaterial[];
  purchaseOrders: PurchaseOrder[];
  suppliers?: Supplier[];
  materialSuppliers?: MaterialSupplier[];
  purchasePriceHistory?: PurchasePriceHistory[];
  qcInspections?: QcInspection[];
  lots?: RawMaterialLot[];
  auditLogs?: AuditLog[];
  onAddGrn: (grn: any) => Promise<void>;
  onDeleteGrn?: (id: number) => Promise<void>;
  onSaveQcInspection?: (qc: QcInspection) => Promise<void>;
  onUpdateLotStatus?: (lotId: number, qcStatus: any, stockStatus: any) => Promise<void>;
  onSaveCoa?: (payload: any) => Promise<void>;
  onSaveStockCount?: (params: any) => Promise<void>;
  onLogAudit?: (log: Omit<AuditLog, "id">) => Promise<void>;
}

export function GrnsPage({ 
  grns, 
  rawMaterials, 
  purchaseOrders, 
  suppliers = [],
  materialSuppliers = [],
  purchasePriceHistory: _purchasePriceHistory = [],
  qcInspections = [],
  lots = [],
  auditLogs = [],
  onAddGrn, 
  onDeleteGrn,
  onSaveQcInspection,
  onUpdateLotStatus,
  onSaveCoa,
  onSaveStockCount,
  onLogAudit
}: GrnsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal triggers
  const [activeQcModal, setActiveQcModal] = useState<QcInspection | null>(null);
  const [activeCoaModalTarget, setActiveCoaModalTarget] = useState<{ grn?: Grn; lot?: RawMaterialLot; inspection?: QcInspection } | null>(null);
  const [activePrintLabelTarget, setActivePrintLabelTarget] = useState<{ inspection?: QcInspection; lot?: RawMaterialLot; grn?: Grn } | null>(null);
  const [isStockCountOpen, setIsStockCountOpen] = useState(false);

  // Form State for Adding GRN
  const [code, setCode] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | "">("");
  const [poNumber, setPoNumber] = useState("");
  const [materialId, setMaterialId] = useState<number | "">("");
  const [supplierName, setSupplierName] = useState("");
  const [receivedQty, setReceivedQty] = useState(100);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [lotNumber, setLotNumber] = useState("");
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [retestDate, setRetestDate] = useState("");
  const [appearance, setAppearance] = useState("ของเหลว ใส ไม่มีตะกอน");
  const [labelPieces, setLabelPieces] = useState(1);
  const [coaUrl, setCoaUrl] = useState("");
  const [receiver, setReceiver] = useState("สมศักดิ์ คลังสินค้า");

  // QC Quick Inspection form states
  const [qcInspector, setQcInspector] = useState("สุรัสวดี");
  const [qcApprover, setQcApprover] = useState("ณ");
  const [qcStatusInput, setQcStatusInput] = useState<"QC Passed" | "QC Failed" | "Quarantine" | "Under Inspection">("QC Passed");
  const [qcAppearance, setQcAppearance] = useState("ของเหลว ใส ไม่มีตะกอน");
  const [qcCoaStatus, setQcCoaStatus] = useState<"Attached" | "Missing COA">("Attached");
  const [qcRemarks, setQcRemarks] = useState("ผ่านการตรวจสอบคุณภาพตามมาตรฐานโรงงาน (FM-QC-17 REV:01)");

  const openFormModal = () => {
    setCode(`GRN-2026-${String(grns.length + 19).padStart(4, "0")}`);
    setPurchaseOrderId("");
    setPoNumber("");
    setMaterialId("");
    setSupplierName("บริษัท เคมีภัณฑ์ คอร์ปอเรชั่น จำกัด");
    setReceivedQty(100);
    setUnitPrice(0);
    setLotNumber(`L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-001`);
    setReceiveDate(new Date().toISOString().slice(0, 10));
    setExpiryDate(new Date(Date.now() + 365*2*24*60*60*1000).toISOString().slice(0, 10));
    setRetestDate(new Date(Date.now() + 180*24*60*60*1000).toISOString().slice(0, 10));
    setAppearance("ของเหลว ใส ไม่มีตะกอน");
    setLabelPieces(1);
    setCoaUrl("");
    setReceiver("สมศักดิ์ คลังสินค้า");
    setIsModalOpen(true);
  };

  const handlePurchaseOrderChange = (poId: number) => {
    setPurchaseOrderId(poId);
    const matchedPo = purchaseOrders.find(po => po.id === poId);
    if (matchedPo) {
      setPoNumber(matchedPo.code);
      if (matchedPo.supplier) {
        setSupplierName(matchedPo.supplier);
      }
      if (matchedPo.items && matchedPo.items.length > 0) {
        const firstItem = matchedPo.items[0];
        setMaterialId(firstItem.raw_material_id);
        setReceivedQty(firstItem.quantity);
        setUnitPrice(firstItem.unit_price || 0);
      }
    }
  };

  const handleMaterialChange = (rmId: number) => {
    setMaterialId(rmId);
    const rm = rawMaterials.find(r => r.id === rmId);
    if (rm) {
      const linked = getResolvedMaterialSuppliers(rm, materialSuppliers, suppliers);
      const mainRef = linked.find(s => s.is_main) || linked[0];
      if (mainRef) {
        setSupplierName(mainRef.name);
        setUnitPrice(mainRef.latest_price && mainRef.latest_price > 0 ? mainRef.latest_price : (rm.unit_price || 0));
      } else {
        if (rm.unit_price) setUnitPrice(rm.unit_price);
        if (rm.supplier_name || rm.supplier) setSupplierName(rm.supplier_name || rm.supplier || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !receivedQty || !lotNumber.trim()) return;

    const rm = rawMaterials.find(r => r.id === Number(materialId));
    
    await onAddGrn({
      code,
      purchase_order_id: purchaseOrderId ? Number(purchaseOrderId) : undefined,
      po_number: poNumber || undefined,
      raw_material_id: Number(materialId),
      material_code: rm?.code,
      material_name: rm?.name,
      supplier_name: supplierName || rm?.supplier_name || rm?.supplier || "IDEVA / De Roma",
      lot_number: lotNumber,
      supplier_lot_no: lotNumber,
      expiry_date: expiryDate,
      retest_date: retestDate,
      appearance,
      label_pieces: labelPieces,
      coa_url: coaUrl,
      received_qty: receivedQty,
      unit_price: unitPrice,
      receiver,
      receive_date: receiveDate
    });
    setIsModalOpen(false);
  };

  // Open Inspection Modal for a specific GRN
  const handleOpenQcInspection = (g: Grn) => {
    const existingQc = qcInspections.find(q => q.grn_no === g.code);
    const mat = rawMaterials.find(r => r.id === g.raw_material_id);
    
    const qcData: QcInspection = existingQc || {
      id: Date.now(),
      grn_no: g.code,
      material_id: g.raw_material_id,
      material_code: g.material_code || mat?.code || "RM-CHEM",
      material_name: g.material_name || mat?.name || "สารเคมีรับเข้า",
      lot_id: Date.now(),
      lot_code: `LOT-${g.code}-${g.lot_number || g.supplier_lot_no}`,
      supplier_lot_no: g.lot_number || g.supplier_lot_no || "-",
      supplier_name: g.supplier_name || mat?.supplier_name || "IDEVA / De Roma",
      received_qty: g.received_qty,
      purchase_unit: mat?.unit || "KG.",
      expiry_date: g.expiry_date,
      retest_date: g.retest_date || g.receive_date,
      appearance: g.appearance || "ของเหลว ใส ไม่มีตะกอน",
      coa_status: g.coa_url ? "Attached" : "Missing COA",
      qc_status: (g.qc_status as any) || "Pending QC",
      checklist: [
        { id: "1", title: "1. ตรวจสอบชื่อวัตถุดิบ (Material Name)", title_en: "Material Name Verification", result: "PASS", remark: "ตรงตามใบสั่งซื้อ" },
        { id: "2", title: "2. ตรวจสอบรหัสสินค้า (Product Code)", title_en: "Product Code Verification", result: "PASS", remark: "รหัสเคมีดิบถูกต้อง" },
        { id: "3", title: "3. ตรวจสอบ Supplier Lot No.", title_en: "Lot Number Check", result: "PASS", remark: "ตรงตามฉลากผู้ผลิต" },
        { id: "4", title: "4. ตรวจสอบวันหมดอายุ (Expiry Date)", title_en: "Expiry Date Check", result: "PASS", remark: "อายุการใช้งาน > 1 ปี" },
        { id: "5", title: "5. ตรวจสอบลักษณะกายภาพ (Appearance)", title_en: "Appearance Check", result: "PASS", remark: "ใส กลิ่นหอมเฉพาะตัว" },
        { id: "6", title: "6. ตรวจสอบเอกสาร COA (Certificate of Analysis)", title_en: "COA Document Check", result: g.coa_url ? "PASS" : "N/A", remark: g.coa_url ? "มี COA แนบ" : "รอเอกสาร" }
      ],
      inspector: "สุรัสวดี",
      inspection_date: new Date().toISOString().slice(0, 10),
      approver: "ณ",
      approval_date: new Date().toISOString().slice(0, 10),
      remarks: "ผ่านการตรวจสอบคุณภาพตามเกณฑ์มาตรฐานโรงงานน้ำหอม (FM-QC-17 REV:01)",
      label_pieces: 1
    };

    setActiveQcModal(qcData);
    setQcInspector(qcData.inspector || "สุรัสวดี");
    setQcApprover(qcData.approver || "ณ");
    setQcAppearance(qcData.appearance || "ของเหลว ใส ไม่มีตะกอน");
    setQcStatusInput(qcData.qc_status === "Pending QC" ? "QC Passed" : (qcData.qc_status as any));
    setQcCoaStatus(qcData.coa_status || (g.coa_url ? "Attached" : "Missing COA"));
    setQcRemarks(qcData.remarks || "ผ่านการตรวจสอบคุณภาพตามเกณฑ์มาตรฐานโรงงาน");
  };

  const handleSaveQcModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQcModal) return;

    const isPassed = qcStatusInput === "QC Passed";
    const updatedQc: QcInspection = {
      ...activeQcModal,
      qc_status: qcStatusInput,
      appearance: qcAppearance,
      coa_status: qcCoaStatus,
      inspector: qcInspector,
      approver: qcApprover,
      inspection_date: new Date().toISOString().slice(0, 10),
      approval_date: new Date().toISOString().slice(0, 10),
      remarks: qcRemarks
    };

    if (onSaveQcInspection) {
      await onSaveQcInspection(updatedQc);
    }

    if (onUpdateLotStatus && activeQcModal.lot_id) {
      await onUpdateLotStatus(
        activeQcModal.lot_id, 
        qcStatusInput, 
        isPassed ? "Available" : "Quarantine"
      );
    }

    if (onLogAudit) {
      await onLogAudit({
        user: qcInspector,
        timestamp: new Date().toISOString(),
        action: isPassed ? "QC_APPROVED" : "QC_REJECTED",
        module: "IncomingQC",
        material_code: activeQcModal.material_code,
        lot_number: activeQcModal.supplier_lot_no,
        new_value: qcStatusInput,
        reason: qcRemarks,
        ref_doc: activeQcModal.grn_no
      });
    }

    setActiveQcModal(null);
  };

  // Filtered GRNs
  const filteredGrns = grns.filter((g) => {
    const q = searchTerm.toLowerCase();
    const mat = rawMaterials.find(r => r.id === g.raw_material_id);
    const matchesSearch =
      (g.code || "").toLowerCase().includes(q) ||
      (g.lot_number || g.supplier_lot_no || "").toLowerCase().includes(q) ||
      (mat?.name || "").toLowerCase().includes(q) ||
      (mat?.code || "").toLowerCase().includes(q) ||
      (g.supplier_name || "").toLowerCase().includes(q);

    const inspection = qcInspections.find(qi => qi.grn_no === g.code);
    const currentQcStatus = inspection ? inspection.qc_status : (g.qc_status || "Pending QC");

    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "qc_passed" && currentQcStatus === "QC Passed") ||
      (filterStatus === "pending_qc" && (currentQcStatus === "Pending QC" || currentQcStatus === "Under Inspection")) ||
      (filterStatus === "quarantine" && (currentQcStatus === "Quarantine" || currentQcStatus === "QC Failed")) ||
      (filterStatus === "has_coa" && (g.coa_url || inspection?.coa_status === "Attached")) ||
      (filterStatus === "missing_coa" && (!g.coa_url && inspection?.coa_status !== "Attached"));

    return matchesSearch && matchesStatus;
  });

  // Calculate Counters
  const countPendingQc = grns.filter(g => {
    const i = qcInspections.find(qi => qi.grn_no === g.code);
    const s = i ? i.qc_status : g.qc_status;
    return s === "Pending QC" || s === "Under Inspection";
  }).length;

  const countPassedQc = grns.filter(g => {
    const i = qcInspections.find(qi => qi.grn_no === g.code);
    const s = i ? i.qc_status : g.qc_status;
    return s === "QC Passed";
  }).length;

  const countHasCoa = grns.filter(g => {
    const i = qcInspections.find(qi => qi.grn_no === g.code);
    return g.coa_url || i?.coa_status === "Attached";
  }).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Banner Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/20 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/20 w-fit px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-2">
            <Truck className="w-3.5 h-3.5" /> GOODS RECEIVE NOTE (GRN) & QUALITY CONTROL
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight">
            การรับเข้าเคมีภัณฑ์ ตรวจคุณภาพ (QC) และพิมพ์ป้ายชี้บ่งสีเขียว
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl font-sans">
            บันทึกรับวัตถุดิบเข้าคลัง, ตรวจเช็คคุณภาพสุ่มตัวอย่าง, จัดเก็บเอกสาร COA, ปริ้นท์ป้ายชี้บ่งผ่าน QC (FM-QC-17 REV:01) และสแกนบาร์โค้ดนับสต็อก
          </p>
        </div>

        {/* Counter KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-center">
            <span className="block text-lg font-mono font-black">{countPendingQc}</span>
            <span className="text-[10px]">รอตรวจ QC</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold text-center">
            <span className="block text-lg font-mono font-black">{countPassedQc}</span>
            <span className="text-[10px]">ผ่าน QC แล้ว</span>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold text-center">
            <span className="block text-lg font-mono font-black">{countHasCoa}</span>
            <span className="text-[10px]">มีเอกสาร COA</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "pending_qc", label: "🟡 รอตรวจ QC" },
            { id: "qc_passed", label: "🟢 ผ่าน QC (Passed)" },
            { id: "quarantine", label: "🛑 กักกัน/ไม่ผ่าน" },
            { id: "has_coa", label: "📄 มี COA" },
            { id: "missing_coa", label: "⚠️ รอเอกสาร COA" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                filterStatus === item.id
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Buttons & Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา GRN, รหัสเคมี, Lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setIsStockCountOpen(true)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
            title="สแกนบาร์โค้ดตรวจนับสต็อกวัตถุดิบเคมี"
          >
            <BarcodeIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>ยิงบาร์โค้ดนับสต็อก</span>
          </button>

          <button
            onClick={openFormModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>บันทึกใบรับเข้า (GRN)</span>
          </button>
        </div>
      </div>

      {/* Main GRN Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                <th className="p-3">เลขที่ GRN / ล็อต</th>
                <th className="p-3">รหัสสาร / ชื่อเคมีวัตถุดิบ</th>
                <th className="p-3">ผู้ผลิต / ผู้จำหน่าย</th>
                <th className="p-3 text-right">จำนวนรับเข้า</th>
                <th className="p-3 text-center">วันที่รับ / หมดอายุ</th>
                <th className="p-3 text-center">เอกสาร COA</th>
                <th className="p-3 text-center">สถานะตรวจ QC</th>
                <th className="p-3 text-center w-52">การดำเนินการ (QC & Label)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredGrns.map((g) => {
                const mat = rawMaterials.find(rm => rm.id === g.raw_material_id);
                const po = purchaseOrders.find(p => p.id === g.purchase_order_id);
                const displayPo = po ? po.code : (g.po_number || "-");
                const inspection = qcInspections.find(qi => qi.grn_no === g.code);
                const lot = lots.find(l => l.grn_no === g.code);
                const qcStatus = inspection ? inspection.qc_status : (g.qc_status || "Pending QC");
                const hasCoa = g.coa_url || inspection?.coa_status === "Attached";
                const isPassed = qcStatus === "QC Passed";
                const isPending = qcStatus === "Pending QC" || qcStatus === "Under Inspection";

                return (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-emerald-700">{g.code}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Lot: {g.lot_number || g.supplier_lot_no || "-"}</div>
                      {displayPo !== "-" && (
                        <div className="text-[9px] text-slate-400 font-mono">PO: {displayPo}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                        {mat?.code || g.material_code || "RM-CHEM"}
                      </span>
                      <strong className="text-slate-900 font-bold block mt-0.5">
                        {mat ? mat.name : (g.material_name || "วัตถุดิบเคมีทั่วไป")}
                      </strong>
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">
                      <div>{g.supplier_name || mat?.supplier_name || mat?.supplier || "IDEVA / De Roma"}</div>
                      <div className="text-[10px] text-slate-400">{g.appearance || "ของเหลว"}</div>
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="font-black text-slate-800 text-sm">
                        {g.received_qty.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1 font-bold">
                        {mat ? (mat.unit || "KG.") : "KG."}
                      </span>
                      {g.unit_price > 0 && (
                        <div className="text-[10px] text-slate-400">
                          ฿{g.unit_price.toLocaleString()}/KG
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <div className="text-slate-700 font-bold text-[11px]">{g.receive_date || "-"}</div>
                      <div className="text-slate-400 text-[10px]">Exp: {g.expiry_date || "-"}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveCoaModalTarget({ grn: g, lot, inspection })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          hasCoa
                            ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                        title="คลิกเพื่อแนบหรือดูเอกสาร COA"
                      >
                        <FileText className="w-3 h-3" />
                        {hasCoa ? "ดู COA แนบแล้ว" : "+ แนบ COA"}
                      </button>
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
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        {qcStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. ปุ่ม ตรวจรับเช็คคุณภาพ */}
                        <button
                          type="button"
                          onClick={() => handleOpenQcInspection(g)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="กดตรวจรับเช็คคุณภาพวัตถุดิบ"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> ตรวจ QC
                        </button>

                        {/* 2. ปุ่ม พิมพ์ป้ายผ่าน QC สีเขียว FM-QC-17 REV:01 */}
                        <button
                          type="button"
                          onClick={() => setActivePrintLabelTarget({ inspection, lot, grn: g })}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="พิมพ์ป้ายชี้บ่งสีเขียว FM-QC-17 REV:01 พร้อมบาร์โค้ดนับสต็อก"
                        >
                          <Printer className="w-3.5 h-3.5" /> ป้ายผ่าน QC
                        </button>

                        {/* Delete GRN Button */}
                        {onDeleteGrn && (
                          <button
                            onClick={() => setDeleteTarget({ id: g.id, name: `ใบรับเข้า ${g.code}` })}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบใบรับเข้า GRN"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGrns.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic bg-slate-50">
                    ไม่พบข้อมูลการรับเข้าวัตถุดิบเคมีภัณฑ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* บันทึกรับเข้า (GRN) Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-900 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                บันทึกใบรับเข้าคลังเคมีภัณฑ์ (Goods Receive Note)
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">เลขที่ใบรับเข้า (GRN)</label>
                  <input
                    type="text"
                    value={code}
                    disabled
                    className="w-full px-3 py-1.5 border border-slate-300 bg-slate-100 text-slate-500 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">วันที่นำเข้า (Receive Date)</label>
                  <input
                    type="date"
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">อ้างอิงใบสั่งซื้อ PO</label>
                  <select
                    value={purchaseOrderId}
                    onChange={(e) => handlePurchaseOrderChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">-- เลือกใบจัดซื้อ PO (ถ้ามี) --</option>
                    {purchaseOrders.map(po => (
                      <option key={po.id} value={po.id}>{po.code} ({po.supplier})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">เลขที่ PO (ถ้าไม่ได้เลือก)</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="เช่น PO-2026-088"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  เลือกวัตถุดิบเคมีที่รับเข้า <span className="text-red-500">*</span>
                </label>
                <select
                  value={materialId}
                  onChange={(e) => handleMaterialChange(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="">-- เลือกรายการเคมีภัณฑ์ --</option>
                  {rawMaterials.map(rm => {
                    const supNames = getResolvedMaterialSuppliers(rm, materialSuppliers, suppliers).map(s => s.name).join(", ");
                    return (
                      <option key={rm.id} value={rm.id}>{rm.code} - {rm.name} ({supNames || 'ทั่วไป'})</option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ผู้ผลิต / ผู้จำหน่าย (Supplier)</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="เช่น IDEVA / De Roma"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                  {(() => {
                    const selectedRm = rawMaterials.find(rm => rm.id === Number(materialId));
                    const linked = selectedRm ? getResolvedMaterialSuppliers(selectedRm, materialSuppliers, suppliers) : [];
                    if (linked.length === 0) return null;
                    return (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {linked.map((s, idx) => (
                          <button
                            key={`${s.code}_${idx}`}
                            type="button"
                            onClick={() => {
                              setSupplierName(s.name);
                              if (s.latest_price && s.latest_price > 0) {
                                setUnitPrice(s.latest_price);
                              } else if (selectedRm?.unit_price) {
                                setUnitPrice(selectedRm.unit_price);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-colors inline-flex items-center gap-1 ${
                              normalizeSupplierName(supplierName) === normalizeSupplierName(s.name)
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50"
                            }`}
                          >
                            {s.is_main && <span>★ หลัก</span>}
                            <span>{s.code ? `${s.code} · ` : ""}{s.name}</span>
                            {s.latest_price && s.latest_price > 0 ? (
                              <span className={`font-mono ${normalizeSupplierName(supplierName) === normalizeSupplierName(s.name) ? "text-emerald-100" : "text-emerald-700"}`}>
                                (฿{s.latest_price.toLocaleString()})
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ลักษณะสินค้า (Appearance)</label>
                  <input
                    type="text"
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                    placeholder="เช่น ของเหลว ใส ไม่มีตะกอน"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">จำนวนรับจริง (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ราคาต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">จำนวนชิ้น/ถัง (Pieces)</label>
                  <input
                    type="number"
                    min="1"
                    value={labelPieces}
                    onChange={(e) => setLabelPieces(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Supplier Lot No. *</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    required
                    placeholder="เช่น L240601-01"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">วันหมดอายุ *</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">วันที่ทดสอบซ้ำ</label>
                  <input
                    type="date"
                    value={retestDate}
                    onChange={(e) => setRetestDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ผู้เซ็นต์รับของเข้า</label>
                  <input
                    type="text"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ลิงก์เอกสาร COA (ถ้ามี)</label>
                  <input
                    type="text"
                    value={coaUrl}
                    onChange={(e) => setCoaUrl(e.target.value)}
                    placeholder="https://... หรือแนบภายหลัง"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" /> บันทึกรับเข้าคลัง & สร้างล็อต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC INSPECTION MODAL */}
      {activeQcModal && (
        <div className="fixed inset-0 bg-black/60 z-[9990] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    บันทึกผลการตรวจสอบคุณภาพ (QC Inspection)
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    GRN: {activeQcModal.grn_no} | {activeQcModal.material_code} - {activeQcModal.material_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveQcModal(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQcModalSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">รหัสเคมีดิบ</span>
                  <span className="font-mono font-bold text-emerald-700">{activeQcModal.material_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">จำนวนรับเข้า</span>
                  <span className="font-mono font-bold text-slate-800">{activeQcModal.received_qty} {activeQcModal.purchase_unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Supplier Lot No</span>
                  <span className="font-mono font-bold text-slate-800">{activeQcModal.supplier_lot_no}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">วันหมดอายุ</span>
                  <span className="font-mono font-bold text-slate-800">{activeQcModal.expiry_date}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ผลการตัดสินใจ QC Status *</label>
                  <select
                    value={qcStatusInput}
                    onChange={(e) => setQcStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="QC Passed">🟢 อนุมัติผ่านการตรวจ (QC Passed)</option>
                    <option value="Under Inspection">🔵 อยู่ระหว่างตรวจสอบ</option>
                    <option value="QC Failed">🔴 ไม่ผ่านการตรวจ (QC Failed)</option>
                    <option value="Quarantine">🛑 กักกันวัตถุดิบ (Quarantine)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ผู้ตรวจสอบ (Inspector) *</label>
                  <input
                    type="text"
                    required
                    value={qcInspector}
                    onChange={(e) => setQcInspector(e.target.value)}
                    className="w-full px-3 py-2 font-bold rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ผู้อนุมัติ (Approver) *</label>
                  <input
                    type="text"
                    required
                    value={qcApprover}
                    onChange={(e) => setQcApprover(e.target.value)}
                    className="w-full px-3 py-2 font-bold rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ลักษณะทางกายภาพ (Appearance)</label>
                  <input
                    type="text"
                    value={qcAppearance}
                    onChange={(e) => setQcAppearance(e.target.value)}
                    placeholder="ของเหลวใส ไม่มีตะกอน กลิ่นหอมวานิลลา"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะ Certificate of Analysis (COA)</label>
                  <select
                    value={qcCoaStatus}
                    onChange={(e) => setQcCoaStatus(e.target.value as any)}
                    className="w-full px-3 py-2 font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Attached">✓ แนบเอกสาร COA ครบถ้วน</option>
                    <option value="Missing COA">⚠️ ขาดเอกสาร COA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุบันทึกผลการตรวจสอบ</label>
                <textarea
                  rows={2}
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveQcModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> บันทึกผลการตรวจ QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COA DOCUMENT MODAL */}
      {activeCoaModalTarget && (
        <CoaDocumentModal
          grn={activeCoaModalTarget.grn}
          lot={activeCoaModalTarget.lot}
          inspection={activeCoaModalTarget.inspection}
          onClose={() => setActiveCoaModalTarget(null)}
          onSaveCoa={async (payload) => {
            if (onSaveCoa) {
              await onSaveCoa(payload);
            }
          }}
        />
      )}

      {/* QC PASS LABEL PRINT MODAL (FM-QC-17 REV:01) */}
      {activePrintLabelTarget && (
        <QcPassLabelModal
          inspection={activePrintLabelTarget.inspection}
          lot={activePrintLabelTarget.lot}
          grn={activePrintLabelTarget.grn}
          onClose={() => setActivePrintLabelTarget(null)}
        />
      )}

      {/* STOCK COUNT SCANNER MODAL */}
      {isStockCountOpen && (
        <StockCountModal
          rawMaterials={rawMaterials}
          lots={lots}
          grns={grns}
          auditLogs={auditLogs}
          onClose={() => setIsStockCountOpen(false)}
          onSaveStockCount={async (params) => {
            if (onSaveStockCount) {
              await onSaveStockCount(params);
            }
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="ยืนยันการลบใบรับเข้าเคมีภัณฑ์ (GRN)"
        itemName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget && onDeleteGrn) {
            await onDeleteGrn(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}


// ============================================================================
// REPORTS PAGE
// ============================================================================
interface ReportPageProps {
  productionOrders: ProductionOrder[];
  purchaseOrders: PurchaseOrder[];
  rawMaterials: RawMaterial[];
  products: Product[];
  customers: Customer[];
  grns: Grn[];
  packingOrders: PackingOrder[];
  prechecks: Precheck[];
}

export function ReportPage({
  productionOrders = [],
  purchaseOrders = [],
  rawMaterials = [],
  products = [],
  customers = [],
  grns = [],
  packingOrders = [],
  prechecks = []
}: ReportPageProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "production" | "purchase">("overview");
  const [dateRange, setDateRange] = useState<"all" | "this_month" | "last_30">("all");

  // Helper to check if record falls within date range
  const filterByDateRange = (dateStr: string | undefined) => {
    if (!dateStr) return true;
    if (dateRange === "all") return true;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    if (dateRange === "this_month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (dateRange === "last_30") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return d >= thirtyDaysAgo;
    }
    return true;
  };

  // Filtered datasets
  const filteredProdOrders = productionOrders.filter(o => filterByDateRange(o.date || o.created_at));
  const filteredPurchOrders = purchaseOrders.filter(o => filterByDateRange(o.order_date));
  const filteredGrns = grns.filter(o => filterByDateRange(o.receive_date));
  const filteredPrechecks = prechecks.filter(o => filterByDateRange(o.date));

  // --- Calculations for Overview Report ---
  const totalProductionCount = filteredProdOrders.length;
  const totalProductionQty = filteredProdOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const totalPurchaseSpending = filteredPurchOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  
  // QC Precheck pass rate
  const passedPrechecksCount = filteredPrechecks.filter(p => p.result === "pass").length;
  const qcPassRate = filteredPrechecks.length > 0 
    ? Math.round((passedPrechecksCount / filteredPrechecks.length) * 100) 
    : 100;

  // Stock status count
  const lowStockCount = rawMaterials.filter(m => m.stock_qty <= m.min_stock).length;

  // --- Production Report aggregation ---
  const prodStatusCount = filteredProdOrders.reduce((acc, o) => {
    const status = o.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Production Volume by Product
  const prodByProduct = filteredProdOrders.reduce((acc, o) => {
    const name = o.product_name || o.product_code || "ไม่ระบุสินค้า";
    acc[name] = (acc[name] || 0) + (Number(o.quantity) || 0);
    return acc;
  }, {} as Record<string, number>);

  const prodByProductList = Object.entries(prodByProduct)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  const maxProdQty = prodByProductList.length > 0 ? Math.max(...prodByProductList.map(item => item.qty)) : 1;

  // Production Volume by Customer
  const prodByCustomer = filteredProdOrders.reduce((acc, o) => {
    const name = o.customer_name || "ทั่วไป / ไม่มีแบรนด์";
    acc[name] = (acc[name] || 0) + (Number(o.quantity) || 0);
    return acc;
  }, {} as Record<string, number>);

  const prodByCustomerList = Object.entries(prodByCustomer)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5); // top 5 customers

  // --- Purchase Report aggregation ---
  const purchStatusCount = filteredPurchOrders.reduce((acc, o) => {
    const status = o.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Spending by Supplier
  const spendingBySupplier = filteredPurchOrders.reduce((acc, o) => {
    const supplier = o.supplier || "ไม่ระบุผู้จำหน่าย";
    acc[supplier] = (acc[supplier] || 0) + (Number(o.total_amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  const supplierSpendingList = Object.entries(spendingBySupplier)
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val);

  const maxSupplierSpending = supplierSpendingList.length > 0 ? Math.max(...supplierSpendingList.map(item => item.val)) : 1;

  // Top purchased raw materials
  const purchasedMaterials = filteredPurchOrders.reduce((acc, o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach(item => {
        const name = item.item_name || "ไม่ทราบชื่อวัตถุดิบ";
        acc[name] = (acc[name] || 0) + (Number(item.subtotal) || (Number(item.quantity) * Number(item.unit_price)) || 0);
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const purchasedMaterialsList = Object.entries(purchasedMaterials)
    .map(([name, cost]) => ({ name, cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // CSV Exporters
  const exportProductionCSV = () => {
    const headers = [
      "รหัสใบสั่งผลิต",
      "ลูกค้า/แบรนด์",
      "ผลิตภัณฑ์",
      "จำนวนผลิต",
      "หน่วยนับ",
      "สถานะ",
      "วันที่สั่งผลิต",
      "กำหนดเสร็จ"
    ];
    const data = filteredProdOrders.map(o => [
      o.code,
      o.customer_name || "-",
      o.product_name || o.product_code || "-",
      o.quantity,
      o.unit || "ชิ้น",
      o.status === "completed" ? "เสร็จสมบูรณ์" : o.status === "in_progress" ? "กำลังผลิต" : "รอดำเนินการ",
      o.date || "-",
      o.due_date || "-"
    ]);
    exportToCSV(data, headers, `รายงานคำสั่งผลิต_กรอง_${dateRange}`);
  };

  const exportPurchaseCSV = () => {
    const headers = [
      "รหัสใบสั่งซื้อ",
      "ผู้จัดจำหน่าย (Supplier)",
      "มูลค่าจัดซื้อ (บาท)",
      "สถานะ",
      "วันที่จัดซื้อ"
    ];
    const data = filteredPurchOrders.map(o => [
      o.code,
      o.supplier,
      o.total_amount,
      o.status === "received" ? "รับของแล้ว" : o.status === "completed" ? "เสร็จสิ้น" : "รอรับของ/ค้างส่ง",
      o.order_date || "-"
    ]);
    exportToCSV(data, headers, `รายงานการจัดซื้อวัตถุดิบ_กรอง_${dateRange}`);
  };

  const exportStockCSV = () => {
    const headers = [
      "รหัสวัตถุดิบ",
      "ชื่อวัตถุดิบเคมีภัณฑ์",
      "ปริมาณคงเหลือ",
      "ระดับปลอดภัยขั้นต่ำ",
      "หน่วยนับ",
      "สถานะสต็อก"
    ];
    const data = rawMaterials.map(m => [
      m.code,
      m.name,
      m.stock_qty,
      m.min_stock,
      m.unit,
      m.stock_qty <= m.min_stock ? "ต่ำกว่าเกณฑ์ขั้นต่ำ (วิกฤต)" : "ปกติ"
    ]);
    exportToCSV(data, headers, `รายงานสถานะสต็อกวัตถุดิบ`);
  };

  const exportToCSV = (data: any[], headers: string[], fileName: string) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...data.map(row => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Date Selector */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight font-sans">📊 ระบบรายงานและสถิติวิเคราะห์</h2>
          <p className="text-xs text-slate-500 mt-0.5">วิเคราะห์สถิติสรุปยอดการประกอบการผลิตและรายงานการจัดซื้อวัตถุดิบเรียลไทม์</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Tabs */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDateRange("all")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${dateRange === "all" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setDateRange("this_month")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${dateRange === "this_month" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setDateRange("last_30")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${dateRange === "last_30" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
            >
              30 วันที่ผ่านมา
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all print:hidden"
            title="พิมพ์รายงาน"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Selection */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl border-t border-x border-slate-200 shadow-sm print:hidden">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Layers className="w-4 h-4" /> รายงานสรุปภาพรวม
        </button>
        <button
          onClick={() => setActiveTab("production")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === "production" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <FileText className="w-4 h-4" /> รายงานการผลิต (Production)
        </button>
        <button
          onClick={() => setActiveTab("purchase")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === "purchase" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <ShoppingCart className="w-4 h-4" /> รายงานการซื้อ (Purchasing)
        </button>
      </div>

      {/* OVERVIEW REPORT TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ใบสั่งผลิตรวม</span>
                <span className="text-xl font-extrabold text-slate-800 font-mono block mt-0.5">{totalProductionCount.toLocaleString()} ใบ</span>
                <span className="text-[10px] text-slate-500 block">ปริมาณ: {totalProductionQty.toLocaleString()} กก.</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">งบประมาณจัดซื้อวัตถุดิบ</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono block mt-0.5">฿{totalPurchaseSpending.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">จากคำสั่งซื้อ {filteredPurchOrders.length} รายการ</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">อัตราตรวจวิเคราะห์ผ่าน (QC)</span>
                <span className="text-xl font-extrabold text-indigo-600 font-mono block mt-0.5">{qcPassRate}%</span>
                <span className="text-[10px] text-slate-500 block">วิเคราะห์ {filteredPrechecks.length} รายการเคมี</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-xl ${lowStockCount > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-50 text-slate-50"}`}>
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">สารเคมีสต็อกต่ำกว่าเกณฑ์</span>
                <span className={`text-xl font-extrabold block mt-0.5 font-mono ${lowStockCount > 0 ? "text-red-600 font-bold" : "text-slate-800"}`}>
                  {lowStockCount} สาร
                </span>
                <span className="text-[10px] text-slate-500 block">จากสารเคมีทั้งหมด {rawMaterials.length} ชนิด</span>
              </div>
            </div>
          </div>

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Orders Status Distribution Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" /> สัดส่วนสถานะใบสั่งประกอบการผลิต
                </h3>
                <span className="text-[10px] font-bold text-slate-400">ข้อมูลที่กรอง</span>
              </div>
              
              <div className="space-y-3.5 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>เสร็จสมบูรณ์ (Completed)</span>
                    <span className="font-mono font-bold text-emerald-600">{(prodStatusCount.completed || 0)} / {totalProductionCount} ใบ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalProductionCount > 0 ? ((prodStatusCount.completed || 0) / totalProductionCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>กำลังประกอบการผลิต (In Progress)</span>
                    <span className="font-mono font-bold text-blue-600">{(prodStatusCount.in_progress || 0)} / {totalProductionCount} ใบ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalProductionCount > 0 ? ((prodStatusCount.in_progress || 0) / totalProductionCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>รอดำเนินการ (Pending)</span>
                    <span className="font-mono font-bold text-amber-600">{(prodStatusCount.pending || 0)} / {totalProductionCount} ใบ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalProductionCount > 0 ? ((prodStatusCount.pending || 0) / totalProductionCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Purchasing Distribution By Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" /> สถานะใบสั่งจัดซื้อเคมีภัณฑ์
                </h3>
                <span className="text-[10px] font-bold text-slate-400">ข้อมูลที่กรอง</span>
              </div>

              <div className="space-y-3.5 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>รับสินค้าเข้าคลังสำเร็จแล้ว (Received / Completed)</span>
                    <span className="font-mono font-bold text-emerald-600">{(purchStatusCount.received || purchStatusCount.completed || 0)} / {filteredPurchOrders.length} ใบ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${filteredPurchOrders.length > 0 ? (((purchStatusCount.received || 0) + (purchStatusCount.completed || 0)) / filteredPurchOrders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>รอดำเนินการ / ค้างส่ง (Pending)</span>
                    <span className="font-mono font-bold text-amber-600">{(purchStatusCount.pending || purchStatusCount.issued || 0)} / {filteredPurchOrders.length} ใบ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${filteredPurchOrders.length > 0 ? (((purchStatusCount.pending || 0) + (purchStatusCount.issued || 0)) / filteredPurchOrders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>การคัดกรองใบรับสินค้าเข้าคลัง (GRN) ช่วยยันยอดรับวัตถุดิบเคมีภัณฑ์เข้าสู่สต็อกจริงอย่างปลอดภัย</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Stock Export Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">ส่งออกข้อมูลคลังจัดเก็บและแจ้งเตือนวิกฤต</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">ดาวน์โหลดข้อมูลสต็อกวัตถุดิบและเคมีภัณฑ์ทั้งหมด เพื่อนำส่งที่ประชุมวางแผนฝ่ายจัดซื้อ</p>
              </div>
            </div>
            
            <button
              onClick={exportStockCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all print:hidden"
            >
              <Download className="w-4 h-4" /> ส่งออกรายงานสต็อก (CSV)
            </button>
          </div>
        </div>
      )}

      {/* PRODUCTION REPORT TAB */}
      {activeTab === "production" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Production volume by Product */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> ยอดการผลิตแยกตามแบรนด์ผลิตภัณฑ์สำเร็จรูป
                  </h3>
                  <p className="text-[10px] text-slate-400">สรุปตามน้ำหนักสุทธิผลิตรวมสำเร็จสะสม</p>
                </div>
                <button
                  onClick={exportProductionCSV}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> ส่งออกคำสั่งผลิต (CSV)
                </button>
              </div>

              {prodByProductList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ยังไม่มีสถิติยอดคำสั่งผลิตในช่วงเวลานี้
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {prodByProductList.map((item, idx) => {
                    const percentage = Math.round((item.qty / maxProdQty) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="truncate max-w-[80%]">{item.name}</span>
                          <span className="font-mono font-bold text-slate-900">{item.qty.toLocaleString()} กก.</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-8 text-right">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Production volume by Customer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-700" /> สัดส่วนสถิติผลิตแยกตามกลุ่มลูกค้า 5 ลำดับแรก
              </h3>
              
              <div className="divide-y divide-slate-100 pt-1">
                {prodByCustomerList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ไม่มีสถิติกำไรกลุ่มลูกค้าในขณะนี้
                  </div>
                ) : (
                  prodByCustomerList.map((cust, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border text-slate-600 font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">{cust.name}</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900">{cust.qty.toLocaleString()} กก.</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Table List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800">รายการใบสั่งผลิตและข้อมูลคำสั่งกรอง</h3>
              <span className="text-[10px] bg-slate-100 border text-slate-500 px-2 py-0.5 rounded-full font-bold">
                จำนวนที่พบ {filteredProdOrders.length} ใบสั่งผลิต
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                    <th className="p-3">รหัสใบสั่ง</th>
                    <th className="p-3">ลูกค้า / แบรนด์</th>
                    <th className="p-3">ผลิตภัณฑ์</th>
                    <th className="p-3 text-right">จำนวนที่ผลิต</th>
                    <th className="p-3 text-center">หน่วย</th>
                    <th className="p-3 text-center">วันที่ผลิต</th>
                    <th className="p-3 text-center">กำหนดส่ง</th>
                    <th className="p-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProdOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{o.code}</td>
                      <td className="p-3 font-semibold text-slate-800">{o.customer_name || "ทั่วไป"}</td>
                      <td className="p-3 text-slate-700">{o.product_name || o.product_code || "-"}</td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">{o.quantity.toLocaleString()}</td>
                      <td className="p-3 text-center text-slate-400">{o.unit}</td>
                      <td className="p-3 text-center text-slate-500">{o.date || "-"}</td>
                      <td className="p-3 text-center text-slate-500">{o.due_date || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          o.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : o.status === "in_progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {o.status === "completed" ? "สำเร็จ" : o.status === "in_progress" ? "กำลังผลิต" : "รอดำเนินการ"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredProdOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        ไม่พบข้อมูลใบสั่งผลิตตามกำหนดเวลาที่กรองในคลังระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE REPORT TAB */}
      {activeTab === "purchase" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Purchase volume by supplier */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-emerald-600" /> ยอดจัดซื้อสะสมแบ่งตามซัพพลายเออร์หลัก
                  </h3>
                  <p className="text-[10px] text-slate-400">สรุปตามยอดมูลค่าสั่งรวม (สกุลเงินบาท)</p>
                </div>
                <button
                  onClick={exportPurchaseCSV}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> ส่งออกจัดซื้อ (CSV)
                </button>
              </div>

              {supplierSpendingList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ยังไม่มีประวัติจัดจัดซื้อวัตถุดิบในช่วงเวลาดังกล่าว
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {supplierSpendingList.map((item, idx) => {
                    const percentage = Math.round((item.val / maxSupplierSpending) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="truncate max-w-[80%]">{item.name}</span>
                          <span className="font-mono font-bold text-emerald-600">฿{item.val.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-8 text-right">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top purchased raw material chemical item breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-indigo-600" /> สัดส่วนงบจัดซื้อแยกตามเคมีภัณฑ์หลัก (Top 5)
              </h3>

              <div className="divide-y divide-slate-100 pt-1">
                {purchasedMaterialsList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ไม่มีสถิติคำสั่งจัดซื้อวัตถุดิบในช่วงเวลานี้
                  </div>
                ) : (
                  purchasedMaterialsList.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-50 border text-slate-500 font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-800">฿{item.cost.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Table List for Purchase */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800">รายงานข้อมูลใบสั่งจัดจัดซื้อวัตถุดิบละเอียด</h3>
              <span className="text-[10px] bg-slate-100 border text-slate-500 px-2 py-0.5 rounded-full font-bold">
                จำนวนจัดซื้อ {filteredPurchOrders.length} รายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                    <th className="p-3">รหัสใบสั่งซื้อ</th>
                    <th className="p-3">ผู้จัดจำหน่าย (Supplier)</th>
                    <th className="p-3 text-center">วันที่ออกใบ</th>
                    <th className="p-3 text-right">จำนวนวัตถุดิบ (ชนิด)</th>
                    <th className="p-3 text-right">ยอดรวมมูลค่า (บาท)</th>
                    <th className="p-3 text-center">สถานะจัดส่ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{o.code}</td>
                      <td className="p-3 font-semibold text-slate-800">{o.supplier}</td>
                      <td className="p-3 text-center text-slate-500">{o.order_date || "-"}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{Array.isArray(o.items) ? o.items.length : 0} รายการ</td>
                      <td className="p-3 text-right font-bold font-mono text-emerald-600">฿{Number(o.total_amount).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          o.status === "received" || o.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {o.status === "received" || o.status === "completed" ? "รับเข้าแล้ว" : "รอดำเนินการ"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPurchOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        ไม่พบรายการข้อมูลใบจัดซื้อตามกำหนดเวลาคัดกรองนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
