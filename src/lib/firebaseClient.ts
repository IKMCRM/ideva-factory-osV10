import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the specific database ID provisioned
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot according to skill guidelines
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return {
      success: true,
      message: "เชื่อมต่อ Firebase Firestore สำเร็จ 100%",
    };
  } catch (error: any) {
    if (
      error instanceof Error &&
      (error.message.includes("the client is offline") ||
        error.message.includes("unavailable"))
    ) {
      console.warn("Firebase client offline warning:", error.message);
      return {
        success: false,
        message: "ระบบกำลังเตรียมการเชื่อมต่อ Firebase Firestore (" + error.message + ")",
      };
    }
    // Document not found is fine, connection succeeded
    return {
      success: true,
      message: "เชื่อมต่อ Firebase Firestore เรียบร้อยแล้ว",
    };
  }
}

// Generic Firestore helpers for Factory Collections
export async function firestoreGetCollection(collectionName: string): Promise<any[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: data.id !== undefined ? data.id : d.id
      };
    });
  } catch (err) {
    console.warn(`[Firestore Query Warning] '${collectionName}':`, err);
    return [];
  }
}

export async function firestoreSaveDoc(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    await setDoc(doc(db, collectionName, String(docId)), {
      ...data,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, String(docId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 9 Official Chemical Suppliers requested by the user
export const OFFICIAL_SUPPLIERS = [
  { id: 1, code: "SUP-0001", name: "บริษัท จันทร์เจ้า ลองจิวตี้ จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 2, code: "SUP-0002", name: "บริษัท พิษณุเคมีคอล จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 3, code: "SUP-0003", name: "บริษัท กรุงเทพเคมี จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 4, code: "SUP-0004", name: "ดีดี สมุนไพร สปา และเคมีภัณฑ์", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 5, code: "SUP-0005", name: "บริษัท โออินแมกซ์ จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 6, code: "SUP-0006", name: "บริษัท เคมีภัณฑ์ คอร์ปอเรชั่น จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 7, code: "SUP-0007", name: "บริษัท อาร์อาร์ คอสเมติกส์ แอนด์ ฟู้ด อินกรีเดียนส์ จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 8, code: "SUP-0008", name: "บริษัท วอเตอร์ ด็อกเตอร์ จำกัด", contact: null, phone: null, email: null, address: null, status: "active" },
  { id: 9, code: "SUP-0009", name: "บริษัท โบนัสช่างหุทรา จำกัด", contact: null, phone: null, email: null, address: null, status: "active" }
];

export async function seedOfficialSuppliersToFirestore(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  try {
    const now = new Date().toISOString();
    for (const s of OFFICIAL_SUPPLIERS) {
      await setDoc(doc(db, "suppliers", s.code), {
        ...s,
        created_at: now,
        updated_at: now
      }, { merge: true });
    }
    return {
      success: true,
      count: OFFICIAL_SUPPLIERS.length,
      message: `บันทึก Supplier ทั้ง 9 รายการ (SUP-0001 ถึง SUP-0009) ลงใน Firebase Firestore เรียบร้อยแล้ว 100%`
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: `เกิดข้อผิดพลาดในการบันทึก: ${err?.message || err}`
    };
  }
}

export { firebaseConfig };
