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
    const { type, dates, reason } = body;

    // Validate required fields
    if (!type || !dates || !Array.isArray(dates) || dates.length === 0 || !reason) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Get user data
    const userDoc = await adminDb.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Check for conflicts with existing approved requests
    const conflictSnapshot = await adminDb
      .collection("timeOffRequests")
      .where("userId", "==", auth.uid)
      .where("status", "==", "approved")
      .get();

    const hasConflict = conflictSnapshot.docs.some(doc => {
      const approvedDates = doc.data().dates || [];
      return dates.some((date: string) => approvedDates.includes(date));
    });

    if (hasConflict) {
      return NextResponse.json({ error: "date_conflict" }, { status: 409 });
    }

    // Get user role to determine approval hierarchy
    const userRole = initialRoles.find(r => r.name === userData.role);
    const approvalHierarchy = userRole?.approvalHierarchy || [];

    // Directors don't need approval - their requests are auto-approved
    // This is mainly to block dates so others can't assign tasks to them
    const isDirector = userData.role === 'Director';
    const requestStatus = isDirector ? 'approved' : 'pending';

    // Create the time off request
    const requestData: any = {
      userId: auth.uid,
      userName: userData.name,
      dates,
      type,
      status: requestStatus,
      reason,
      requestedAt: new Date(),
    };

    // If auto-approved (Director), add approval info
    if (isDirector) {
      requestData.approvedAt = new Date();
      requestData.approvedBy = auth.uid;
      requestData.approvedByName = userData.name;
      requestData.autoApproved = true;
    }

    const requestRef = await adminDb.collection("timeOffRequests").add(requestData);

    // Log the request
    const logAction = isDirector ? 'timeoff_auto_approved' : 'timeoff_requested';
    const dateRange = dates.length === 1 
      ? dates[0] 
      : `${dates[0]} - ${dates[dates.length - 1]}`;
    
    await adminDb.collection("logs").add({
      authorId: auth.uid,
      authorName: userData.name,
      action: logAction,
      entityId: requestRef.id,
      entityType: 'timeoff',
      entityName: `${type === 'libre' ? 'Día Libre' : 'Urgencia'}: ${dateRange}`,
      createdAt: new Date(),
    });

    // Find users who can approve this request (only if not auto-approved)
    let approvers: any[] = [];
    if (!isDirector && approvalHierarchy.length > 0) {
      const approversSnapshot = await adminDb
        .collection("users")
        .where("role", "in", approvalHierarchy)
        .where("status", "==", "Activo")
        .get();

      approvers = approversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Send notifications to approvers
      for (const approver of approvers) {
        // Here you could send an email or in-app notification
        console.log(`Notification sent to ${approver.email} for approval of request ${requestRef.id}`);
      }
    }

    console.log(`✅ Time off request created: ${requestRef.id} (${isDirector ? 'auto-approved' : 'pending approval'})`);

    return NextResponse.json({
      success: true,
      requestId: requestRef.id,
      autoApproved: isDirector,
      approvers: approvers.map(a => a.email),
    });
  } catch (error: any) {
    console.error("❌ Error creating time off request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
