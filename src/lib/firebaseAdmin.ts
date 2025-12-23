import "server-only";

import { cert, getApps, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { firebaseConfig } from "@/firebase/config";

const firebaseAdminApp = (() => {
  if (getApps().length) return getApps()[0]!;

  // Check for service account credentials
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountJson) {
    // Use service account from environment variable
    try {
      // Clean the JSON string - remove any prefix like "FIREBASE_SERVICE_ACCOUNT_KEY=" if present
      let cleanJson = serviceAccountJson.trim();
      // Find the start of the JSON object
      const jsonStart = cleanJson.indexOf('{');
      if (jsonStart > 0) {
        cleanJson = cleanJson.substring(jsonStart);
      }
      
      const serviceAccount = JSON.parse(cleanJson) as ServiceAccount;
      console.log("✅ Firebase Admin SDK initialized with service account");
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
      });
    } catch (e) {
      console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
      console.error("Raw value length:", serviceAccountJson?.length);
      console.error("First 100 chars:", serviceAccountJson?.substring(0, 100));
    }
  }
  
  // Fallback: Initialize with just project ID (limited functionality)
  // This allows basic Firestore/Auth operations in development
  console.warn("⚠️ Firebase Admin SDK initialized without service account credentials.");
  console.warn("⚠️ Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable for full functionality.");
  
  return initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  });
})();

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
export const adminStorage = getStorage(firebaseAdminApp);
