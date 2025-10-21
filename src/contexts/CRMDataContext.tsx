
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
} from '@/lib/types';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface CRMContextType {
  currentUser: AuthenticatedUser | null;
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
  addDocument: (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file: File) => Promise<Document | null>;
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
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    // This is a placeholder for a real permission system.
    // In a real app, you'd fetch this from Firestore or custom claims.
    const currentUser: AuthenticatedUser | null = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuario Anónimo',
        photoURL: user.photoURL,
        permissions: {
            donna: {
                clients_create: true, clients_edit: true, clients_delete: true, clients_view: true,
                documents_create: true, documents_edit: true, documents_delete: true, documents_view: true,
                tasks_create: true, tasks_edit: true, tasks_delete: true, tasks_view: true,
                reservations_create: true, reservations_edit: true, reservations_delete: true, reservations_view: true,
                crm_edit: true, crm_view: true, reports_view: true,
                operations_create: true, quotes_view: true, cash_management_view: true, audit_view: true, admin_view: true,
                dashboard: true,
            }
        }
    } : null;

    const clientsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
    const tasksQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
    const documentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'documents') : null, [firestore, user]);
    const notesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'notes') : null, [firestore, user]);
    const reservationsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bookings') : null, [firestore, user]);
    const workflowsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'serviceWorkflows') : null, [firestore, user]);

    const { data: clients = [], isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    const { data: tasks = [], isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
    const { data: documents = [], isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);
    const { data: notes = [], isLoading: isLoadingNotes } = useCollection<Note>(notesQuery);
    const { data: donnaReservations = [], isLoading: isLoadingDonnaReservations } = useCollection<Reservation>(reservationsQuery);
    const { data: serviceWorkflows = [], isLoading: isLoadingWorkflows } = useCollection<ServiceWorkflow>(workflowsQuery);


    const addClient = async (data: Omit<Client, 'id'>) => {
        if (!user) {
            showNotification('error', 'No autenticado', 'Debe iniciar sesión para añadir un cliente.');
            return null;
        }
        const colRef = collection(firestore, 'users', user.uid, 'clients');
        try {
            const docRef = await addDocumentNonBlocking(colRef, data);
            showNotification('success', 'Cliente añadido', `El cliente ${data.name} ha sido creado.`);
            return { id: docRef.id, ...data };
        } catch (error: any) {
            showNotification('error', 'Error al crear cliente', error.message);
            return null;
        }
    };
    const updateClient = async (id: string, updates: Partial<Client>) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', id);
        updateDocumentNonBlocking(docRef, updates);
        showNotification('success', 'Cliente actualizado');
        return true;
    };
    const deleteClient = async (id: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', id);
        deleteDocumentNonBlocking(docRef);
        showNotification('info', 'Cliente eliminado');
        return true;
    };
    const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);

    const addTask = async (data: Omit<Task, 'id' | 'status'>) => {
        if (!user) {
            showNotification('error', 'No autenticado');
            return null;
        }
        const clientName = clients.find(c => c.id === data.clientId)?.name || 'N/A';
        const newTaskData: Omit<Task, 'id'> = { ...data, status: 'Pendiente', clientName };
        const colRef = collection(firestore, 'users', user.uid, 'tasks');
        try {
            const docRef = await addDocumentNonBlocking(colRef, newTaskData);
            showNotification('success', 'Tarea añadida');
            return { id: docRef.id, ...newTaskData };
        } catch (error: any) {
            showNotification('error', 'Error al añadir tarea', error.message);
            return null;
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', id);
        updateDocumentNonBlocking(docRef, updates);
        showNotification('success', 'Tarea actualizada');
        return true;
    };

    const deleteTask = async (id: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', id);
        deleteDocumentNonBlocking(docRef);
        showNotification('info', 'Tarea eliminada');
        return true;
    };

    const getTasksByClientId = useCallback((clientId: string) => {
        return tasks.filter(t => t.clientId === clientId);
    }, [tasks]);

    const addDocument = async (data: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>) => {
         if (!user) {
            showNotification('error', 'No autenticado');
            return null;
        }
        // In a real app, you would upload the file to Firebase Storage first and get the URL.
        const newDocData: Omit<Document, 'id'> = { ...data, uploadedAt: new Date(), downloadURL: '#' };
        const colRef = collection(firestore, 'users', user.uid, 'documents');
        const docRef = await addDocumentNonBlocking(colRef, newDocData);
        showNotification('success', 'Documento añadido');
        return { id: docRef.id, ...newDocData };
    };
    
    const updateDocument = async (id: string, updates: Partial<Document>) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'documents', id);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteDocument = async (id: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'documents', id);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const getDocumentsByClientId = useCallback((clientId: string) => {
        return documents.filter(d => d.clientId === clientId);
    }, [documents]);
    
    const addNote = async (clientId: string, text: string) => {
        if (!user) {
            showNotification('error', 'No autenticado');
            return null;
        }
        const newNoteData = { clientId, text, content: text, createdAt: new Date(), authorName: currentUser?.displayName || 'Usuario' };
        const colRef = collection(firestore, 'users', user.uid, 'notes');
        const docRef = await addDocumentNonBlocking(colRef, newNoteData);
        showNotification('success', 'Nota añadida');
        return { id: docRef.id, ...newNoteData };
    };
    
    const updateNote = async (noteId: string, newText: string, clientId?: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'notes', noteId);
        updateDocumentNonBlocking(docRef, { text: newText, content: newText, updatedAt: new Date() });
        return true;
    };
    
    const deleteNote = async (noteId: string, clientId?: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'notes', noteId);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const addDonnaReservation = async (data: Omit<Reservation, 'id'>) => {
        if (!user) { showNotification('error', 'No autenticado'); return null; }
        const colRef = collection(firestore, 'users', user.uid, 'bookings');
        const docRef = await addDocumentNonBlocking(colRef, data);
        showNotification('success', 'Reservación creada');
        return { id: docRef.id, ...data };
    };

    const updateDonnaReservation = async (id: string, updates: Partial<Reservation>) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'bookings', id);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteDonnaReservation = async (id: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'bookings', id);
        deleteDocumentNonBlocking(docRef);
        return true;
    };
    
    const addService = async () => {
        if (!user) return null;
        const newService: Omit<ServiceWorkflow, 'id'> = { name: "Nuevo Servicio (sin título)", stages: [], subServices: [] };
        const colRef = collection(firestore, 'users', user.uid, 'serviceWorkflows');
        const docRef = await addDocumentNonBlocking(colRef, newService);
        return { id: docRef.id, ...newService };
    };
    
    const updateService = async (serviceId: string, updates: Partial<ServiceWorkflow>) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        updateDocumentNonBlocking(docRef, updates);
        return true;
    };
    
    const deleteService = async (serviceId: string) => {
        if (!user) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        deleteDocumentNonBlocking(docRef);
        return true;
    };

    const addSubServiceToService = async (serviceId: string) => {
        // This is complex with subcollections. For simplicity, we'll read, update, and write the whole service doc.
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;
        const newSub: SubService = { id: `sub-${Date.now()}`, name: 'Nuevo Sub-Servicio', stages: [] };
        const updatedSubServices = [...(service.subServices || []), newSub];
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };
    
    const updateSubServiceName = async (serviceId: string, subServiceId: string, newName: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;
        const updatedSubServices = service.subServices.map(sub => sub.id === subServiceId ? { ...sub, name: newName } : sub);
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };

    const deleteSubServiceFromService = async (serviceId: string, subServiceId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;
        const updatedSubServices = service.subServices.filter(sub => sub.id !== subServiceId);
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };
    
    const updateStagesInService = async (serviceId: string, subServiceId: string | null, newStages: WorkflowStage[]) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;
        
        let updatedSubServices;
        if(subServiceId) {
             updatedSubServices = service.subServices.map(sub => 
                sub.id === subServiceId ? { ...sub, stages: newStages } : sub
            );
        } else if (service.subServices.length > 0) {
            updatedSubServices = [{ ...service.subServices[0], stages: newStages }, ...service.subServices.slice(1)];
        } else {
            // Handle case where there are no subservices (should not happen with new logic)
            updatedSubServices = service.subServices;
        }

        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: updatedSubServices });
        return true;
    };


    const addStageToSubService = async (serviceId: string, subServiceId: string | null) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;

        const newStage: WorkflowStage = { id: `stage-${Date.now()}`, title: 'Nueva Etapa', order: 0, objectives: [] };

        let targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];
        
        // If no subservice, create one.
        if (!targetSubService && !subServiceId) {
            targetSubService = { id: `sub-${Date.now()}`, name: 'General', stages: []};
            service.subServices.push(targetSubService);
        }
        
        if (targetSubService) {
            newStage.order = targetSubService.stages.length + 1;
            targetSubService.stages.push(newStage);
        }

        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const updateStageInSubService = async (serviceId: string, subServiceId: string | null, stageId: string, updates: Partial<WorkflowStage>) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;

        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];

        if(targetSubService) {
            targetSubService.stages = targetSubService.stages.map(st => st.id === stageId ? { ...st, ...updates } : st);
        }

        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const deleteStageFromSubService = async (serviceId: string, subServiceId: string | null, stageId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;

        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];

        if (targetSubService) {
            targetSubService.stages = targetSubService.stages.filter(st => st.id !== stageId);
        }

        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const addObjectiveToStage = async (serviceId: string, subServiceId: string | null, stageId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;

        const newObjective: WorkflowStageObjective = { id: `obj-${Date.now()}`, description: 'Nuevo Objetivo', order: 0, subObjectives: [] };
        
        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];
        
        if (targetSubService) {
            const targetStage = targetSubService.stages.find(st => st.id === stageId);
            if (targetStage) {
                newObjective.order = targetStage.objectives.length + 1;
                targetStage.objectives.push(newObjective);
            }
        }
        
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };

    const updateObjectiveInStage = async (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string, updates: Partial<WorkflowStageObjective>) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;

        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];
        
        if (targetSubService) {
            const targetStage = targetSubService.stages.find(st => st.id === stageId);
            if (targetStage) {
                targetStage.objectives = targetStage.objectives.map(obj => obj.id === objectiveId ? { ...obj, ...updates } : obj);
            }
        }
        
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
    };
    
    const deleteObjectiveFromStage = async (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string) => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!user || !service) return false;
        
        const targetSubService = subServiceId ? service.subServices.find(s => s.id === subServiceId) : service.subServices[0];

        if (targetSubService) {
            const targetStage = targetSubService.stages.find(st => st.id === stageId);
            if (targetStage) {
                targetStage.objectives = targetStage.objectives.filter(obj => obj.id !== objectiveId);
            }
        }
        
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId), { subServices: service.subServices });
        return true;
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
        if (!client || !client.currentWorkflowStageId || !client.currentObjectiveId) {
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

        // Check if there is a next objective in the same stage
        if (currentObjectiveIndex + 1 < currentStage.objectives.length) {
            const nextObjective = currentStage.objectives[currentObjectiveIndex + 1];
            const updates = { currentObjectiveId: nextObjective.id };
            await updateClient(clientId, updates);
            const updatedClient = { ...client, ...updates };
            showNotification('success', '¡Objetivo completado!', `Siguiente objetivo: ${nextObjective.description}`);
            return { nextObjective, updatedClient };
        } else {
            // Move to the next stage
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
                showNotification('success', `¡Etapa "${currentStage.title}" completada!`, `Iniciando etapa: "${nextStage.title}"`);
                return { nextObjective, updatedClient };
            } else {
                // Workflow complete
                const updates = { currentObjectiveId: undefined }; // Or set a specific "completed" status
                await updateClient(clientId, updates);
                const updatedClient = { ...client, ...updates };
                showNotification('success', '¡Flujo de trabajo completado!', 'Todos los objetivos han sido cumplidos.');
                return { nextObjective: null, updatedClient };
            }
        }
    }, [clients, serviceWorkflows, updateClient, showNotification]);

    // This hook is used to get the notes for a specific client.
    const useClientNotes = (clientId: string | null) => {
        const notesQuery = useMemoFirebase(() => {
            if (!user || !clientId) return null;
            return collection(firestore, 'users', user.uid, 'notes'); // Simplified: fetches all notes
        }, [firestore, user, clientId]);
    
        const { data: allNotes, isLoading: isLoadingNotes } = useCollection<Note>(notesQuery);
    
        const clientNotes = useMemo(() => {
            return allNotes ? allNotes.filter(note => note.clientId === clientId) : [];
        }, [allNotes, clientId]);
    
        return { notes: clientNotes, isLoading: isLoadingNotes };
    };

    const value = useMemo(() => ({
        currentUser, clients, isLoadingClients, addClient, updateClient, deleteClient, getClientById,
        tasks, isLoadingTasks, addTask, updateTask, deleteTask, getTasksByClientId,
        documents, isLoadingDocuments, addDocument, updateDocument, deleteDocument, getDocumentsByClientId,
        notes, isLoadingNotes, addNote, updateNote, deleteNote,
        donnaReservations, isLoadingDonnaReservations, addDonnaReservation, updateDonnaReservation, deleteDonnaReservation,
        serviceWorkflows, isLoadingWorkflows, addService, updateService, deleteService, addSubServiceToService, updateSubServiceName, deleteSubServiceFromService, addStageToSubService, updateStageInSubService, deleteStageFromSubService, addObjectiveToStage, updateObjectiveInStage, deleteObjectiveFromStage,
        getObjectiveById, completeClientObjective
    }), [
        currentUser, clients, isLoadingClients, getClientById,
        tasks, isLoadingTasks, getTasksByClientId,
        documents, isLoadingDocuments, getDocumentsByClientId,
        notes, isLoadingNotes,
        donnaReservations, isLoadingDonnaReservations,
        serviceWorkflows, isLoadingWorkflows,
        getObjectiveById, completeClientObjective, addClient, updateClient, deleteClient, addTask, updateTask, deleteTask, addDocument, updateDocument, deleteDocument, addNote, updateNote, deleteNote, addDonnaReservation, updateDonnaReservation, deleteDonnaReservation, addService, updateService, deleteService, addSubServiceToService, updateSubServiceName, deleteSubServiceFromService, addStageToSubService, updateStageInSubService, deleteStageFromSubService, addObjectiveToStage, updateObjectiveInStage, deleteObjectiveFromStage
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
