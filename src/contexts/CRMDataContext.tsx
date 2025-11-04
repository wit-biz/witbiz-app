
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
import { clients as mockClients, tasks as mockTasks, documents as mockDocuments, notes as mockNotes, serviceWorkflows as mockWorkflows } from '@/lib/data';

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
  addTask: (newTaskData: Omit<Task, 'id' | 'status' | 'clientName'>) => Promise<Task | null>;
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
  updateService: (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'name' | 'stages' | 'subServices'>>) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  addSubServiceToService: (serviceId: string, name: string) => Promise<boolean>;
  updateSubServiceName: (serviceId: string, subServiceId: string, newName: string) => Promise<boolean>;
  deleteSubServiceFromService: (serviceId: string, subServiceId: string) => Promise<boolean>;
  addStageToSubService: (serviceId: string, subServiceId: string | null, name: string) => Promise<boolean>;
  updateStageInSubService: (serviceId: string, subServiceId: string | null, stageId: string, updates: Partial<WorkflowStage>) => Promise<boolean>;
  deleteStageFromSubService: (serviceId: string, subServiceId: string | null, stageId: string) => Promise<boolean>;
  addActionToStage: (serviceId: string, subServiceId: string | null, stageId: string) => Promise<boolean>;
  updateActionInStage: (serviceId: string, subServiceId: string | null, stageId: string, actionId: string, updates: Partial<WorkflowAction>) => Promise<boolean>;
  deleteActionFromStage: (serviceId: string, subServiceId: string | null, stageId: string, actionId: string) => Promise<boolean>;
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
    
    // LOADING STATES
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
    
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
    
    // MOCK DATA HANDLERS
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
    
    const addTask = async (newTaskData: Omit<Task, 'id' | 'status' | 'clientName'>): Promise<Task | null> => {
        const client = clients.find(c => c.id === newTaskData.clientId);
        if (!client) return null;
        const newTask: Task = { ...newTaskData, id: `task-${Date.now()}`, status: 'Pendiente', clientName: client.name };
        setTasks(prev => [...prev, newTask].sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59")));
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

    const addService = async (name: string): Promise<ServiceWorkflow | null> => {
        const newService: ServiceWorkflow = {
            id: `service-${Date.now()}`,
            name: name,
            description: "",
            clientRequirements: [],
            subServices: [],
            stages: [] // Legacy
        };
        setServiceWorkflows(prev => [newService, ...prev]);
        return newService;
    };

    const updateService = async (serviceId: string, updates: Partial<ServiceWorkflow>): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(s => s.id === serviceId ? { ...s, ...updates } : s));
        showNotification('success', 'Servicio Guardado', 'Los cambios se han guardado correctamente.');
        return true;
    }

    const deleteService = async (serviceId: string): Promise<boolean> => {
        // We need to use the functional form of setState to ensure we have the latest state
        // when calculating the next selected ID in the component.
        setServiceWorkflows(prev => prev.filter(s => s.id !== serviceId));
        showNotification('success', 'Servicio Eliminado', 'El servicio ha sido eliminado.');
        return true;
    }

    const addSubServiceToService = async (serviceId: string, name: string): Promise<boolean> => {
        const newSubService: SubService = {
            id: `sub-service-${Date.now()}`,
            name: name,
            stages: [],
        };
        setServiceWorkflows(prev => prev.map(service => 
            service.id === serviceId
                ? { ...service, subServices: [...service.subServices, newSubService] }
                : service
        ));
        return true;
    };
    
    const updateSubServiceName = async (serviceId: string, subServiceId: string, newName: string): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                const newSubServices = service.subServices.map(sub => 
                    sub.id === subServiceId ? { ...sub, name: newName } : sub
                );
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        showNotification('success', 'Sub-Servicio Actualizado', 'El nombre se ha guardado.');
        return true;
    };

    const deleteSubServiceFromService = async (serviceId: string, subServiceId: string): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                return { ...service, subServices: service.subServices.filter(sub => sub.id !== subServiceId) };
            }
            return service;
        }));
        showNotification('success', 'Sub-Servicio Eliminado', 'El sub-servicio ha sido eliminado.');
        return true;
    };

    const addStageToSubService = async (serviceId: string, subServiceId: string | null, name: string): Promise<boolean> => {
        const newStage: WorkflowStage = {
            id: `stage-${Date.now()}`,
            title: name,
            order: 100, // Append to the end
            actions: [],
        };

        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                // If there are no sub-services, create one.
                if (service.subServices.length === 0) {
                     const newSubService: SubService = { id: `sub-service-${Date.now()}`, name: "General", stages: [{ ...newStage, order: 1 }] };
                     return { ...service, subServices: [newSubService] };
                }
                
                const targetSubServiceId = subServiceId ?? service.subServices[0]?.id;
                if (!targetSubServiceId) return service;

                const newSubServices = service.subServices.map(sub => {
                    if (sub.id === targetSubServiceId) {
                        const newOrder = sub.stages.length > 0 ? Math.max(...sub.stages.map(s => s.order)) + 1 : 1;
                        return { ...sub, stages: [...sub.stages, { ...newStage, order: newOrder }] };
                    }
                    return sub;
                });
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        return true;
    };
    
    const updateStageInSubService = async (serviceId: string, subServiceId: string | null, stageId: string, updates: Partial<WorkflowStage>): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                const targetSubServiceId = subServiceId ?? service.subServices[0]?.id;
                 if (!targetSubServiceId) return service;
                const newSubServices = service.subServices.map(sub => {
                    if (sub.id === targetSubServiceId) {
                        const newStages = sub.stages.map(stage => 
                            stage.id === stageId ? { ...stage, ...updates } : stage
                        );
                        return { ...sub, stages: newStages };
                    }
                    return sub;
                });
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        showNotification('success', 'Etapa Actualizada', 'Los cambios en la etapa se han guardado.');
        return true;
    };

    const deleteStageFromSubService = async (serviceId: string, subServiceId: string | null, stageId: string): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                const targetSubServiceId = subServiceId ?? service.subServices[0]?.id;
                if (!targetSubServiceId) return service;

                const newSubServices = service.subServices.map(sub => {
                    if (sub.id === targetSubServiceId) {
                        return { ...sub, stages: sub.stages.filter(stage => stage.id !== stageId) };
                    }
                    return sub;
                });
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        showNotification('success', 'Etapa Eliminada', 'La etapa ha sido eliminada del flujo.');
        return true;
    };

    const addActionToStage = async (serviceId: string, subServiceId: string | null, stageId: string): Promise<boolean> => {
        const newAction: WorkflowAction = {
            id: `action-${Date.now()}`,
            description: "Nueva Acción",
            order: 100, // Append
            subActions: []
        };
        
        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                const targetSubServiceId = subServiceId ?? service.subServices[0]?.id;
                if (!targetSubServiceId) return service;

                const newSubServices = service.subServices.map(sub => {
                    if (sub.id === targetSubServiceId) {
                        const newStages = sub.stages.map(stage => {
                            if (stage.id === stageId) {
                                const newOrder = stage.actions.length > 0 ? Math.max(...stage.actions.map(o => o.order)) + 1 : 1;
                                return { ...stage, actions: [...stage.actions, { ...newAction, order: newOrder }] };
                            }
                            return stage;
                        });
                        return { ...sub, stages: newStages };
                    }
                    return sub;
                });
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        return true;
    };

    const updateActionInStage = async (serviceId: string, subServiceId: string | null, stageId: string, actionId: string, updates: Partial<WorkflowAction>): Promise<boolean> => {
        setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                const targetSubServiceId = subServiceId ?? service.subServices[0]?.id;
                if (!targetSubServiceId) return service;

                const newSubServices = service.subServices.map(sub => {
                    if (sub.id === targetSubServiceId) {
                        const newStages = sub.stages.map(stage => {
                            if (stage.id === stageId) {
                                const newActions = stage.actions.map(act => act.id === actionId ? { ...act, ...updates } : act);
                                return { ...stage, actions: newActions };
                            }
                            return stage;
                        });
                        return { ...sub, stages: newStages };
                    }
                    return sub;
                });
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        return true;
    };

    const deleteActionFromStage = async (serviceId: string, subServiceId: string | null, stageId: string, actionId: string): Promise<boolean> => {
         setServiceWorkflows(prev => prev.map(service => {
            if (service.id === serviceId) {
                const targetSubServiceId = subServiceId ?? service.subServices[0]?.id;
                if (!targetSubServiceId) return service;

                const newSubServices = service.subServices.map(sub => {
                    if (sub.id === targetSubServiceId) {
                        const newStages = sub.stages.map(stage => {
                            if (stage.id === stageId) {
                                return { ...stage, actions: stage.actions.filter(act => act.id !== actionId) };
                            }
                            return stage;
                        });
                        return { ...sub, stages: newStages };
                    }
                    return sub;
                });
                return { ...service, subServices: newSubServices };
            }
            return service;
        }));
        return true;
    };


    // Placeholder functions to avoid breaking the UI
    const placeholderPromise = async <T,>(data: T | null = null): Promise<any> => {
        showNotification('info', 'Funcionalidad no implementada', 'Esta acción aún no está conectada.');
        return data;
    }

    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser: isUserLoading, 
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
        addService,
        updateService,
        deleteService,
        addSubServiceToService,
        updateSubServiceName,
        deleteSubServiceFromService,
        addStageToSubService,
        updateStageInSubService,
        deleteStageFromSubService,
        addActionToStage,
        updateActionInStage,
        deleteActionFromStage,
        getActionById,
        registerUser,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [
        currentUser, isUserLoading, clients, isLoadingClients, 
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
