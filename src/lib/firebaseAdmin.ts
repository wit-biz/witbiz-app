import "server-only";

import { cert, getApps, initializeApp, applicationDefault, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { firebaseConfig } from "@/firebase/config";

const firebaseAdminApp = (() => {
  if (getApps().length) return getApps()[0]!;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  // Local development: use service account from env variable
  if (serviceAccountJson) {
    try {
      let cleanJson = serviceAccountJson.trim();
      const jsonStart = cleanJson.indexOf('{');
      if (jsonStart > 0) cleanJson = cleanJson.substring(jsonStart);
      
      const serviceAccount = JSON.parse(cleanJson) as ServiceAccount;
      console.log("✅ Firebase Admin SDK initialized with service account");
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
      });
    } catch (e) {
      console.error("❌ Failed to parse service account:", e);
    }
  }
  
  // Production (Firebase App Hosting): use ADC
  try {
    console.log("✅ Firebase Admin SDK initialized with ADC");
    return initializeApp({
      credential: applicationDefault(),
      projectId: firebaseConfig.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
    });
  } catch (e) {
    console.warn("⚠️ Using project ID only");
    return initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
    });
  }
})();

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
export const adminStorage = getStorage(firebaseAdminApp);
