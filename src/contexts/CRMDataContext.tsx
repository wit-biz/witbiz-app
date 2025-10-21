
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
    type SubService, 
    type WorkflowStage, 
    type WorkflowStageObjective,
    type DocumentType,
    type DonnaPermissions,
    type AppUser,
    type UserRole,
} from '@/lib/types';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, writeBatch, setDoc } from 'firebase/firestore';
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

  donnaReservations: Reservation[];
  isLoadingDonnaReservations: boolean;
  addDonnaReservation: (newReservationData: Omit<Reservation, 'id'>) => Promise<Reservation | null>;
  updateDonnaReservation: (reservationId: string, updates: Partial<Reservation>) => Promise<boolean>;
  deleteDonnaReservation: (reservationId: string) => Promise<boolean>;

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

const guestPermissions: Partial<DonnaPermissions> = {
    dashboard: true,
    clients_view: true, clients_create: true, clients_edit: true, clients_delete: true,
    tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: true,
    reservations_view: true, reservations_create: true, reservations_edit: true, reservations_delete: true,
    documents_view: true, documents_create: true, documents_edit: true, documents_delete: true,
    crm_view: true, crm_edit: true,
    reports_view: true,
    audit_view: true,
    admin_view: true,
};

const guestUser: AuthenticatedUser = {
    uid: 'guest-user',
    email: 'guest@example.com',
    displayName: 'Invitado',
    photoURL: null,
    permissions: guestPermissions,
};


export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const firestore = useFirestore();
    
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(guestUser);
    const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(false);

    // All data fetching logic is disabled as there is no real user.
    // We will return empty arrays for all data.
    const [clients, setClients] = useState<Client[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [donnaReservations, setDonnaReservations] = useState<Reservation[]>([]);
    const [serviceWorkflows, setServiceWorkflows] = useState<ServiceWorkflow[]>([]);

    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [isLoadingDonnaReservations, setIsLoadingDonnaReservations] = useState(false);
    const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

    const placeholderPromise = async <T,>(data: T | null = null): Promise<any> => {
        showNotification('info', 'Funcionalidad deshabilitada', 'El modo invitado no permite guardar datos.');
        return data;
    }

    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser, 
        clients, isLoadingClients, 
        addClient: (d) => placeholderPromise(null),
        updateClient: (id, d) => placeholderPromise(false),
        deleteClient: (id) => placeholderPromise(false),
        getClientById: (id) => clients.find(c => c.id === id),
        
        tasks, isLoadingTasks,
        addTask: (d) => placeholderPromise(null),
        updateTask: (id, d) => placeholderPromise(false),
        deleteTask: (id) => placeholderPromise(false),
        getTasksByClientId: (id) => tasks.filter(t => t.clientId === id),

        documents, isLoadingDocuments,
        addDocument: (d) => placeholderPromise(null),
        updateDocument: (id, d) => placeholderPromise(false),
        deleteDocument: (id) => placeholderPromise(false),
        getDocumentsByClientId: (id) => documents.filter(d => d.clientId === id),

        notes, isLoadingNotes,
        addNote: (clientId, text) => placeholderPromise(null),
        updateNote: (id, text) => placeholderPromise(false),
        deleteNote: (id) => placeholderPromise(false),

        donnaReservations, isLoadingDonnaReservations,
        addDonnaReservation: (d) => placeholderPromise(null),
        updateDonnaReservation: (id, d) => placeholderPromise(false),
        deleteDonnaReservation: (id) => placeholderPromise(false),

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
        registerUser: (name, email, pass) => placeholderPromise(null),
    }), [
        currentUser, isLoadingCurrentUser, clients, isLoadingClients, 
        tasks, isLoadingTasks, documents, isLoadingDocuments, notes, isLoadingNotes,
        donnaReservations, isLoadingDonnaReservations, serviceWorkflows, isLoadingWorkflows,
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
