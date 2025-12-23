export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// This endpoint cleans up conversations older than 1 month
// Can be triggered by:
// 1. Vercel Cron Jobs (add to vercel.json)
// 2. Google Cloud Scheduler
// 3. Manual trigger
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getFirestore();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    console.log("🧹 Starting monthly conversation cleanup...");
    console.log(`📅 Deleting conversations older than: ${oneMonthAgo.toISOString()}`);

    // Query all old conversations across all users
    const oldConvsQuery = db
      .collection("chatConversations")
      .where("updatedAt", "<", Timestamp.fromDate(oneMonthAgo));

    const snapshot = await oldConvsQuery.get();
    
    if (snapshot.empty) {
      console.log("✅ No old conversations to delete");
      return NextResponse.json({
        success: true,
        message: "No old conversations to delete",
        deletedCount: 0,
      });
    }

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deletedCount = 0;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(`🗑️ Deleted batch: ${batchDocs.length} conversations`);
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} old conversations`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} old conversations`,
      deletedCount,
      cutoffDate: oneMonthAgo.toISOString(),
    });
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
