import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type ApplyRequestBody = {
  docId: string;
  proposal: any;
  associations?: {
    supplierId?: string;
    clientId?: string;
    createSupplier?: { name: string; rfc?: string };
    createClient?: { name: string; rfc?: string };
  };
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

  let body: ApplyRequestBody;
  try {
    body = (await req.json()) as ApplyRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.docId || !body.proposal) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const docRef = adminDb.collection("documents").doc(body.docId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  }

  const proposal = body.proposal;
  const associations = body.associations || {};
  
  // Support both old format (transaction/task) and new format (suggestedActions.createTransaction/createTask)
  const tx = proposal?.suggestedActions?.createTransaction || proposal?.transaction;
  const taskData = proposal?.suggestedActions?.createTask || proposal?.task;
  const docData = docSnap.data() as any;

  const writes: Array<Promise<any>> = [];
  
  // Variables para almacenar IDs de entidades asociadas
  let finalSupplierId: string | null = null;
  let finalClientId: string | null = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // MANEJAR ASOCIACIONES DE PROVEEDOR
  // ═══════════════════════════════════════════════════════════════════════════
  if (associations.supplierId) {
    // Vincular con proveedor existente
    finalSupplierId = associations.supplierId;
    console.log("📎 Vinculando documento con proveedor existente:", finalSupplierId);
  } else if (associations.createSupplier?.name) {
    // Crear nuevo proveedor
    const newSupplier = {
      name: associations.createSupplier.name,
      rfc: associations.createSupplier.rfc || null,
      status: "Activo",
      createdAt: FieldValue.serverTimestamp(),
    };
    const supplierRef = await adminDb.collection("suppliers").add(newSupplier);
    finalSupplierId = supplierRef.id;
    console.log("✨ Proveedor creado:", finalSupplierId, newSupplier.name);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANEJAR ASOCIACIONES DE CLIENTE
  // ═══════════════════════════════════════════════════════════════════════════
  if (associations.clientId) {
    // Vincular con cliente existente
    finalClientId = associations.clientId;
    console.log("📎 Vinculando documento con cliente existente:", finalClientId);
  } else if (associations.createClient?.name) {
    // Crear nuevo cliente
    const newClient = {
      name: associations.createClient.name,
      rfc: associations.createClient.rfc || null,
      status: "Activo",
      owner: auth.uid,
      category: "General",
      subscribedServiceIds: [],
      createdAt: FieldValue.serverTimestamp(),
    };
    const clientRef = await adminDb.collection("clients").add(newClient);
    finalClientId = clientRef.id;
    console.log("✨ Cliente creado:", finalClientId, newClient.name);
  }

  // Handle transaction creation - only if we have the required fields
  // For now, just log the proposal without requiring all accounting fields
  if (tx && tx.amount) {
    // Store the proposed transaction info in the document for later manual processing
    // Full transaction creation requires categoryId, companyId, accountId which user selects
    console.log("AI proposed transaction:", tx);
  }

  // Handle task creation - preferir clientId de la tarea sugerida; fallback al recién asociado o al documento
  const clientId = String(taskData?.clientId || finalClientId || docData?.clientId || "");
  if (taskData && taskData.title && clientId) {
    const assignedUserId = String(taskData.assignedToId || auth.uid);
    const userSnap = await adminDb.collection("users").doc(assignedUserId).get();
    const userData = userSnap.exists ? (userSnap.data() as any) : {};

    const clientSnap = await adminDb.collection("clients").doc(String(clientId)).get();
    const clientData = clientSnap.exists ? (clientSnap.data() as any) : {};

    const dueDate = taskData.dueDate ? String(taskData.dueDate) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const taskPayload: any = {
      title: String(taskData.title),
      description: taskData.description ? String(taskData.description) : undefined,
      location: taskData.location ? String(taskData.location) : undefined,
      dueDate,
      dueTime: taskData.dueTime ? String(taskData.dueTime) : undefined,
      status: "Pendiente",
      clientId: String(clientId),
      clientName: String(clientData.name || ""),
      serviceId: taskData.serviceId ? String(taskData.serviceId) : undefined,
      type: taskData.type ? String(taskData.type) : undefined,
      requiredDocumentForCompletion: typeof taskData.requiredDocumentForCompletion === "boolean" ? taskData.requiredDocumentForCompletion : undefined,
      requiredDocuments: Array.isArray(taskData.requiredDocuments) ? taskData.requiredDocuments : undefined,
      requiresInput: typeof taskData.requiresInput === "boolean" ? taskData.requiresInput : undefined,
      subTasks: Array.isArray(taskData.subTasks) ? taskData.subTasks : undefined,
      assignedToId: assignedUserId,
      assignedToName: String(userData.name || ""),
      assignedToPhotoURL: String(userData.photoURL || ""),
      createdAt: FieldValue.serverTimestamp(),
    };

    const clean: any = {};
    for (const [k, v] of Object.entries(taskPayload)) {
      if (v !== undefined) clean[k] = v;
    }

    writes.push(adminDb.collection("tasks").add(clean));
  }

  // Execute all writes with error handling
  try {
    const results = await Promise.all(writes);
    console.log("✅ Writes completed:", results.length, "operations");
  } catch (error) {
    console.error("❌ Error executing writes:", error);
    return NextResponse.json({ 
      error: "Error creating associated records", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }

  // Construir objeto de actualización del documento
  // Guardar la propuesta editada para futuras ediciones (evita re-analizar con Document AI)
  
  // Helper function to deeply clean object for Firestore (remove undefined, functions, symbols)
  const cleanForFirestore = (obj: any, depth = 0): any => {
    // Prevent infinite recursion
    if (depth > 10) return null;
    
    // Handle null/undefined
    if (obj === null || obj === undefined) return null;
    
    // Handle primitives
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }
    
    // Skip functions and symbols
    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return null;
    }
    
    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => cleanForFirestore(item, depth + 1)).filter(item => item !== undefined);
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && typeof value !== 'function' && typeof value !== 'symbol') {
          const cleanedValue = cleanForFirestore(value, depth + 1);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    
    return null;
  };

  // Build a minimal, clean update object
  const docUpdate: any = {
    ai: {
      status: "applied",
      proposal: {
        suggestedType: String(proposal.documentType || proposal.suggestedType || "unknown"),
        confidence: typeof proposal.confidence === 'number' ? proposal.confidence : 0,
        summary: String(proposal.summary || ""),
      },
      audit: {
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: String(auth.uid),
      },
    },
  };

  // Add optional extracted data if present
  if (proposal.rawExtracted || proposal.extracted) {
    docUpdate.ai.proposal.extracted = cleanForFirestore(proposal.rawExtracted || proposal.extracted);
  }

  // Add optional suggested transaction
  if (tx) {
    docUpdate.ai.proposal.suggested = docUpdate.ai.proposal.suggested || {};
    docUpdate.ai.proposal.suggested.transaction = {
      type: String(tx.type || ""),
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
      description: String(tx.description || ""),
    };
  }

  // Add optional suggested task
  if (taskData) {
    docUpdate.ai.proposal.suggested = docUpdate.ai.proposal.suggested || {};
    docUpdate.ai.proposal.suggested.task = {
      title: String(taskData.title || ""),
      description: String(taskData.description || ""),
      clientId: String(taskData.clientId || finalClientId || ""),
    };
    if (taskData.dueDate) docUpdate.ai.proposal.suggested.task.dueDate = String(taskData.dueDate);
    if (taskData.dueTime) docUpdate.ai.proposal.suggested.task.dueTime = String(taskData.dueTime);
    if (taskData.location) docUpdate.ai.proposal.suggested.task.location = String(taskData.location);
  }

  // Add associations info
  docUpdate.ai.proposal.associations = {};
  if (finalSupplierId) {
    docUpdate.ai.proposal.associations.supplier = { matched: true, id: String(finalSupplierId) };
  }
  if (finalClientId) {
    docUpdate.ai.proposal.associations.client = { matched: true, id: String(finalClientId) };
  }

  // Agregar asociaciones al documento si existen
  if (finalSupplierId) {
    docUpdate.supplierId = finalSupplierId;
  }
  if (finalClientId) {
    docUpdate.clientId = finalClientId;
  }

  console.log("📝 Document update payload:", JSON.stringify(docUpdate, null, 2));

  // Update document with error handling
  try {
    await docRef.set(docUpdate, { merge: true });
    console.log("✅ Documento aplicado:", body.docId, { supplierId: finalSupplierId, clientId: finalClientId });
  } catch (error) {
    console.error("❌ Error updating document:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json({ 
      error: "Error updating document", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }

  return NextResponse.json({ 
    ok: true,
    associations: {
      supplierId: finalSupplierId,
      clientId: finalClientId,
    }
  });
}
