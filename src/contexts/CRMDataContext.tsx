

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
} from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc, useAuth, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { teamMembers as mockTeamMembers } from '@/lib/data';
import { addDays, format } from 'date-fns';

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
  addTask: (newTaskData: Omit<Task, 'id' | 'status' | 'clientName'> & { dueDays?: number }) => Promise<Task | null>;
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
    
    // --- Firestore Data ---
    const clientsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
    const { data: clients = [], isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
    
    const tasksCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
    const { data: tasks = [], isLoading: isLoadingTasks } = useCollection<Task>(tasksCollection);
    
    const documentsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'documents') : null, [firestore, user]);
    const { data: documents = [], isLoading: isLoadingDocuments } = useCollection<Document>(documentsCollection);

    const workflowsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'serviceWorkflows') : null, [firestore, user]);
    const { data: serviceWorkflows = [], isLoading: isLoadingWorkflows } = useCollection<ServiceWorkflow>(workflowsCollection);


    useEffect(() => {
        if (user) {
            const userInTeam = teamMembers.find(m => m.email === user.email);
            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: userInTeam?.photoURL || user.photoURL,
                permissions: { 
                  dashboard: true, 
                  clients_view: true, 
                  tasks_view: true, 
                  crm_view: true, 
                  finances_view: true, 
                  admin_view: true,
                  clients_create: true,
                  clients_edit: true,
                  clients_delete: true,
                  tasks_create: true,
                  tasks_edit: true,
                  tasks_delete: true,
                  crm_edit: true,
                  team_invite: true,
                  documents_view: true,
                  services_view: true,
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
        
        // Find the first stage of the first subscribed service to set the initial state
        const firstServiceId = newClientData.subscribedServiceIds[0];
        const service = serviceWorkflows.find(s => s.id === firstServiceId);
        const initialStage = service?.stages?.[0] || service?.subServices?.[0]?.stages?.[0];

        const payload: Omit<Client, 'id'> = {
            ...newClientData,
            currentWorkflowStageId: initialStage?.id,
            createdAt: serverTimestamp(),
        };
        
        const newClientDocRef = await addDocumentNonBlocking(clientsCollection, payload);
        
        // Auto-generate tasks for the initial stage
        if (initialStage?.actions && newClientDocRef) {
            for (const action of initialStage.actions) {
                await addTask({
                    ...action,
                    clientId: newClientDocRef.id,
                });
            }
        }
        
        return { ...payload, id: newClientDocRef.id };
    };
    const updateClient = async (clientId: string, updates: Partial<Client>): Promise<boolean> => {
        if (!clientsCollection) return false;
        const clientDocRef = doc(clientsCollection, clientId);
        setDocumentNonBlocking(clientDocRef, updates, { merge: true });
        return true;
    };
    const deleteClient = async (clientId: string): Promise<boolean> => {
        if (!clientsCollection) return false;
        const clientDocRef = doc(clientsCollection, clientId);
        deleteDocumentNonBlocking(clientDocRef);
        return true;
    };
    
    const addTask = async (newTaskData: Omit<Task, 'id' | 'status' | 'clientName'> & { dueDays?: number }): Promise<Task | null> => {
        if (!tasksCollection) return null;
        const client = clients.find(c => c.id === newTaskData.clientId);
        if (!client) return null;

        let finalDueDate = newTaskData.dueDate;
        if (newTaskData.dueDays !== undefined) {
            const today = new Date();
            const dueDate = addDays(today, newTaskData.dueDays);
            finalDueDate = format(dueDate, 'yyyy-MM-dd');
        }

        const assignedUser = teamMembers.find(m => m.id === newTaskData.assignedToId);

        const newTaskPayload: Omit<Task, 'id'> = { 
            ...newTaskData, 
            dueDate: finalDueDate,
            status: 'Pendiente', 
            clientName: client.name,
            assignedToId: assignedUser?.id,
            assignedToName: assignedUser?.name,
            assignedToPhotoURL: assignedUser?.photoURL,
            createdAt: serverTimestamp()
        };
        const newDocRef = await addDocumentNonBlocking(tasksCollection, newTaskPayload);
        showNotification('success', 'Tarea Creada', `La tarea "${newTaskPayload.title}" ha sido creada.`);
        return { ...newTaskPayload, id: newDocRef.id };
    };
    const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
        if (!tasksCollection) return false;
        const taskDocRef = doc(tasksCollection, taskId);
        setDocumentNonBlocking(taskDocRef, updates, { merge: true });
        return true;
    };
    const deleteTask = async (taskId: string): Promise<boolean> => {
        if (!tasksCollection) return false;
        const taskDocRef = doc(tasksCollection, taskId);
        deleteDocumentNonBlocking(taskDocRef);
        return true;
    };

    const addDocument = async (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file?: File): Promise<Document | null> => {
         if (!documentsCollection) return null;
        // NOTE: File upload to storage is not implemented here. This just saves metadata.
        const newDocRef = await addDocumentNonBlocking(documentsCollection, {
            ...newDocumentData,
            uploadedAt: serverTimestamp(),
            downloadURL: '#'
        });
        return { ...newDocumentData, id: newDocRef.id, uploadedAt: new Date(), downloadURL: '#' };
    }

    const getActionById = useCallback((actionId: string): WorkflowAction | null => {
        if (!serviceWorkflows) return null;
        for (const service of serviceWorkflows) {
            if(service.stages) {
                for (const stage of service.stages) {
                    const action = stage.actions.find(o => o.id === actionId);
                    if (action) return action;
                }
            }
            if(service.subServices) {
                for (const subService of service.subServices) {
                    for (const stage of subService.stages) {
                        const action = stage.actions.find(o => o.id === actionId);
                        if (action) return action;
                    }
                }
            }
        }
        return null;
    }, [serviceWorkflows]);

    // --- Service / Workflow Handlers ---

    const addService = async (name: string): Promise<ServiceWorkflow | null> => {
        if (!workflowsCollection) return null;
        const newServiceData: Omit<ServiceWorkflow, 'id'> = {
            name: name,
            description: "",
            clientRequirements: [],
            stages: [],
            subServices: [],
        };
        const newDocRef = await addDocumentNonBlocking(workflowsCollection, newServiceData);
        return { ...newServiceData, id: newDocRef.id };
    };

    const updateService = async (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'stages' | 'subServices'>>): Promise<boolean> => {
        if (!workflowsCollection) return false;
        const serviceDocRef = doc(workflowsCollection, serviceId);
        setDocumentNonBlocking(serviceDocRef, updates, { merge: true });
        showNotification('success', 'Servicio Guardado', 'Los cambios se han guardado correctamente.');
        return true;
    }
    
    const setServiceWorkflowsAndPersist = (workflows: ServiceWorkflow[]) => {
      if (!workflowsCollection) return;
      const batch = writeBatch(firestore);
      workflows.forEach(wf => {
        const { id, ...data } = wf;
        const docRef = doc(workflowsCollection, id);
        batch.set(docRef, data);
      });
      batch.commit().then(() => {
         // Data will be updated by the realtime listener, no need for local state update
      }).catch(err => {
        console.error("Error saving workflows", err);
        showNotification('error', 'Error al Guardar', 'No se pudieron guardar los cambios en los flujos.');
      });
    };


    const deleteService = async (serviceId: string): Promise<boolean> => {
        if (!workflowsCollection) return false;
        const serviceDocRef = doc(workflowsCollection, serviceId);
        deleteDocumentNonBlocking(serviceDocRef);
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
        deleteDocument: (id) => {
            if(!documentsCollection) return Promise.resolve(false);
            deleteDocumentNonBlocking(doc(documentsCollection, id));
            return Promise.resolve(true);
        },
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
