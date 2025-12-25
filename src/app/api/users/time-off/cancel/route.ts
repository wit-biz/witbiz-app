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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: "missing_request_id" }, { status: 400 });
    }

    // Get the request
    const requestDoc = await adminDb.collection("timeOffRequests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "request_not_found" }, { status: 404 });
    }

    const requestData = requestDoc.data() as any;

    // Get user data
    const userDoc = await adminDb.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Check if user can cancel this request
    // Either the requester or the approver can cancel
    const isRequester = requestData.userId === auth.uid;
    const isApprover = requestData.approvedBy === auth.uid;
    
    if (!isRequester && !isApprover) {
      return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
    }

    // Check if request is approved or pending (can't cancel rejected)
    if (requestData.status === 'rejected') {
      return NextResponse.json({ error: "cannot_cancel_rejected" }, { status: 400 });
    }

    if (requestData.status === 'cancelled') {
      return NextResponse.json({ error: "already_cancelled" }, { status: 400 });
    }

    // Check 24-hour rule - must be at least 24 hours before the first date
    const firstDate = new Date(requestData.dates[0]);
    const now = new Date();
    const hoursUntilStart = (firstDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
      return NextResponse.json({ 
        error: "too_late_to_cancel",
        message: "Las solicitudes solo pueden cancelarse con al menos 24 horas de anticipación"
      }, { status: 400 });
    }

    // Update the request status
    await adminDb.collection("timeOffRequests").doc(requestId).update({
      status: 'cancelled',
      cancelledBy: auth.uid,
      cancelledByName: userData.name,
      cancelledAt: new Date(),
    });

    // Log the cancellation
    const dates = requestData.dates || [];
    const dateRange = dates.length === 1 
      ? dates[0] 
      : `${dates[0]} - ${dates[dates.length - 1]}`;
    
    await adminDb.collection("logs").add({
      authorId: auth.uid,
      authorName: userData.name,
      action: 'timeoff_cancelled',
      entityId: requestId,
      entityType: 'timeoff',
      entityName: `${requestData.userName}: ${requestData.type === 'libre' ? 'Día Libre' : 'Urgencia'} (${dateRange})`,
      createdAt: new Date(),
    });

    console.log(`✅ Time off request ${requestId} cancelled by ${userData.name}`);

    return NextResponse.json({
      success: true,
      status: 'cancelled',
    });
  } catch (error: any) {
    console.error("❌ Error cancelling time off request:", error);
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 }
    );
  }
}
