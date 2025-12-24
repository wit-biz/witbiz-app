import "server-only";

import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { firebaseConfig } from "@/firebase/config";

const firebaseAdminApp = (() => {
  if (getApps().length) return getApps()[0]!;

  // In Firebase App Hosting, use Application Default Credentials (ADC)
  // This automatically works with the service account assigned to the backend
  try {
    console.log("✅ Firebase Admin SDK initialized with ADC");
    return initializeApp({
      credential: applicationDefault(),
      projectId: firebaseConfig.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
    });
  } catch (e) {
    console.warn("⚠️ ADC not available, using project ID only:", e);
    return initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
    });
  }
})();

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
export const adminStorage = getStorage(firebaseAdminApp);
