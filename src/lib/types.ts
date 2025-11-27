

import { type LucideIcon } from "lucide-react";

export type PosTerminal = {
  id: string;
  serialNumber: string;
}

export type PromoterRef = {
  promoterId: string;
  percentage: number;
}

export type CustomCommission = {
    serviceId: string;
    commissionId: string;
    rate: number;
}

export type SubmittedRequirement = {
  text: string;
  submittedAt: Date; 
};

export type Client = {
  id: string;
  name: string;
  owner: string;
  category: string;
  stage?: string; // Opcional, legado
  status: 'Activo' | 'Inactivo' | 'Archivado';
  currentActionId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  subscribedServiceIds: string[];
  currentWorkflowStageId?: string;
  createdAt?: any;
  promoters?: PromoterRef[];
  posTerminals?: PosTerminal[];
  customCommissions?: CustomCommission[];
  submittedRequirements?: SubmittedRequirement[];
  archivedAt?: any;
  customCommissionServiceIds?: string[];
};

export type Promoter = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  referredClients: number;
  totalCommissions: number;
  status: 'Activo' | 'Inactivo' | 'Archivado';
  accessCode?: string;
  createdAt?: any;
  archivedAt?: any;
};

export type Supplier = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  service?: string;
  status: 'Activo' | 'Inactivo' | 'Archivado';
  createdAt?: any;
  archivedAt?: any;
}

export type SubTask = {
  id: string;
  description: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  dueDate: string; // ISO String YYYY-MM-DD
  dueTime?: string; // HH:MM
  status: 'Pendiente' | 'Completada' | 'Pospuesta' | 'Archivado';
  clientId: string;
  clientName?: string;
  serviceId?: string; // ID of the service this task belongs to
  assignedToId?: string;
  assignedToName?: string;
  assignedToPhotoURL?: string;
  description?: string;
  type?: 'Tarea' | 'Cita' | 'Operación Divisas';
  createdAt?: any;
  requiredDocumentForCompletion?: boolean;
  requiredDocuments?: { id: string; description: string }[];
  postponedReason?: string;
  postponedAt?: string; // ISO String YYYY-MM-DD
  reactivationDate?: string; // ISO String YYYY-MM-DD
  subTasks?: SubTask[];
  archivedAt?: any;
};

export type Document = {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: any; // Firestore Timestamp o Date
  clientId?: string;
  serviceId?: string;
  promoterId?: string;
  supplierId?: string;
  downloadURL?: string;
  uploadDate?: string; // ISO String YYYY-MM-DD
  status?: 'Activo' | 'Archivado';
  archivedAt?: any;
};

export type Tax = {
  id: string;
  name: string;
  rate: number;
}

export type Company = {
    id: string;
    name: string;
    taxes: Tax[];
}

export type CreditDetails = {
    hasCredit: boolean;
    status: 'No Ofrecido' | 'Pendiente' | 'Aceptado' | 'Rechazado';
    creditAmount?: number;
    paymentPlan?: string;
}

export type BankAccount = {
    id: string;
    companyId: string;
    bankName: string;
    balance: number;
    currency: 'MXN' | 'USD' | 'EUR';
    creditDetails?: CreditDetails;
    initialBalance?: number;
}

export type Category = {
    id: string;
    name: string;
    type: 'Ingreso' | 'Egreso';
}

export type Transaction = {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  description: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  amount: number;
  companyId: string;
  accountId: string;
  clientId?: string;
  clientName?: string;
  attachmentUrl?: string; // URL al comprobante
  destinationAccountId?: string;
}

export type InterCompanyLoan = {
    id: string;
    lenderCompanyId: string;
    borrowerCompanyId: string;
    amount: number;
    date: any; // Firestore Timestamp
    status: 'En Curso' | 'Pagado' | 'Pendiente';
    terms?: string;
}

export type Note = {
  id: string;
  content: string; // Legado o para visualización
  text: string;
  createdAt: any; // Firestore Timestamp o Date
  clientId: string;
  authorName?: string;
  updatedAt?: any; // Firestore Timestamp o Date
  status?: 'Activo' | 'Archivado';
  archivedAt?: any;
};

// New 3-level structure
export type SubSubStage = {
  id: string;
  title: string;
  order: number;
  actions: WorkflowAction[];
};

export type SubStage = {
  id: string;
  title: string;
  order: number;
  actions: WorkflowAction[];
  subSubStages: SubSubStage[];
};

export type WorkflowStage = {
  id: string;
  title: string;
  order: number;
  actions: WorkflowAction[];
  subStages: SubStage[];
};

export type WorkflowAction = {
  id: string;
  title: string;
  order: number;
  subActions: SubAction[];
  requiredDocumentForCompletion?: boolean;
  requiredDocuments?: { id: string; description: string }[];
  description?: string;
  assignedToId?: string;
  serviceId?: string;
};

export type SubAction = {
    id: string;
    text: string;
    order?: number; // Opcional para simplicidad en datos de ejemplo
};

export type DocumentType = "Contrato" | "Factura" | "Propuesta" | "Informe" | "Otro" | "Descargable";

export type AppPermissions = {
    clients_create: boolean;
    clients_edit: boolean;
    clients_delete: boolean;
    clients_view: boolean;
    documents_view: boolean;
    tasks_create: boolean;
    tasks_edit: boolean;
    tasks_delete: boolean;
    tasks_view: boolean;
    crm_edit: boolean;
    crm_view: boolean;
    finances_view: boolean;
    admin_view: boolean;
    dashboard: boolean;
    team_invite: boolean;
    services_view: boolean;
}

export type UserRole = {
    id: string;
    name: string;
    permissions: Partial<AppPermissions>;
}

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: string;
    photoURL?: string;
    status?: 'Activo' | 'Archivado';
    archivedAt?: any;
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  permissions: Partial<AppPermissions>;
}

export interface Service {
    id: string;
    name: string;
    description: string;
}

export type ClientRequirement = {
  id: string;
  text: string;
}

export type SubCommission = {
  id: string;
  name: string;
  rate: number;
}

export type Commission = {
  id: string;
  name: string;
  rate: number;
  subCommissions?: SubCommission[];
}

// This structure is now stored directly in the `serviceWorkflows` collection
export interface ServiceWorkflow {
    id: string;
    name: string;
    description?: string;
    clientRequirements?: ClientRequirement[];
    commissions?: Commission[];
    stages: WorkflowStage[];
    order: number;
    status?: 'Activo' | 'Archivado';
    archivedAt?: any;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | string;
  exactMatch?: boolean;
  requiredPermission?: keyof AppPermissions;
}
