import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { initialRoles } from "@/lib/data";

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
    const { requestId, action, reason } = body;

    // Validate required fields
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    // Get the request
    const requestDoc = await adminDb.collection("timeOffRequests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "request_not_found" }, { status: 404 });
    }

    const requestData = requestDoc.data() as any;
    
    // Check if request is still pending
    if (requestData.status !== 'pending') {
      return NextResponse.json({ error: "request_already_processed" }, { status: 409 });
    }

    // Get approver data
    const approverDoc = await adminDb.collection("users").doc(auth.uid).get();
    const approverData = approverDoc.data();

    if (!approverData) {
      return NextResponse.json({ error: "approver_not_found" }, { status: 404 });
    }

    // Get requester role to check approval hierarchy
    const requesterRole = initialRoles.find(r => r.name === requestData.userRole);
    const approvalHierarchy = requesterRole?.approvalHierarchy || [];

    // Check if approver is in the approval hierarchy
    if (!approvalHierarchy.includes(approverData.role)) {
      return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
    }

    // Update the request
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: auth.uid,
      approvedByName: approverData.name,
      approvedAt: new Date(),
    };

    if (action === 'reject' && reason) {
      updateData.rejectionReason = reason;
    }

    await adminDb.collection("timeOffRequests").doc(requestId).update(updateData);

    // Log the decision
    const logAction = action === 'approve' ? 'timeoff_approved' : 'timeoff_rejected';
    const dates = requestData.dates || [];
    const dateRange = dates.length === 1 
      ? dates[0] 
      : `${dates[0]} - ${dates[dates.length - 1]}`;
    
    await adminDb.collection("logs").add({
      authorId: auth.uid,
      authorName: approverData.name,
      action: logAction,
      entityId: requestId,
      entityType: 'timeoff',
      entityName: `${requestData.userName}: ${requestData.type === 'libre' ? 'Día Libre' : 'Urgencia'} (${dateRange})`,
      createdAt: new Date(),
    });

    // Send notification to requester
    console.log(`Notification sent to ${requestData.userId}: Request ${requestId} was ${action}d`);

    console.log(`✅ Time off request ${requestId} ${action}d by ${approverData.name}`);

    return NextResponse.json({
      success: true,
      status: action === 'approve' ? 'approved' : 'rejected',
    });
  } catch (error: any) {
    console.error("❌ Error processing time off request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
