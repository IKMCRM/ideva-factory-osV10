import React from "react";
import { 
  FileText, 
  Clock, 
  Boxes, 
  AlertTriangle, 
  Warehouse, 
  TrendingUp, 
  CheckCircle,
  BellRing,
  Sparkles,
  Zap
} from "lucide-react";
import { ProductionOrder, RawMaterial, PackingOrder, Precheck } from "../types";

interface DashboardProps {
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
  packingOrders: PackingOrder[];
  prechecks: Precheck[];
  setActivePage: (page: string) => void;
}

export default function Dashboard({ 
  productionOrders, 
  rawMaterials, 
  packingOrders, 
  prechecks,
  setActivePage 
}: DashboardProps) {
  
  // Dynamic KPIs calculations
  const totalPO = productionOrders.length;
  const pendingPO = productionOrders.filter(p => p.status === "pending").length;
  const runningPO = productionOrders.filter(p => p.status === "running").length;
  const donePO = productionOrders.filter(p => p.status === "done").length;
  const packingPending = packingOrders.filter(pk => pk.status !== "done").length;
  const lowStockCount = rawMaterials.filter(m => m.stock_qty <= m.min_stock).length;

  // Pending prechecks count
  const expiringCount = prechecks.filter(p => p.result === "pending").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />ผลิตเสร็จ</span>;
      case "running":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />กำลังผลิต</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />รอผลิต</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">ยกเลิก</span>;
    }
  };

  const getPackingStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">เสร็จสิ้น</span>;
      case "running":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">กำลังบรรจุ</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">รอดำเนินการ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Guidance Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-8 -mb-8 blur-lg"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 bg-blue-500/20 w-fit px-2.5 py-1 rounded-full text-xs font-semibold text-blue-300 border border-blue-400/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> INDUSTRIAL ASSEMBLY FLOW
            </div>
            <h2 className="text-lg md:text-xl font-bold font-display tracking-tight">ขั้นตอนการทำงานโรงงานอุตสาหกรรม</h2>
            <p className="text-slate-300 text-xs mt-1">ควบคุมกระบวนการตั้งแต่จับคู่ลูกค้า ทำสูตร (BOM) ตรวจสภาพสาร สั่งผลิต บรรจุหีบห่อ และเพิ่มสต็อกคงคลังอย่างเป็นระบบ</p>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-1 max-w-full">
            {[
              { label: "ลูกค้า", page: "customer", active: true },
              { label: "BOM", page: "bom", active: true },
              { label: "ตรวจสาร", page: "precheck", active: true },
              { label: "สั่งผลิต", page: "production", active: true },
              { label: "สั่งบรรจุ", page: "packing", active: true },
              { label: "จัดซื้อ", page: "purchase", active: true },
              { label: "รับเข้า", page: "grn", active: true },
              { label: "สต็อก", page: "inventory", active: true }
            ].map((step, sIdx) => (
              <React.Fragment key={sIdx}>
                <button 
                  onClick={() => setActivePage(step.page)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[11px] font-bold rounded-lg border border-white/10 transition-all cursor-pointer whitespace-nowrap"
                >
                  {step.label}
                </button>
                {sIdx < 7 && <span className="text-slate-500 text-xs px-1">➔</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ใบสั่งผลิตทั้งหมด", value: totalPO, sub: "ใบสั่งผลิตรวม", icon: <FileText className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50 border-blue-100" },
          { label: "รอการผลิต", value: pendingPO, sub: `${runningPO} กำลังดำเนินการ`, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50 border-amber-100" },
          { label: "รอบรรจุภัณฑ์", value: packingPending, sub: "ในคิวบรรจุหีบห่อ", icon: <Boxes className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50 border-indigo-100" },
          { label: "วัตถุดิบใกล้หมด", value: lowStockCount, sub: "ต่ำกว่า Minimum", icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: "bg-red-50 border-red-100", active: lowStockCount > 0 }
        ].map((card, idx) => (
          <div key={idx} className={`bg-white border p-4 rounded-xl shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md duration-200 ${card.active ? "ring-2 ring-red-500/20" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px] md:text-xs font-semibold truncate">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold font-mono text-slate-800">{card.value}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Production Orders Queue */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" /> คิวใบสั่งผลิตล่าสุด
            </h3>
            <button 
              onClick={() => setActivePage("production")}
              className="text-[11px] text-blue-600 font-semibold hover:underline"
            >
              ดูคิวทั้งหมด →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="p-2.5">เลขที่</th>
                  <th className="p-2.5">สินค้า</th>
                  <th className="p-2.5">จำนวน</th>
                  <th className="p-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionOrders.slice(0, 5).map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold font-mono text-blue-600">{po.code}</td>
                    <td className="p-2.5 font-medium text-slate-800 truncate max-w-[150px]">{po.product_name || `สินค้า #${po.product_id}`}</td>
                    <td className="p-2.5 font-semibold font-mono">{po.quantity.toLocaleString()} {po.unit}</td>
                    <td className="p-2.5">{getStatusBadge(po.status)}</td>
                  </tr>
                ))}
                {productionOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">ยังไม่มีใบสั่งผลิตในระบบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Materials Warning Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-indigo-600" /> สต็อกวัตถุดิบสำคัญ
            </h3>
            <button 
              onClick={() => setActivePage("inventory")}
              className="text-[11px] text-indigo-600 font-semibold hover:underline"
            >
              เช็คสต็อกทั้งหมด →
            </button>
          </div>

          <div className="space-y-3">
            {rawMaterials.slice(0, 5).map((mat) => {
              const percentage = Math.min(100, Math.round((mat.stock_qty / 200) * 100));
              const isLow = mat.stock_qty <= mat.min_stock;
              
              return (
                <div key={mat.id} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{mat.name} ({mat.code})</span>
                    <span className="font-mono text-slate-500">
                      <strong className={isLow ? "text-red-600 font-bold" : "text-slate-800"}>
                        {mat.stock_qty}
                      </strong>{" "}
                      / 200 {mat.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? "bg-red-500 shadow-sm shadow-red-500/30" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isLow && (
                    <p className="text-[9px] text-red-500 font-medium flex items-center gap-0.5">
                      ⚠ ต่ำกว่าระดับปลอดภัย ({mat.min_stock} {mat.unit}) กรุณาสั่งจัดซื้อด่วน!
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Notifications and Alerts System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Real-Time Security & Quality Checks (Prechecks list) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> ผลวิเคราะห์สารเคมีและการตรวจรับ
            </h3>
            <button 
              onClick={() => setActivePage("precheck")}
              className="text-[11px] text-emerald-600 font-semibold hover:underline"
            >
              บันทึกผลตรวจสอบ →
            </button>
          </div>

          <div className="space-y-2">
            {prechecks.map((pre) => (
              <div 
                key={pre.id} 
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  pre.result === "pass" 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                    : pre.result === "fail"
                      ? "bg-red-50/50 border-red-100 text-red-800"
                      : "bg-amber-50/50 border-amber-100 text-amber-800"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-semibold">{pre.material}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Lot: {pre.lot} | ผู้ตรวจ: {pre.inspector}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pre.result === "pass"
                      ? "bg-emerald-100 text-emerald-700"
                      : pre.result === "fail"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}>
                    {pre.result === "pass" ? "ผ่าน" : pre.result === "fail" ? "ไม่ผ่าน" : "รอผลตรวจ"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Packing Orders Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-indigo-600" /> ใบสั่งบรรจุภัณฑ์ล่าสุด
            </h3>
            <button 
              onClick={() => setActivePage("packing")}
              className="text-[11px] text-indigo-600 font-semibold hover:underline"
            >
              ดูทั้งหมด →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500">
                  <th className="p-2.5">เลขที่ใบสั่งบรรจุ</th>
                  <th className="p-2.5">สินค้าที่บรรจุ</th>
                  <th className="p-2.5">จำนวนบรรจุ</th>
                  <th className="p-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packingOrders.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-bold font-mono text-slate-800">{p.code}</td>
                    <td className="p-2.5">{p.item_name}</td>
                    <td className="p-2.5 font-semibold font-mono">{p.quantity.toLocaleString()} {p.unit}</td>
                    <td className="p-2.5">{getPackingStatusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
