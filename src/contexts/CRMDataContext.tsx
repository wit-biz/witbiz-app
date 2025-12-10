
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
    type Promoter,
    type Supplier,
    type BankAccount,
    type Category,
    type Company,
    type InterCompanyLoan,
    type Transaction,
    type Log,
    type LogAction,
} from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc, useAuth, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, where, updateDoc, runTransaction, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDays, format } from 'date-fns';
import { initialRoles as baseInitialRoles, teamMembers as staticTeamMembers } from '@/lib/data';

type AnyStage = WorkflowStage | SubStage | SubSubStage;

interface CRMContextType {
  currentUser: AuthenticatedUser | null;
  isLoadingCurrentUser: boolean;
  teamMembers: AppUser[];
  roles: UserRole[];
  setRoles: (roles: UserRole[]) => void;

  clients: Client[];
  isLoadingClients: boolean;
  addClient: (newClientData: Omit<Client, 'id'>) => Promise<Client | null>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<boolean>;
  deleteClient: (clientId: string, permanent?: boolean) => Promise<boolean>;
  restoreClient: (clientId: string) => Promise<boolean>;
  getClientById: (clientId: string) => Client | undefined;
  getClientsByPromoterId: (promoterId: string) => Client[];
  
  tasks: Task[];
  isLoadingTasks: boolean;
  addTask: (newTaskData: Omit<Task, 'id' | 'status' >) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string, permanent?: boolean) => Promise<boolean>;
  restoreTask: (taskId: string) => Promise<boolean>;
  getTasksByClientId: (clientId: string) => Task[];

  documents: Document[];
  isLoadingDocuments: boolean;
  addDocument: (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file: File) => Promise<Document | null>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<boolean>;
  deleteDocument: (documentId: string, permanent?: boolean) => Promise<boolean>;
  restoreDocument: (documentId: string) => Promise<boolean>;
  getDocumentsByClientId: (clientId: string) => Document[];
  getDocumentsByServiceId: (serviceId: string) => Document[];
  getDocumentsByPromoterId: (promoterId: string) => Document[];
  getDocumentsBySupplierId: (supplierId: string) => Document[];

  notes: Note[];
  isLoadingNotes: boolean;
  addNote: (clientId: string, text: string) => Promise<Note | null>;
  updateNote: (noteId: string, newText: string, clientId?: string) => Promise<boolean>;
  deleteNote: (noteId: string, permanent?: boolean) => Promise<boolean>;
  restoreNote: (noteId: string) => Promise<boolean>;

  logs: Log[];
  isLoadingLogs: boolean;
  addLog: (action: LogAction, entityId: string, entityType: string, entityName?: string) => Promise<void>;

  serviceWorkflows: ServiceWorkflow[];
  setServiceWorkflows: (workflows: ServiceWorkflow[]) => void;
  isLoadingWorkflows: boolean;
  addService: (name: string) => Promise<ServiceWorkflow | null>;
  updateService: (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'stages' | 'subServices' | 'order'>>) => Promise<boolean>;
  deleteService: (serviceId: string, permanent?: boolean) => Promise<boolean>;
  restoreService: (serviceId: string) => Promise<boolean>;
  getActionById: (actionId: string) => WorkflowAction | null;
  
  promoters: Promoter[];
  isLoadingPromoters: boolean;
  addPromoter: (promoterData: Omit<Promoter, 'id'>) => Promise<Promoter | null>;
  updatePromoter: (promoterId: string, updates: Partial<Promoter>) => Promise<boolean>;
  deletePromoter: (promoterId: string, permanent?: boolean) => Promise<boolean>;
  restorePromoter: (promoterId: string) => Promise<boolean>;

  suppliers: Supplier[];
  isLoadingSuppliers: boolean;
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<Supplier | null>;
  updateSupplier: (supplierId: string, updates: Partial<Supplier>) => Promise<boolean>;
  deleteSupplier: (supplierId: string, permanent?: boolean) => Promise<boolean>;
  restoreSupplier: (supplierId: string) => Promise<boolean>;

  companies: Company[];
  isLoadingCompanies: boolean;
  addCompany: (data: Omit<Company, 'id'>) => Promise<void>;
  deleteCompany: (id: string) => Promise<boolean>;

  bankAccounts: BankAccount[];
  isLoadingBankAccounts: boolean;
  addBankAccount: (data: Omit<BankAccount, 'id'|'balance'>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<boolean>;

  categories: Category[];
  isLoadingCategories: boolean;
  addCategory: (data: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;

  transactions: Transaction[];
  isLoadingTransactions: boolean;
  addTransaction: (data: any) => Promise<void>;
  
  loans: InterCompanyLoan[];
  isLoadingLoans: boolean;
  addLoan: (data: Omit<InterCompanyLoan, 'id' | 'date' | 'status'>) => Promise<void>;

  registerUser: (name: string, email: string, pass: string, role: string) => Promise<any>;
  updateUser: (userId: string, updates: Partial<AppUser>) => Promise<boolean>;
  deleteUser: (userId: string, permanent?: boolean) => Promise<boolean>;
  restoreUser: (userId: string) => Promise<boolean>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMDataProvider({ children }: { children: ReactNode }) {
    const { showNotification } = useGlobalNotification();
    const firestore = useFirestore();
    const auth = useAuth();
    const storage = useStorage();
    const { user, isUserLoading } = useUser();
    
    // Simulating role management with local state for now
    const [roles, setRoles] = useState<UserRole[]>(baseInitialRoles);
    
    // LOADING STATES
    
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<AppUser>(userProfileRef);

    const [teamMembers, setTeamMembers] = useState<AppUser[]>(staticTeamMembers);
    const isLoadingTeamMembers = false; // Since it's static data


    // --- Collections ---
    const clientsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
    const tasksCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);
    const documentsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'documents') : null, [firestore, user]);
    const serviceWorkflowsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'serviceWorkflows') : null, [firestore, user]);
    const promotersCollection = useMemoFirebase(() => user ? query(collection(firestore, 'promoters')) : null, [firestore, user]);
    const suppliersCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'suppliers') : null, [firestore, user]);
    const notesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'notes') : null, [firestore, user]);
    const companiesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'companies') : null, [firestore, user]);
    const bankAccountsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user]);
    const categoriesCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
    const transactionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [firestore, user]);
    const loansCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'loans') : null, [firestore, user]);
    const logsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'logs') : null, [firestore, user]);

    const addLog = useCallback(async (action: LogAction, entityId: string, entityType: string, entityName?: string) => {
        if (!logsCollection || !currentUser) return;
        const logEntry: Omit<Log, 'id'> = {
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Sistema',
            action,
            entityId,
            entityType,
            entityName,
            createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(logsCollection, logEntry);
    }, [logsCollection, currentUser]);
    
    useEffect(() => {
        const bootstrapDirectors = async () => {
            if (!firestore) return;
    
            const directorUsers = [
                { uid: 'TycwLL3rn5Zny3R4aibDJuIbd2S2', name: 'Isaac Golzarri', email: 'witbiz.mx@gmail.com' },
                { uid: 'GfHifOumHKVvmNcUg6W4iNJEYSj2', name: 'Said Saigar', email: 'saidsaigar@gmail.com' },
            ];
    
            for (const dir of directorUsers) {
                const userDocRef = doc(firestore, 'users', dir.uid);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    try {
                        await setDocumentNonBlocking(userDocRef, {
                            id: dir.uid,
                            name: dir.name,
                            email: dir.email,
                            role: 'Director',
                            status: 'Activo',
                        }, { merge: true });
                        console.log(`Director profile for ${dir.name} created.`);
                    } catch (error) {
                        console.error(`Failed to create director profile for ${dir.name}:`, error);
                    }
                }
            }
        };
    
        bootstrapDirectors();
    }, [firestore]);


    // --- Firestore Data ---
    const { data: clients = [], isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);
    const { data: tasks = [], isLoading: isLoadingTasks } = useCollection<Task>(tasksCollection);
    const { data: documents = [], isLoading: isLoadingDocuments } = useCollection<Document>(documentsCollection);
    const { data: serviceWorkflows = [], isLoading: isLoadingWorkflows } = useCollection<ServiceWorkflow>(serviceWorkflowsCollection);
    const { data: promoters = [], isLoading: isLoadingPromoters } = useCollection<Promoter>(promotersCollection);
    const { data: suppliers = [], isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersCollection);
    const { data: notes = [], isLoading: isLoadingNotes } = useCollection<Note>(notesCollection);
    const { data: companies = [], isLoading: isLoadingCompanies } = useCollection<Company>(companiesCollection);
    const { data: bankAccounts = [], isLoading: isLoadingBankAccounts } = useCollection<BankAccount>(bankAccountsCollection);
    const { data: categories = [], isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);
    const { data: transactions = [], isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsCollection);
    const { data: loans = [], isLoading: isLoadingLoans } = useCollection<InterCompanyLoan>(loansCollection);
    const { data: logs = [], isLoading: isLoadingLogs } = useCollection<Log>(logsCollection);
    
    const registerUser = useCallback(async (name: string, email: string, pass: string, role: string) => {
        if (!auth || !firestore) {
            showNotification('error', 'Error de registro', 'Los servicios de autenticación no están listos.');
            throw new Error('Los servicios de autenticación no están listos.');
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const { user: newUser } = userCredential;
    
            await updateProfile(newUser, { displayName: name });
            
            const userDocRef = doc(firestore, "users", newUser.uid);
            await setDocumentNonBlocking(userDocRef, {
                id: newUser.uid,
                name: name,
                email: newUser.email,
                role: role,
                status: 'Activo',
            }, { merge: true });
            
            await addLog('user_invited', newUser.uid, 'user', name);
    
            return userCredential;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                 showNotification('warning', 'Usuario Existente', 'Este correo electrónico ya está registrado.');
            } else {
                 showNotification('error', 'Error de registro', error.message);
            }
            throw error; // Re-throw to be handled by caller if needed
        }
    }, [auth, firestore, showNotification, addLog]);

    const updateUser = async (userId: string, updates: Partial<AppUser>): Promise<boolean> => {
        if (!firestore) return false;
        const userDocRef = doc(firestore, 'users', userId);
        setDocumentNonBlocking(userDocRef, updates, { merge: true });
        return true;
    };

    const deleteUser = async (userId: string, permanent: boolean = false): Promise<boolean> => {
        if (!firestore) return false;
        const docRef = doc(firestore, 'users', userId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        return true;
    };

    const restoreUser = async (userId: string): Promise<boolean> => {
        if (!firestore) return false;
        const docRef = doc(firestore, 'users', userId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
        return true;
    };


    // --- Data Handlers ---

    const addClient = async (newClientData: Omit<Client, 'id'>): Promise<Client | null> => {
        if (!clientsCollection || !serviceWorkflows) return null;
        
        const firstServiceId = newClientData.subscribedServiceIds[0];
        const service = serviceWorkflows.find(s => s.id === firstServiceId);
        const initialStage = service?.stages?.[0];

        const payload = {
            ...newClientData,
            status: 'Activo' as const,
            currentWorkflowStageId: initialStage?.id,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDocumentNonBlocking(clientsCollection, payload);
        addLog('client_created', docRef.id, 'client', newClientData.name);
        
        const newClient = { id: docRef.id, ...payload } as Client;

        if (initialStage?.actions) {
            for (const action of initialStage.actions) {
                await addTask({
                    ...action,
                    clientId: newClient.id,
                    serviceId: service?.id, // Add serviceId here
                });
            }
        }
        
        return newClient;
    };

    const updateClient = async (clientId: string, updates: Partial<Client>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', clientId);
        setDocumentNonBlocking(docRef, updates, { merge: true });
        const clientName = clients.find(c => c.id === clientId)?.name || updates.name;
        addLog('client_updated', clientId, 'client', clientName);
        return true;
    };

    const deleteClient = async (clientId: string, permanent: boolean = false): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', clientId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
            const clientName = clients.find(c => c.id === clientId)?.name;
            addLog('client_archived', clientId, 'client', clientName);
        }
        return true;
    };

    const restoreClient = async (clientId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'clients', clientId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
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
        
        // Find which of the client's subscribed services contains this task's action
        const serviceId = newTaskData.serviceId || client.subscribedServiceIds.find(subId => {
            const service = serviceWorkflows.find(s => s.id === subId);
            if (!service) return false;
            return getAllStages(service.id).some(stage => stage.actions.some(action => action.title === newTaskData.title));
        });

        const assignedUserId = newTaskData.assignedToId || currentUser.uid;
        const assignedUser = teamMembers.find(m => m.id === assignedUserId);

        const newTaskPayload = { 
            ...newTaskData, 
            dueDate: finalDueDate,
            status: 'Pendiente' as const, 
            clientName: client.name,
            serviceId: serviceId, // Save the serviceId
            assignedToId: assignedUser?.id || currentUser.uid,
            assignedToName: assignedUser?.name || currentUser.displayName || 'Usuario Actual',
            assignedToPhotoURL: assignedUser?.photoURL || currentUser.photoURL || '',
            createdAt: serverTimestamp()
        };

        const docRef = await addDocumentNonBlocking(tasksCollection, newTaskPayload);
        showNotification('success', 'Tarea Creada', `La tarea "${newTaskPayload.title}" ha sido creada.`);
        addLog('task_created', docRef.id, 'task', newTaskPayload.title);
        return { id: docRef.id, ...newTaskPayload } as Task;
    };
    
    const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        setDocumentNonBlocking(docRef, updates, { merge: true });
        
        if (updates.status === 'Completada') {
            const completedTask = { ...tasks.find(t => t.id === taskId), ...updates } as Task | undefined;
            if (completedTask) {
                addLog('task_completed', taskId, 'task', completedTask.title);
                await checkAndAdvanceWorkflow(completedTask.clientId);
            }
        } else {
            const taskName = tasks.find(t => t.id === taskId)?.title || updates.title;
            addLog('task_updated', taskId, 'task', taskName);
        }
        return true;
    };
    
    const checkAndAdvanceWorkflow = async (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client || !client.currentWorkflowStageId) return;

        // Give Firestore a moment to update the task list after completion
        await new Promise(resolve => setTimeout(resolve, 1000));

        const clientTasks = tasks.filter(t => t.clientId === clientId);
        
        const allStagesForClient = getAllStagesForClient(client);
        const currentStage = allStagesForClient.find(s => s.id === client.currentWorkflowStageId);
        if (!currentStage) return;

        // Check against the *latest* task list state
        const updatedTasks = (await (useCollection(tasksCollection)).data) || tasks;
        const pendingTasksForCurrentStage = (currentStage.actions || []).filter(action => {
            return updatedTasks.some(task => task.title === action.title && task.clientId === clientId && task.status === 'Pendiente');
        });
        
        if (pendingTasksForCurrentStage.length === 0) {
            const nextStage = findNextStage(client);
            if (nextStage) {
                await updateClient(clientId, { currentWorkflowStageId: nextStage.id });
                showNotification('info', 'Cliente Avanzó', `${client.name} ha avanzado a la etapa: ${nextStage.title}.`);
                
                const serviceForNextStage = serviceWorkflows.find(s => getAllStages(s.id).some(st => st.id === nextStage.id));

                if (nextStage.actions) {
                    for (const action of nextStage.actions) {
                        await addTask({ ...action, clientId: clientId, serviceId: serviceForNextStage?.id });
                    }
                }

            } else {
                 showNotification('success', 'Flujo Completado', `¡${client.name} ha completado el flujo de trabajo!`);
            }
        }
    };
    
    const getAllStages = useCallback((serviceId?: string): AnyStage[] => {
      if (!serviceWorkflows) return [];
      
      const servicesToScan = serviceId ? serviceWorkflows.filter(s => s.id === serviceId) : serviceWorkflows;
      const all: AnyStage[] = [];
      
      const sortedWorkflows = [...servicesToScan].sort((a,b) => (a.order || 0) - (b.order || 0));

      sortedWorkflows.forEach(service => {
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

    const getAllStagesForClient = (client: Client): AnyStage[] => {
        if (!client || !client.subscribedServiceIds) return [];
        return client.subscribedServiceIds.flatMap(serviceId => getAllStages(serviceId));
    };

    const findNextStage = (client: Client): AnyStage | null => {
        if (!client.currentWorkflowStageId) return null;
        const allStagesForClient = getAllStagesForClient(client);
        const currentIndex = allStagesForClient.findIndex(s => s.id === client.currentWorkflowStageId);
        if (currentIndex !== -1 && currentIndex < allStagesForClient.length - 1) {
            return allStagesForClient[currentIndex + 1];
        }
        return null;
    };

    const deleteTask = async (taskId: string, permanent: boolean = false): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        return true;
    };

    const restoreTask = async (taskId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        setDocumentNonBlocking(docRef, { status: 'Pendiente', archivedAt: undefined }, { merge: true });
        return true;
    };

    const addDocument = async (newDocumentData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'>, file: File): Promise<Document | null> => {
        if (!documentsCollection || !user || !storage) return null;
        
        const filePath = `users/${user.uid}/documents/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const newDoc = { 
                ...newDocumentData,
                status: 'Activo' as const,
                uploadedAt: serverTimestamp(),
                downloadURL: downloadURL
            };
            const docRef = await addDocumentNonBlocking(documentsCollection, newDoc);
            addLog('document_uploaded', docRef.id, 'document', file.name);
            return { id: docRef.id, ...newDoc } as Document;
        } catch (error) {
            console.error("Error uploading file or saving document:", error);
            showNotification('error', 'Error de subida', 'No se pudo subir el archivo.');
            return null;
        }
    }

    const deleteDocument = async (id: string, permanent: boolean = false): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'documents', id);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        return true;
    };

    const restoreDocument = async (documentId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'documents', documentId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
        return true;
    };

    const addNote = async (clientId: string, text: string): Promise<Note | null> => {
        if (!currentUser || !notesCollection) return null;
        const clientName = clients.find(c => c.id === clientId)?.name || 'Cliente Desconocido';
        const newNoteData = {
            clientId: clientId,
            text: text,
            content: text, // Legado o para visualización
            authorName: currentUser.displayName || "Usuario",
            createdAt: serverTimestamp(),
            status: 'Activo' as const,
        };
        const docRef = await addDocumentNonBlocking(notesCollection, newNoteData);
        addLog('note_created', clientId, 'client', `Nota para ${clientName}`);
        return { id: docRef.id, ...newNoteData } as Note;
    };

    const updateNote = async (noteId: string, newText: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'notes', noteId);
        setDocumentNonBlocking(docRef, { text: newText, content: newText, updatedAt: serverTimestamp() }, { merge: true });
        return true;
    };

    const deleteNote = async (noteId: string, permanent: boolean = false): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'notes', noteId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        return true;
    };

    const restoreNote = async (noteId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'notes', noteId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
        return true;
    };

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
            order: (serviceWorkflows || []).length,
            status: 'Activo',
        };
        const docRef = await addDocumentNonBlocking(serviceWorkflowsCollection, newServiceData);
        return { ...newServiceData, id: docRef.id };
    };

    const updateService = async (serviceId: string, updates: Partial<Omit<ServiceWorkflow, 'id' | 'stages' | 'subServices' | 'order'>>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        setDocumentNonBlocking(docRef, updates, { merge: true });
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


    const deleteService = async (serviceId: string, permanent: boolean = false): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        showNotification('success', 'Servicio Eliminado', 'El servicio ha sido enviado a la papelera.');
        return true;
    }

    const restoreService = async (serviceId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'serviceWorkflows', serviceId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
        return true;
    };

    // --- Promoter Handlers ---
    const addPromoter = async (promoterData: Omit<Promoter, 'id'>): Promise<Promoter | null> => {
        if (!promotersCollection) return null;
        const payload = { ...promoterData, status: 'Activo' as const, createdAt: serverTimestamp() };
        const docRef = await addDocumentNonBlocking(promotersCollection, payload);
        const finalPayload = { ...payload, id: docRef.id };
        setDocumentNonBlocking(doc(promotersCollection, docRef.id), finalPayload, { merge: true });
        return finalPayload as Promoter;
    };
    const updatePromoter = async (promoterId: string, updates: Partial<Promoter>): Promise<boolean> => {
        if (!promotersCollection) return false;
        const docRef = doc(promotersCollection, promoterId);
        setDocumentNonBlocking(docRef, updates, { merge: true });
        return true;
    };
    const deletePromoter = async (promoterId: string, permanent: boolean = false): Promise<boolean> => {
        if (!promotersCollection) return false;
        const docRef = doc(promotersCollection, promoterId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        return true;
    };
    const restorePromoter = async (promoterId: string): Promise<boolean> => {
        if (!promotersCollection) return false;
        const docRef = doc(promotersCollection, promoterId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
        return true;
    };

    // --- Supplier Handlers ---
    const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier | null> => {
        if (!suppliersCollection) return null;
        const payload = { ...supplierData, status: 'Activo' as const, createdAt: serverTimestamp() };
        const docRef = await addDocumentNonBlocking(suppliersCollection, payload);
        return { ...payload, id: docRef.id };
    };
    const updateSupplier = async (supplierId: string, updates: Partial<Supplier>): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'suppliers', supplierId);
        setDocumentNonBlocking(docRef, updates, { merge: true });
        return true;
    };
    const deleteSupplier = async (supplierId: string, permanent: boolean = false): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'suppliers', supplierId);
        if (permanent) {
            deleteDocumentNonBlocking(docRef);
        } else {
            setDocumentNonBlocking(docRef, { status: 'Archivado', archivedAt: serverTimestamp() }, { merge: true });
        }
        return true;
    };
    const restoreSupplier = async (supplierId: string): Promise<boolean> => {
        if (!user || !firestore) return false;
        const docRef = doc(firestore, 'users', user.uid, 'suppliers', supplierId);
        setDocumentNonBlocking(docRef, { status: 'Activo', archivedAt: undefined }, { merge: true });
        return true;
    };

    // --- Accounting Handlers ---
    const addCompany = async (data: Omit<Company, 'id'>) => {
        if (!companiesCollection) return;
        const docRef = await addDocumentNonBlocking(companiesCollection, data);
        setDocumentNonBlocking(doc(companiesCollection, docRef.id), { id: docRef.id }, { merge: true });
    };
    const deleteCompany = async (id: string) => {
        if (!companiesCollection) return false;
        deleteDocumentNonBlocking(doc(companiesCollection, id));
        return true;
    };

    const addBankAccount = async (data: Omit<BankAccount, 'id' | 'balance'>) => {
        if (!bankAccountsCollection) return;
        const payload: Omit<BankAccount, 'id'> = { ...data, balance: data.initialBalance || 0 };
        const docRef = await addDocumentNonBlocking(bankAccountsCollection, payload);
        setDocumentNonBlocking(doc(bankAccountsCollection, docRef.id), { id: docRef.id, initialBalance: data.initialBalance }, { merge: true });
    };
    const deleteBankAccount = async (id: string) => {
        if (!bankAccountsCollection) return false;
        deleteDocumentNonBlocking(doc(bankAccountsCollection, id));
        return true;
    };
    
    const addCategory = async (data: Omit<Category, 'id'>) => {
        if (!categoriesCollection) return;
        const docRef = await addDocumentNonBlocking(categoriesCollection, data);
        setDocumentNonBlocking(doc(categoriesCollection, docRef.id), { id: docRef.id }, { merge: true });
    };
    const deleteCategory = async (id: string) => {
        if (!categoriesCollection) return false;
        deleteDocumentNonBlocking(doc(categoriesCollection, id));
        return true;
    };
    
    const addTransaction = async (data: any) => {
        if (!transactionsCollection || !bankAccountsCollection || !firestore) return;
    
        const { date, ...rest } = data;
        const payload = { ...rest, date: format(date, 'yyyy-MM-dd') };
        const docRef = await addDocumentNonBlocking(transactionsCollection, payload);
        addLog('transaction_created', docRef.id, 'transaction', `Transacción de ${payload.amount}`);
    
        try {
            await runTransaction(firestore, async (transaction) => {
                const amount = payload.amount;
                const originAccountRef = doc(bankAccountsCollection, payload.accountId);
                const originAccountDoc = await transaction.get(originAccountRef);
    
                if (!originAccountDoc.exists()) {
                    throw new Error("La cuenta de origen no existe.");
                }
    
                const newOriginBalance = (originAccountDoc.data().balance || 0) - (payload.type === 'transfer' || payload.type === 'expense' ? amount : -amount);
                transaction.update(originAccountRef, { balance: newOriginBalance });
    
                if (payload.type === 'transfer' && payload.destinationAccountId) {
                    const destAccountRef = doc(bankAccountsCollection, payload.destinationAccountId);
                    const destAccountDoc = await transaction.get(destAccountRef);
    
                    if (!destAccountDoc.exists()) {
                        throw new Error("La cuenta de destino no existe.");
                    }
    
                    const newDestBalance = (destAccountDoc.data().balance || 0) + amount;
                    transaction.update(destAccountRef, { balance: newDestBalance });
                }
            });
        } catch (e) {
            console.error("Error al actualizar balances de cuentas: ", e);
            showNotification('error', 'Error de transacción', 'No se pudieron actualizar los saldos de las cuentas.');
        }
    };

    const addLoan = async (data: Omit<InterCompanyLoan, 'id' | 'date' | 'status'>) => {
        if (!loansCollection) return;
        const payload: Omit<InterCompanyLoan, 'id'> = { ...data, status: 'En Curso', date: serverTimestamp() };
        const docRef = await addDocumentNonBlocking(loansCollection, payload);
        setDocumentNonBlocking(doc(loansCollection, docRef.id), { id: docRef.id }, { merge: true });
    };
    
    // Final setup in a separate effect to ensure all functions are defined
    useEffect(() => {
        if (user && userProfile) {
            const userRole = roles.find(r => r.name === userProfile.role) || roles.find(r => r.id === 'collaborator');

            setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: userProfile.name || user.displayName,
                photoURL: userProfile.photoURL || user.photoURL,
                role: userRole?.name,
                permissions: userRole?.permissions || {},
            });
        } else if (!user && !isUserLoading) {
            setCurrentUser(null);
        }
    }, [user, userProfile, isUserLoading, roles]);
    
    const value = useMemo(() => ({
        currentUser, isLoadingCurrentUser: isUserLoading || isLoadingUserProfile, teamMembers, roles, setRoles,
        clients, isLoadingClients, 
        addClient, updateClient, deleteClient, restoreClient,
        getClientById: (id: string) => clients?.find(c => c.id === id),
        getClientsByPromoterId: (id: string) => clients?.filter(c => c.promoters?.some(p => p.promoterId === id)) || [],
        
        tasks, isLoadingTasks,
        addTask, updateTask, deleteTask, restoreTask,
        getTasksByClientId: (id: string) => tasks.filter(t => t.clientId === id),

        documents, isLoadingDocuments,
        addDocument,
        updateDocument: (id, d) => Promise.resolve(false),
        deleteDocument, restoreDocument,
        getDocumentsByClientId: (id) => documents.filter(d => d.clientId === id),
        getDocumentsByServiceId: (id) => documents.filter(d => d.serviceId === id),
        getDocumentsByPromoterId: (id) => documents.filter(d => d.promoterId === id),
        getDocumentsBySupplierId: (id) => documents.filter(d => d.supplierId === id),

        notes, isLoadingNotes,
        addNote,
        updateNote,
        deleteNote, restoreNote,

        logs, isLoadingLogs, addLog,

        serviceWorkflows, 
        setServiceWorkflows: setServiceWorkflowsAndPersist, 
        isLoadingWorkflows,
        addService, updateService, deleteService, restoreService,
        getActionById,
        
        promoters, isLoadingPromoters,
        addPromoter, updatePromoter, deletePromoter, restorePromoter,

        suppliers, isLoadingSuppliers,
        addSupplier, updateSupplier, deleteSupplier, restoreSupplier,
        
        companies, isLoadingCompanies, addCompany, deleteCompany,
        bankAccounts, isLoadingBankAccounts, addBankAccount, deleteBankAccount,
        categories, isLoadingCategories, addCategory, deleteCategory,
        transactions, isLoadingTransactions, addTransaction,
        loans, isLoadingLoans, addLoan,

        registerUser,
        updateUser,
        deleteUser,
        restoreUser,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [
        currentUser, isUserLoading, isLoadingUserProfile, teamMembers, roles, setRoles, clients, isLoadingClients, 
        tasks, isLoadingTasks, documents, isLoadingDocuments, notes, isLoadingNotes, logs, isLoadingLogs,
        serviceWorkflows, isLoadingWorkflows, getActionById,
        promoters, isLoadingPromoters, suppliers, isLoadingSuppliers,
        companies, isLoadingCompanies, bankAccounts, isLoadingBankAccounts, categories, isLoadingCategories,
        transactions, isLoadingTransactions, loans, isLoadingLoans,
        addLog, registerUser
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

    