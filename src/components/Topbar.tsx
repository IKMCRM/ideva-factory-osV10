import React, { useState } from "react";
import { Bell, Menu, Calendar, Clock, AlertTriangle, XCircle, CheckCircle, Info, Database, Lock, Share2, CheckCircle2 } from "lucide-react";
import { getShareableDatabaseLink } from "../lib/supabaseClient";

interface NotificationItem {
  id: string;
  type: "warning" | "info" | "error" | "success";
  title: string;
  description: string;
  page: string;
}

interface TopbarProps {
  activePage: string;
  setSidebarOpen: (open: boolean) => void;
  lowStockCount: number;
  dbStatus: any;
  notifications?: NotificationItem[];
  onNavigate?: (page: string) => void;
  onOpenDbModal?: () => void;
}

export default function Topbar({ 
  activePage, 
  setSidebarOpen, 
  lowStockCount, 
  dbStatus,
  notifications = [],
  onNavigate,
  onOpenDbModal
}: TopbarProps) {
  const pageTitles: Record<string, string> = {
    dashboard: "แดชบอร์ดภาพรวม",
    projects: "โปรเจคทั้งหมด",
    customer: "ข้อมูลลูกค้าและแบรนด์",
    bom: "สูตรการผลิต (BOM)",
    precheck: "ตรวจสอบเคมีภัณฑ์ก่อนผลิต",
    production: "ใบสั่งผลิต (Production Orders)",
    packing: "ใบสั่งบรรจุภัณฑ์ (Packing)",
    purchase: "ใบสั่งซื้อเคมีภัณฑ์",
    grn: "ใบรับเข้าคลังสินค้า (GRN)",
    inventory: "การจัดการคลังสินค้า",
    report: "รายงานสรุปโรงงาน",
    manual: "คู่มือการใช้งานระบบ",
    settings: "ตั้งค่าระบบ & จัดการฐานข้อมูล"
  };

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close notifications dropdown on click outside
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 h-16 px-4 md:px-6 flex items-center justify-between z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-800 font-display">
            {pageTitles[activePage] || activePage}
          </h2>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-500 mt-0.5 font-sans">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {date}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {time} น.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Dedicated Button for Database Link & Check (Protected by Passcode) */}
        <button
          onClick={onOpenDbModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95 cursor-pointer border border-blue-400/30"
          title="เข้าลิงค์เช็คฐานข้อมูล (มีระบบรักษาความปลอดภัย)"
        >
          <Database className="w-3.5 h-3.5 text-blue-200" />
          <span className="hidden sm:inline">เข้าลิงค์เช็คฐานข้อมูล</span>
          <span className="sm:hidden">ฐานข้อมูล</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> ระบบป้องกัน
          </span>
        </button>

        {/* 1-Click Multi-Device Universal Sync Link */}
        <button
          onClick={() => {
            const link = getShareableDatabaseLink();
            navigator.clipboard.writeText(link);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-300 transition-all active:scale-95 cursor-pointer"
          title="คัดลอกลิงก์แชร์เชื่อมต่อทุกอุปกรณ์ (เปิดที่ไหนเห็นข้อมูลชุดเดียวกันทันที 100%)"
        >
          {copiedLink ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">คัดลอกลิงก์แล้ว!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>แชร์ลิงก์ซิงค์</span>
            </>
          )}
        </button>

        {dbStatus ? (
          <div 
            onClick={onOpenDbModal}
            className="hidden md:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-colors"
            title="คลิกเพื่อดูรายละเอียดการเชื่อมต่อฐานข้อมูล"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            {dbStatus.host === "Firebase Firestore" 
              ? "เชื่อมต่อ Firebase Firestore แล้ว 🔥" 
              : "เชื่อมต่อ Supabase Realtime แล้ว ⚡"}
          </div>
        ) : (
          <div 
            onClick={onOpenDbModal}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all"
            title="ระบบบันทึกข้อมูลทันทีและกำลังเชื่อมต่อ/ซิงค์ฐานข้อมูลอัตโนมัติ (คลิกเพื่อดูการตั้งค่า)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
            ⚡ ซิงค์อัตโนมัติ (บันทึกข้อมูลได้ทันที)
          </div>
        )}

        {lowStockCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-semibold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            พบวัตถุดิบต่ำกว่าขั้นต่ำ {lowStockCount} รายการ!
          </div>
        )}

        {/* Dynamic Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            title="รายการแจ้งเตือน"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">รายการแจ้งเตือนระบบ ({notifications.length})</span>
                {notifications.length > 0 && (
                  <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded-full">เรียลไทม์</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-xs">
                    ไม่มีแจ้งเตือนหรือรายการที่ต้องจัดการในขณะนี้
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate?.(item.page);
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3 transition-colors last:border-0"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === "warning" ? "bg-amber-50 text-amber-600" :
                        item.type === "error" ? "bg-red-50 text-red-600" :
                        item.type === "success" ? "bg-emerald-50 text-emerald-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {item.type === "warning" && <AlertTriangle className="w-4.5 h-4.5" />}
                        {item.type === "error" && <XCircle className="w-4.5 h-4.5" />}
                        {item.type === "success" && <CheckCircle className="w-4.5 h-4.5" />}
                        {item.type === "info" && <Info className="w-4.5 h-4.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <h4 className="text-xs font-semibold text-slate-700 truncate max-w-[120px]" title="บริษัท ไอดีว่า กรุ๊ป จำกัด">บริษัท ไอดีว่า กรุ๊ป จำกัด</h4>
            <p className="text-[9px] text-slate-400">ผู้ดูแลระบบคลังและสูตร</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-200 border-2 border-white">
            ไอ
          </div>
        </div>
      </div>
    </header>
  );
}
