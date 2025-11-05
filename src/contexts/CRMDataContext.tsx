

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
    type WorkflowStage, 
    type WorkflowAction,
    type AppUser,
    type UserRole,
    type AppPermissions,
    type SubService,
    type ClientRequirement,
} from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, writeBatch, setDoc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { clients as mockClients, tasks as mockTasks, documents as mockDocuments, notes as mockNotes, serviceWorkflows as mockWorkflows, teamMembers as mockTeamMembers } from '@/lib/data';
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
  setServiceWorkflows: React.Dispatch<React.SetStateAction<ServiceWorkflow[]>>;
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

    // MOCK DATA STATES
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [documents, setDocuments] = useState<Document[]>(mockDocuments);
    const [notes, setNotes] = useState<Note[]>(mockNotes);
    const [serviceWorkflows, setServiceWorkflows] = useState<ServiceWorkflow[]>(mockWorkflows);
    const [teamMembers, setTeamMembers] = useState<AppUser[]>(mockTeamMembers);
    
    // LOADING STATES
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

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
            await setDoc(doc(firestore, "clients", newUser.uid), {
                uid: newUser.uid,
                email: newUser.email,
                displayName: name,
                roleId: 'collaborator'
            });

            return userCredential;
        } catch (error: any) {
            console.error("Error registering user:", error);
            showNotification('error', 'Error de registro', error.message);
            return null;
        }
    };
    
    // --- Data Handlers ---

    const addClient = async (newClientData: Omit<Client, 'id'>): Promise<Client | null> => {
        const newClient: Client = { ...newClientData, id: `client-${Date.now()}` };
        setClients(prev => [...prev, newClient]);
        return newClient;
    };
    const updateClient = async (clientId: string, updates: Partial<Client>): Promise<boolean> => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
        return true;
    };
    const deleteClient = async (clientId: string): Promise<boolean> => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        return true;
    };
    
    const addTask = async (newTaskData: Omit<Task, 'id' | 'status' | 'clientName'> & { dueDays?: number }): Promise<Task | null> => {
        const client = clients.find(c => c.id === newTaskData.clientId);
        if (!client) return null;

        let finalDueDate = newTaskData.dueDate;
        if (newTaskData.dueDays !== undefined) {
            const today = new Date();
            const dueDate = addDays(today, newTaskData.dueDays);
            finalDueDate = format(dueDate, 'yyyy-MM-dd');
        }

        const assignedUser = teamMembers.find(m => m.id === newTaskData.assignedToId);

        const newTask: Task = { 
            ...newTaskData, 
            dueDate: finalDueDate,
            id: `task-${Date.now()}`, 
            status: 'Pendiente', 
            clientName: client.name,
            assignedToName: assignedUser?.name,
            assignedToPhotoURL: assignedUser?.photoURL,
        };
        setTasks(prev => [...prev, newTask].sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59")));
        showNotification('success', 'Tarea Creada', `La tarea "${newTask.title}" ha sido creada.`);
        return newTask;
    };
    const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        return true;
    };
    const deleteTask = async (taskId: string): Promise<boolean> => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        return true;
    };

    const addDocument = async (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file?: File): Promise<Document | null> => {
        const newDoc: Document = { ...newDocumentData, id: `doc-${Date.now()}`, uploadedAt: new Date(), downloadURL: '#' };
        setDocuments(prev => [...prev, newDoc]);
        return newDoc;
    }

    const getActionById = useCallback((actionId: string): WorkflowAction | null => {
        for (const service of serviceWorkflows) {
            for (const subService of service.subServices) {
                for (const stage of subService.stages) {
                    const action = stage.actions.find(o => o.id === actionId);
                    if (action) return action;
                }
            }
        }
        return null;
    }, [serviceWorkflows]);

    // --- Service / Workflow Handlers ---

    const addService = async (name: string): Promise<ServiceWorkflow | null> => {
        const newService: ServiceWorkflow = {
            id: `service-${Date.now()}`,
            name: name,
            description: "",
            clientRequirements: [],
            stages: [],
            subServices: [],
        };
        setServiceWorkflows(prev => [newService, ...prev]);
        return newService;
    };

    const updateService = async (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'stages' | 'subServices'>>): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(s => s.id === serviceId ? { ...s, ...updates } : s));
        showNotification('success', 'Servicio Guardado', 'Los cambios se han guardado correctamente.');
        return true;
    }

    const deleteService = async (serviceId: string): Promise<boolean> => {
        setServiceWorkflows(prev => prev.filter(s => s.id !== serviceId));
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
            setDocuments(prev => prev.filter(doc => doc.id !== id));
            return Promise.resolve(true);
        },
        getDocumentsByClientId: (id) => documents.filter(d => d.clientId === id),
        getDocumentsByServiceId: (id) => documents.filter(d => d.serviceId === id),

        notes, isLoadingNotes,
        addNote: (clientId, text) => placeholderPromise(null),
        updateNote: (id, text) => placeholderPromise(false),
        deleteNote: (id) => placeholderPromise(false),

        serviceWorkflows, setServiceWorkflows, isLoadingWorkflows,
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
