import React, { useState } from "react";
import { History, Search, Download, Filter, FileText, User, Calendar, ShieldCheck, Tag } from "lucide-react";
import { AuditLog } from "../types";

interface AuditLogPageProps {
  logs: AuditLog[];
}

export default function AuditLogPage({ logs }: AuditLogPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const exportCSV = () => {
    const headers = ["ID", "User", "Timestamp", "Action", "Module", "Material Code", "Lot Number", "Old Value", "New Value", "Reason", "Ref Doc"];
    const rows = logs.map((l) => [
      l.id,
      l.user,
      l.timestamp,
      l.action,
      l.module,
      l.material_code || "",
      l.lot_number || "",
      l.old_value || "",
      l.new_value || "",
      l.reason || "",
      l.ref_doc || ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      l.user.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.module.toLowerCase().includes(q) ||
      (l.material_code && l.material_code.toLowerCase().includes(q)) ||
      (l.lot_number && l.lot_number.toLowerCase().includes(q)) ||
      (l.ref_doc && l.ref_doc.toLowerCase().includes(q)) ||
      (l.reason && l.reason.toLowerCase().includes(q));

    const matchModule = moduleFilter === "all" || l.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const modulesList = Array.from(new Set(logs.map((l) => l.module)));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/20 w-fit px-2.5 py-0.5 rounded-full border border-indigo-500/30 mb-2">
            <History className="w-3.5 h-3.5" /> AUDIT LOG SYSTEM (MODULE 12)
          </div>
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight">
            ประวัติการดำเนินงานและตรวจสอบย้อนหลัง (Audit Log)
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            บันทึกประวัติการสร้าง แก้ไข รับเข้า เปลี่ยนราคา เปลี่ยนล็อต อนุมัติ QC เบิกวัตถุดิบ และการสลับล็อตที่ไม่ใช่ FEFO อย่างละเอียด ป้องกันการลบย้อนหลัง
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
        >
          <Download className="w-4 h-4" /> ส่งออกประวัติ (CSV)
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">กรองตามโมดูล:</label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none cursor-pointer font-bold"
          >
            <option value="all">โมดูลทั้งหมด</option>
            {modulesList.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="relative md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้, Action, รหัสเคมี, Lot, เอกสาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                <th className="p-3 text-center w-12 font-mono">#</th>
                <th className="p-3">วัน-เวลา (Timestamp)</th>
                <th className="p-3">ผู้ดำเนินการ (User)</th>
                <th className="p-3">การกระทำ (Action)</th>
                <th className="p-3">โมดูล (Module)</th>
                <th className="p-3">รหัสเคมี / Lot</th>
                <th className="p-3">ค่าเดิม ➔ ค่าใหม่</th>
                <th className="p-3">เหตุผล / เอกสารอ้างอิง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-mono text-slate-400 font-bold bg-slate-50/50">{log.id || idx + 1}</td>
                  <td className="p-3 font-mono text-slate-600 font-semibold text-[11px]">{log.timestamp}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      <User className="w-3 h-3 text-slate-500" />
                      {log.user}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-indigo-700 font-mono text-[11px] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{log.module}</td>
                  <td className="p-3 font-mono text-slate-800">
                    {log.material_code && <span className="font-bold text-emerald-700 mr-1.5">[{log.material_code}]</span>}
                    {log.lot_number || "-"}
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    {log.old_value && <span className="text-slate-400 line-through mr-1">{log.old_value}</span>}
                    {log.new_value && <span className="font-bold text-slate-900">➔ {log.new_value}</span>}
                    {!log.old_value && !log.new_value && "-"}
                  </td>
                  <td className="p-3 text-slate-600 max-w-xs truncate" title={log.reason || log.ref_doc || ""}>
                    {log.reason && <div className="font-medium text-slate-800">{log.reason}</div>}
                    {log.ref_doc && <div className="text-[10px] text-slate-400 font-mono">อ้างอิง: {log.ref_doc}</div>}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    ไม่พบประวัติการดำเนินงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
