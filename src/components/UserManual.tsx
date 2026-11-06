import React, { useState } from "react";
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Printer, 
  Sparkles, 
  Layers, 
  Users, 
  ClipboardList, 
  ShieldCheck, 
  FileText, 
  Boxes, 
  ShoppingCart, 
  Truck, 
  Warehouse, 
  LineChart, 
  Info, 
  AlertTriangle, 
  Lightbulb,
  ExternalLink,
  Workflow,
  Check,
  Zap
} from "lucide-react";

interface UserManualProps {
  onNavigate: (page: string) => void;
}

interface ManualSection {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  pageKey: string;
  summary: string;
  purpose: string;
  features: string[];
  steps: { title: string; desc: string; detail?: string }[];
  tips: string[];
  warnings?: string[];
}

export default function UserManual({ onNavigate }: UserManualProps) {
  const [activeTab, setActiveTab] = useState<string>("workflow");
  const [searchQuery, setSearchQuery] = useState("");

  const manualSections: ManualSection[] = [
    {
      id: "dashboard",
      title: "1. แดชบอร์ด (Dashboard)",
      category: "ภาพรวม",
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      pageKey: "dashboard",
      summary: "หน้าศูนย์รวมข้อมูลตัวเลข KPI การผลิต คำสั่งซื้อ และแจ้งเตือนสำคัญแบบ Real-time",
      purpose: "ให้ผู้บริหารและผู้ควบคุมการผลิตเห็นภาพรวมการดำเนินงานของโรงงานในหน้าเดียว โดยไม่ต้องไล่เปิดทีละเมนู",
      features: [
        "สรุปการ์ดตัวเลข KPI 4 ด้าน: จำนวนสั่งผลิตทั้งหมด, ยอดจัดซื้อวัตถุดิบ, มูลค่าคลังสินค้า, สารเคมีต่ำกว่าเกณฑ์",
        "กราฟเส้นวิเคราะห์เทรนด์ ยอดการผลิตเทียบกับยอดจัดซื้อวัตถุดิบ",
        "กราฟวงกลม/โดนัทแสดงสัดส่วนสถานะคำสั่งผลิต (ฉบับร่าง, รอดำเนินการ, กำลังผลิต, ผลิตเสร็จสิ้น)",
        "ระบบแจ้งเตือน Real-time Smart Alerts แสดงวัตถุดิบที่ใกล้หมด และงานผลิตที่กำลังเดินเครื่อง",
        "รายการกิจกรรมล่าสุดในโรงงาน (Recent Activities)"
      ],
      steps: [
        {
          title: "ตรวจสอบการ์ดตัวเลข KPI ด้านบนสุด",
          desc: "ดูจำนวนคำสั่งผลิต ยอดจัดซื้อรวม และจำนวนสารเคมีเตือนสต็อกต่ำ"
        },
        {
          title: "สังเกตกล่องแจ้งเตือน Smart Alerts",
          desc: "หากมีแถบสีเหลืองหรือสีแดง สามารถกดที่ข้อความแจ้งเตือนเพื่อวาร์ปไปยังหน้าจัดการวัตถุดิบหรือสั่งผลิตได้ทันที"
        },
        {
          title: "วิเคราะห์กราฟเปรียบเทียบ",
          desc: "ดูกราฟเทรนด์ประจำเดือนเพื่อวางแผนกำลังการผลิตและการสั่งซื้อเคมีภัณฑ์ล่วงหน้า"
        }
      ],
      tips: [
        "กดที่การ์ดแจ้งเตือนวัตถุดิบเตือนต่ำกว่าเกณฑ์ เพื่อข้ามไปดูรายชื่อเคมีดิบในคลังได้ทันที",
        "ข้อมูลในแดชบอร์ดจะอัปเดตอัตโนมัติเมื่อมีการบันทึกข้อมูลจากเมนูอื่น"
      ]
    },
    {
      id: "customer",
      title: "2. บริหารจัดการลูกค้า (Customers)",
      category: "ข้อมูลหลัก",
      icon: <Users className="w-5 h-5 text-purple-600" />,
      pageKey: "customer",
      summary: "จัดการฐานข้อมูลลูกค้า OEM/ODM, ผู้สั่งผลิตเคมีภัณฑ์ และประวัติคำสั่งซื้อ",
      purpose: "จัดเก็บข้อมูลผู้ติดต่อ ที่อยู่จัดส่ง เลขผู้เสียภาษี และประวัติการรับบริการสั่งผลิตของลูกค้ารายบุคคล",
      features: [
        "ตารางแสดงรายชื่อลูกค้า รหัสลูกค้า ชื่อบริษัท ผู้ติดต่อ เบอร์โทรศัพท์ และอีเมล",
        "ฟังก์ชันเพิ่มลูกค้าใหม่ (Add Customer) พร้อมระบบรันรหัสลูกค้าอัตโนมัติ (เช่น CUST-001)",
        "แก้ไขข้อมูลผู้ติดต่อและที่อยู่จัดส่งเอกสาร/สินค้า",
        "ดูประวัติคำสั่งผลิต (Order History) ทั้งหมดที่ลูกค้ารายนี้เคยสั่งผลิต"
      ],
      steps: [
        {
          title: "กดปุ่ม '+ เพิ่มลูกค้าใหม่'",
          desc: "มุมขวาบนของตาราง เพื่อเปิดหน้าต่างบันทึกข้อมูล"
        },
        {
          title: "กรอกข้อมูลบริษัทและผู้ติดต่อ",
          desc: "ใส่ชื่อบริษัท/ลูกค้า, ชื่อผู้ติดต่อ, เบอร์โทรศัพท์, อีเมล และที่อยู่จัดส่งให้ครบถ้วน"
        },
        {
          title: "บันทึกข้อมูล",
          desc: "กดปุ่มบันทึก รายชื่อลูกค้าจะพร้อมใช้อ้างอิงในใบสั่งผลิตทันที"
        }
      ],
      tips: [
        "สามารถค้นหาชื่อลูกค้าผ่านช่องค้นหาด่วนได้ตลอดเวลา",
        "เมื่อเลือกลูกค้าในใบสั่งผลิต ข้อมูลที่อยู่จะถูกดึงไปแสดงในเอกสารอัตโนมัติ"
      ]
    },
    {
      id: "bom",
      title: "3. สูตรการผลิต (BOM - Bill of Materials)",
      category: "ข้อมูลหลัก",
      icon: <ClipboardList className="w-5 h-5 text-amber-600" />,
      pageKey: "bom",
      summary: "กำหนดโครงสร้างสูตรผสมเคมีภัณฑ์ สัดส่วนสารเคมี Part A/B/C และคำนวณต้นทุนประเมิน",
      purpose: "สร้างมาตรฐานการผสมเคมีภัณฑ์ (Recipe Standard) ป้องกันความผิดพลาดสัดส่วนเคมี และคำนวณต้นทุนต่อหน่วย",
      features: [
        "กำหนด Part No. (เช่น PART-001), รหัสสินค้า, ชื่อผลิตภัณฑ์เคมี และเวอร์ชันสูตร (เช่น v1.0)",
        "ใส่ส่วนผสมสารเคมีแบบละเอียด รองรับการกำหนดกลุ่ม Part (Part A, Part B, Part C) สำหรับขั้นตอนผสม",
        "รองรับการใส่สัดส่วนปริมาณเป็นทศนิยมละเอียด (เช่น 0.01 KG.)",
        "คำนวณต้นทุนวัตถุดิบประมาณการต่อหน่วย (Estimated Unit Cost) อัตโนมัติจากราคาล่าสุดในคลัง",
        "บันทึกขั้นตอนคำแนะนำการผสม (Mixing Instructions) ทีละข้อ",
        "ฟังก์ชันคัดลอกสูตร (Clone BOM) เพื่อสร้างเวอร์ชันใหม่ได้สะดวกรวดเร็ว",
        "พิมพ์เอกสารใบสูตร BOM (BOM Print Out) รูปแบบมาตรฐาน A4 สำหรับฝ่ายผลิต"
      ],
      steps: [
        {
          title: "กดปุ่ม '+ สร้างสูตร BOM ใหม่'",
          desc: "ระบุ Part No., รหัสสินค้า และชื่อผลิตภัณฑ์เคมีภัณฑ์ที่ต้องการผลิต"
        },
        {
          title: "เพิ่มรายการสารเคมีส่วนผสม",
          desc: "ระบุ Part (A, B, C), พิมพ์ค้นหารหัสหรือชื่อเคมีดิบ ระบบจะดึงหน่วยวัดและราคาให้อัตโนมัติ แล้วใส่ปริมาณสัดส่วน"
        },
        {
          title: "ระบุขั้นตอนและข้อควรระวังในการผสม",
          desc: "เพิ่มบรรทัดคำแนะนำการผสม เช่น '1. เติม Part A ลงถังปั่นที่ความเร็ว 500 RPM', '2. ค่อยๆ เท Part B'"
        },
        {
          title: "บันทึกและพิมพ์ใบสูตร",
          desc: "ตรวจสอบต้นทุนประมาณการต่อหน่วย แล้วกดบันทึก สามารถพิมพ์ออกเอกสาร A4 นำไปติดหน้าถังผสมได้"
        }
      ],
      tips: [
        "การแบ่ง Part A, B, C จะช่วยให้ช่างควบคุมการผสมทำงานตามลำดับความร้อน/ความเย็นและการทำละลายของเคมีได้ถูกต้อง",
        "หากราคาวัตถุดิบในคลังเปลี่ยน ต้นทุนประมาณการใน BOM จะคำนวณปรับตามให้อัตโนมัติ"
      ],
      warnings: [
        "ตรวจสอบหน่วยวัดของวัตถุดิบใน BOM ให้ตรงกับหน่วยวัดในคลังสารเคมีเพื่อความแม่นยำในการตัดสต็อก"
      ]
    },
    {
      id: "precheck",
      title: "4. ตรวจสอบก่อนผลิต (Precheck)",
      category: "การผลิต",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      pageKey: "precheck",
      summary: "ระบบตรวจสอบความพร้อมก่อนเริ่มเดินเครื่องผสมสารเคมี (Pre-production QC)",
      purpose: "รับประกันคุณภาพความสะอาดเครื่องจักร ถังปั่น สต็อกเคมี และอุปกรณ์ความปลอดภัย ป้องกันการปนเปื้อนก่อนเริ่มผลิต",
      features: [
        "ลงทะเบียนใบตรวจเช็คก่อนผลิต (Pre-production Checklist Code)",
        "เช็คความสะอาดเครื่องจักร ถังผสม ระบบไฟฟ้า และอุปกรณ์ความปลอดภัย (PPE)",
        "ตรวจเช็คความพร้อมวัตถุดิบเคมีดิบตามสูตร BOM",
        "บันทึกผลการตรวจสอบ (ผ่าน / ไม่ผ่าน / รอดำเนินการ)",
        "บันทึกชื่อผู้ตรวจสอบและข้อเสนอแนะ"
      ],
      steps: [
        {
          title: "สร้างใบตรวจเช็คก่อนผลิต",
          desc: "เลือกใบสั่งผลิตหรือผลิตภัณฑ์เคมีที่กำลังจะเริ่มผสม"
        },
        {
          title: "ลงพื้นที่ตรวจเช็คตามรายการมาตรฐาน",
          desc: "ติ๊กตรวจความสะอาดถังผสม ระบบกวน ถุงกรอง และวัตถุดิบ"
        },
        {
          title: "สรุปผลและอนุมัติ",
          desc: "หากผ่านทุกรายการ ให้เปลี่ยนสถานะเป็น 'ผ่าน (PASS)' เพื่อให้ฝ่ายผลิตเริ่มเดินเครื่องได้"
        }
      ],
      tips: [
        "หากผลตรวจไม่ผ่าน (FAIL) ระบบจะแสดงการ์ดเตือนสีแดงในแดชบอร์ดเพื่อให้ฝ่ายคิวซีเข้าแก้ไขทันที"
      ]
    },
    {
      id: "production",
      title: "5. ใบสั่งผลิต (Production Orders / Work Orders)",
      category: "การผลิต",
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      pageKey: "production",
      summary: "วางแผน คำนวณอัตราส่วนเคมีตามขนาด Batch Size และติดตามสถานะการผสมเคมี",
      purpose: "แปลงสูตร BOM มาเป็นคำสั่งผลิตจริง คำนวณปริมาณสารเคมีที่ต้องใช้ตามขนาดถังผสม (Batch Size) และดึงวัตถุดิบตามหลัก FEFO",
      features: [
        "สร้างใบสั่งผลิต (WO Code) เลือกลูกค้า และเลือกสูตร BOM ที่ต้องการผลิต",
        "ใส่จำนวน Batch Size ที่ต้องการผลิต ระบบจะคำนวณปริมาณเคมีดิบที่ต้องใช้ทุการรายการให้อัตโนมัติ",
        "ระบบเชื่อมโยงคลัง FEFO เลือกสารเคมีล๊อตที่หมดอายุเร็วที่สุดมาตัดใช้ก่อน",
        "ติดตามสถานะการผลิต: Draft (ฉบับร่าง) ➔ Pending (รอดำเนินการ) ➔ Running (กำลังผลิต) ➔ Completed (ผลิตเสร็จสิ้น)",
        "เมื่อเปลี่ยนสถานะเป็น Completed ระบบจะตัดสต็อกวัตถุดิบเคมีดิบออกจากคลังจริงทันที",
        "พิมพ์ใบสั่งผลิตมาตรฐาน (Work Order Print Out) สำหรับช่างผสมเคมี"
      ],
      steps: [
        {
          title: "กด '+ สร้างใบสั่งผลิต'",
          desc: "เลือกลูกค้า และเลือกผลิตภัณฑ์เคมีภัณฑ์จากสูตร BOM"
        },
        {
          title: "ระบุปริมาณที่ต้องการผลิต (Batch Size)",
          desc: "ระบบจะคำนวณสัดส่วนสารเคมีดิบแต่ละตัวให้อัตโนมัติ และแสดงรายการล๊อต FEFO ที่จะถูกตัดสต็อก"
        },
        {
          title: "สั่งเริ่มการผลิต (Start Running)",
          desc: "เมื่อช่างเริ่มผสมเคมี ให้เปลี่ยนสถานะเป็น 'กำลังผลิต'"
        },
        {
          title: "จบการผลิต (Complete Order)",
          desc: "เมื่อผสมเสร็จเรียบร้อย เปลี่ยนสถานะเป็น 'เสร็จสิ้น' ระบบจะตัดสต็อกสารเคมีดิบจริงทันที"
        }
      ],
      tips: [
        "พิมพ์ใบสั่งผลิตติดไว้ที่หน้าถังผสม เพื่อให้ช่างติ๊กตามรายการเคมี Part A, B, C และขั้นตอนการผสม"
      ]
    },
    {
      id: "packing",
      title: "6. ใบสั่งบรรจุ (Packing Orders)",
      category: "การผลิต",
      icon: <Boxes className="w-5 h-5 text-indigo-600" />,
      pageKey: "packing",
      summary: "การบรรจุเคมีภัณฑ์ลงขวด แกลลอน หรือถุง พร้อมติดตาม Yield และ Loss",
      purpose: "นำเคมีภัณฑ์ที่ผสมเสร็จแล้ว มาทำการบรรจุลงบรรจุภัณฑ์ (HDPE/ขวด/ถุง/แกลลอน) ติดฉลาก และคำนวณประสิทธิภาพการบรรจุ",
      features: [
        "สร้างใบสั่งบรรจุ (Packing Order Code) อ้างอิงจากใบสั่งผลิตที่ผสมเสร็จแล้ว",
        "เลือกชนิดบรรจุภัณฑ์จากคลัง (เช่น ขวด HDPE 1,000ml, ฝา, ฉลาก)",
        "บันทึกจำนวนที่บรรจุได้จริง และจำนวนที่สูญเสีย/ของเสีย (Yield & Loss)",
        "ตัดสต็อกบรรจุภัณฑ์ออกจากคลัง และเพิ่มสินค้าสำเร็จรูป (Finished Goods) เข้าสต็อก",
        "พิมพ์ใบสั่งบรรจุและรายงานผลบรรจุ"
      ],
      steps: [
        {
          title: "กด '+ สร้างใบสั่งบรรจุ'",
          desc: "เลือกใบสั่งผลิตที่ผสมเสร็จแล้ว"
        },
        {
          title: "เลือกรายการบรรจุภัณฑ์ที่ใช้",
          desc: "ระบุขวด, ฝา, ฉลาก หรือกล่องบรรจุภัณฑ์"
        },
        {
          title: "บันทึกจำนวนผลิตได้จริง (Yield)",
          desc: "ใส่จำนวนชิ้นที่บรรจุผ่าน QC และจำนวนชิ้นที่เสีย"
        },
        {
          title: "ยืนยันเสร็จสิ้นงานบรรจุ",
          desc: "ระบบจะตัดสต็อกขวด/ฉลาก และเพิ่ม Finished Goods เข้าคลังสินค้าพร้อมส่งมอบ"
        }
      ],
      tips: [
        "การติดตามเปอร์เซ็นต์ Loss ช่วยให้วิเคราะห์ปัญหาหัวฉีดหรือการรั่วซึมของสายบรรจุได้"
      ]
    },
    {
      id: "purchase",
      title: "7. จัดซื้อวัตถุดิบ (Purchase Orders - PO)",
      category: "จัดซื้อและคลัง",
      icon: <ShoppingCart className="w-5 h-5 text-teal-600" />,
      pageKey: "purchase",
      summary: "ออกใบสั่งซื้อวัตถุดิบเคมีและบรรจุภัณฑ์ (PO) ไปยัง Supplier",
      purpose: "จัดการกระบวนการจัดซื้อสารเคมีอย่างเป็นระบบ คำนวณยอดเงินรวม ตรวจสอบการอนุมัติ และพิมพ์เอกสาร PO ส่งผู้ขาย",
      features: [
        "สร้างใบสั่งซื้อ PO (เช่น PO-2026-001) พร้อมเลือกร้านผู้จำหน่าย (Supplier)",
        "เพิ่มรายการวัตถุดิบเคมีดิบหรือบรรจุภัณฑ์ที่ต้องการสั่งซื้อ พร้อมระบุปริมาณและราคา/หน่วย",
        "คำนวณยอดรวมเงินและภาษีให้อัตโนมัติ",
        "ติดตามสถานะ PO: Pending (รอรับของ) ➔ Completed (รับของแล้ว)",
        "มีปุ่มทางลัด 'รับเคมีเข้าคลังอัตโนมัติ' ช่วยให้แปลง PO เป็น GRN ได้ในคลิกเดียว",
        "พิมพ์ใบสั่งซื้อ PO มาตรฐานส่งซัพพลายเออร์"
      ],
      steps: [
        {
          title: "กด '+ สร้างใบสั่งซื้อ PO'",
          desc: "เลือกร้านผู้จำหน่าย (Supplier) และระบุวันที่กำหนดส่งมอบ"
        },
        {
          title: "เลือกรายการเคมีดิบที่ต้องการสั่งซื้อ",
          desc: "ใส่จำนวน และราคาต่อหน่วย ระบบจะรวมเงินให้อัตโนมัติ"
        },
        {
          title: "อนุมัติและพิมพ์ใบ PO",
          desc: "พิมพ์ออกเป็นเอกสาร PDF/A4 เพื่อส่งให้ Supplier ดำเนินการจัดส่ง"
        },
        {
          title: "บันทึกรับของเมื่อเคมีมาถึง",
          desc: "เมื่อของมาส่ง กดปุ่มรับเคมีเข้าคลัง ระบบจะสร้างใบ GRN และปรับเพิ่มสต็อกให้ทันที"
        }
      ],
      tips: [
        "สามารถสร้าง Supplier รายใหม่ไว้ในระบบเพื่อเลือกรวดเร็วในครั้งถัดไป"
      ]
    },
    {
      id: "grn",
      title: "8. รับเข้าคลัง (Goods Received Note - GRN)",
      category: "จัดซื้อและคลัง",
      icon: <Truck className="w-5 h-5 text-emerald-600" />,
      pageKey: "grn",
      summary: "บันทึกการรับมอบสารเคมีเข้าคลัง ตรวจสอบ Lot Number และวันหมดอายุ",
      purpose: "สร้างหลักฐานการรับเข้าสารเคมีจริง ควบคุมคุณภาพล๊อต (Lot Traceability) และบันทึกวันหมดอายุเพื่อใช้กับระบบ FEFO",
      features: [
        "สร้างใบรับเข้า GRN อ้างอิงใบสั่งซื้อ PO หรือบันทึกรับเข้าโดยตรง",
        "ระบุ Lot Number ของสารเคมีจากผู้ผลิต (Supplier Lot)",
        "บันทึกวันหมดอายุของล๊อตเคมี (Expiry Date)",
        "บันทึกราคาต่อหน่วยรับเข้าจริง และผู้เซ็นต์รับของเข้าคลัง",
        "เชื่อมโยงข้อมูลไปยังตาราง FEFO สำหรับลำดับการเบิกจ่ายไปผลิต"
      ],
      steps: [
        {
          title: "กด '+ บันทึกรับเคมีเข้าคลัง (GRN)'",
          desc: "เลือกรหัส PO อ้างอิง หรือเลือกสารเคมีดิบโดยตรง"
        },
        {
          title: "ใส่ข้อมูลสำคัญของล๊อตสารเคมี",
          desc: "กรอก Lot Number, วันหมดอายุ (Expiry Date) และจำนวนที่รับจริง"
        },
        {
          title: "ลงชื่อผู้รับเข้าและบันทึก",
          desc: "สต็อกในคลังจะถูกปรับเพิ่มขึ้นตามจำนวนที่รับจริงทันที"
        }
      ],
      tips: [
        "การระบุวันหมดอายุอย่างถูกต้องเป็นสิ่งสำคัญมาก เพราะระบบจะนำไปจัดลำดับ FEFO ในการสั่งผลิต"
      ]
    },
    {
      id: "inventory",
      title: "9. สต็อกคงคลัง (Inventory & FEFO Inspection)",
      category: "จัดซื้อและคลัง",
      icon: <Warehouse className="w-5 h-5 text-cyan-600" />,
      pageKey: "inventory",
      summary: "บริหารจัดการสต็อกเคมีดิบ บรรจุภัณฑ์ สินค้าสำเร็จรูป และระบบตรวจสอบ FEFO",
      purpose: "ตรวจสอบยอดคงเหลือเคมีดิบ มูลค่าสต็อกรวม กรองตามผู้จำหน่าย และตรวจสอบลำดับการดึงสารเคมีตามวันหมดอายุ",
      features: [
        "แบ่งหมวดหมู่ชัดเจน 3 แท็บ: วัตถุดิบเคมีดิบ, บรรจุภัณฑ์, ผลิตภัณฑ์สำเร็จรูป (FG)",
        "ตัวกรองแยกตามร้านผู้จำหน่าย (Supplier Filter) ดูสต็อกแยกตามราย Supplier ได้ง่าย",
        "แสดงรูปภาพวัตถุดิบเคมี, ราคาต่อหน่วย, มูลค่ารวมสต็อก และระดับสถานะสต็อก (ปกติ / เตือนสต็อกต่ำ)",
        "ปุ่มตรวจล๊อตตามหลัก FEFO (First Expired, First Out) แสดงลำดับล๊อตสารเคมีที่หมดอายุเร็วที่สุดพร้อมคำอธิบายการใช้งาน",
        "เพิ่ม/แก้ไข ข้อมูลสารเคมีดิบ ราคาประเมิน และภาพถ่ายเคมีภัณฑ์"
      ],
      steps: [
        {
          title: "เลือกแท็บประเภทคลังสินค้า",
          desc: "สลับดูวัตถุดิบเคมีดิบ บรรจุภัณฑ์ หรือสินค้าสำเร็จรูป"
        },
        {
          title: "ใช้ตัวกรอง Supplier หรือ ค้นหาด่วน",
          desc: "เลือกดูเฉพาะเคมีดิบจากซัพพลายเออร์รายที่ต้องการ"
        },
        {
          title: "กดปุ่ม 'ตรวจสอบล๊อตตามหลัก FEFO'",
          desc: "เพื่อดูตารางจัดลำดับว่าสารเคมีล๊อตไหนจะถูกดึงไปผสมผลิตก่อนตามวันหมดอายุ"
        }
      ],
      tips: [
        "หากรายการใดแสดงแถบสีแดง 'สต็อกต่ำกว่าเกณฑ์' ให้รีบดำเนินการเปิดใบสั่งซื้อ PO เพิ่มเติม"
      ]
    },
    {
      id: "report",
      title: "10. รายงานสรุป (Reports & Analytics)",
      category: "รายงาน",
      icon: <LineChart className="w-5 h-5 text-rose-600" />,
      pageKey: "report",
      summary: "รายงานวิเคราะห์ผลการดำเนินงาน มูลค่าสต็อก ประวัติการผลิต และประสิทธิภาพ",
      purpose: "สรุปตัวเลขและสถิติสำคัญของโรงงานสำหรับผู้บริหาร พิมพ์รายงานยื่นคิวซีหรือตรวจสอบบัญชีประจำเดือน",
      features: [
        "รายงานมูลค่าสต็อกเคมีดิบ บรรจุภัณฑ์ และ Finished Goods รวม",
        "รายงานสรุปประวัติคำสั่งผลิตเคมีภัณฑ์ และสถานะการผลิต",
        "รายงานประวัติการจัดซื้อวัตถุดิบและการรับเข้า GRN",
        "รายงานผลการตรวจเช็ค Precheck ก่อนผลิต",
        "รองรับการพิมพ์เอกสารรายงาน (Print / Save as PDF)"
      ],
      steps: [
        {
          title: "เลือกหัวข้อรายงานที่ต้องการดู",
          desc: "เลือกดูสรุปสต็อก, การผลิต, การจัดซื้อ หรือ คิวซี"
        },
        {
          title: "ตรวจสอบตัวเลขสถิติและมูลค่า",
          desc: "ดูยอดรวมมูลค่าคงคลัง และจำนวน Batch ที่ผลิตเสร็จ"
        },
        {
          title: "กดปุ่มพิมพ์รายงาน",
          desc: "ส่งออกเป็นเอกสารเสนอผู้บริหารหรือแนบประกอบรายงานประจำเดือน"
        }
      ],
      tips: [
        "ควรตรวจสอบรายงานมูลค่าสต็อกเป็นประจำทุกสิ้นเดือนเพื่อกระทบยอดบัญชี"
      ]
    }
  ];

  // Filter sections based on search query
  const filteredSections = manualSections.filter(sec => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.purpose.toLowerCase().includes(q) ||
      sec.category.toLowerCase().includes(q) ||
      sec.features.some(f => f.toLowerCase().includes(q)) ||
      sec.steps.some(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
    );
  });

  const selectedSection = manualSections.find(s => s.id === activeTab) || manualSections[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <BookOpen className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>IDEVA FACTORY OS — OPERATING GUIDE</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            คู่มือการใช้งานระบบบริหารจัดการโรงงานแบบละเอียด
          </h1>

          <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed font-sans">
            รวบรวมขั้นตอนการทำงาน วัตถุประสงค์ คำแนะนำเทคนิค และขั้นตอนการใช้งานสำหรับทุกเมนูในระบบ 
            ครอบคลุมตั้งแต่การตั้งค่าสูตรเคมี BOM, การจัดซื้อ, การรับคลัง FEFO, การตรวจความพร้อม, จนถึงการสั่งผลิตและบรรจุ
          </p>

          {/* Search Box inside header */}
          <div className="pt-2">
            <div className="relative max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ค้นหาคู่มือ เช่น BOM, FEFO, ใบสั่งผลิต, สต็อก, พิมพ์เอกสาร..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-blue-200/60 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-200 hover:text-white"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workflow Quick Overview Chart */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-slate-800">
                แผนผังกระบวนการทำงานหลักในโรงงาน (End-to-End Factory Process Flow)
              </h2>
              <p className="text-xs text-slate-500">
                ลำดับขั้นตอนมาตรฐานตั้งแต่การรับเคมีดิบไปจนถึงสินค้าสำเร็จรูปพร้อมส่งมอบ
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> พิมพ์คู่มือ
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          {[
            { step: "1. จัดซื้อ", title: "สั่งซื้อวัตถุดิบ (PO)", sub: "ออกเอกสารสั่งซื้อไปยัง Supplier", color: "border-teal-300 bg-teal-50/50 text-teal-800", page: "purchase" },
            { step: "2. รับเข้าคลัง", title: "รับของเข้า (GRN/FEFO)", sub: "ระบุ ล๊อต & วันหมดอายุ", color: "border-emerald-300 bg-emerald-50/50 text-emerald-800", page: "grn" },
            { step: "3. สูตรผสม", title: "ตั้งสูตร (BOM)", sub: "กำหนดสัดส่วน Part A, B, C", color: "border-amber-300 bg-amber-50/50 text-amber-800", page: "bom" },
            { step: "4. QC เช็ค", title: "ตรวจก่อนผลิต (Precheck)", sub: "เช็คถังปั่น ความสะอาด & PPE", color: "border-purple-300 bg-purple-50/50 text-purple-800", page: "precheck" },
            { step: "5. สั่งผลิต", title: "ผสมเคมี (Work Order)", sub: "ดึงล๊อต FEFO & ตัดสต็อก", color: "border-blue-300 bg-blue-50/50 text-blue-800", page: "production" },
            { step: "6. สั่งบรรจุ", title: "บรรจุลงขวด/กล่อง", sub: "ตัดขวด/ฉลาก & คำนวณ Loss", color: "border-indigo-300 bg-indigo-50/50 text-indigo-800", page: "packing" },
            { step: "7. สต็อก FG", title: "คลังพร้อมส่งมอบ", sub: "รายงานสรุปและพร้อมจัดส่ง", color: "border-rose-300 bg-rose-50/50 text-rose-800", page: "inventory" }
          ].map((item, idx) => (
            <div 
              key={idx}
              onClick={() => onNavigate(item.page)}
              className={`p-3 rounded-xl border ${item.color} hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between`}
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70 block mb-0.5">{item.step}</span>
                <h4 className="text-xs font-bold leading-snug group-hover:underline">{item.title}</h4>
                <p className="text-[10px] opacity-80 mt-1 leading-tight">{item.sub}</p>
              </div>
              <div className="mt-2 text-right">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
                  วาร์ปไปเปิด <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Manual Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar Menu Selector */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 sticky top-20">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              เลือกระบบที่ต้องการดูคู่มือ ({filteredSections.length} เมนู)
            </h3>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredSections.map((sec) => {
                const isSelected = selectedSection.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold"
                        : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/80 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-white text-slate-700 shadow-sm"}`}>
                        {sec.icon}
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{sec.title}</div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          {sec.category}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  ไม่พบหัวข้อคู่มือที่ตรงกับคำค้นหา "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Detail Content View */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSection && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              {/* Header Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                    {selectedSection.icon}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                      {selectedSection.category}
                    </span>
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-900 font-display mt-0.5">
                      {selectedSection.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(selectedSection.pageKey)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
                >
                  <ExternalLink className="w-4 h-4" /> ไปยังหน้านี้เพื่อใช้งานจริง
                </button>
              </div>

              {/* Purpose Box */}
              <div className="bg-blue-50/80 border border-blue-150 p-4 rounded-xl space-y-1">
                <h4 className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Info className="w-4 h-4 text-blue-600" /> วัตถุประสงค์และการใช้งานหลัก
                </h4>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  {selectedSection.purpose}
                </p>
              </div>

              {/* Core Features Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" /> คุณสมบัติและฟังก์ชันเด่นในหน้านี้
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedSection.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step by Step Walkthrough */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" /> ขั้นตอนการทำงานทีละขั้นตอน (Step-by-Step Guide)
                </h3>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {selectedSection.steps.map((st, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 pl-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm relative z-10">
                        {idx + 1}
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900">{st.title}</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips Box */}
              {selectedSection.tips.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4 text-amber-600" /> ข้อแนะนำการใช้งาน & เทคนิคสำคัญ (Pro Tips)
                  </h4>
                  <ul className="space-y-1 text-xs text-amber-950 font-medium list-disc list-inside">
                    {selectedSection.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warning Box */}
              {selectedSection.warnings && selectedSection.warnings.length > 0 && (
                <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> ข้อควรระวัง (Warnings)
                  </h4>
                  <ul className="space-y-1 text-xs text-rose-950 font-medium list-disc list-inside">
                    {selectedSection.warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-extrabold text-slate-800">
            คำถามที่พบบ่อยในการใช้งาน (Frequently Asked Questions - FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[
            {
              q: "ระบบ FEFO (First Expired, First Out) ทำงานอย่างไรในการสั่งผลิต?",
              a: "เมื่อเลือกสูตร BOM และระบุ Batch Size ในใบสั่งผลิต ระบบจะไปค้นคลัง GRN แล้วเลือกดึงสารเคมีล๊อตที่มีวันหมดอายุใกล้ที่สุดมาใช้อัตโนมัติ เพื่อป้องกันสารเคมีเสื่อมสภาพในคลัง"
            },
            {
              q: "หากต้องการพิมพ์ใบสูตรผสม BOM ต้องทำอย่างไร?",
              a: "ไปที่เมนู 'สูตรการผลิต (BOM)' แล้วกดปุ่มพิมพ์รูปเครื่องพิมพ์ในตารางสูตร ระบบจะแสดงพรีวิวเอกสารพิมพ์ใบ BOM พร้อส่วนผสม Part A, B, C ในรูปแบบมาตรฐาน A4"
            },
            {
              q: "ต้นทุนวัตถุดิบประมาณการในสูตร BOM คำนวณมาจากไหน?",
              a: "คำนวณจาก (สัดส่วนปริมาณวัตถุดิบในสูตร BOM × ราคาวัตถุดิบต่อหน่วยล่าสุดที่บันทึกไว้ในคลังเคมีดิบ) แล้วนำมารวมกันเป็นต้นทุนวัตถุดิบรวมต่อ 1 หน่วย"
            },
            {
              q: "เมื่อไหร่ที่สต็อกสารเคมีจริงในคลังจะถูกตัดลดลง?",
              a: "สต็อกสารเคมีดิบจริงจะถูกตัดลดลงเมื่อเปลี่ยนสถานะใบสั่งผลิตเป็น 'ผลิตเสร็จสิ้น (Completed)' เท่านั้น เพื่อให้ตรงกับของที่ใช้ผสมจริง"
            }
          ].map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-start gap-1.5">
                <span className="text-blue-600 shrink-0">Q:</span> {faq.q}
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed pl-4">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
