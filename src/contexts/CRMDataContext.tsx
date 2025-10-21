
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

const defaultPermissions: Partial<DonnaPermissions> = {
    dashboard: true,
    clients_view: false, clients_create: false, clients_edit: false, clients_delete: false,
    tasks_view: false, tasks_create: false, tasks_edit: false, tasks_delete: false,
    reservations_view: false, reservations_create: false, reservations_edit: false, reservations_delete: false,
    documents_view: false, documents_create: false, documents_edit: false, documents_delete: false,
    crm_view: false, crm_edit: false,
    reports_view: false,
    audit_view: false,
    admin_view: false,
};

export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const { user: authUser, isUserLoading: isAuthUserLoading, auth } = useUser(true);
    const firestore = useFirestore();
    
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);

    const appUserDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
    const { data: appUser, isLoading: isLoadingAppUser } = useDoc<AppUser>(appUserDocRef);
    
    const roleDocRef = useMemoFirebase(() => appUser?.roleId ? doc(firestore, 'roles', appUser.roleId) : null, [firestore, appUser]);
    const { data: userRole, isLoading: isLoadingUserRole } = useDoc<UserRole>(roleDocRef);

    useEffect(() => {
        setIsLoadingCurrentUser(isAuthUserLoading || isLoadingAppUser || isLoadingUserRole);
        if (isAuthUserLoading) return;
        
        if (!authUser) {
            setCurrentUser(null);
            return;
        }

        const permissions = userRole ? { ...defaultPermissions, ...userRole.permissions } : defaultPermissions;
        
        setCurrentUser({
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
            roleId: appUser?.roleId,
            permissions,
        });

    }, [authUser, isAuthUserLoading, appUser, isLoadingAppUser, userRole, isLoadingUserRole]);
    

    const userBasedCollection = (collectionName: string) => useMemoFirebase(() => currentUser?.uid ? collection(firestore, 'users', currentUser.uid, collectionName) : null, [currentUser]);

    const clientsQuery = userBasedCollection('clients');
    const tasksQuery = userBasedCollection('tasks');
    const documentsQuery = userBasedCollection('documents');
    const notesQuery = userBasedCollection('notes');
    const reservationsQuery = userBasedCollection('bookings');
    const workflowsQuery = userBasedCollection('serviceWorkflows');

    const { data: clients = [], isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    const { data: tasks = [], isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
    const { data: documents = [], isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);
    const { data: notes = [], isLoading: isLoadingNotes } = useCollection<Note>(notesQuery);
    const { data: donnaReservations = [], isLoading: isLoadingDonnaReservations } = useCollection<Reservation>(reservationsQuery);
    const { data: serviceWorkflows = [], isLoading: isLoadingWorkflows } = useCollection<ServiceWorkflow>(workflowsQuery);


    const addClient = async (data: Omit<Client, 'id'>) => {
        if (!currentUser || !clientsQuery) return null;
        const docRef = await addDocumentNonBlocking(clientsQuery, data);
        return { id: docRef.id, ...data };
    };
    const updateClient = async (id: string, updates: Partial<Client>) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'clients', id);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    const deleteClient = async (id: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'clients', id);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);

    const addTask = async (data: Omit<Task, 'id' | 'status'>) => {
        if (!currentUser || !tasksQuery) return null;
        const clientName = clients.find(c => c.id === data.clientId)?.name || 'N/A';
        const newTaskData: Omit<Task, 'id'> = { ...data, status: 'Pendiente', clientName };
        const docRef = await addDocumentNonBlocking(tasksQuery, newTaskData);
        return { id: docRef.id, ...newTaskData };
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'tasks', id);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteTask = async (id: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'tasks', id);
        deleteDocumentNonBlocking(docRef);
        return true;
    };

    const getTasksByClientId = useCallback((clientId: string) => {
        return tasks.filter(t => t.clientId === clientId);
    }, [tasks]);

    const addDocument = async (data: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>) => {
         if (!currentUser || !documentsQuery) return null;
        const newDocData: Omit<Document, 'id'> = { ...data, uploadedAt: new Date(), downloadURL: '#' };
        const docRef = await addDocumentNonBlocking(documentsQuery, newDocData);
        return { id: docRef.id, ...newDocData };
    };
    
    const updateDocument = async (id: string, updates: Partial<Document>) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'documents', id);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteDocument = async (id: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'documents', id);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const getDocumentsByClientId = useCallback((clientId: string) => {
        return documents.filter(d => d.clientId === clientId);
    }, [documents]);
    
    const addNote = async (clientId: string, text: string) => {
        if (!currentUser || !notesQuery) return null;
        const newNoteData = { clientId, text, content: text, createdAt: new Date(), authorName: currentUser?.displayName || 'Usuario' };
        const docRef = await addDocumentNonBlocking(notesQuery, newNoteData);
        return { id: docRef.id, ...newNoteData };
    };
    
    const updateNote = async (noteId: string, newText: string, clientId?: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'notes', noteId);
        updateDocumentNonBlocking(docRef, { text: newText, content: newText, updatedAt: new Date() });
        return true;
    };
    
    const deleteNote = async (noteId: string, clientId?: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'notes', noteId);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const addDonnaReservation = async (data: Omit<Reservation, 'id'>) => {
        if (!currentUser || !reservationsQuery) return null;
        const docRef = await addDocumentNonBlocking(reservationsQuery, data);
        return { id: docRef.id, ...data };
    };

    const updateDonnaReservation = async (id: string, updates: Partial<Reservation>) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'bookings', id);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteDonnaReservation = async (id: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'bookings', id);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const addService = async () => {
        if (!currentUser || !workflowsQuery) return null;
        const newService: Omit<ServiceWorkflow, 'id'> = { name: "Nuevo Servicio (sin título)", stages: [], subServices: [] };
        const docRef = await addDocumentNonBlocking(workflowsQuery, newService);
        return { id: docRef.id, ...newService };
    };
    
    const updateService = async (serviceId: string, updates: Partial<ServiceWorkflow>) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteService = async (serviceId: string) => {
        if (!currentUser) return false;
        const docRef = doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId);
        deleteDocumentNonBlocking(docRef);
        return true;
    };

    const addSubServiceToService = async (serviceId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;
        const newSub: SubService = { id: `sub-${Date.now()}`, name: 'Nuevo Sub-Servicio', stages: [] };
        const updatedSubServices = [...(service.subServices || []), newSub];
        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };
    
    const updateSubServiceName = async (serviceId: string, subServiceId: string, newName: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;
        const updatedSubServices = service.subServices.map(sub => sub.id === subServiceId ? { ...sub, name: newName } : sub);
        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };

    const deleteSubServiceFromService = async (serviceId: string, subServiceId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;
        const updatedSubServices = service.subServices.filter(sub => sub.id !== subServiceId);
        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };
    
    const addStageToSubService = async (serviceId: string, subServiceId: string | null) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;

        const newStage: WorkflowStage = { id: `stage-${Date.now()}`, title: 'Nueva Etapa', order: 0, objectives: [] };

        let targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];
        
        if (!targetSubService && !subServiceId) {
            targetSubService = { id: `sub-${Date.now()}`, name: 'General', stages: []};
            service.subServices.push(targetSubService);
        }
        
        if (targetSubService) {
            newStage.order = targetSubService.stages.length + 1;
            targetSubService.stages.push(newStage);
        }

        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const updateStageInSubService = async (serviceId: string, subServiceId: string | null, stageId: string, updates: Partial<WorkflowStage>) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;

        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];

        if(targetSubService) {
            targetSubService.stages = targetSubService.stages.map(st => st.id === stageId ? { ...st, ...updates } : st);
        }

        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const deleteStageFromSubService = async (serviceId: string, subServiceId: string | null, stageId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;

        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];

        if (targetSubService) {
            targetSubService.stages = targetSubService.stages.filter(st => st.id !== stageId);
        }

        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const addObjectiveToStage = async (serviceId: string, subServiceId: string | null, stageId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;

        const newObjective: WorkflowStageObjective = { id: `obj-${Date.now()}`, description: 'Nuevo Objetivo', order: 0, subObjectives: [] };
        
        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];
        
        if (targetSubService) {
            const targetStage = targetSubService.stages.find(st => st.id === stageId);
            if (targetStage) {
                newObjective.order = targetStage.objectives.length + 1;
                targetStage.objectives.push(newObjective);
            }
        }
        
        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };

    const updateObjectiveInStage = async (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string, updates: Partial<WorkflowStageObjective>) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;

        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];
        
        if (targetSubService) {
            const targetStage = targetSubService.stages.find(st => st.id === stageId);
            if (targetStage) {
                targetStage.objectives = targetStage.objectives.map(obj => obj.id === objectiveId ? { ...obj, ...updates } : obj);
            }
        }
        
        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const deleteObjectiveFromStage = async (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!currentUser || !service) return false;
        
        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];

        if (targetSubService) {
            const targetStage = targetSubService.stages.find(st => st.id === stageId);
            if (targetStage) {
                targetStage.objectives = targetStage.objectives.filter(obj => obj.id !== objectiveId);
            }
        }
        
        updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };

    const registerUser = async (name: string, email: string, pass: string) => {
        if (!auth) throw new Error("Auth not initialized");
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name });
            const userDocRef = doc(firestore, "users", userCredential.user.uid);
            await setDoc(userDocRef, { uid: userCredential.user.uid, roleId: "collaborator" });
        }
        return userCredential;
    };


    const getObjectiveById = useCallback((objectiveId: string): WorkflowStageObjective | null => {
        for (const service of serviceWorkflows) {
            for (const subService of service.subServices) {
                for (const stage of subService.stages) {
                    const found = stage.objectives.find(obj => obj.id === objectiveId);
                    if (found) return found;
                }
            }
        }
        return null;
    }, [serviceWorkflows]);

    const completeClientObjective = useCallback(async (clientId: string): Promise<{ nextObjective: WorkflowStageObjective | null; updatedClient: Client | null; }> => {
        const client = clients.find(c => c.id === clientId);
        if (!client || !client.currentWorkflowStageId || !client.currentObjectiveId || !currentUser) {
            showNotification('error', 'Error', 'El cliente no tiene un objetivo activo.');
            return { nextObjective: null, updatedClient: null };
        }

        const allStages = serviceWorkflows.flatMap(sw => sw.subServices.flatMap(ss => ss.stages));
        const currentStage = allStages.find(s => s.id === client.currentWorkflowStageId);
        if (!currentStage) {
            showNotification('error', 'Error', 'No se encontró la etapa actual del cliente.');
            return { nextObjective: null, updatedClient: null };
        }

        const currentObjectiveIndex = currentStage.objectives.findIndex(o => o.id === client.currentObjectiveId);
        if (currentObjectiveIndex === -1) {
            showNotification('error', 'Error', 'No se encontró el objetivo actual del cliente.');
            return { nextObjective: null, updatedClient: null };
        }

        if (currentObjectiveIndex + 1 < currentStage.objectives.length) {
            const nextObjective = currentStage.objectives[currentObjectiveIndex + 1];
            const updates = { currentObjectiveId: nextObjective.id };
            await updateClient(clientId, updates);
            const updatedClient = { ...client, ...updates };
            return { nextObjective, updatedClient };
        } else {
            const currentStageIndex = allStages.findIndex(s => s.id === currentStage.id);
            if (currentStageIndex + 1 < allStages.length) {
                const nextStage = allStages[currentStageIndex + 1];
                const nextObjective = nextStage.objectives.length > 0 ? nextStage.objectives[0] : null;
                const updates = {
                    currentWorkflowStageId: nextStage.id,
                    currentObjectiveId: nextObjective ? nextObjective.id : undefined,
                };
                await updateClient(clientId, updates);
                const updatedClient = { ...client, ...updates };
                return { nextObjective, updatedClient };
            } else {
                const updates = { currentObjectiveId: undefined };
                await updateClient(clientId, updates);
                const updatedClient = { ...client, ...updates };
                return { nextObjective: null, updatedClient };
            }
        }
    }, [clients, serviceWorkflows, updateClient, showNotification, currentUser]);

    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser, clients, isLoadingClients, addClient, updateClient, deleteClient, getClientById,
        tasks, isLoadingTasks, addTask, updateTask, deleteTask, getTasksByClientId,
        documents, isLoadingDocuments, addDocument, updateDocument, deleteDocument, getDocumentsByClientId,
        notes, isLoadingNotes, addNote, updateNote, deleteNote,
        donnaReservations, isLoadingDonnaReservations, addDonnaReservation, updateDonnaReservation, deleteDonnaReservation,
        serviceWorkflows, isLoadingWorkflows, addService, updateService, deleteService, addSubServiceToService, updateSubServiceName, deleteSubServiceFromService, addStageToSubService, updateStageInSubService, deleteStageFromSubService, addObjectiveToStage, updateObjectiveInStage, deleteObjectiveFromStage,
        getObjectiveById, completeClientObjective,
        registerUser,
    }), [
        currentUser, isLoadingCurrentUser, clients, isLoadingClients, getClientById,
        tasks, isLoadingTasks, getTasksByClientId,
        documents, isLoadingDocuments, getDocumentsByClientId,
        notes, isLoadingNotes,
        donnaReservations, isLoadingDonnaReservations,
        serviceWorkflows, isLoadingWorkflows,
        getObjectiveById, completeClientObjective, addClient, updateClient, deleteClient, addTask, updateTask, deleteTask, addDocument, updateDocument, deleteDocument, addNote, updateNote, deleteNote, addDonnaReservation, updateDonnaReservation, deleteDonnaReservation, addService, updateService, deleteService, addSubServiceToService, updateSubServiceName, deleteSubServiceFromService, addStageToSubService, updateStageInSubService, deleteStageFromSubService, addObjectiveToStage, updateObjectiveInStage, deleteObjectiveFromStage, registerUser
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
