
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode, useCallback, useEffect } from 'react';
import { useGlobalNotification } from './NotificationContext';
import { 
    type AuthenticatedUser, 
    type Client, 
    type Task, 
    type Document, 
    type Note, 
    type Reservation, 
    type ServiceWorkflow, 
    type WorkflowStage, 
    type WorkflowStageObjective,
    type AppUser,
    type UserRole,
    type AppPermissions,
} from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, writeBatch, setDoc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface CRMContextType {
  currentUser: AuthenticatedUser | null;
  isLoadingCurrentUser: boolean;
  clients: Client[];
  isLoadingClients: boolean;
  addClient: (newClientData: Omit<Client, 'id'>) => Promise<Client | null>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<boolean>;
  deleteClient: (clientId: string) => Promise<boolean>;
  getClientById: (clientId: string) => Client | undefined;
  
  tasks: Task[];
  isLoadingTasks: boolean;
  addTask: (newTaskData: Omit<Task, 'id' | 'status'>) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getTasksByClientId: (clientId: string) => Task[];

  documents: Document[];
  isLoadingDocuments: boolean;
  addDocument: (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file?: File) => Promise<Document | null>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<boolean>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  getDocumentsByClientId: (clientId: string) => Document[];

  notes: Note[];
  isLoadingNotes: boolean;
  addNote: (clientId: string, text: string) => Promise<Note | null>;
  updateNote: (noteId: string, newText: string, clientId?: string) => Promise<boolean>;
  deleteNote: (noteId: string, clientId?: string) => Promise<boolean>;

  reservations: Reservation[];
  isLoadingReservations: boolean;
  addReservation: (newReservationData: Omit<Reservation, 'id'>) => Promise<Reservation | null>;
  updateReservation: (reservationId: string, updates: Partial<Reservation>) => Promise<boolean>;
  deleteReservation: (reservationId: string) => Promise<boolean>;

  serviceWorkflows: ServiceWorkflow[];
  isLoadingWorkflows: boolean;
  addService: () => Promise<ServiceWorkflow | null>;
  updateService: (serviceId: string, updates: Partial<ServiceWorkflow>) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  addSubServiceToService: (serviceId: string) => Promise<boolean>;
  updateSubServiceName: (serviceId: string, subServiceId: string, newName: string) => Promise<boolean>;
  deleteSubServiceFromService: (serviceId: string, subServiceId: string) => Promise<boolean>;
  addStageToSubService: (serviceId: string, subServiceId: string | null) => Promise<boolean>;
  updateStageInSubService: (serviceId: string, subServiceId: string | null, stageId: string, updates: Partial<WorkflowStage>) => Promise<boolean>;
  deleteStageFromSubService: (serviceId: string, subServiceId: string | null, stageId: string) => Promise<boolean>;
  addObjectiveToStage: (serviceId: string, subServiceId: string | null, stageId: string) => Promise<boolean>;
  updateObjectiveInStage: (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string, updates: Partial<WorkflowStageObjective>) => Promise<boolean>;
  deleteObjectiveFromStage: (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string) => Promise<boolean>;
  getObjectiveById: (objectiveId: string) => WorkflowStageObjective | null;
  completeClientObjective: (clientId: string) => Promise<{ nextObjective: WorkflowStageObjective | null; updatedClient: Client | null; }>;
  registerUser: (name: string, email: string, pass: string) => Promise<any>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();

    // Return empty arrays and loading=false to prevent Firestore calls
    const clients: Client[] = [];
    const isLoadingClients = false;
    const tasks: Task[] = [];
    const isLoadingTasks = false;
    const documents: Document[] = [];
    const isLoadingDocuments = false;
    const notes: Note[] = [];
    const isLoadingNotes = false;
    const reservations: Reservation[] = [];
    const isLoadingReservations = false;
    const serviceWorkflows: ServiceWorkflow[] = [];
    const isLoadingWorkflows = false;

    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

    useEffect(() => {
        if (user) {
            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                permissions: { 
                  dashboard: true, 
                  clients_view: true, 
                  tasks_view: true, 
                  bookings_view: true, 
                  crm_view: true, 
                  audit_view: true, 
                  admin_view: true,
                  clients_create: true,
                  clients_edit: true,
                  clients_delete: true,
                  tasks_create: true,
                  tasks_edit: true,
                  tasks_delete: true,
                  reservations_create: true,
                  reservations_edit: true,
                  reservations_delete: true,
                  crm_edit: true
                },
            });
        } else {
            setCurrentUser(null);
        }
    }, [user]);

    const registerUser = async (name: string, email: string, pass: string) => {
        if (!auth || !firestore) {
            showNotification('error', 'Error de registro', 'Los servicios de autenticación no están listos.');
            return null;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const { user: newUser } = userCredential;

            await updateProfile(newUser, { displayName: name });
            await setDoc(doc(firestore, "users", newUser.uid), {
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
    
    // Placeholder functions to avoid breaking the UI
    const placeholderPromise = async <T,>(data: T | null = null): Promise<any> => {
        showNotification('info', 'Funcionalidad no implementada', 'Esta acción aún no está conectada.');
        return data;
    }

    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser: isUserLoading, 
        clients, isLoadingClients, 
        addClient: (d) => placeholderPromise(null), 
        updateClient: (id, d) => placeholderPromise(false), 
        deleteClient: (id) => placeholderPromise(false),
        getClientById: (id: string) => clients.find(c => c.id === id),
        
        tasks, isLoadingTasks,
        addTask: (d) => placeholderPromise(null), 
        updateTask: (id, d) => placeholderPromise(false), 
        deleteTask: (id) => placeholderPromise(false),
        getTasksByClientId: (id: string) => tasks.filter(t => t.clientId === id),

        documents, isLoadingDocuments,
        addDocument: (d) => placeholderPromise(null),
        updateDocument: (id, d) => placeholderPromise(false),
        deleteDocument: (id) => placeholderPromise(false),
        getDocumentsByClientId: (id) => documents.filter(d => d.clientId === id),

        notes, isLoadingNotes,
        addNote: (clientId, text) => placeholderPromise(null),
        updateNote: (id, text) => placeholderPromise(false),
        deleteNote: (id) => placeholderPromise(false),

        reservations, isLoadingReservations,
        addReservation: (d) => placeholderPromise(null),
        updateReservation: (id, d) => placeholderPromise(false),
        deleteReservation: (id) => placeholderPromise(false),

        serviceWorkflows, isLoadingWorkflows,
        addService: () => placeholderPromise(null),
        updateService: (id, d) => placeholderPromise(false),
        deleteService: (id) => placeholderPromise(false),
        addSubServiceToService: (id) => placeholderPromise(false),
        updateSubServiceName: (id, subId, name) => placeholderPromise(false),
        deleteSubServiceFromService: (id, subId) => placeholderPromise(false),
        addStageToSubService: (id, subId) => placeholderPromise(false),
        updateStageInSubService: (id, subId, stageId, d) => placeholderPromise(false),
        deleteStageFromSubService: (id, subId, stageId) => placeholderPromise(false),
        addObjectiveToStage: (id, subId, stageId) => placeholderPromise(false),
        updateObjectiveInStage: (id, subId, stageId, objId, d) => placeholderPromise(false),
        deleteObjectiveFromStage: (id, subId, stageId, objId) => placeholderPromise(false),

        getObjectiveById: (id) => null,
        completeClientObjective: (id) => placeholderPromise({ nextObjective: null, updatedClient: null }),
        registerUser,
    }), [
        currentUser, isUserLoading, clients, isLoadingClients, 
        tasks, isLoadingTasks, documents, isLoadingDocuments, notes, isLoadingNotes,
        reservations, isLoadingReservations, serviceWorkflows, isLoadingWorkflows,
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
