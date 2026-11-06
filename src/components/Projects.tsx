import React, { useState } from "react";
import {
  Briefcase,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Building,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Boxes,
  Eye,
  X,
  Download
} from "lucide-react";
import { Project, Customer } from "../types";

interface ProjectsProps {
  projects: Project[];
  customers: Customer[];
  onSaveProject: (project: Project) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
}

export default function Projects({
  projects,
  customers,
  onSaveProject,
  onDeleteProject
}: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  // Form State matching the requested fields
  const [formData, setFormData] = useState<{
    id: number;
    title: string;
    project_type: string;
    customer: string;
    customer_status: string;
    description: string;
    start_date: string;
    due_date: string;
    price: number;
    tags_text: string;
    status: string;
    product_code: string;
    lot_number: string;
    product_name: string;
    details: string;
    category: string;
    quantity: number;
    owner: string;
    progress: number;
  }>({
    id: 0,
    title: "",
    project_type: "ลูกค้า",
    customer: "",
    customer_status: "ลูกค้า",
    description: "",
    start_date: "01/01/2024",
    due_date: "12/01/2024",
    price: 0,
    tags_text: "",
    status: "กำลังผลิต",
    product_code: "",
    lot_number: "Lot6",
    product_name: "",
    details: "",
    category: "",
    quantity: 500,
    owner: "ผู้จัดการฝ่ายผลิต",
    progress: 50
  });

  const openCreateModal = () => {
    setSelectedProject(null);
    const nextId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    setFormData({
      id: nextId,
      title: "",
      project_type: "ลูกค้า",
      customer: customers[0]?.name || "",
      customer_status: "ลูกค้า",
      description: "",
      start_date: new Date().toLocaleDateString("en-GB"),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
      price: 0,
      tags_text: "",
      status: "กำลังผลิต",
      product_code: `PRD-${String(nextId).padStart(3, "0")}`,
      lot_number: `Lot${nextId}`,
      product_name: "",
      details: "",
      category: "สบู่ก้อนสมุนไพร",
      quantity: 500,
      owner: "ผู้จัดการฝ่ายผลิต",
      progress: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      id: project.id,
      title: project.title || "",
      project_type: project.project_type || "ลูกค้า",
      customer: project.customer || "",
      customer_status: project.customer_status || "ลูกค้า",
      description: project.description || "",
      start_date: project.start_date || "",
      due_date: project.due_date || "",
      price: project.price || 0,
      tags_text: (project.tags || []).join(", "),
      status: project.status || "กำลังผลิต",
      product_code: project.product_code || "",
      lot_number: project.lot_number || "",
      product_name: project.product_name || "",
      details: project.details || "",
      category: project.category || "",
      quantity: project.quantity || 0,
      owner: project.owner || "",
      progress: project.progress || 0
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("กรุณากรอกหัวเรื่องโปรเจค");
      return;
    }

    const payload: Project = {
      id: formData.id,
      title: formData.title.trim(),
      project_type: formData.project_type.trim(),
      customer: formData.customer.trim(),
      customer_status: formData.customer_status.trim(),
      owner: formData.owner.trim() || "ผู้ดูแลโปรเจค",
      price: Number(formData.price) || 0,
      start_date: formData.start_date.trim(),
      due_date: formData.due_date.trim(),
      progress: Math.min(100, Math.max(0, Number(formData.progress) || 0)),
      status: formData.status,
      quantity: Number(formData.quantity) || 0,
      tags: formData.tags_text
        ? formData.tags_text.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      description: formData.description.trim(),
      product_code: formData.product_code.trim(),
      lot_number: formData.lot_number.trim(),
      product_name: formData.product_name.trim(),
      details: formData.details.trim(),
      category: formData.category.trim()
    };

    await onSaveProject(payload);
    setIsModalOpen(false);
  };

  const exportToCSV = () => {
    const headers = [
      "ไอดี",
      "หัวเรื่อง",
      "ลูกค้า",
      "เจ้าของ",
      "ราคา",
      "วันที่เริ่ม",
      "วันกำหนดส่ง",
      "ความคืบหน้า (%)",
      "สถานะ",
      "จำนวน",
      "รหัสสินค้า",
      "Lot Number",
      "ชื่อสินค้า",
      "รายละเอียด"
    ];

    const rows = filteredProjects.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.customer.replace(/"/g, '""')}"`,
      `"${p.owner.replace(/"/g, '""')}"`,
      p.price,
      `"${p.start_date}"`,
      `"${p.due_date}"`,
      p.progress,
      `"${p.status}"`,
      p.quantity,
      `"${p.product_code || ""}"`,
      `"${p.lot_number || ""}"`,
      `"${(p.product_name || "").replace(/"/g, '""')}"`,
      `"${(p.details || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `projects_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (p.title || "").toLowerCase().includes(term) ||
      (p.customer || "").toLowerCase().includes(term) ||
      (p.owner || "").toLowerCase().includes(term) ||
      (p.product_name || "").toLowerCase().includes(term) ||
      (p.lot_number || "").toLowerCase().includes(term) ||
      (p.product_code || "").toLowerCase().includes(term);

    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // KPI calculations
  const totalValue = projects.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalQty = projects.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const activeCount = projects.filter((p) => p.status === "กำลังผลิต" || p.status === "รอดำเนินการ").length;
  const completedCount = projects.filter((p) => p.status === "เสร็จสิ้น" || p.status === "เสร็จสมบูรณ์").length;

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">โปรเจคทั้งหมด</p>
            <h3 className="text-xl font-bold text-slate-800 font-mono">{projects.length} รายการ</h3>
            <p className="text-[11px] text-slate-400">รวม {totalQty.toLocaleString()} ชิ้น</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">กำลังดำเนินการ</p>
            <h3 className="text-xl font-bold text-amber-600 font-mono">{activeCount} โปรเจค</h3>
            <p className="text-[11px] text-slate-400">อยู่ในกระบวนการผลิต/ผสม</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">เสร็จสมบูรณ์</p>
            <h3 className="text-xl font-bold text-emerald-600 font-mono">{completedCount} โปรเจค</h3>
            <p className="text-[11px] text-slate-400">ส่งมอบและปิดจ็อบแล้ว</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">มูลค่าโปรเจครวม</p>
            <h3 className="text-xl font-bold text-indigo-700 font-mono">
              ฿{totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-slate-400">ยอดสั่งผลิตทั้งหมด</p>
          </div>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโปรเจค, ลูกค้า, รหัสสินค้า, Lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="กำลังผลิต">กำลังผลิต</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="ตรวจ QC">ตรวจ QC</option>
            <option value="รอสารเคมี">รอสารเคมี</option>
            <option value="เสร็จสมบูรณ์">เสร็จสมบูรณ์</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> ส่งออก CSV
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> เพิ่มโปรเจคใหม่
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* PROJECTS TABLE (EXACT COLUMNS REQUESTED)                                */}
      {/* ไอดี | หัวเรื่อง | ลูกค้า | เจ้าของ | ราคา | วันที่เริ่ม | วันกำหนดส่ง | ความคืบหน้า | สถานะ | จำนวน */}
      {/* ======================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3 text-center w-14">ไอดี</th>
                <th className="p-3 min-w-[170px]">หัวเรื่อง</th>
                <th className="p-3 min-w-[180px]">ลูกค้า</th>
                <th className="p-3 min-w-[130px]">เจ้าของ</th>
                <th className="p-3 text-right min-w-[100px]">ราคา</th>
                <th className="p-3 text-center min-w-[100px]">วันที่เริ่ม</th>
                <th className="p-3 text-center min-w-[100px]">วันกำหนดส่ง</th>
                <th className="p-3 text-center min-w-[140px]">ความคืบหน้า</th>
                <th className="p-3 text-center min-w-[110px]">สถานะ</th>
                <th className="p-3 text-right min-w-[90px]">จำนวน</th>
                <th className="p-3 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProjects.map((item) => {
                const isOverdue =
                  item.status !== "เสร็จสมบูรณ์" &&
                  item.due_date &&
                  new Date(item.due_date.split("/").reverse().join("-")) < new Date();

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ไอดี */}
                    <td className="p-3 text-center font-mono font-bold text-slate-500">
                      #{item.id}
                    </td>

                    {/* หัวเรื่อง */}
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs sm:text-[13px] hover:text-blue-600 cursor-pointer" onClick={() => openDetailModal(item)}>
                          {item.title}
                        </span>
                        {item.lot_number && (
                          <span className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">
                            Lot: {item.lot_number} {item.product_code ? `• ${item.product_code}` : ""}
                          </span>
                        )}
                        {item.product_name && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {item.product_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ลูกค้า */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 line-clamp-1" title={item.customer}>
                          {item.customer || "-"}
                        </span>
                      </div>
                      {item.customer_status && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {item.customer_status}
                        </span>
                      )}
                    </td>

                    {/* เจ้าของ */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{item.owner || "-"}</span>
                      </div>
                    </td>

                    {/* ราคา */}
                    <td className="p-3 text-right font-mono font-bold text-indigo-700">
                      ฿{(item.price || 0).toLocaleString()}
                    </td>

                    {/* วันที่เริ่ม */}
                    <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                      {item.start_date || "-"}
                    </td>

                    {/* วันกำหนดส่ง */}
                    <td className="p-3 text-center font-mono text-[11px]">
                      <span className={isOverdue ? "text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded" : "text-slate-700"}>
                        {item.due_date || "-"}
                      </span>
                    </td>

                    {/* ความคืบหน้า */}
                    <td className="p-3">
                      <div className="w-full space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-slate-700">{item.progress || 0}%</span>
                          <span className="text-slate-400">{item.status}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              (item.progress || 0) >= 100
                                ? "bg-emerald-500"
                                : (item.progress || 0) >= 60
                                ? "bg-blue-600"
                                : (item.progress || 0) >= 30
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, item.progress || 0))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* สถานะ */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === "เสร็จสมบูรณ์" || item.status === "เสร็จสิ้น"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "กำลังผลิต"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "ตรวจ QC"
                            ? "bg-purple-100 text-purple-700"
                            : item.status === "รอสารเคมี"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* จำนวน */}
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {(item.quantity || 0).toLocaleString()}
                    </td>

                    {/* จัดการ */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขโปรเจค"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer active:scale-95"
                          title="ลบโปรเจค"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold">ไม่พบข้อมูลโปรเจคที่ตรงตามเงื่อนไข</p>
                    <p className="text-xs text-slate-400 mt-1">คลิกปุ่ม "เพิ่มโปรเจคใหม่" ด้านบนเพื่อเริ่มต้นสร้างโปรเจค</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* MODAL: แก้ไขโปรเจค / เพิ่มโปรเจค (EXACT FORM FIELDS REQUESTED)           */}
      {/* ======================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  {selectedProject ? "แก้ไขโปรเจค" : "สร้างโปรเจคใหม่"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* หัวเรื่อง */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หัวเรื่อง *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น สบู่มังคุด"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ประเภทโปรเจค & สถานะของลูกค้า */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทโปรเจค
                  </label>
                  <input
                    type="text"
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    placeholder="เช่น ลูกค้า / OEM ผลิตสบู่"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานะของลูกค้า
                  </label>
                  <input
                    type="text"
                    value={formData.customer_status}
                    onChange={(e) => setFormData({ ...formData, customer_status: e.target.value })}
                    placeholder="เช่น ลูกค้า / ลูกค้าประจำ / VIP"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* ลูกค้า & เจ้าของ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ลูกค้า *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    placeholder="เช่น SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    list="customer-suggestions"
                  />
                  <datalist id="customer-suggestions">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เจ้าของ (ผู้ดูแลโปรเจค)
                  </label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="เช่น คุณสมใจ ผลิตภัณฑ์"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* คำบรรยาย */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำบรรยาย
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="คำบรรยายรายละเอียดโปรเจค..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* วันที่เริ่ม, วันกำหนดส่ง, ราคา */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันที่เริ่ม
                  </label>
                  <input
                    type="text"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    placeholder="01/01/2024"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันกำหนดส่ง
                  </label>
                  <input
                    type="text"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    placeholder="12/01/2024"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 45000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* คำกำกับ (Tags) & สถานะ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำกำกับ (คั่นด้วยจุลภาค)
                  </label>
                  <input
                    type="text"
                    value={formData.tags_text}
                    onChange={(e) => setFormData({ ...formData, tags_text: e.target.value })}
                    placeholder="เช่น สบู่ก้อน, ลดสิว, ส่งออก"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="กำลังผลิต">กำลังผลิต</option>
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="ตรวจ QC">ตรวจ QC</option>
                    <option value="รอสารเคมี">รอสารเคมี</option>
                    <option value="เสร็จสมบูรณ์">เสร็จสมบูรณ์</option>
                  </select>
                </div>
              </div>

              {/* รหัสสินค้า & Lot Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสสินค้า
                  </label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    placeholder="เช่น MP-SOAP-006"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    value={formData.lot_number}
                    onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                    placeholder="เช่น Lot6"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* ชื่อสินค้า */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อสินค้า
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="เช่น MANGOSTEEN ACNE SOAP/แมงโกสทีน แอคเน่ โซฟ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              {/* รายละเอียด */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  rows={2}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="เช่น SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* ประเภท, จำนวน, ความคืบหน้า */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภท
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="เช่น สบู่ก้อนสมุนไพร"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวน (ชิ้น)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="เช่น 500"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ความคืบหน้า ({formData.progress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                    className="w-full accent-blue-600 mt-2 cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {selectedProject ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = { id: selectedProject.id, title: selectedProject.title };
                      setIsModalOpen(false);
                      setDeleteTarget(target);
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบโปรเจคนี้
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {selectedProject ? "บันทึกการแก้ไข" : "สร้างโปรเจค"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ดูรายละเอียดโปรเจค (VIEW DETAILS MODAL)                           */}
      {/* ======================================================================= */}
      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl my-6 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  โปรเจค #{selectedProject.id}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {selectedProject.title}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Status and Progress bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">สถานะ: {selectedProject.status}</span>
                  <span className="font-mono font-bold text-blue-600">{selectedProject.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${selectedProject.progress}%` }}
                  />
                </div>
              </div>

              {/* Grid information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">ลูกค้า:</span>
                  <strong className="text-slate-800 text-xs">{selectedProject.customer}</strong>
                  {selectedProject.customer_status && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">({selectedProject.customer_status})</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">เจ้าของโปรเจค:</span>
                  <strong className="text-slate-800 text-xs">{selectedProject.owner}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">ช่วงเวลาดำเนินงาน:</span>
                  <strong className="text-slate-800 text-xs font-mono">
                    {selectedProject.start_date} - {selectedProject.due_date}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">ราคา & จำนวน:</span>
                  <strong className="text-indigo-700 text-xs font-mono">
                    ฿{selectedProject.price.toLocaleString()} ({selectedProject.quantity.toLocaleString()} ชิ้น)
                  </strong>
                </div>
              </div>

              {/* Product specifications */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">ข้อมูลสินค้า & ล็อตผลิต</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">รหัสสินค้า:</span> <strong className="font-mono">{selectedProject.product_code || "-"}</strong></div>
                  <div><span className="text-slate-500">Lot Number:</span> <strong className="font-mono text-blue-600">{selectedProject.lot_number || "-"}</strong></div>
                  <div className="col-span-2"><span className="text-slate-500">ชื่อสินค้า:</span> <strong>{selectedProject.product_name || "-"}</strong></div>
                  <div className="col-span-2"><span className="text-slate-500">รายละเอียด:</span> <span>{selectedProject.details || "-"}</span></div>
                  {selectedProject.description && (
                    <div className="col-span-2"><span className="text-slate-500">คำบรรยาย:</span> <span>{selectedProject.description}</span></div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedProject.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  const target = { id: selectedProject.id, title: selectedProject.title };
                  setIsDetailModalOpen(false);
                  setDeleteTarget(target);
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบโปรเจคนี้
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openEditModal(selectedProject);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  แก้ไขโปรเจคนี้
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
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
                <h3 className="text-base font-bold text-slate-800">ยืนยันการลบโปรเจค</h3>
                <p className="text-xs text-slate-500">การลบนี้จะนำข้อมูลออกจากระบบถาวร</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจค <strong className="text-red-600">"{deleteTarget.title}"</strong> ออกจากระบบ 100%?
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
                  await onDeleteProject(id);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> ยืนยันลบโปรเจค
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
