import React, { useState } from "react";
import { Search, Plus, Edit2, Trash2, History, X, Save, Building, Phone, MapPin } from "lucide-react";
import { Customer, ProductionOrder, BomRecipe } from "../types";

interface CustomersProps {
  customers: Customer[];
  onSaveCustomer: (customer: any) => Promise<void>;
  onDeleteCustomer: (id: number) => Promise<void>;
  productionOrders: ProductionOrder[];
  bomRecipes: BomRecipe[];
}

export default function Customers({ 
  customers, 
  onSaveCustomer, 
  onDeleteCustomer,
  productionOrders,
  bomRecipes
}: CustomersProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("active");

  const filtered = customers.filter(c => {
    if (!c) return false;
    const nameStr = (c.name || "").toLowerCase();
    const codeStr = (c.code || "").toLowerCase();
    const contactStr = (c.contact || "").toLowerCase();
    const addressStr = (c.address || "").toLowerCase();
    const searchStr = (search || "").toLowerCase();

    return (
      nameStr.includes(searchStr) ||
      codeStr.includes(searchStr) ||
      contactStr.includes(searchStr) ||
      addressStr.includes(searchStr)
    );
  });

  const openFormModal = (customer: Customer | null = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setCode(customer.code);
      setName(customer.name);
      setContact(customer.contact || "");
      setAddress(customer.address || "");
      setStatus(customer.status || "active");
    } else {
      setEditingCustomer(null);
      // Auto generate draft code
      const nextNum = customers.length + 1;
      setCode(`C69-${String(nextNum).padStart(3, "0")}`);
      setName("");
      setContact("");
      setAddress("");
      setStatus("active");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    await onSaveCustomer({
      id: editingCustomer ? editingCustomer.id : 0,
      code,
      name,
      contact,
      address,
      status
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id: number, customerName: string) => {
    setDeleteTarget({ id, name: customerName });
  };

  const openHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setIsHistoryOpen(true);
  };

  // Filter production orders for history
  const historyOrders = selectedCustomerForHistory 
    ? productionOrders.filter(po => po.customer_id === selectedCustomerForHistory.id || po.customer_name === selectedCustomerForHistory.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Search and action controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหารหัส, ชื่อลูกค้า, ชื่อแบรนด์ หรือที่อยู่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={() => openFormModal(null)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white border border-slate-250 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-[11px] text-slate-700 tracking-wider">
                <th className="p-2 border border-slate-200 font-normal">วันที่ลงข้อมูล</th>
                <th className="p-2 border border-slate-200 font-normal">รหัสลูกค้า</th>
                <th className="p-2 border border-slate-200 font-normal">ชื่อลูกค้า</th>
                <th className="p-2 border border-slate-200 font-normal">ชื่อแบรนด์</th>
                <th className="p-2 border border-slate-200 font-normal">ที่อยู่จัดส่ง</th>
                <th className="p-2 border border-slate-200 font-normal">สถานะ</th>
                <th className="p-2 border border-slate-200 font-normal text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="odd:bg-white even:bg-[#f2f6fc] hover:bg-blue-50/55 transition-colors">
                  <td className="p-2 border border-slate-200 text-slate-500 font-sans font-normal">
                    {c.created_at ? String(c.created_at).split(/[ T]/)[0] : "-"}
                  </td>
                  <td className="p-2 border border-slate-200 font-normal font-mono text-blue-600">{c.code || "-"}</td>
                  <td className="p-2 border border-slate-200">
                    <div className="font-normal text-slate-800">{c.name || "-"}</div>
                  </td>
                  <td className="p-2 border border-slate-200 text-slate-600 font-normal">
                    {c.contact || "-"}
                  </td>
                  <td className="p-2 border border-slate-200 text-slate-500 max-w-[200px] truncate font-sans font-normal" title={c.address || ""}>
                    {c.address || "-"}
                  </td>
                  <td className="p-2 border border-slate-200">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal ${
                      c.status === "active" || !c.status
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                        : "bg-slate-50 border border-slate-100 text-slate-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        c.status === "active" || !c.status ? "bg-emerald-500" : "bg-slate-400"
                      }`} />
                      {c.status === "active" || !c.status ? "ปกติ" : "ระงับ"}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-200">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openHistory(c)}
                        title="ดูประวัติผลิตของลูกค้า"
                        className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-all"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openFormModal(c)}
                        title="แก้ไขลูกค้า"
                        className="p-1 text-amber-600 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        title="ลบข้อมูลลูกค้า"
                        className="p-1 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 border border-slate-200">
                    ไม่พบข้อมูลลูกค้าที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-4.5 h-4.5 text-blue-600" />
                {editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">รหัสลูกค้า <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="เช่น C69-001"
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ชื่อลูกค้า <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ระบุชื่อจริงหรือชื่อบริษัทนิติบุคคล"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ชื่อแบรนด์</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="เช่น แบรนด์ A"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ที่อยู่จัดส่ง</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="กรอกที่อยู่จัดส่ง บ้านเลขที่ ถนน แขวง เขต จังหวัด..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">สถานะ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">ปกติ</option>
                    <option value="suspended">ระงับ</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50">
                {editingCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: editingCustomer.id, name: editingCustomer.name };
                      setIsModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบลูกค้ารายนี้
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Production History Modal */}
      {isHistoryOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-indigo-600" />
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-slate-800">ประวัติการสั่งผลิตของลูกค้า</h3>
                  <p className="text-[10px] text-slate-500 font-sans">แบรนด์/ลูกค้า: {selectedCustomerForHistory.name} ({selectedCustomerForHistory.code})</p>
                </div>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Customer summary card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-600">ที่อยู่จัดส่ง:</strong>
                    <p className="text-slate-500 mt-0.5 font-sans">{selectedCustomerForHistory.address || "ไม่ได้ระบุที่อยู่"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-600">ข้อมูลติดต่อ:</strong>
                    <p className="text-slate-500 mt-0.5 font-sans">แบรนด์: {selectedCustomerForHistory.contact || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Manufacturing history table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">รายการใบสั่งผลิตสำเร็จรูป</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-2.5">เลขใบสั่ง</th>
                          <th className="p-2.5">วันที่ผลิต</th>
                          <th className="p-2.5">สินค้า</th>
                          <th className="p-2.5">จำนวนสั่งผลิต</th>
                          <th className="p-2.5">สูตรผลิต (BOM) ที่ใช้</th>
                          <th className="p-2.5">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyOrders.map((ho) => {
                          // Look up corresponding BOM recipe for the ordered product
                          const matchedBom = bomRecipes.find(b => b.product_id === ho.product_id);

                          return (
                            <tr key={ho.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold font-mono text-indigo-600">{ho.code}</td>
                              <td className="p-2.5 text-slate-500">{ho.date}</td>
                              <td className="p-2.5 font-semibold text-slate-800">{ho.product_name}</td>
                              <td className="p-2.5 font-semibold font-mono">{ho.quantity.toLocaleString()} {ho.unit}</td>
                              <td className="p-2.5">
                                {matchedBom ? (
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap gap-1">
                                      {matchedBom.materials.map((m, mIdx) => (
                                        <span key={mIdx} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                                          {m.material_name} ({m.quantity} {m.unit})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px] font-sans">ไม่พบประวัติสูตรในคลัง</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ho.status === "done" 
                                    ? "bg-emerald-100 text-emerald-800"
                                    : ho.status === "running"
                                      ? "bg-blue-100 text-blue-800 animate-pulse"
                                      : "bg-amber-100 text-amber-800"
                                }`}>
                                  {ho.status === "done" ? "สำเร็จ" : ho.status === "running" ? "กำลังผลิต" : "รอดำเนินการ"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {historyOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              ลูกค้ารายนี้ยังไม่มีประวัติใบสั่งผลิตในอดีต
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
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
                <h3 className="text-base font-bold text-slate-800">ยืนยันการลบลูกค้า</h3>
                <p className="text-xs text-slate-500">การลบนี้จะนำข้อมูลออกจากระบบถาวร</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้า <strong className="text-red-600">"{deleteTarget.name}"</strong> ออกจากระบบ 100%?
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
                  await onDeleteCustomer(id);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> ยืนยันลบลูกค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
