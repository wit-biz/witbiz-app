
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
  rfc?: string;
  owner: string;
  category: string;
  stage?: string; // Opcional, legado
  status: 'Activo' | 'Inactivo' | 'Archivado';
  currentActionId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  subscribedServiceIds: string[];
  subscribedPackageIds?: string[]; // IDs of service packages client is subscribed to
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
  rfc?: string;
  email?: string;
  phone?: string;
  service?: string;
  address?: string;
  status: 'Activo' | 'Inactivo' | 'Archivado';
  createdAt?: any;
  archivedAt?: any;
}

// Represents a recipient of commission distribution
export type CommissionRecipient = {
  id: string;
  type: 'witbiz' | 'supplier' | 'team_member' | 'promoter';
  entityId?: string; // ID of supplier, team member, or promoter
  name: string;
  percentage: number; // Percentage of the parent's share
}

// Revenue distribution configuration for a service
export type RevenueDistribution = {
  // First level: How revenue is split between provider and WitBiz
  supplierPercentage: number; // % that goes to the supplier/provider
  witbizPercentage: number; // % that goes to WitBiz
  // Second level: How WitBiz's share is distributed internally
  witbizDistribution?: CommissionRecipient[];
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
  stageId?: string; // ID of the workflow stage this task belongs to
  assignedToId?: string;
  assignedToName?: string;
  assignedToPhotoURL?: string;
  description?: string;
  location?: string; // New field for location
  type?: 'Tarea' | 'Cita' | 'Operación Divisas';
  createdAt?: any;
  requiredDocumentForCompletion?: boolean;
  requiredDocuments?: { id: string; description: string }[];
  requiresInput?: boolean;
  postponedReason?: string;
  postponedAt?: string; // ISO String YYYY-MM-DD
  reactivationDate?: string; // ISO String YYYY-MM-DD
  subTasks?: SubTask[];
  archivedAt?: any;
};

export type DocumentCategory = 'general' | 'caja_fuerte';

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
  storagePath?: string;
  uploadDate?: string; // ISO String YYYY-MM-DD
  status?: 'Activo' | 'Archivado';
  archivedAt?: any;
  category?: DocumentCategory; // 'caja_fuerte' for important docs
  description?: string; // Optional description for the document
  ai?: {
    status?: 'analyzing' | 'proposed' | 'applied' | 'failed';
    proposal?: any;
    audit?: {
      proposedAt?: any;
      proposedBy?: string;
      approvedAt?: any;
      approvedBy?: string;
    };
    error?: {
      message?: string;
    };
  };
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
  documentId?: string; // Link to Document for audit trail
  serviceId?: string; // Link to service workflow
  stageId?: string; // Link to workflow stage
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

export type LogAction = 
  | 'client_created' | 'client_updated' | 'client_archived' | 'client_deleted_permanently'
  | 'task_created' | 'task_completed' | 'task_updated' | 'task_deleted_permanently'
  | 'document_uploaded' | 'document_deleted_permanently'
  | 'note_created' | 'note_deleted_permanently'
  | 'transaction_created'
  | 'user_invited' | 'user_deleted_permanently'
  | 'service_deleted_permanently'
  | 'supplier_deleted_permanently'
  | 'promoter_deleted_permanently'
  | 'entity_deleted_automatically'
  | 'timeoff_requested' | 'timeoff_approved' | 'timeoff_rejected' | 'timeoff_cancelled' | 'timeoff_auto_approved';

export type LogEntityType = 'client' | 'task' | 'document' | 'note' | 'transaction' | 'user' | 'service' | 'promoter' | 'supplier' | 'system' | 'timeoff';

export type Log = {
  id: string;
  authorId: string;
  authorName: string;
  action: LogAction;
  entityId: string;
  entityType: LogEntityType;
  entityName?: string;
  createdAt: any;
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
  requiresInput?: boolean;
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
    // General
    dashboard_view: boolean;
    // Contactos
    clients_view: boolean;
    clients_create: boolean;
    clients_edit: boolean;
    clients_delete: boolean;
    suppliers_view: boolean;
    suppliers_create: boolean;
    suppliers_edit: boolean;
    suppliers_delete: boolean;
    promoters_view: boolean;
    promoters_create: boolean;
    promoters_edit: boolean;
    promoters_delete: boolean;
    // Tareas
    tasks_view: boolean;
    tasks_create: boolean;
    tasks_edit: boolean;
    tasks_delete: boolean;
    // Documentos
    documents_view: boolean;
    documents_upload: boolean;
    documents_edit: boolean;
    documents_archive: boolean;
    // Servicios y Flujos
    services_view: boolean;
    crm_view: boolean;
    workflow_edit: boolean;
    services_edit: boolean;
    // Finanzas
    intelligence_view: boolean;
    accounting_view: boolean;
    accounting_config: boolean;
    // Administración y Equipo
    admin_view: boolean;
    team_manage_members: boolean;
    team_manage_roles: boolean;
    team_tasks_view: boolean;
    team_activity_view: boolean;
    team_finance_view: boolean;
}

export type TimeOffRequest = {
  id: string;
  userId: string;
  userName: string;
  dates: string[]; // Array of date strings in YYYY-MM-DD format
  type: 'libre' | 'urgencia';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: any;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: any;
  rejectionReason?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: any;
};

export type UserRole = {
  id: string;
  name: string;
  permissions: AppPermissions;
  approvalHierarchy?: string[]; // Array of role names that can approve this role's requests
  isBaseRole?: boolean;
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
    // Supplier/Provider link
    linkedSupplierIds?: string[]; // Suppliers that provide this service
    primarySupplierId?: string; // Main supplier for this service
    // Revenue distribution configuration
    revenueDistribution?: RevenueDistribution;
}

// Service Package - combines multiple services for unified billing/accounting
export interface ServicePackage {
    id: string;
    name: string;
    description?: string;
    serviceIds: string[]; // IDs of services included in this package
    // Package-level pricing (overrides individual service pricing when subscribed as package)
    packagePrice?: number;
    packageCommissions?: Commission[]; // Unified commissions for the package
    discount?: number; // Discount percentage when buying as package
    status?: 'Activo' | 'Archivado';
    createdAt?: any;
    archivedAt?: any;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | string;
  exactMatch?: boolean;
  requiredPermission?: keyof AppPermissions;
}
