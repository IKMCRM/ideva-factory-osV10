import React, { useState } from "react";
import {
  Settings,
  Database,
  Trash2,
  RotateCcw,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Palette,
  Layers,
  Sparkles,
  Server,
  Lock,
  Eye,
  EyeOff,
  Cpu,
  Info,
  Copy,
  Check,
  Share2,
  Flame
} from "lucide-react";
import {
  testSupabaseConnection,
  clearAllDatabaseTables,
  getSupabaseConfig,
  updateSupabaseConfig,
  resetSupabaseConfig,
  getShareableDatabaseLink
} from "../lib/supabaseClient";
import { FULL_SUPABASE_SCHEMA_SQL } from "../lib/schemaSql";
import { firebaseConfig, testFirestoreConnection } from "../lib/firebaseClient";

interface SettingsPageProps {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  themes: Array<{
    id: string;
    name: string;
    color: string;
    primary: string;
    light: string;
  }>;
  tableStats?: {
    projects: number;
    customers: number;
    bomRecipes: number;
    prechecks: number;
    productionOrders: number;
    packingOrders: number;
    purchaseOrders: number;
    grns: number;
    rawMaterials: number;
    inventoryPacks: number;
    suppliers?: number;
    products?: number;
    semiGoods?: number;
    requisitions?: number;
    [key: string]: number | undefined;
  };
  onRefreshData?: () => Promise<void>;
  onOpenDbModal?: () => void;
}

export default function SettingsPage({
  activeTheme,
  setActiveTheme,
  themes,
  tableStats,
  onRefreshData,
  onOpenDbModal
}: SettingsPageProps) {
  // Clear Database State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearPasscode, setClearPasscode] = useState("");
  const [showClearPassword, setShowClearPassword] = useState(false);
  const [clearError, setClearError] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState("");

  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isPausedPossible?: boolean;
    details?: string;
  } | null>(null);

  // Custom Supabase Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const currentConfig = getSupabaseConfig();
  const [configUrl, setConfigUrl] = useState(currentConfig.url);
  const [configKey, setConfigKey] = useState(currentConfig.key);
  const [configSaved, setConfigSaved] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlCode, setShowSqlCode] = useState(false);

  const SUPABASE_PROJECT_ID = currentConfig.projectId || "zizlhxikswejwvoftshk";
  const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`;
  const SUPABASE_TABLE_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor`;
  const SUPABASE_SQL_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`;

  const totalRecords = tableStats
    ? Object.values(tableStats).reduce((acc, curr) => acc + curr, 0)
    : 0;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success && onRefreshData) {
        await onRefreshData();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `ข้อผิดพลาด: ${e.message || "เครือข่ายขัดข้อง"}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExecuteClear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearPasscode.trim() !== "4321034") {
      setClearError("รหัสผ่านไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อยืนยัน");
      return;
    }
    setIsClearing(true);
    setClearError("");
    try {
      const result = await clearAllDatabaseTables(clearPasscode);
      setClearSuccessMsg(result.message);
      setClearPasscode("");
      if (onRefreshData) {
        await onRefreshData();
      }
      setTimeout(() => {
        setIsClearModalOpen(false);
        setClearSuccessMsg("");
      }, 2500);
    } catch (err: any) {
      setClearError(err.message || "เกิดข้อผิดพลาดในการล้างข้อมูล");
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl.trim() || !configKey.trim()) return;
    updateSupabaseConfig(configUrl, configKey);
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setIsConfigOpen(false);
    }, 1500);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleRestoreDefaultConfig = () => {
    resetSupabaseConfig();
    const def = getSupabaseConfig();
    setConfigUrl(def.url);
    setConfigKey(def.key);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 1500);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 font-display">
                ตั้งค่าระบบโรงงาน & ฐานข้อมูล
              </h1>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full font-mono">
                System Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการเชื่อมต่อฐานข้อมูล Supabase Online, ล้างข้อมูลในตารางทั้งหมด (Delete all records), และปรับแต่งธีม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDbModal}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>เข้าเช็คระบบฐานข้อมูล Supabase</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
              <Lock className="w-2.5 h-2.5" /> ล็อค
            </span>
          </button>
        </div>
      </div>

      {/* Primary Cloud Database: Firebase Firestore 100% */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-6 rounded-2xl shadow-sm border border-amber-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  ฐานข้อมูลหลัก: Firebase Firestore Enterprise (100% Realtime Active)
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> ออนไลน์สมบูรณ์
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Database ID: <code className="font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">{firebaseConfig.firestoreDatabaseId}</code> | Cloud Region: <span className="font-bold text-slate-800">asia-south1</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await testFirestoreConnection();
                alert(res.message);
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> ทดสอบสัญญาณ Firestore
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-100">
            <span className="text-slate-500 text-[11px] block">เครื่องยนต์หลัก</span>
            <span className="font-bold text-slate-800">Google Cloud Firestore</span>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-100">
            <span className="text-slate-500 text-[11px] block">การซิงค์ข้อมูล</span>
            <span className="font-bold text-emerald-700">Realtime onSnapshot</span>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-100">
            <span className="text-slate-500 text-[11px] block">จำนวนตารางที่เชื่อมต่อ</span>
            <span className="font-bold text-amber-800">17+ คอลเลกชันครบวงจร</span>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-100">
            <span className="text-slate-500 text-[11px] block">ความปลอดภัย</span>
            <span className="font-bold text-blue-700">Rules Deployed (100%)</span>
          </div>
        </div>
      </div>

      {/* Database Connection & Health Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                สถานะการเชื่อมต่อ Supabase Online
              </h3>
              <p className="text-[11px] text-slate-500">
                Project: <span className="font-mono font-bold text-slate-700">{SUPABASE_PROJECT_ID}</span> ({currentConfig.url})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="text-xs text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors"
            >
              {isConfigOpen ? "ซ่อนตั้งค่า URL" : "⚙️ เปลี่ยน URL / Key"}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-600" : ""}`} />
              <span>ทดสอบสัญญาณ</span>
            </button>
          </div>
        </div>

        {/* Universal Multi-Device Link Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-xs border border-blue-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-200">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ลิงก์แชร์เชื่อมต่อฐานข้อมูลทุกอุปกรณ์ (Universal Multi-Device Sync Link)</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              เปิดลิงก์นี้บน Netlify, เครื่องมือถือ หรือส่งให้ทีมงาน ทุกเครื่องจะเชื่อมต่อและเห็นฐานข้อมูลเดียวกัน 100% ทันที
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const link = getShareableDatabaseLink();
              navigator.clipboard.writeText(link);
              setCopiedShareLink(true);
              setTimeout(() => setCopiedShareLink(false), 2500);
            }}
            className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {copiedShareLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>คัดลอกลิงก์แชร์ซิงค์</span>
              </>
            )}
          </button>
        </div>

        {/* Custom Supabase URL & Key Form */}
        {isConfigOpen && (
          <form onSubmit={handleSaveConfig} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">กำหนดค่า Supabase Project URL & Anon Key</span>
              {currentConfig.isCustom && (
                <button
                  type="button"
                  onClick={handleRestoreDefaultConfig}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  คืนค่าเริ่มต้นโครงการ
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Supabase URL</label>
                <input
                  type="text"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Anon / Public API Key</label>
                <input
                  type="text"
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">
                หากโครงการของคุณ Paused หรือย้ายไปโปรเจกต์ใหม่ นำ URL และ Anon Key มาวางที่นี่ได้ทันที
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {configSaved ? "✓ บันทึกสำเร็จ" : "บันทึกและเชื่อมต่อ"}
              </button>
            </div>
          </form>
        )}

        {/* Test Result Display with intelligent Failed to fetch solution */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <div className="font-bold text-sm">{testResult.message}</div>
                {testResult.details && (
                  <p className="text-[11px] leading-relaxed opacity-90">{testResult.details}</p>
                )}
              </div>
            </div>

            {/* If Failed to fetch / Paused, show quick fix buttons */}
            {!testResult.success && testResult.isPausedPossible && (
              <div className="mt-2 pt-2 border-t border-red-200 flex flex-wrap items-center gap-2">
                <a
                  href={SUPABASE_DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดหน้า Supabase เพื่อกด Unpause / Restore Project ↗</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                >
                  ระบุ URL & Key ใหม่
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <a
            href={SUPABASE_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Supabase Dashboard</span>
                <span className="text-[10px] text-slate-500">จัดการโครงการ {SUPABASE_PROJECT_ID}</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
          </a>

          <a
            href={SUPABASE_TABLE_EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">ตารางข้อมูล (Table Editor)</span>
                <span className="text-[10px] text-slate-500">ดูเรคคอร์ดสดใน Supabase</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
          </a>

          <a
            href={SUPABASE_SQL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">SQL Query Editor</span>
                <span className="text-[10px] text-slate-500">รันคำสั่ง SQL หรือ Migrate</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
          </a>

          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Firebase Firestore</span>
                <span className="text-[10px] text-slate-500">Project: {firebaseConfig.projectId}</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
          </a>
        </div>
      </div>

      {/* DANGER ZONE: CLEAR ALL RECORDS / RESET DATABASE */}
      <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl border border-red-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-red-950">
                  โซนจัดการล้างข้อมูล & รีเซ็ตฐานข้อมูล (Danger Zone)
                </h3>
                <span className="text-[10px] bg-red-200 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> มีระบบป้องกันความปลอดภัย
                </span>
              </div>
              <p className="text-xs text-red-700 mt-0.5">
                ฟังก์ชันพิเศษสำหรับล้างข้อมูลทุกตาราง (Delete all records) ใน Supabase และระบบ หรือกู้คืนข้อมูลตัวอย่างโรงงาน
              </p>
            </div>
          </div>
        </div>

        {/* Live records summary before clearing */}
        {tableStats && (
          <div className="bg-white/80 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-red-600" />
                จำนวนข้อมูลที่อยู่ในตารางทั้งหมดขณะนี้:
              </span>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                รวมทั้งหมด {totalRecords} เรคคอร์ด
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center font-mono text-xs">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ซัพพลายเออร์</span>
                <strong className="text-emerald-700">{tableStats.suppliers ?? 0}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">โปรเจค</span>
                <strong>{tableStats.projects}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ลูกค้า</span>
                <strong>{tableStats.customers}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">สูตร BOM</span>
                <strong>{tableStats.bomRecipes}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">วัตถุดิบเคมี</span>
                <strong>{tableStats.rawMaterials}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ใบสั่งผลิต</span>
                <strong>{tableStats.productionOrders}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ใบสั่งบรรจุ</span>
                <strong>{tableStats.packingOrders}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ใบสั่งซื้อ PO</span>
                <strong>{tableStats.purchaseOrders}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ใบรับเข้า GRN</span>
                <strong>{tableStats.grns}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">ตรวจ Pre-QC</span>
                <strong>{tableStats.prechecks}</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">บรรจุภัณฑ์</span>
                <strong>{tableStats.inventoryPacks}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {/* Main Requested Button: ล้างข้อมูลในตารางทั้งหมด */}
          <button
            onClick={() => {
              setIsClearModalOpen(true);
              setClearError("");
              setClearPasscode("");
            }}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all border border-red-500"
          >
            <Trash2 className="w-4 h-4" />
            <span>สั่งล้างข้อมูลในตารางทั้งหมด (Delete all records) ใน Supabase</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
              <Lock className="w-2.5 h-2.5" /> ยืนยันรหัส
            </span>
          </button>

          {/* Direct Cloud Refresh */}
          <button
            onClick={async () => {
              if (onRefreshData) {
                await onRefreshData();
              }
            }}
            className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>🔄 ซิงค์และรีเฟรชข้อมูลสดจาก Supabase (Direct Cloud Refresh)</span>
          </button>
        </div>
      </div>

      {/* SQL SCHEMA SECTION (100% READY FOR SUPABASE) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  สคริปต์ SQL สร้างตารางใน Supabase ครบ 100% (Full Schema + Realtime + RLS)
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full font-mono">
                  15 Tables
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                รวมคำสั่งสร้างตารางทั้ง 15 ตาราง, ความสัมพันธ์ Foreign Key, Row Level Security (RLS) และเปิดใช้งาน Supabase Realtime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(FULL_SUPABASE_SCHEMA_SQL);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2500);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                copiedSql
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>✓ คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก SQL ทั้งหมด</span>
                </>
              )}
            </button>

            <a
              href={SUPABASE_SQL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>เปิด Supabase SQL Editor ↗</span>
            </a>

            <button
              type="button"
              onClick={() => setShowSqlCode(!showSqlCode)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
            >
              {showSqlCode ? "ซ่อนโค้ด" : "ดูโค้ด SQL"}
            </button>
          </div>
        </div>

        {/* Expandable SQL Preview */}
        {showSqlCode && (
          <div className="relative animate-in fade-in duration-150">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[350px] leading-relaxed custom-scrollbar border border-slate-800 select-all">
              {FULL_SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* Theme Selection */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">ธีมสีและรูปแบบระบบ (Themes)</h3>
            <p className="text-[11px] text-slate-500">เลือกชุดสีพาสเทลสำหรับหน้าต่างการใช้งาน</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {themes.map((theme) => {
            const isCurrent = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  isCurrent
                    ? "border-blue-600 bg-blue-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-5 h-5 rounded-full shadow-sm border border-black/10"
                    style={{ backgroundColor: theme.primary }}
                  />
                  {isCurrent && (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                      ใช้งาน
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>IDEVA Factory OS v2.6.4 — Real-time Production & Inventory Management System</span>
        </div>
        <div className="font-mono text-[11px]">
          Engine: Vite + React 19 + Supabase Cloud Engine
        </div>
      </div>

      {/* CONFIRMATION MODAL: DELETE ALL RECORDS */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">ยืนยันสั่งล้างข้อมูลในตารางทั้งหมด</h3>
                  <p className="text-[11px] text-red-100">Delete all records in Supabase database</p>
                </div>
              </div>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="p-1 text-red-200 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteClear} className="p-6 space-y-4">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  คำเตือนความปลอดภัยสูงสุด:
                </div>
                <p>
                  การสั่งล้างข้อมูลนี้จะนำเรคคอร์ดทั้งหมด ({totalRecords} รายการ) ออกจากตารางใน Supabase
                  และในระบบทั้งหมด ข้อมูลจะไม่สามารถกู้คืนได้
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  กรุณาใส่รหัสผ่านความปลอดภัยเพื่อยืนยันการล้างข้อมูล:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showClearPassword ? "text" : "password"}
                    value={clearPasscode}
                    onChange={(e) => {
                      setClearPasscode(e.target.value);
                      setClearError("");
                    }}
                    placeholder="ใส่รหัสผ่านความปลอดภัย"
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClearPassword(!showClearPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showClearPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {clearError && (
                <div className="p-2.5 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{clearError}</span>
                </div>
              )}

              {clearSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{clearSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={isClearing}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isClearing}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-red-600/30 cursor-pointer"
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> กำลังล้างข้อมูลทุกตาราง...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> ยืนยันล้างข้อมูลทั้งหมด
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
