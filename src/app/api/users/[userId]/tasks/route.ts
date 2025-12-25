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

  // Users can only see their own tasks unless they have permission
  if (auth.uid !== userId) {
    const userDoc = await adminDb.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.permissions?.team_tasks_view) {
      return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
    }
  }

  try {
    // Get tasks assigned to the user
    const tasksSnapshot = await adminDb
      .collection("tasks")
      .where("assignedToId", "==", userId)
      .where("status", "in", ["Pendiente", "En Progreso"])
      .get();

    const tasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore timestamp to date string
      if (data.dueDate && typeof data.dueDate.toDate === 'function') {
        data.dueDate = data.dueDate.toDate().toISOString().split('T')[0];
      }
      return {
        id: doc.id,
        ...data,
      };
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
