

"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode, useCallback, useEffect } from 'react';
import { useGlobalNotification } from './NotificationContext';
import { 
    type AuthenticatedUser, 
    type Client, 
    type Task, 
    type Document, 
    type Note, 
    type ServiceWorkflow, 
    type WorkflowAction,
    type AppUser,
    type UserRole,
    type AppPermissions,
    type SubService,
    type ClientRequirement,
    type WorkflowStage,
    type SubStage,
    type SubSubStage,
    type Commission,
} from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc, useAuth, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { teamMembers as mockTeamMembers, serviceWorkflows as mockServiceWorkflows } from '@/lib/data';
import { addDays, format } from 'date-fns';

type AnyStage = WorkflowStage | SubStage | SubSubStage;

interface CRMContextType {
  currentUser: AuthenticatedUser | null;
  isLoadingCurrentUser: boolean;
  teamMembers: AppUser[];
  clients: Client[];
  isLoadingClients: boolean;
  addClient: (newClientData: Omit<Client, 'id'>) => Promise<Client | null>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<boolean>;
  deleteClient: (clientId: string) => Promise<boolean>;
  getClientById: (clientId: string) => Client | undefined;
  
  tasks: Task[];
  isLoadingTasks: boolean;
  addTask: (newTaskData: Omit<Task, 'id' | 'status' >) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getTasksByClientId: (clientId: string) => Task[];

  documents: Document[];
  isLoadingDocuments: boolean;
  addDocument: (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file?: File) => Promise<Document | null>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<boolean>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  getDocumentsByClientId: (clientId: string) => Document[];
  getDocumentsByServiceId: (serviceId: string) => Document[];

  notes: Note[];
  isLoadingNotes: boolean;
  addNote: (clientId: string, text: string) => Promise<Note | null>;
  updateNote: (noteId: string, newText: string, clientId?: string) => Promise<boolean>;
  deleteNote: (noteId: string, clientId?: string) => Promise<boolean>;

  serviceWorkflows: ServiceWorkflow[];
  setServiceWorkflows: (workflows: ServiceWorkflow[]) => void;
  isLoadingWorkflows: boolean;
  addService: (name: string) => Promise<ServiceWorkflow | null>;
  updateService: (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'stages' | 'subServices'>>) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  getActionById: (actionId: string) => WorkflowAction | null;
  
  registerUser: (name: string, email: string, pass: string) => Promise<any>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();

    // MOCK DATA STATES (for data not yet in firestore)
    const [teamMembers, setTeamMembers] = useState<AppUser[]>(mockTeamMembers);
    const [notes, setNotes] = useState<Note[]>([]); // Will be fetched if needed
    
    // LOADING STATES
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

    // --- Collections ---
    const clientsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
    const tasksCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
    const documentsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'documents') : null, [firestore, user]);
    const serviceWorkflowsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'serviceWorkflows') : null, [firestore, user]);

    // --- Firestore Data ---
    const { data: clients = [], isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
    const { data: tasks = [], isLoading: isLoadingTasks } = useCollection<Task>(tasksCollection);
    const { data: documents = [], isLoading: isLoadingDocuments } = useCollection<Document>(documentsCollection);
    const { data: serviceWorkflows = [], isLoading: isLoadingWorkflows } = useCollection<ServiceWorkflow>(serviceWorkflowsCollection);


    useEffect(() => {
        if (user) {
            // Find user in mock team members to assign permissions. In a real app, this would come from the DB.
            const userInTeam = teamMembers.find(m => m.email === user.email);
            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: userInTeam?.photoURL || user.photoURL,
                // In a real app, permissions would be fetched based on the user's role from the database.
                permissions: { 
                  dashboard: true, clients_view: true, tasks_view: true, crm_view: true, finances_view: true, admin_view: true,
                  clients_create: true, clients_edit: true, clients_delete: true,
                  tasks_create: true, tasks_edit: true, tasks_delete: true,
                  crm_edit: true, team_invite: true, documents_view: true, services_view: true,
                },
            });
        } else {
            setCurrentUser(null);
        }
    }, [user, teamMembers]);

    const registerUser = async (name: string, email: string, pass: string) => {
        if (!auth || !firestore) {
            showNotification('error', 'Error de registro', 'Los servicios de autenticación no están listos.');
            return null;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const { user: newUser } = userCredential;

            await updateProfile(newUser, { displayName: name });
            const userDocRef = doc(firestore, "users", newUser.uid);
            await setDocumentNonBlocking(userDocRef, {
                uid: newUser.uid,
                email: newUser.email,
                displayName: name,
                roleId: 'collaborator'
            }, {});

            return userCredential;
        } catch (error: any) {
            console.error("Error registering user:", error);
            showNotification('error', 'Error de registro', error.message);
            return null;
        }
    };
    
    // --- Data Handlers ---

    const addClient = async (newClientData: Omit<Client, 'id'>): Promise<Client | null> => {
        if (!clientsCollection || !serviceWorkflows) return null;
        
        const firstServiceId = newClientData.subscribedServiceIds[0];
        const service = serviceWorkflows.find(s => s.id === firstServiceId);
        const initialStage = service?.stages?.[0];

        const payload = {
            ...newClientData,
            currentWorkflowStageId: initialStage?.id,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDocumentNonBlocking(clientsCollection, payload);
        
        const newClient = { id: docRef.id, ...payload } as Client;

        if (initialStage?.actions) {
            for (const action of initialStage.actions) {
                await addTask({
                    ...action,
                    clientId: newClient.id,
                });
            }
        }
        
        return newClient;
    };

    const updateClient = async (clientId: string, updates: Partial<Client>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', clientId);
        await setDocumentNonBlocking(docRef, updates, { merge: true });
        return true;
    };

    const deleteClient = async (clientId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', clientId);
        await deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const addTask = async (newTaskData: Omit<Task, 'id' | 'status'>): Promise<Task | null> => {
        if (!currentUser || !tasksCollection) return null;
        const client = clients.find(c => c.id === newTaskData.clientId);
        if (!client) return null;

        let finalDueDate: string;
        if (newTaskData.dueDate === undefined) {
             finalDueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        } else if (newTaskData.dueDate instanceof Date) {
            finalDueDate = format(newTaskData.dueDate, 'yyyy-MM-dd');
        } else {
            finalDueDate = newTaskData.dueDate;
        }

        const assignedUserId = newTaskData.assignedToId || currentUser.uid;
        const assignedUser = teamMembers.find(m => m.id === assignedUserId);

        const newTaskPayload = { 
            ...newTaskData, 
            dueDate: finalDueDate,
            status: 'Pendiente' as const, 
            clientName: client.name,
            assignedToId: assignedUser?.id || currentUser.uid,
            assignedToName: assignedUser?.name || currentUser.displayName || 'Usuario Actual',
            assignedToPhotoURL: assignedUser?.photoURL || currentUser.photoURL || '',
            createdAt: serverTimestamp()
        };

        const docRef = await addDocumentNonBlocking(tasksCollection, newTaskPayload);
        showNotification('success', 'Tarea Creada', `La tarea "${newTaskPayload.title}" ha sido creada.`);
        return { id: docRef.id, ...newTaskPayload } as Task;
    };
    
    const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        await setDocumentNonBlocking(docRef, updates, { merge: true });
        
        if (updates.status === 'Completada') {
            const completedTask = tasks.find(t => t.id === taskId);
            if (completedTask) {
                await checkAndAdvanceWorkflow(completedTask.clientId);
            }
        }
        return true;
    };
    
    const checkAndAdvanceWorkflow = async (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client || !client.currentWorkflowStageId) return;

        await new Promise(resolve => setTimeout(resolve, 500));

        const clientTasks = tasks.filter(t => t.clientId === clientId);
        
        const allStages = getAllStages();
        const currentStage = allStages.find(s => s.id === client.currentWorkflowStageId);
        if (!currentStage) return;

        const pendingTasksForCurrentStage = clientTasks.filter(task => {
            const isTaskForThisStage = currentStage.actions.some(action => action.title === task.title);
            return isTaskForThisStage && task.status === 'Pendiente';
        });

        if (pendingTasksForCurrentStage.length === 0) {
            const nextStage = findNextStage(client.currentWorkflowStageId);
            if (nextStage) {
                await updateClient(clientId, { currentWorkflowStageId: nextStage.id });
                showNotification('info', 'Cliente Avanzó', `${client.name} ha avanzado a la etapa: ${nextStage.title}.`);

                for (const action of nextStage.actions) {
                    await addTask({ ...action, clientId: clientId });
                }
            } else {
                 showNotification('success', 'Flujo Completado', `¡${client.name} ha completado el flujo de trabajo!`);
            }
        }
    };
    
    const getAllStages = useCallback((): AnyStage[] => {
      if (!serviceWorkflows) return [];
      
      const all: AnyStage[] = [];
      
      serviceWorkflows.forEach(service => {
        (service.stages || []).forEach(stage1 => {
          all.push(stage1);
          (stage1.subStages || []).forEach(stage2 => {
            all.push(stage2);
            (stage2.subSubStages || []).forEach(stage3 => {
                all.push(stage3);
            });
          });
        });
      });

      return all.sort((a,b) => a.order - b.order);
    }, [serviceWorkflows]);

    const findNextStage = (currentStageId: string): AnyStage | null => {
        const allStages = getAllStages();
        const currentIndex = allStages.findIndex(s => s.id === currentStageId);
        if (currentIndex !== -1 && currentIndex < allStages.length - 1) {
            return allStages[currentIndex + 1];
        }
        return null;
    };

    const deleteTask = async (taskId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        await deleteDocumentNonBlocking(docRef);
        return true;
    };

    const addDocument = async (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file?: File): Promise<Document | null> => {
        if (!documentsCollection) return null;
        // In a real app, you'd upload the file to Firebase Storage and get a downloadURL
        const newDoc = { 
            ...newDocumentData,
            uploadedAt: serverTimestamp(),
            downloadURL: '#' // Placeholder
        };
        const docRef = await addDocumentNonBlocking(documentsCollection, newDoc);
        return { id: docRef.id, ...newDoc } as Document;
    }

    const deleteDocument = async (id: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'documents', id);
        await deleteDocumentNonBlocking(docRef);
        return true;
    }

    const getActionById = useCallback((actionId: string): WorkflowAction | null => {
        if (!serviceWorkflows) return null;
        for (const service of serviceWorkflows) {
            if (!service.stages) continue;
            for (const stage of service.stages) {
                let action = stage.actions.find(o => o.id === actionId);
                if (action) return action;

                if (!stage.subStages) continue;
                for (const subStage of (stage.subStages || [])) {
                    action = subStage.actions.find(o => o.id === actionId);
                    if (action) return action;
                    
                    if (!subStage.subSubStages) continue;
                    for (const subSubStage of (subStage.subSubStages || [])) {
                         action = subSubStage.actions.find(o => o.id === actionId);
                         if (action) return action;
                    }
                }
            }
        }
        return null;
    }, [serviceWorkflows]);

    // --- Service / Workflow Handlers ---

    const addService = async (name: string): Promise<ServiceWorkflow | null> => {
        if (!serviceWorkflowsCollection) return null;
        const newServiceData: Omit<ServiceWorkflow, 'id'> = {
            name: name,
            description: "",
            clientRequirements: [],
            commissions: [],
            stages: [],
            subServices: [], // legacy
        };
        const docRef = await addDocumentNonBlocking(serviceWorkflowsCollection, newServiceData);
        return { ...newServiceData, id: docRef.id };
    };

    const updateService = async (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'stages' | 'subServices'>>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        await setDocumentNonBlocking(docRef, updates, { merge: true });
        showNotification('success', 'Servicio Guardado', 'Los cambios se han guardado correctamente.');
        return true;
    }
    
    const setServiceWorkflowsAndPersist = (workflows: ServiceWorkflow[]) => {
      if (!user || !firestore) return;
      const batch = writeBatch(firestore);
      workflows.forEach(wf => {
          const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', wf.id);
          batch.set(docRef, wf, { merge: true });
      });
      batch.commit().catch(err => console.error("Error saving workflow order", err));
    };


    const deleteService = async (serviceId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        await deleteDocumentNonBlocking(docRef);
        showNotification('success', 'Servicio Eliminado', 'El servicio ha sido eliminado.');
        return true;
    }
    
    const placeholderPromise = async <T,>(data: T | null = null): Promise<any> => {
        showNotification('info', 'Funcionalidad no implementada', 'Esta acción aún no está conectada.');
        return data;
    }

    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser: isUserLoading, teamMembers,
        clients, isLoadingClients, 
        addClient, updateClient, deleteClient,
        getClientById: (id: string) => clients.find(c => c.id === id),
        
        tasks, isLoadingTasks,
        addTask, updateTask, deleteTask,
        getTasksByClientId: (id: string) => tasks.filter(t => t.clientId === id),

        documents, isLoadingDocuments,
        addDocument,
        updateDocument: (id, d) => placeholderPromise(false),
        deleteDocument: deleteDocument,
        getDocumentsByClientId: (id) => documents.filter(d => d.clientId === id),
        getDocumentsByServiceId: (id) => documents.filter(d => d.serviceId === id),

        notes, isLoadingNotes,
        addNote: (clientId, text) => placeholderPromise(null),
        updateNote: (id, text) => placeholderPromise(false),
        deleteNote: (id) => placeholderPromise(false),

        serviceWorkflows, 
        setServiceWorkflows: setServiceWorkflowsAndPersist, 
        isLoadingWorkflows,
        addService, updateService, deleteService,
        getActionById,
        
        registerUser,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [
        currentUser, isUserLoading, teamMembers, clients, isLoadingClients, 
        tasks, isLoadingTasks, documents, isLoadingDocuments, notes, isLoadingNotes,
        serviceWorkflows, isLoadingWorkflows, getActionById
    ]);

    return (
        <CRMContext.Provider value={value}>
            {children}
        </CRMContext.Provider>
    );
}

export function useCRMData() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRMData must be used within a CRMDataProvider');
  }
  return context;
}
