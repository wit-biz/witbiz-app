import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { initialRoles } from "@/lib/data";

type CreateUserData = {
  name: string;
  email: string;
  password: string;
  role: string;
};

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

  let body: CreateUserData;
  try {
    body = (await req.json()) as CreateUserData;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Validate required fields
  if (!body.name || !body.email || !body.password || !body.role) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Check if user has permission to create users
  const userDoc = await adminDb.collection("users").doc(auth.uid).get();
  const userData = userDoc.data();
  
  // Get role permissions (same logic as CRMDataContext)
  const userRole = initialRoles.find(r => r.name === userData?.role) || initialRoles.find(r => r.id === 'collaborator');
  
  console.log('🔍 User permission check:', {
    userId: auth.uid,
    userRole: userData?.role,
    foundRole: userRole?.name,
    permissions: userRole?.permissions,
    canManageMembers: userRole?.permissions?.team_manage_members
  });
  
  if (!userRole?.permissions?.team_manage_members) {
    return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
  }

  try {
    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email: body.email,
      password: body.password,
      displayName: body.name,
    });

    // Create user document in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      name: body.name,
      email: body.email,
      role: body.role,
      status: 'Activo',
      createdAt: new Date().toISOString(),
    });

    console.log("✅ User created successfully:", userRecord.uid);

    return NextResponse.json({ 
      success: true,
      user: {
        id: userRecord.uid,
        name: body.name,
        email: body.email,
        role: body.role,
      }
    });
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: "email_already_exists" }, { status: 409 });
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json({ error: "weak_password" }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "failed_to_create_user",
      details: error.message 
    }, { status: 500 });
  }
}
