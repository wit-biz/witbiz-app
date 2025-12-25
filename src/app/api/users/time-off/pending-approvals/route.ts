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

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Get current user data
    const userDoc = await adminDb.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Get all roles to determine approval hierarchy
    const roles = initialRoles;
    
    // Find which roles this user can approve
    const canApproveRoles: string[] = [];
    roles.forEach(role => {
      if (role.approvalHierarchy?.includes(userData.role)) {
        canApproveRoles.push(role.name);
      }
    });

    if (canApproveRoles.length === 0) {
      // User cannot approve any requests
      return NextResponse.json({ requests: [] });
    }

    // Fetch pending requests from users with roles that current user can approve
    const requestsSnapshot = await adminDb
      .collection("timeOffRequests")
      .where("status", "==", "pending")
      .get();

    // Get all users to check their roles
    const userIds = [...new Set(requestsSnapshot.docs.map(doc => doc.data().userId as string))];
    
    if (userIds.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const usersMap = new Map();
    
    // Fetch users in batches (Firestore "in" query is limited to 10 items)
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const usersSnapshot = await adminDb
        .collection("users")
        .where("__name__", "in", batch)
        .get();
      
      usersSnapshot.docs.forEach(doc => {
        usersMap.set(doc.id, doc.data());
      });
    }

    // Filter requests based on approval hierarchy
    const pendingRequests = requestsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          dates: data.dates,
          type: data.type,
          status: data.status,
          requestedAt: data.requestedAt,
          reason: data.reason,
        };
      })
      .filter(request => {
        const requester = usersMap.get(request.userId);
        return requester && canApproveRoles.includes(requester.role);
      });

    return NextResponse.json({ requests: pendingRequests });
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending requests" },
      { status: 500 }
    );
  }
}
