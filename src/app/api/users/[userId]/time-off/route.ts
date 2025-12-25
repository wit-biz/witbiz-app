import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

async function requireAuth(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return NextResponse.json({ error: "invalid_auth" }, { status: 401 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { userId } = params;

  // Users can only see their own calendar unless they have permission
  if (auth.uid !== userId) {
    // Check if user has permission to view others' calendars
    const userDoc = await adminDb.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.permissions?.team_activity_view) {
      return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
    }
  }

  try {
    // Get time off requests
    const requestsSnapshot = await adminDb
      .collection("timeOffRequests")
      .where("userId", "==", userId)
      .orderBy("requestedAt", "desc")
      .get();

    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching time off requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
