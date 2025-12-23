export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { VertexAI, FunctionDeclarationSchemaType } from '@google-cloud/vertexai';

interface ChatRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
}

async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return NextResponse.json({ error: 'invalid_auth' }, { status: 401 });
  }
}

function parseDateFromText(text: string): string {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return toDateStr(d);
  };
  
  // "en X dias" o "dentro de X dias"
  const diasMatch = lower.match(/(?:en|dentro de)\s*(\d+)\s*dias?/);
  if (diasMatch) return addDays(parseInt(diasMatch[1]));
  
  // "en X semanas"
  const semanasMatch = lower.match(/(?:en|dentro de)\s*(\d+)\s*semanas?/);
  if (semanasMatch) return addDays(parseInt(semanasMatch[1]) * 7);
  
  // "en X meses"
  const mesesMatch = lower.match(/(?:en|dentro de)\s*(\d+)\s*mes(?:es)?/);
  if (mesesMatch) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + parseInt(mesesMatch[1]));
    return toDateStr(d);
  }
  
  // Dias de la semana
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  for (let i = 0; i < diasSemana.length; i++) {
    if (lower.includes(diasSemana[i]) || lower.includes('el ' + diasSemana[i])) {
      const currentDay = today.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7; // Proximo de ese dia
      return addDays(daysUntil);
    }
  }
  
  // Expresiones comunes
  if (lower.includes('hoy') || lower.includes('ahora') || lower.includes('ya')) {
    return toDateStr(today);
  }
  if (lower.includes('pasado manana') || lower.includes('pasado mañana')) {
    return addDays(2);
  }
  if (lower.includes('manana') || lower.includes('mañana')) {
    return addDays(1);
  }
  if (lower.includes('proxima semana') || lower.includes('siguiente semana') || lower.includes('la semana que viene')) {
    return addDays(7);
  }
  if (lower.includes('proximo mes') || lower.includes('mes que viene') || lower.includes('siguiente mes')) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    return toDateStr(d);
  }
  if (lower.includes('fin de semana')) {
    const currentDay = today.getDay();
    const daysUntilSat = (6 - currentDay + 7) % 7 || 7;
    return addDays(daysUntilSat);
  }
  if (lower.includes('fin de mes')) {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return toDateStr(d);
  }
  if (lower.includes('una semana') || lower.includes('1 semana')) {
    return addDays(7);
  }
  if (lower.includes('dos semanas') || lower.includes('2 semanas')) {
    return addDays(14);
  }
  if (lower.includes('un mes') || lower.includes('1 mes')) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    return toDateStr(d);
  }
  
  // Default: mañana
  return addDays(1);
}

// Find member by name or nickname (case insensitive, partial match)
function findMember(members: Array<{id: string, name: string}>, searchName: string): {id: string, name: string} | null {
  if (!searchName) return null;
  const lower = searchName.toLowerCase().trim();
  
  // Exact match first
  const exact = members.find(m => m.name.toLowerCase() === lower);
  if (exact) return exact;
  
  // Partial match
  const partial = members.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase().split(' ')[0]));
  return partial || null;
}

// Find client by name (case insensitive, partial match)
function findClient(clients: Array<{id: string, name: string}>, searchName: string): {id: string, name: string} | null {
  if (!searchName) return null;
  const lower = searchName.toLowerCase().trim();
  
  const exact = clients.find(c => c.name.toLowerCase() === lower);
  if (exact) return exact;
  
  const partial = clients.find(c => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()));
  return partial || null;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'missing_message' }, { status: 400 });
  }

  try {
    // Load ALL context data for comprehensive knowledge
    const [userDoc, clientsSnap, usersSnap, suppliersSnap, tasksSnap, servicesSnap, promotersSnap, docsSnap] = await Promise.all([
      adminDb.collection('users').doc(authResult.uid).get(),
      adminDb.collection('clients').get(),
      adminDb.collection('users').get(),
      adminDb.collection('suppliers').get(),
      adminDb.collection('tasks').orderBy('createdAt', 'desc').limit(50).get(),
      adminDb.collection('serviceWorkflows').get(),
      adminDb.collection('promoters').get(),
      adminDb.collection('documents').orderBy('uploadedAt', 'desc').limit(30).get(),
    ]);
    
    const userData = userDoc.data();
    const currentUserName = userData?.name || 'Usuario';
    
    // Build comprehensive data
    const clientsList = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const membersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const suppliersList = suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tasksList = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const servicesList = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const promotersList = promotersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const documentsList = docsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Stats
    const totalClients = clientsList.length;
    const activeClients = clientsList.filter((c: any) => c.status === 'Activo').length;
    const totalTasks = tasksList.length;
    const pendingTasks = tasksList.filter((t: any) => t.status === 'Pendiente').length;
    const completedTasks = tasksList.filter((t: any) => t.status === 'Completada').length;
    const myPendingTasks = tasksList.filter((t: any) => t.assignedToId === authResult.uid && t.status === 'Pendiente');
    
    // Names for quick reference
    const clientNames = clientsList.map((c: any) => c.name).filter(Boolean).join(', ');
    const memberNames = membersList.map((m: any) => m.name).filter(Boolean).join(', ');
    const supplierNames = suppliersList.map((s: any) => s.name).filter(Boolean).join(', ');
    const serviceNames = servicesList.map((s: any) => s.name).filter(Boolean).join(', ');
    const promoterNames = promotersList.map((p: any) => p.name).filter(Boolean).join(', ');
    
    // Recent tasks summary
    const recentTasksSummary = myPendingTasks.slice(0, 5).map((t: any) => `- ${t.title} (${t.dueDate})`).join('\n');
    
    const todayStr = new Date().toISOString().slice(0, 10);
    
    const systemPrompt = `Eres WitBot, asistente IA de WitBiz. Usuario actual: ${currentUserName}.

PUEDES RESPONDER CUALQUIER PREGUNTA sobre la plataforma WitBiz:
- CRM: clientes, prospectos, seguimiento
- Tareas: crear, asignar, consultar pendientes
- Servicios y workflows configurados
- Documentos subidos
- Equipo y miembros
- Proveedores y promotores
- Contabilidad y finanzas (si preguntan)
- Centro de inteligencia y reportes

DATOS EN TIEMPO REAL:
- Clientes: ${totalClients} total (${activeClients} activos): ${clientNames || 'ninguno'}
- Equipo: ${membersList.length} miembros: ${memberNames || 'ninguno'}
- Proveedores: ${suppliersList.length}: ${supplierNames || 'ninguno'}
- Promotores: ${promotersList.length}: ${promoterNames || 'ninguno'}
- Servicios: ${servicesList.length}: ${serviceNames || 'ninguno'}
- Tareas: ${totalTasks} total, ${pendingTasks} pendientes, ${completedTasks} completadas
- Documentos: ${documentsList.length} recientes

TUS TAREAS PENDIENTES:
${recentTasksSummary || 'Ninguna pendiente'}

REGLAS PARA CREAR:
1) USA FUNCIONES inmediatamente. NUNCA preguntes, SOLO EJECUTA.
2) Titulo SIN hora. Ej: "llamar 11am" -> title:"llamar", time:"11:00"
3) Fechas flexibles: "mañana", "pasado mañana", "el lunes", "en 3 días", "próxima semana", "fin de mes"
4) Si NO dicen a quién asignar, NO pongas assignToNames (se asigna al usuario actual automáticamente)
5) Si mencionan VARIOS nombres como "tarea isaac carolina said", usa assignToNames:["isaac","carolina","said"] para crear una tarea para CADA uno
6) SOLO usa assignToNames si EXPLICITAMENTE mencionan nombres
7) Si mencionan una DIRECCION o UBICACION (calle, avenida, colonia, plaza, lugar, "en X"), usa el campo location

HOY: ${todayStr}
Responde en español, sé útil y preciso.`;

    const chatHistory: Array<{role: 'user' | 'model', parts: Array<{text: string}>}> = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Soy WitBot. Puedo ayudarte con cualquier cosa de WitBiz: crear tareas, consultar clientes, ver pendientes, información de servicios, equipo, proveedores, contabilidad y más. ¿Qué necesitas?' }] },
    ];
    
    if (body.history?.length) {
      for (const msg of body.history) {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) {
      return NextResponse.json({ response: 'Project ID no configurado' }, { status: 500 });
    }
    
    const vertexAI = new VertexAI({ project: projectId, location: 'us-central1' });
    
    const tools = [{
      functionDeclarations: [
        {
          name: 'create_task',
          description: 'Crea tarea(s). Si mencionan varios nombres, crea una tarea para cada uno. Detecta direcciones/ubicaciones.',
          parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
              title: { type: FunctionDeclarationSchemaType.STRING, description: 'Titulo SIN hora' },
              clientName: { type: FunctionDeclarationSchemaType.STRING, description: 'Cliente si mencionan' },
              dueDate: { type: FunctionDeclarationSchemaType.STRING, description: 'Fecha: mañana, pasado mañana, lunes, etc.' },
              time: { type: FunctionDeclarationSchemaType.STRING, description: 'Hora HH:MM' },
              description: { type: FunctionDeclarationSchemaType.STRING, description: 'Detalles opcionales' },
              location: { type: FunctionDeclarationSchemaType.STRING, description: 'Direccion o ubicacion si mencionan. Ej: "Av. Constituyentes 123", "Plaza Comercial X", "oficina del cliente", "tonayan", etc.' },
              assignToNames: { type: FunctionDeclarationSchemaType.ARRAY, items: { type: FunctionDeclarationSchemaType.STRING }, description: 'Lista de nombres si mencionan varios. Ej: ["isaac","carolina","said"]. NO incluir si no dicen nombres.' },
            },
            required: ['title'],
          },
        },
        {
          name: 'create_client',
          description: 'Crea cliente nuevo.',
          parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
              name: { type: FunctionDeclarationSchemaType.STRING, description: 'Nombre' },
              email: { type: FunctionDeclarationSchemaType.STRING, description: 'Email' },
              phone: { type: FunctionDeclarationSchemaType.STRING, description: 'Telefono' },
            },
            required: ['name'],
          },
        },
        {
          name: 'create_supplier',
          description: 'Crea proveedor.',
          parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
              name: { type: FunctionDeclarationSchemaType.STRING, description: 'Nombre' },
              email: { type: FunctionDeclarationSchemaType.STRING, description: 'Email' },
              phone: { type: FunctionDeclarationSchemaType.STRING, description: 'Telefono' },
            },
            required: ['name'],
          },
        },
      ],
    }];

    const model = vertexAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-002',
      tools: tools as any,
    });
    
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(body.message);
    
    let finalText = '';
    const { FieldValue } = await import('firebase-admin/firestore');
    
    const functionCalls = result.response?.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall)?.map((p: any) => ({ name: p.functionCall.name, args: p.functionCall.args })) || [];
    
    if (functionCalls && functionCalls.length > 0) {
      const results: string[] = [];
      
      // Process ALL function calls
      for (const fc of functionCalls) {
        console.log('Function called:', fc.name, fc.args);
        
        try {
          if (fc.name === 'create_task') {
            const args = fc.args as any;
            let dueDate = args.dueDate;
            if (!dueDate || dueDate.includes('undefined')) {
              dueDate = parseDateFromText(body.message);
            } else {
              dueDate = parseDateFromText(dueDate);
            }
            
            let baseDescription = args.description || '';
            if (args.time) {
              baseDescription = 'Hora: ' + args.time + (baseDescription ? ' - ' + baseDescription : '');
            }
            
            let clientId = '';
            let clientName = args.clientName || '';
            if (clientName) {
              const foundClient = findClient(clientsList as any, clientName);
              if (foundClient) {
                clientId = foundClient.id;
                clientName = foundClient.name;
              }
            }
            
            // Build list of assignees
            const assignees: Array<{id: string, name: string, photoURL: string}> = [];
            
            if (args.assignToNames && Array.isArray(args.assignToNames) && args.assignToNames.length > 0) {
              // Multiple assignees
              for (const assignName of args.assignToNames) {
                const nameLower = assignName.toLowerCase().trim();
                const currentNameLower = currentUserName.toLowerCase();
                
                // Check if it's the current user
                if (currentNameLower.includes(nameLower) || nameLower.includes(currentNameLower.split(' ')[0])) {
                  assignees.push({ id: authResult.uid, name: currentUserName, photoURL: userData?.photoURL || '' });
                } else {
                  const foundMember = membersList.find((m: any) => 
                    m.name?.toLowerCase().includes(nameLower) || 
                    nameLower.includes(m.name?.toLowerCase().split(' ')[0])
                  ) as any;
                  if (foundMember) {
                    assignees.push({ id: foundMember.id, name: foundMember.name, photoURL: foundMember.photoURL || '' });
                  }
                }
              }
            }
            
            // If no assignees found, default to current user
            if (assignees.length === 0) {
              assignees.push({ id: authResult.uid, name: currentUserName, photoURL: userData?.photoURL || '' });
            }
            
            // Create a task for each assignee
            const createdTasks: string[] = [];
            // Generate groupId if multiple assignees
            const taskGroupId = assignees.length > 1 ? `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;
            
            for (const assignee of assignees) {
              const taskData: any = {
                title: args.title,
                description: baseDescription || '',
                location: args.location || '',
                clientName: clientName || '',
                clientId: clientId || '',
                dueDate,
                dueTime: args.time || '',
                status: 'Pendiente',
                type: 'Tarea',
                assignedToId: assignee.id,
                assignedToName: assignee.name,
                assignedToPhotoURL: assignee.photoURL,
                createdById: authResult.uid,
                createdByName: currentUserName,
                createdAt: FieldValue.serverTimestamp(),
              };
              
              // Add groupId if this is a group task
              if (taskGroupId) {
                taskData.taskGroupId = taskGroupId;
              }
              
              console.log('Creating task for:', assignee.name, { title: args.title, dueDate });
              const taskRef = await adminDb.collection('tasks').add(taskData);
              console.log('Task created:', taskRef.id);
              createdTasks.push(assignee.name);
            }
            
            const timeStr = args.time ? ' a las ' + args.time : '';
            const locationStr = args.location ? ' en ' + args.location : '';
            if (createdTasks.length === 1 && createdTasks[0] === currentUserName) {
              results.push(args.title + timeStr + locationStr);
            } else {
              results.push(args.title + timeStr + locationStr + ' (para ' + createdTasks.join(', ') + ')');
            }
          } 
          else if (fc.name === 'create_client') {
            const args = fc.args as any;
            const clientData = {
              name: args.name,
              email: args.email || '',
              phone: args.phone || '',
              status: 'Activo',
              category: 'General',
              owner: authResult.uid,
              createdAt: FieldValue.serverTimestamp(),
            };
            await adminDb.collection('clients').add(clientData);
            results.push('Cliente: ' + args.name);
          }
          else if (fc.name === 'create_supplier') {
            const args = fc.args as any;
            const supplierData = {
              name: args.name,
              email: args.email || '',
              phone: args.phone || '',
              status: 'Activo',
              owner: authResult.uid,
              createdAt: FieldValue.serverTimestamp(),
            };
            await adminDb.collection('suppliers').add(supplierData);
            results.push('Proveedor: ' + args.name);
          }
        } catch (error) {
          console.error('Error creating record:', error);
          results.push('Error al crear');
        }
      }
      
      finalText = results.length > 0 ? 'Creado: ' + results.join(', ') : 'Procesado.';
    } else {
      try {
        const textPart = result.response?.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
        finalText = textPart?.text || 'Entendido.';
      } catch {
        finalText = 'Entendido.';
      }
    }

    return NextResponse.json({
      response: finalText,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Chat Error:', error);
    // Return detailed error in production for debugging
    const errorDetails = error.message || 'Unknown error';
    return NextResponse.json({
      response: `Error: ${errorDetails.substring(0, 100)}`,
      error: errorDetails,
    }, { status: 500 });
  }
}