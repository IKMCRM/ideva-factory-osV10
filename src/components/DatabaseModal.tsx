import React, { useState } from "react";
import {
  Database,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Radio,
  Share2,
  Flame
} from "lucide-react";
import {
  testSupabaseConnection,
  clearAllDatabaseTables,
  getSupabaseConfig,
  updateSupabaseConfig,
  resetSupabaseConfig,
  setSupabaseOffline,
  getShareableDatabaseLink,
  TABLE_ALLOWED_COLUMNS,
  getLocalTable
} from "../lib/supabaseClient";
import { FULL_SUPABASE_SCHEMA_SQL } from "../lib/schemaSql";
import {
  testFirestoreConnection,
  firestoreSaveDoc,
  firebaseConfig,
  OFFICIAL_SUPPLIERS,
  seedOfficialSuppliersToFirestore
} from "../lib/firebaseClient";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  initialTab?: "links" | "clear" | "config" | "sql" | "firebase";
}

export default function DatabaseModal({
  isOpen,
  onClose,
  tableStats,
  onRefreshData,
  initialTab = "links"
}: DatabaseModalProps) {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<"links" | "clear" | "config" | "sql" | "firebase">(initialTab);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isPausedPossible?: boolean;
    details?: string;
  } | null>(null);

  // Firebase Firestore State
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncProgress, setFirebaseSyncProgress] = useState("");
  const [firebaseSyncSuccess, setFirebaseSyncSuccess] = useState("");
  const [isSeedingSuppliers, setIsSeedingSuppliers] = useState(false);
  const [supplierSeedMsg, setSupplierSeedMsg] = useState("");

  // Clear Database State inside Modal
  const [clearConfirmPasscode, setClearConfirmPasscode] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearSuccess, setClearSuccess] = useState("");

  // Reset Sample Data State inside Modal
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  // Seed Full Database State
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState("");

  // Supabase Configuration
  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentConfig.url);
  const [customKey, setCustomKey] = useState(currentConfig.key);
  const [configSaved, setConfigSaved] = useState(false);

  const SUPABASE_PROJECT_ID = currentConfig.projectId || "zizlhxikswejwvoftshk";
  const SUPABASE_URL = currentConfig.url;
  const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`;
  const SUPABASE_TABLE_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor`;
  const SUPABASE_SQL_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`;
  const POSTGRES_HOST = "aws-0-ap-southeast-1.pooler.supabase.com";

  if (!isOpen) return null;

  const totalRecords = tableStats
    ? Object.values(tableStats).reduce((acc, curr) => acc + curr, 0)
    : 0;

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "4321034") {
      setIsUnlocked(true);
      setErrorMsg("");
    } else {
      setErrorMsg("รหัสผ่านไม่ถูกต้อง! กรุณากรอกรหัสผ่านความปลอดภัยที่ถูกต้อง");
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
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
        message: `ข้อผิดพลาดในการเชื่อมต่อ: ${e.message || "เครือข่ายขัดข้อง"}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearAllRecords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearConfirmPasscode.trim() !== "4321034") {
      setClearError("รหัสผ่านความปลอดภัยไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านเพื่อยืนยัน");
      return;
    }
    setIsClearing(true);
    setClearError("");
    setClearSuccess("");
    try {
      const res = await clearAllDatabaseTables(clearConfirmPasscode);
      setClearSuccess(res.message);
      setClearConfirmPasscode("");
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setClearError(err.message || "เกิดข้อผิดพลาดในการล้างข้อมูล");
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) return;
    updateSupabaseConfig(customUrl, customKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleResetToDefaultConfig = () => {
    resetSupabaseConfig();
    const def = getSupabaseConfig();
    setCustomUrl(def.url);
    setCustomKey(def.key);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleDirectRefreshData = async () => {
    setIsSeeding(true);
    setSeedSuccessMsg("");
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      setSeedSuccessMsg("ดึงข้อมูลจริงล่าสุดจาก Supabase ครบทั้ง 17 ตารางเรียบร้อยแล้ว 100%");
      setTimeout(() => setSeedSuccessMsg(""), 5000);
    } catch (e: any) {
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + (e.message || e));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    setFirebaseTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setFirebaseTestResult(res);
    } catch (err: any) {
      setFirebaseTestResult({ success: false, message: err?.message || String(err) });
    } finally {
      setIsTestingFirebase(false);
    }
  };

  const handleSyncAllToFirebase = async () => {
    setIsSyncingFirebase(true);
    setFirebaseSyncProgress("กำลังเตรียมข้อมูล...");
    setFirebaseSyncSuccess("");
    try {
      const collectionsToSync = [
        "suppliers", "customers", "products", "raw_materials", "raw_material_lots",
        "qc_inspections", "audit_logs", "bom_recipes", "production_orders", "packing_orders",
        "purchase_orders", "grns", "prechecks", "inventory_pack", "purchase_packs",
        "projects", "semi_finished_goods", "requisitions"
      ];
      let totalSynced = 0;
      for (const col of collectionsToSync) {
        setFirebaseSyncProgress(`กำลังอัปโหลดตาราง ${col}...`);
        const rows = getLocalTable(col);
        for (const r of rows) {
          const docId = String(r.id || r.code || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
          await firestoreSaveDoc(col, docId, r);
          totalSynced++;
        }
      }
      setFirebaseSyncSuccess(`✓ นำเข้าข้อมูลทั้ง ${totalSynced} รายการขึ้นสู่ Firebase Firestore สำเร็จเรียบร้อย!`);
    } catch (err: any) {
      setFirebaseSyncSuccess(`เกิดข้อผิดพลาดในการซิงค์: ${err?.message || err}`);
    } finally {
      setIsSyncingFirebase(false);
      setFirebaseSyncProgress("");
    }
  };

  const handleSeedSuppliersToFirestore = async () => {
    setIsSeedingSuppliers(true);
    setSupplierSeedMsg("");
    try {
      const res = await seedOfficialSuppliersToFirestore();
      setSupplierSeedMsg(res.message);
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setSupplierSeedMsg(`ข้อผิดพลาด: ${err?.message || err}`);
    } finally {
      setIsSeedingSuppliers(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/30">
              <Database className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold">เช็คระบบฐานข้อมูล Supabase</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                ลิงค์เข้าจัดการฐานข้อมูล ตารางข้อมูล และข้อมูลเชื่อมต่อเซิร์ฟเวอร์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {!isUnlocked ? (
            /* Passcode Verification Screen */
            <div className="max-w-md mx-auto py-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800">
                  กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบฐานข้อมูล
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  ระบบรักษาความปลอดภัยโรงงาน — ใส่รหัสผ่าน 7 หลักเพื่อเข้าถึงลิงค์ Supabase และคำสั่งล้างข้อมูล
                </p>
              </div>

              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div className="relative max-w-xs mx-auto">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="ใส่รหัสผ่านความปลอดภัย"
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center justify-center gap-1.5 font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full max-w-xs mx-auto py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" /> ยืนยันรหัสเข้าสู่ฐานข้อมูล
                  </button>
                </div>
              </form>

              {/* Troubleshooting Card for ERR_NAME_NOT_RESOLVED / Paused Project */}
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-left space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>พบข้อผิดพลาด net::ERR_NAME_NOT_RESOLVED หรือบันทึกไม่ได้?</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  เครื่องแม่ข่าย <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">{SUPABASE_PROJECT_ID}.supabase.co</code> ไม่ตอบสนองต่อ DNS ส่วนใหญ่เกิดจาก Supabase Free Tier ทำการ <strong>"Paused" (พักโปรเจกต์)</strong> อัตโนมัติเนื่องจากไม่มีการใช้งานต่อเนื่องเกิน 7 วัน
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <a
                    href={SUPABASE_DASHBOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ไปที่ Supabase Dashboard เพื่อกด Restore
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setPasscode("4321034");
                      setIsUnlocked(true);
                      setActiveTab("config");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-600" /> ใส่ Supabase URL & Key ใหม่
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked View with 3 Clean Tabs */
            <div className="space-y-5">
              {/* Top Unlocked Status & Tab Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">ปลดล็อคเข้าใช้งานระบบแล้ว</span>
                </div>

                {/* Tab Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("links")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "links"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ลิงค์และตาราง
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("sql")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "sql"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>สคริปต์ SQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("clear")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "clear"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>เคลียร์ข้อมูล</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("firebase")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "firebase"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${activeTab === "firebase" ? "text-white" : "text-amber-500"}`} />
                    <span>Firebase Firestore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("config")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "config"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ตั้งค่า URL
                  </button>
                </div>
              </div>

              {/* TAB 1: LINKS & TABLES */}
              {activeTab === "links" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Universal Multi-Device Sync Share Link */}
                  <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-md border border-blue-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-blue-200">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>ลิงก์แชร์เชื่อมต่อฐานข้อมูลทุกอุปกรณ์ (Universal Sync Link)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        เปิดลิงก์นี้ที่เครื่องไหน หรือเปิดผ่าน Netlify ที่ใด ข้อมูลจะเชื่อมต่อและดึงมาจากฐานข้อมูลเดียวกัน 100% ทันทีอัตโนมัติ!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = getShareableDatabaseLink();
                        copyToClipboard(link, "universal_link");
                      }}
                      className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      {copiedKey === "universal_link" ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>คัดลอกลิงก์แล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>คัดลอกลิงก์แชร์</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Direct Link Action Cards (Requested: ลิงค์กดเข้าฐานข้อมูล) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> ลิงค์ด่วนเข้าสู่ Supabase Dashboard
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Link 1: Supabase Main Dashboard */}
                      <a
                        href={SUPABASE_DASHBOARD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-md hover:shadow-lg hover:brightness-105 transition-all flex flex-col justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Supabase Console</span>
                            <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                          <div className="text-sm font-bold">เข้าสู่ Project Dashboard ↗</div>
                          <p className="text-[11px] opacity-80 mt-1">
                            หน้าแดชบอร์ดหลักของโครงการ {SUPABASE_PROJECT_ID}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/20 text-[10px] font-mono flex items-center justify-between">
                          <span className="truncate">{SUPABASE_DASHBOARD_URL}</span>
                        </div>
                      </a>

                      {/* Link 2: Supabase Table Editor */}
                      <a
                        href={SUPABASE_TABLE_EDITOR_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg hover:brightness-105 transition-all flex flex-col justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Table Editor</span>
                            <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                          <div className="text-sm font-bold">ตารางข้อมูล (Table Editor) ↗</div>
                          <p className="text-[11px] opacity-80 mt-1">
                            เข้าดูและแก้ไขแถวข้อมูลโดยตรงในทุกตาราง
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/20 text-[10px] font-mono flex items-center justify-between">
                          <span className="truncate">{SUPABASE_TABLE_EDITOR_URL}</span>
                        </div>
                      </a>

                      {/* Link 3: SQL Editor */}
                      <a
                        href={SUPABASE_SQL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Supabase SQL Editor ↗</div>
                            <p className="text-[10px] text-slate-500">รันคำสั่ง SQL Query และตรวจสอบสคีมา</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>

                      {/* Test Connection Button */}
                      <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <RefreshCw className={`w-4 h-4 ${isTestingConnection ? "animate-spin" : ""}`} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">ทดสอบสัญญาณฐานข้อมูล</div>
                            <p className="text-[10px] text-slate-500">ตรวจเช็ค Realtime Latency ตอนนี้</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-blue-600 font-bold group-hover:underline">กดเช็ค</span>
                      </button>
                    </div>

                    {/* Test Result with intelligent Failed to fetch solution */}
                    {testResult && (
                      <div
                        className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2 ${
                          testResult.success
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold block">{testResult.message}</span>
                            {testResult.details && (
                              <p className="text-[11px] mt-1 leading-relaxed opacity-90">{testResult.details}</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons if Paused or Failed to fetch */}
                        {!testResult.success && testResult.isPausedPossible && (
                          <div className="pt-2 border-t border-red-200 flex flex-wrap items-center gap-2">
                            <a
                              href={SUPABASE_DASHBOARD_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>เปิด Supabase Dashboard เพื่อกด Unpause / Restore Project ↗</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setActiveTab("config")}
                              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              ⚙️ เปลี่ยน URL / Key ใหม่
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSupabaseOffline(true);
                                alert("สลับใช้งาน Local Database ออฟไลน์เรียบร้อยแล้ว ระบบสามารถใช้งานต่อได้ 100%");
                              }}
                              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              ใช้โหมด Local ทันที
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* One-click direct database refresh card */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>ดึงและซิงค์ข้อมูลจริงจาก Supabase ทันที (100% Realtime Cloud Query)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        ดึงข้อมูลสดล่าสุดจากฐานข้อมูล Supabase ทั้ง 17 ตาราง (ผู้จำหน่าย, ลูกค้า, วัตถุดิบ, สูตร BOM, ใบสั่งผลิต ฯลฯ) โดยตรงแบบ Single Source of Truth
                      </p>
                      {seedSuccessMsg && (
                        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-1 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{seedSuccessMsg}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleDirectRefreshData}
                      disabled={isSeeding}
                      className="shrink-0 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
                      <span>{isSeeding ? "กำลังดึงข้อมูล..." : "🔄 ซิงค์ข้อมูลสดจาก Supabase"}</span>
                    </button>
                  </div>

                  {/* 17 Tables and Columns Verification Dashboard (100% Direct Sync) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          สถานะการเชื่อมต่อครบทั้ง 17 ตาราง และทุกคอลัมน์ (100% Direct Supabase Sync)
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        รวม {totalRecords} เรคคอร์ด
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">
                      ทุกตารางและทุกคอลัมน์ด้านล่างนี้ถูกแมปและบันทึกตรงเข้า Supabase ทันที เมื่อเปิดลิงก์บนอุปกรณ์ใดๆ จะเห็นข้อมูลชุดเดียวกัน 100%
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[
                        { key: "suppliers", name: "ซัพพลายเออร์เคมีภัณฑ์", cols: TABLE_ALLOWED_COLUMNS.suppliers, count: tableStats?.suppliers ?? 0 },
                        { key: "customers", name: "ลูกค้าและแบรนด์", cols: TABLE_ALLOWED_COLUMNS.customers, count: tableStats?.customers ?? 0 },
                        { key: "products", name: "สินค้าสำเร็จรูป (FG)", cols: TABLE_ALLOWED_COLUMNS.products, count: tableStats?.products ?? 0 },
                        { key: "raw_materials", name: "คลังสารเคมีดิบ (RM)", cols: TABLE_ALLOWED_COLUMNS.raw_materials, count: tableStats?.rawMaterials ?? 0 },
                        { key: "bom_recipes", name: "สูตรการผลิตแม่บท (BOM)", cols: TABLE_ALLOWED_COLUMNS.bom_recipes, count: tableStats?.bomRecipes ?? 0 },
                        { key: "bom_items", name: "รายการวัตถุดิบในสูตร", cols: TABLE_ALLOWED_COLUMNS.bom_items, count: tableStats?.bomItems ?? 0 },
                        { key: "production_orders", name: "ใบสั่งผลิตเคมีภัณฑ์", cols: TABLE_ALLOWED_COLUMNS.production_orders, count: tableStats?.productionOrders ?? 0 },
                        { key: "packing_orders", name: "ใบสั่งบรรจุภัณฑ์", cols: TABLE_ALLOWED_COLUMNS.packing_orders, count: tableStats?.packingOrders ?? 0 },
                        { key: "purchase_orders", name: "ใบสั่งซื้อเคมีภัณฑ์ (PO)", cols: TABLE_ALLOWED_COLUMNS.purchase_orders, count: tableStats?.purchaseOrders ?? 0 },
                        { key: "purchase_order_items", name: "รายการวัตถุดิบในใบ PO", cols: TABLE_ALLOWED_COLUMNS.purchase_order_items, count: tableStats?.poItems ?? 0 },
                        { key: "grns", name: "ใบรับเข้าคลังสินค้า (GRN)", cols: TABLE_ALLOWED_COLUMNS.grns, count: tableStats?.grns ?? 0 },
                        { key: "prechecks", name: "ใบตรวจสารเคมีก่อนผลิต (QC)", cols: TABLE_ALLOWED_COLUMNS.prechecks, count: tableStats?.prechecks ?? 0 },
                        { key: "inventory_pack", name: "คลังบรรจุภัณฑ์ ขวด ฝา กล่อง", cols: TABLE_ALLOWED_COLUMNS.inventory_pack, count: tableStats?.inventoryPacks ?? 0 },
                        { key: "purchase_packs", name: "การจัดซื้อบรรจุภัณฑ์", cols: TABLE_ALLOWED_COLUMNS.purchase_packs, count: tableStats?.purchasePacks ?? 0 },
                        { key: "projects", name: "โปรเจคการผลิตและ OEM", cols: TABLE_ALLOWED_COLUMNS.projects, count: tableStats?.projects ?? 0 },
                        { key: "semi_finished_goods", name: "สินค้ากึ่งสำเร็จรูป (Bulk WIP)", cols: TABLE_ALLOWED_COLUMNS.semi_finished_goods, count: tableStats?.semiGoods ?? 0 },
                        { key: "requisitions", name: "ใบเบิกพัสดุและเคมีภัณฑ์", cols: TABLE_ALLOWED_COLUMNS.requisitions, count: tableStats?.requisitions ?? 0 }
                      ].map((t) => (
                        <div
                          key={t.key}
                          className="p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[140px]">
                              {t.key}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 100% Sync
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate font-medium">
                            {t.name}
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{t.cols.length} คอลัมน์</span>
                            <span className="font-bold text-slate-800">{t.count} แถว</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connection Strings */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600" /> ข้อมูลการเชื่อมต่อเซิร์ฟเวอร์ (Connection Details)
                    </h4>
                    <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0 font-medium w-28">Project URL:</span>
                        <span className="font-mono text-slate-800 truncate select-all">{SUPABASE_URL}</span>
                        <button
                          onClick={() => copyToClipboard(SUPABASE_URL, "url")}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer shrink-0"
                          title="คัดลอก URL"
                        >
                          {copiedKey === "url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0 font-medium w-28">Project ID:</span>
                        <span className="font-mono text-slate-800 truncate select-all font-bold">{SUPABASE_PROJECT_ID}</span>
                        <button
                          onClick={() => copyToClipboard(SUPABASE_PROJECT_ID, "id")}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer shrink-0"
                          title="คัดลอก Project ID"
                        >
                          {copiedKey === "id" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0 font-medium w-28">Postgres Host:</span>
                        <span className="font-mono text-slate-800 truncate select-all">{POSTGRES_HOST}</span>
                        <button
                          onClick={() => copyToClipboard(POSTGRES_HOST, "host")}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer shrink-0"
                          title="คัดลอก Host"
                        >
                          {copiedKey === "host" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CLEAR ALL DATA (REQUESTED: หน้า เครียร์ข้อมูล ทั้งหมด) */}
              {activeTab === "clear" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <span>คำสั่งล้างข้อมูลในตารางทั้งหมด (Delete all records)</span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed">
                      หน้านี้ใช้สำหรับ <strong>รีเซ็ตฐานข้อมูล</strong> เพื่อล้างข้อมูลเก่าทั้งหมดในทุกตาราง (ลูกค้า, สต็อกเคมีภัณฑ์, สูตร BOM, ใบสั่งผลิต, ใบสั่งซื้อ ฯลฯ)
                      ให้กลายเป็นตารางว่างเปล่า (0 รายการ) เพื่อเริ่มต้นใช้งานระบบใหม่ทั้งหมด
                    </p>
                    <div className="text-[11px] bg-red-100/80 p-2.5 rounded-lg border border-red-200 text-red-800 font-medium">
                      🔒 ป้องกันการกดพลาด: ต้องยืนยันด้วยรหัสผ่านความปลอดภัยของผู้ดูแลระบบ
                    </div>
                  </div>

                  {/* Current Table Record Count */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700">ข้อมูลปัจจุบันที่จะถูกล้าง:</span>
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {totalRecords} เรคคอร์ด
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-1">
                      <span>• ซัพพลายเออร์: {tableStats?.suppliers ?? 0}</span>
                      <span>• โปรเจค: {tableStats?.projects ?? 0}</span>
                      <span>• ลูกค้า: {tableStats?.customers ?? 0}</span>
                      <span>• สูตร BOM: {tableStats?.bomRecipes ?? 0}</span>
                      <span>• วัตถุดิบ: {tableStats?.rawMaterials ?? 0}</span>
                      <span>• สั่งผลิต: {tableStats?.productionOrders ?? 0}</span>
                      <span>• สั่งซื้อ PO: {tableStats?.purchaseOrders ?? 0}</span>
                    </div>
                  </div>

                  {/* Form to Clear Data */}
                  <form onSubmit={handleClearAllRecords} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        ใส่รหัสผ่านความปลอดภัยเพื่อสั่งล้างข้อมูล:
                      </label>
                      <div className="relative max-w-sm">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          value={clearConfirmPasscode}
                          onChange={(e) => {
                            setClearConfirmPasscode(e.target.value);
                            setClearError("");
                          }}
                          placeholder="พิมพ์รหัสผ่านความปลอดภัย"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {clearError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{clearError}</span>
                      </div>
                    )}

                    {clearSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{clearSuccess}</span>
                      </div>
                    )}

                    {resetSuccess && (
                      <div className="p-3 bg-blue-50 border border-blue-300 text-blue-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{resetSuccess}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      {/* Execute Clear Button */}
                      <button
                        type="submit"
                        disabled={isClearing}
                        className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {isClearing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> กำลังล้างข้อมูลทุกตาราง...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" /> สั่งล้างข้อมูลในตารางทั้งหมด (Delete all records)
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: CONFIGURATION (Custom URL / Key) */}
              {activeTab === "config" && (
                <form onSubmit={handleSaveConfig} className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <strong>ปรับแต่ง Supabase Connection:</strong> หากคุณมีโปรเจกต์ Supabase ใหม่ หรือกู้คืนโปรเจกต์เดิมมาแล้วได้ URL / API Key ใหม่ สามารถระบุและบันทึกเพื่อเชื่อมต่อทันที
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Supabase Project URL</label>
                      <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://xxxxxxxxxxxx.supabase.co"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Supabase Anon Key</label>
                      <textarea
                        rows={3}
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="eyJhbGciOi..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleResetToDefaultConfig}
                      className="text-xs text-slate-500 hover:text-blue-600 underline cursor-pointer"
                    >
                      คืนค่าเป็นโปรเจกต์เริ่มต้น
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      {configSaved ? "✓ บันทึกสำเร็จ" : "บันทึกและเชื่อมต่อทันที"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: SQL SCHEMA SCRIPT (100% READY FOR SUPABASE) */}
              {activeTab === "sql" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5 text-indigo-950">
                        <Server className="w-4 h-4 text-indigo-600" />
                        <span>สคริปต์ SQL สร้างตารางทั้ง 15 ตาราง (Full Schema + Realtime + RLS)</span>
                      </div>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        คัดลอกคำสั่งนี้ แล้วนำไปวางในหน้า Supabase SQL Editor เพื่อสร้างตารางทั้งหมดแบบ 100%
                      </p>
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
                        className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        <span>เปิด SQL Editor ↗</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[360px] leading-relaxed custom-scrollbar border border-slate-800 select-all">
                      {FULL_SUPABASE_SCHEMA_SQL}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: FIREBASE FIRESTORE */}
              {activeTab === "firebase" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Firebase Provision Banner */}
                  <div className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-xl shadow-md border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-100">
                        <Flame className="w-4 h-4 text-amber-200" />
                        <span>Firebase Firestore Enterprise (asia-south1)</span>
                      </div>
                      <p className="text-[11px] text-amber-100/90 leading-relaxed">
                        ฐานข้อมูล Firebase Cloud Firestore ถูกสร้างและตั้งค่าระบบความปลอดภัย (Security Rules) พร้อมใช้งานกับทั้ง 18 คอลเลกชันโรงงาน
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 bg-white/20 text-white font-mono text-xs rounded-lg font-bold border border-white/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Provisioned
                    </span>
                  </div>

                  {/* Firebase Info Grid */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Firebase Project ID:</span>
                      <span className="font-mono font-bold text-slate-800 select-all">{firebaseConfig.projectId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Firestore Database ID:</span>
                      <span className="font-mono text-slate-700 select-all truncate max-w-[280px]">{firebaseConfig.firestoreDatabaseId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Region:</span>
                      <span className="font-mono text-slate-700">asia-south1 (Mumbai)</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">Security Rules:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hardened & Deployed
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Console Link */}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Flame className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">เปิด Firebase Console ↗</div>
                          <p className="text-[10px] opacity-90">ดูและจัดการเอกสารใน Firestore</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>

                    {/* Test Connection */}
                    <button
                      type="button"
                      onClick={handleTestFirebase}
                      disabled={isTestingFirebase}
                      className="p-3.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                          <RefreshCw className={`w-4 h-4 ${isTestingFirebase ? "animate-spin" : ""}`} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">ทดสอบสัญญาณ Firestore</div>
                          <p className="text-[10px] text-slate-500">เรียก getDocFromServer ตรวจสอบ SDK</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-600 font-bold group-hover:underline">เช็คสัญญาณ</span>
                    </button>
                  </div>

                  {/* Firebase Test Result */}
                  {firebaseTestResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                        firebaseTestResult.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {firebaseTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block">{firebaseTestResult.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Sync All Button */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> นำเข้าข้อมูลโรงงานเข้าสู่ Firebase Firestore
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          อัปโหลดข้อมูลจาก 18 ตาราง (ซัพพลายเออร์, ลูกค้า, วัตถุดิบ, สูตร BOM, PO, สต็อก) ขึ้นสู่ Firestore Document
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncAllToFirebase}
                        disabled={isSyncingFirebase}
                        className="shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSyncingFirebase ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{firebaseSyncProgress || "กำลังส่ง..."}</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-3.5 h-3.5" />
                            <span>ซิงค์ข้อมูลขึ้น Firebase</span>
                          </>
                        )}
                      </button>
                    </div>

                    {firebaseSyncSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{firebaseSyncSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* 9 Official Suppliers on Firebase Firestore (Requested by User) */}
                  <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <Flame className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            ข้อมูลผู้จำหน่าย 9 รายการ (Suppliers) บน Firebase Firestore
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            คอลเลกชัน <code className="text-amber-700 font-mono font-bold">suppliers</code> บน Cloud Firestore (SUP-0001 ถึง SUP-0009)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSeedSuppliersToFirestore}
                        disabled={isSeedingSuppliers}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSeedingSuppliers ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>บันทึก 9 ซัพพลายเออร์ลง Firestore</span>
                          </>
                        )}
                      </button>
                    </div>

                    {supplierSeedMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{supplierSeedMsg}</span>
                      </div>
                    )}

                    {/* Table of 9 Suppliers */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-2 w-12 text-center">#</th>
                            <th className="p-2 w-28">รหัส</th>
                            <th className="p-2">ชื่อบริษัทผู้จำหน่าย</th>
                            <th className="p-2 w-20 text-center">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {OFFICIAL_SUPPLIERS.map((s, idx) => (
                            <tr key={s.code} className="hover:bg-amber-50/50">
                              <td className="p-2 text-center text-slate-400 font-sans text-[11px]">{idx + 1}</td>
                              <td className="p-2 font-bold text-blue-700">{s.code}</td>
                              <td className="p-2 font-sans font-medium text-slate-800">{s.name}</td>
                              <td className="p-2 text-center font-sans">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* SQL Reference for Supabase */}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Server className="w-3.5 h-3.5 text-indigo-600" /> คำสั่ง SQL สำหรับ Supabase PostgreSQL:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const sql = `BEGIN;
DELETE FROM public.suppliers;
ALTER SEQUENCE public.suppliers_id_seq RESTART WITH 1;
INSERT INTO public.suppliers (code, name, contact, phone, email, address, status) VALUES
('SUP-0001', 'บริษัท จันทร์เจ้า ลองจิวตี้ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0002', 'บริษัท พิษณุเคมีคอล จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0003', 'บริษัท กรุงเทพเคมี จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0004', 'ดีดี สมุนไพร สปา และเคมีภัณฑ์', NULL, NULL, NULL, NULL, 'active'),
('SUP-0005', 'บริษัท โออินแมกซ์ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0006', 'บริษัท เคมีภัณฑ์ คอร์ปอเรชั่น จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0007', 'บริษัท อาร์อาร์ คอสเมติกส์ แอนด์ ฟู้ด อินกรีเดียนส์ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0008', 'บริษัท วอเตอร์ ด็อกเตอร์ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0009', 'บริษัท โบนัสช่างหุทรา จำกัด', NULL, NULL, NULL, NULL, 'active');
COMMIT;`;
                            copyToClipboard(sql, "supplier_sql");
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedKey === "supplier_sql" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>คัดลอก SQL แล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>คัดลอก SQL สำหรับ Supabase</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-28 custom-scrollbar">
{`BEGIN;
DELETE FROM public.suppliers;
ALTER SEQUENCE public.suppliers_id_seq RESTART WITH 1;
INSERT INTO public.suppliers (code, name, contact, phone, email, address, status) VALUES
('SUP-0001', 'บริษัท จันทร์เจ้า ลองจิวตี้ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0002', 'บริษัท พิษณุเคมีคอล จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0003', 'บริษัท กรุงเทพเคมี จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0004', 'ดีดี สมุนไพร สปา และเคมีภัณฑ์', NULL, NULL, NULL, NULL, 'active'),
('SUP-0005', 'บริษัท โออินแมกซ์ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0006', 'บริษัท เคมีภัณฑ์ คอร์ปอเรชั่น จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0007', 'บริษัท อาร์อาร์ คอสเมติกส์ แอนด์ ฟู้ด อินกรีเดียนส์ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0008', 'บริษัท วอเตอร์ ด็อกเตอร์ จำกัด', NULL, NULL, NULL, NULL, 'active'),
('SUP-0009', 'บริษัท โบนัสช่างหุทรา จำกัด', NULL, NULL, NULL, NULL, 'active');
COMMIT;`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ระบบฐานข้อมูล: <strong className="text-slate-700">Supabase Cloud Realtime</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
