
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
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
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

export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();

    const appUserRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: appUser, isLoading: isLoadingAppUser } = useDoc<AppUser>(appUserRef);

    const roleRef = useMemoFirebase(() => appUser ? doc(firestore, 'roles', appUser.roleId) : null, [firestore, appUser]);
    const { data: userRole, isLoading: isLoadingUserRole } = useDoc<UserRole>(roleRef);

    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
    
    useEffect(() => {
        setIsLoadingCurrentUser(isUserLoading || isLoadingAppUser || isLoadingUserRole);
        if (!isUserLoading && !user) {
            setCurrentUser(null);
        } else if (user && userRole) {
             setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                permissions: userRole.permissions,
             });
        }
    }, [user, isUserLoading, appUser, isLoadingAppUser, userRole, isLoadingUserRole]);

    const clientsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

    const tasksQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
    const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);

    const documentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'documents') : null, [firestore, user]);
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    const notesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'notes') : null, [firestore, user]);
    const { data: notes, isLoading: isLoadingNotes } = useCollection<Note>(notesQuery);

    const reservationsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bookings') : null, [firestore, user]);
    const { data: donnaReservations, isLoading: isLoadingDonnaReservations } = useCollection<Reservation>(reservationsQuery);
    
    const workflowsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'serviceWorkflows') : null, [firestore, user]);
    const { data: serviceWorkflows, isLoading: isLoadingWorkflows } = useCollection<ServiceWorkflow>(workflowsQuery);


    const addClient = async (newClientData: Omit<Client, 'id'>): Promise<Client | null> => {
        if (!user || !firestore) return null;
        try {
            const docRef = await addDoc(collection(firestore, 'users', user.uid, 'clients'), newClientData);
            return { id: docRef.id, ...newClientData };
        } catch (error) {
            showNotification('error', 'Error al crear', 'No se pudo crear el usuario.');
            console.error(error);
            return null;
        }
    };
    
    const updateClient = async (clientId: string, updates: Partial<Client>): Promise<boolean> => {
        if (!user || !firestore) return false;
        try {
            await updateDoc(doc(firestore, 'users', user.uid, 'clients', clientId), updates);
            return true;
        } catch (error) {
            showNotification('error', 'Error al actualizar', 'No se pudo actualizar el usuario.');
            console.error(error);
            return false;
        }
    };
    
    const deleteClient = async (clientId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'clients', clientId));
            return true;
        } catch (error) {
            showNotification('error', 'Error al eliminar', 'No se pudo eliminar el usuario.');
            console.error(error);
            return false;
        }
    };

    const addTask = async (newTaskData: Omit<Task, 'id' | 'status'>): Promise<Task | null> => {
        if (!user || !firestore) return null;
        try {
            const dataWithStatus = { ...newTaskData, status: 'Pendiente' as const };
            const docRef = await addDoc(collection(firestore, 'users', user.uid, 'tasks'), dataWithStatus);
            return { id: docRef.id, ...dataWithStatus };
        } catch (error) {
            showNotification('error', 'Error al crear tarea', 'No se pudo crear la tarea.');
            console.error(error);
            return null;
        }
    };
    
    const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
        if (!user || !firestore) return false;
        try {
            await updateDoc(doc(firestore, 'users', user.uid, 'tasks', taskId), updates);
            return true;
        } catch (error) {
            showNotification('error', 'Error al actualizar tarea', 'No se pudo actualizar la tarea.');
            console.error(error);
            return false;
        }
    };

    const deleteTask = async (taskId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'tasks', taskId));
            return true;
        } catch (error) {
            showNotification('error', 'Error al eliminar tarea', 'No se pudo eliminar la tarea.');
            console.error(error);
            return false;
        }
    };

    const addDonnaReservation = async (newReservationData: Omit<Reservation, 'id'>): Promise<Reservation | null> => {
        if (!user || !firestore) return null;
        const dataWithTimestamp = { ...newReservationData, createdAt: serverTimestamp() };
        addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'bookings'), dataWithTimestamp);
        // Optimistic update
        return { id: `temp-${Date.now()}`, ...newReservationData };
    };

    const updateDonnaReservation = async (reservationId: string, updates: Partial<Reservation>): Promise<boolean> => {
        if (!user || !firestore) return false;
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'bookings', reservationId), updates);
        return true;
    };

    const deleteDonnaReservation = async (reservationId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'bookings', reservationId));
        return true;
    };

    const registerUser = async (name: string, email: string, pass: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const { user: newUser } = userCredential;

        await updateProfile(newUser, { displayName: name });

        const batch = writeBatch(firestore);

        // Crear el documento de perfil de usuario
        const userDocRef = doc(firestore, "users", newUser.uid);
        batch.set(userDocRef, {
            uid: newUser.uid,
            roleId: 'collaborator' // Asignar rol por defecto
        });
        
        // Crear documento de rol si no existe
        const defaultRoleRef = doc(firestore, "roles", "collaborator");
        const defaultRoleSnap = await getDoc(defaultRoleRef);
        if (!defaultRoleSnap.exists()) {
             batch.set(defaultRoleRef, {
                name: "Colaborador",
                permissions: {
                    dashboard: true,
                    clients_view: true, clients_create: true, clients_edit: true, clients_delete: true,
                    tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: true,
                    reservations_view: true, reservations_create: true, reservations_edit: true, reservations_delete: true,
                    documents_view: true, documents_create: true, documents_edit: true, documents_delete: false,
                    crm_view: true, crm_edit: false,
                    reports_view: true,
                    audit_view: false,
                    admin_view: false,
                }
             });
        }
        
        await batch.commit();
        
        return userCredential;
    };
    
    // Placeholder functions to avoid breaking the UI
    const placeholderPromise = async <T,>(data: T | null = null): Promise<any> => {
        showNotification('info', 'Funcionalidad no implementada', 'Esta acción aún no está conectada.');
        return data;
    }


    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser, 
        clients: clients || [], isLoadingClients, 
        addClient, updateClient, deleteClient,
        getClientById: (id: string) => clients?.find(c => c.id === id),
        
        tasks: tasks || [], isLoadingTasks,
        addTask, updateTask, deleteTask,
        getTasksByClientId: (id: string) => tasks?.filter(t => t.clientId === id) || [],

        documents: documents || [], isLoadingDocuments,
        addDocument: (d) => placeholderPromise(null),
        updateDocument: (id, d) => placeholderPromise(false),
        deleteDocument: (id) => placeholderPromise(false),
        getDocumentsByClientId: (id) => documents?.filter(d => d.clientId === id) || [],

        notes: notes || [], isLoadingNotes,
        addNote: (clientId, text) => placeholderPromise(null),
        updateNote: (id, text) => placeholderPromise(false),
        deleteNote: (id) => placeholderPromise(false),

        donnaReservations: donnaReservations || [], isLoadingDonnaReservations,
        addDonnaReservation,
        updateDonnaReservation,
        deleteDonnaReservation,

        serviceWorkflows: serviceWorkflows || [], isLoadingWorkflows,
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
