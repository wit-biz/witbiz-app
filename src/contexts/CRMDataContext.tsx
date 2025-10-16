
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
import { clients as mockClients, tasks as mockTasks, documents as mockDocs, notes as mockNotes, bookings as mockBookings, workflowStages as mockWorkflowStages } from '@/lib/data';

// Datos Iniciales de Ejemplo
const initialServiceWorkflows: ServiceWorkflow[] = [
    {
      id: 'sw-1',
      name: 'Onboarding de Cliente Estándar',
      stages: [], // No usado cuando hay sub-servicios
      subServices: [
        {
          id: 'sub-1',
          name: 'Fase de Venta',
          stages: [
            { id: 'stage-1', title: 'Prospecto', order: 1, objectives: [{ id: 'obj-1-1', description: 'Realizar contacto inicial', order: 1, subObjectives: [] }] },
            { id: 'stage-2', title: 'Cualificación', order: 2, objectives: [{ id: 'obj-2-1', description: 'Completar análisis de necesidades técnicas', order: 1, subObjectives: [] }] },
            { id: 'stage-3', title: 'Negociación', order: 3, objectives: [{ id: 'obj-3-1', description: 'Finalizar precios y términos del contrato', order: 1, requiredDocumentForCompletion: 'Contrato', subObjectives: [] }] },
            { id: 'stage-4', title: 'Cierre', order: 4, objectives: [{ id: 'obj-4-1', description: 'Recibir contrato firmado', order: 1, subObjectives: [] }] },
          ],
        },
      ],
    },
];

const initialClients: Client[] = [
    { id: '1', name: 'Innovate Inc.', owner: 'Tú', category: 'Tecnología', subscribedServiceIds: ['sw-1'], currentWorkflowStageId: 'stage-2', currentObjectiveId: 'obj-2-1', contactEmail: "contact@innovate.com", contactPhone: "123-456-7890", website: "innovate.com" },
    { id: '2', name: 'Synergy Corp.', owner: 'Alex Smith', category: 'Finanzas', subscribedServiceIds: ['sw-1'], currentWorkflowStageId: 'stage-3', currentObjectiveId: 'obj-3-1', contactEmail: "contact@synergy.com", contactPhone: "123-456-7890", website: "synergy.com" },
    { id: '3', name: 'Solutions LLC', owner: 'Tú', category: 'Salud', subscribedServiceIds: ['sw-1'], currentWorkflowStageId: 'stage-1', currentObjectiveId: 'obj-1-1', contactEmail: "contact@solutions.com", contactPhone: "123-456-7890", website: "solutions.com" },
    { id: '4', name: 'Global Net', owner: 'Jane Doe', category: 'Logística', subscribedServiceIds: ['sw-1'], currentWorkflowStageId: 'stage-4', currentObjectiveId: 'obj-4-1', contactEmail: "contact@global.com", contactPhone: "123-456-7890", website: "global.com" },
    { id: '5', name: 'Marketing Pro', owner: 'Tú', category: 'Marketing', subscribedServiceIds: ['sw-1'], currentWorkflowStageId: 'stage-1', currentObjectiveId: 'obj-1-1', contactEmail: "contact@marketing.com", contactPhone: "123-456-7890", website: "marketing.com" },
];


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
  addTask: (newTaskData: Omit<Task, 'id'>) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getTasksByClientId: (clientId: string) => Task[];

  documents: Document[];
  isLoadingDocuments: boolean;
  addDocument: (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file: File) => Promise<Document | null>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<boolean>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  getDocumentsByClientId: (clientId: string) => Document[];

  clientNotes: Note[];
  isLoadingClientNotes: boolean;
  fetchClientNotes: (clientId: string) => void;
  addClientNote: (clientId: string, text: string) => Promise<boolean>;
  updateClientNote: (noteId: string, newText: string, clientId?: string) => Promise<boolean>;
  deleteClientNote: (noteId: string, clientId?: string) => Promise<boolean>;

  donnaReservations: Reservation[];
  isLoadingDonnaReservations: boolean;
  addDonnaReservation: (newReservationData: Omit<Reservation, 'id'>) => Promise<boolean>;
  updateDonnaReservation: (reservationId: string, updates: Partial<Reservation>) => Promise<boolean>;
  deleteDonnaReservation: (reservationId: string) => Promise<boolean>;

  serviceWorkflows: ServiceWorkflow[];
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

    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>({
        uid: 'user-123', email: 'usuario@ejemplo.com', displayName: 'Usuario de Prueba', photoURL: null,
        permissions: { donna: { clients_create: true, clients_edit: true, clients_delete: true, clients_view: true, documents_create: true, documents_edit: true, documents_delete: true, documents_view: true, tasks_create: true, tasks_edit: true, tasks_delete: true, tasks_view: true, reservations_create: true, reservations_edit: true, reservations_delete: true, reservations_view: true, workflows_edit: true, workflows_view: true, reports_view: true } }
    });

    const [clients, setClients] = useState<Client[]>(initialClients);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [documents, setDocuments] = useState<Document[]>(mockDocs);
    const [clientNotes, setClientNotes] = useState<Note[]>(mockNotes);
    const [donnaReservations, setDonnaReservations] = useState<Reservation[]>(mockBookings);
    const [serviceWorkflows, setServiceWorkflows] = useState<ServiceWorkflow[]>(initialServiceWorkflows);
    
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isLoadingClientNotes, setIsLoadingClientNotes] = useState(false);
    const [isLoadingDonnaReservations, setIsLoadingDonnaReservations] = useState(false);

    // IMPLEMENTACIONES DE EJEMPLO (MOCK)
    const addClient = async (data: Omit<Client, 'id'>) => {
        const newClient: Client = { id: `C${Date.now()}`, ...data };
        setClients(prev => [...prev, newClient]);
        showNotification('success', 'Cliente añadido', `El cliente ${newClient.name} ha sido creado.`);
        return newClient;
    };
    const updateClient = async (id: string, updates: Partial<Client>) => {
        setClients(prev => prev.map(c => c.id === id ? {...c, ...updates} : c));
        showNotification('success', 'Cliente actualizado', 'Los cambios han sido guardados.');
        return true;
    }
    const deleteClient = async (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
        showNotification('info', 'Cliente eliminado');
        return true;
    }
    const getClientById = (id: string) => clients.find(c => c.id === id);

    const addTask = async (data: Omit<Task, 'id'>) => {
        const clientName = clients.find(c => c.id === data.clientId)?.name || 'N/A';
        const newTask: Task = { id: `T${Date.now()}`, ...data, clientName };
        setTasks(prev => [...prev, newTask]);
        showNotification('success', 'Tarea añadida', `La tarea "${newTask.title}" ha sido creada.`);
        return newTask;
    };
    const updateTask = async (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? {...t, ...updates} : t));
        showNotification('success', 'Tarea actualizada');
        return true;
    }
    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        showNotification('info', 'Tarea eliminada');
        return true;
    }
    const getTasksByClientId = (clientId: string) => tasks.filter(t => t.clientId === clientId);
    
    const addDocument = async (data: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>) => {
        const newDoc: Document = { id: `D${Date.now()}`, uploadedAt: new Date(), downloadURL: '#', ...data };
        setDocuments(prev => [...prev, newDoc]);
        showNotification('success', 'Documento añadido', `El documento ${newDoc.name} ha sido subido.`);
        return newDoc;
    };
    const updateDocument = async (id: string, updates: Partial<Document>) => {
        setDocuments(prev => prev.map(d => d.id === id ? {...d, ...updates} : d));
        showNotification('success', 'Documento actualizado');
        return true;
    };
    const deleteDocument = async (id: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
        showNotification('info', 'Documento eliminado');
        return true;
    };
    const getDocumentsByClientId = (clientId: string) => documents.filter(d => d.clientId === clientId);

    const fetchClientNotes = (clientId: string) => {
        setIsLoadingClientNotes(true);
        setTimeout(() => {
            setClientNotes(mockNotes.filter(n => n.clientId === clientId));
            setIsLoadingClientNotes(false);
        }, 300);
    };
    const addClientNote = async (clientId: string, text: string) => {
        const newNote: Note = { id: `N${Date.now()}`, clientId, text: text, content: text, createdAt: new Date(), authorName: currentUser?.displayName || 'Usuario' };
        setClientNotes(prev => [newNote, ...prev]);
        showNotification('success', 'Nota añadida');
        return true;
    };
    const updateClientNote = async (noteId: string, newText: string, clientId?: string) => {
        setClientNotes(prev => prev.map(n => n.id === noteId ? {...n, text: newText, content: newText, updatedAt: new Date()} : n));
        showNotification('success', 'Nota actualizada');
        return true;
    };
    const deleteClientNote = async (noteId: string, clientId?: string) => {
        setClientNotes(prev => prev.filter(n => n.id !== noteId));
        showNotification('info', 'Nota eliminada');
        return true;
    };
    
    const addDonnaReservation = async (data: Omit<Reservation, 'id'>) => {
        const newRes: Reservation = { id: `R${Date.now()}`, ...data };
        setDonnaReservations(prev => [...prev, newRes]);
        showNotification('success', 'Reservación creada');
        return true;
    };
    const updateDonnaReservation = async (id: string, updates: Partial<Reservation>) => {
        setDonnaReservations(prev => prev.map(r => r.id === id ? {...r, ...updates} : r));
        showNotification('success', 'Reservación actualizada');
        return true;
    };
    const deleteDonnaReservation = async (id: string) => {
        setDonnaReservations(prev => prev.filter(r => r.id !== id));
        showNotification('info', 'Reservación eliminada');
        return true;
    };

    // MOCKS DE FLUJOS DE TRABAJO
    const addService = async () => {
        const newService: ServiceWorkflow = { id: `sw-${Date.now()}`, name: "Nuevo Servicio (sin título)", stages: [], subServices: [] };
        setServiceWorkflows(prev => [...prev, newService]);
        return newService;
    };
    const updateService = async (serviceId: string, updates: Partial<ServiceWorkflow>) => {
        setServiceWorkflows(prev => prev.map(s => s.id === serviceId ? {...s, ...updates} : s));
        return true;
    };
    const deleteService = async (serviceId: string) => {
        setServiceWorkflows(prev => prev.filter(s => s.id !== serviceId));
        return true;
    };
    const addSubServiceToService = async (serviceId: string) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSub: SubService = { id: `sub-${Date.now()}`, name: 'Nuevo Sub-Servicio', stages: [] };
                return {...s, subServices: [...s.subServices, newSub] };
            }
            return s;
        }));
        return true;
    };
    const updateSubServiceName = async (serviceId: string, subServiceId: string, newName: string) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => sub.id === subServiceId ? {...sub, name: newName} : sub);
                return {...s, subServices: newSubs };
            }
            return s;
        }));
        return true;
    };
    const deleteSubServiceFromService = async (serviceId: string, subServiceId: string) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                return {...s, subServices: s.subServices.filter(sub => sub.id !== subServiceId)};
            }
            return s;
        }));
        return true;
    };

    const findParentSubService = (serviceId: string, subServiceId: string | null): [ServiceWorkflow | undefined, SubService | undefined] => {
        const service = serviceWorkflows.find(s => s.id === serviceId);
        if (!service) return [undefined, undefined];
        const subService = subServiceId ? service.subServices.find(sub => sub.id === subServiceId) : service.subServices[0];
        return [service, subService];
    };
    
    const addStageToSubService = async (serviceId: string, subServiceId: string | null) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => {
                    if ((subServiceId && sub.id === subServiceId) || (!subServiceId && s.subServices.indexOf(sub) === 0)) {
                        const newStage: WorkflowStage = { id: `stage-${Date.now()}`, title: 'Nueva Etapa', order: sub.stages.length + 1, objectives: [] };
                        return {...sub, stages: [...sub.stages, newStage] };
                    }
                    return sub;
                });
                return {...s, subServices: newSubs };
            }
            return s;
        }));
        return true;
    };
    const updateStageInSubService = async (serviceId: string, subServiceId: string | null, stageId: string, updates: Partial<WorkflowStage>) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => {
                    if ((subServiceId && sub.id === subServiceId) || (!subServiceId && s.subServices.indexOf(sub) === 0)) {
                        const newStages = sub.stages.map(st => st.id === stageId ? {...st, ...updates} : st);
                        return {...sub, stages: newStages };
                    }
                    return sub;
                });
                return {...s, subServices: newSubs };
            }
            return s;
        }));
        return true;
    };
    const deleteStageFromSubService = async (serviceId: string, subServiceId: string | null, stageId: string) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => {
                    if ((subServiceId && sub.id === subServiceId) || (!subServiceId && s.subServices.indexOf(sub) === 0)) {
                        return {...sub, stages: sub.stages.filter(st => st.id !== stageId)};
                    }
                    return sub;
                });
                return {...s, subServices: newSubs };
            }
            return s;
        }));
        return true;
    };

    const addObjectiveToStage = async (serviceId: string, subServiceId: string | null, stageId: string) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => {
                    if ((subServiceId && sub.id === subServiceId) || (!subServiceId && s.subServices.indexOf(sub) === 0)) {
                        const newStages = sub.stages.map(st => {
                            if (st.id === stageId) {
                                const newObj: WorkflowStageObjective = { id: `obj-${Date.now()}`, description: 'Nuevo Objetivo', order: st.objectives.length + 1, subObjectives: [] };
                                return {...st, objectives: [...st.objectives, newObj] };
                            }
                            return st;
                        });
                        return {...sub, stages: newStages };
                    }
                    return sub;
                });
                return {...s, subServices: newSubs };
            }
            return s;
        }));
        return true;
    };
    const updateObjectiveInStage = async (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string, updates: Partial<WorkflowStageObjective>) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => {
                    if ((subServiceId && sub.id === subServiceId) || (!subServiceId && s.subServices.indexOf(sub) === 0)) {
                        const newStages = sub.stages.map(st => {
                            if (st.id === stageId) {
                                const newObjectives = st.objectives.map(o => o.id === objectiveId ? {...o, ...updates} : o);
                                return {...st, objectives: newObjectives };
                            }
                            return st;
                        });
                        return {...sub, stages: newStages };
                    }
                    return sub;
                });
                return {...s, subServices: newSubs };
            }
            return s;
        }));
        return true;
    };
    const deleteObjectiveFromStage = async (serviceId: string, subServiceId: string | null, stageId: string, objectiveId: string) => {
        setServiceWorkflows(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newSubs = s.subServices.map(sub => {
                    if ((subServiceId && sub.id === subServiceId) || (!subServiceId && s.subServices.indexOf(sub) === 0)) {
                        const newStages = sub.stages.map(st => {
                            if (st.id === stageId) {
                                return {...st, objectives: st.objectives.filter(o => o.id !== objectiveId) };
                            }
                            return st;
                        });
                        return {...sub, stages: newStages };
                    }
                    return sub;
                });
                return {...s, subServices: newSubs };
            }
            return s;
        }));
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

    const value = useMemo(() => ({
        currentUser, clients, isLoadingClients, addClient, updateClient, deleteClient, getClientById,
        tasks, isLoadingTasks, addTask, updateTask, deleteTask, getTasksByClientId,
        documents, isLoadingDocuments, addDocument, updateDocument, deleteDocument, getDocumentsByClientId,
        clientNotes, isLoadingClientNotes, fetchClientNotes, addClientNote, updateClientNote, deleteClientNote,
        donnaReservations, isLoadingDonnaReservations, addDonnaReservation, updateDonnaReservation, deleteDonnaReservation,
        serviceWorkflows, addService, updateService, deleteService, addSubServiceToService, updateSubServiceName, deleteSubServiceFromService, addStageToSubService, updateStageInSubService, deleteStageFromSubService, addObjectiveToStage, updateObjectiveInStage, deleteObjectiveFromStage,
        getObjectiveById, completeClientObjective
    }), [
        currentUser, clients, isLoadingClients, getClientById,
        tasks, isLoadingTasks, getTasksByClientId,
        documents, isLoadingDocuments, getDocumentsByClientId,

        clientNotes, isLoadingClientNotes,
        donnaReservations, isLoadingDonnaReservations,
        serviceWorkflows,
        getObjectiveById, completeClientObjective, addClient, updateClient, deleteClient, addTask, updateTask, deleteTask, addDocument, updateDocument, deleteDocument, fetchClientNotes, addClientNote, updateClientNote, deleteClientNote, addDonnaReservation, updateDonnaReservation, deleteDonnaReservation, addService, updateService, deleteService, addSubServiceToService, updateSubServiceName, deleteSubServiceFromService, addStageToSubService, updateStageInSubService, deleteStageFromSubService, addObjectiveToStage, updateObjectiveInStage, deleteObjectiveFromStage
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
