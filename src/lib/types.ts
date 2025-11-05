

import { type LucideIcon } from "lucide-react";

export type Client = {
  id: string;
  name: string;
  owner: string;
  category: string;
  stage?: string; // Opcional, legado
  currentActionId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  subscribedServiceIds?: string[];
  currentWorkflowStageId?: string;
};

export type Promoter = {
  id: string;
  name: string;
  referredClients: number;
  totalCommissions: number;
  status: 'Activo' | 'Inactivo';
};

export type Task = {
  id: string;
  title: string;
  dueDate: string; // ISO String YYYY-MM-DD
  dueTime?: string; // HH:MM
  status: 'Pendiente' | 'Completada';
  clientId: string;
  clientName: string;
  description?: string;
  type?: 'Tarea' | 'Cita' | 'Operación Divisas';
  createdAt?: any;
  dueDays?: number;
  requiredDocumentForCompletion?: boolean;
  requiredDocuments?: { id: string; description: string }[];
};

export type Document = {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: any; // Firestore Timestamp o Date
  clientId?: string; // Optional: can be linked to a client
  serviceId?: string; // Optional: can be linked to a service
  downloadURL?: string;
  uploadDate?: string; // ISO String YYYY-MM-DD
};

export type Transaction = {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  description: string;
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out';
  category: string;
  amount: number;
  companyId: string;
  accountId: string;
  clientId?: string;
  clientName?: string;
  attachmentUrl?: string; // URL al comprobante
}

export type Note = {
  id: string;
  content: string; // Legado o para visualización
  text: string;
  createdAt: any; // Firestore Timestamp o Date
  clientId: string;
  authorName?: string;
  updatedAt?: any; // Firestore Timestamp o Date
};

export type WorkflowStage = {
  id: string;
  title: string;
  order: number;
  actions: WorkflowAction[];
};

export type WorkflowAction = {
  id: string;
  title: string;
  dueDays: number;
  order: number;
  subActions: SubAction[];
  requiredDocumentForCompletion?: boolean;
  requiredDocuments?: { id: string; description: string }[];
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
    uid: string;
    roleId: string;
    // ... otros campos del perfil de cliente
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  roleId?: string;
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

export interface SubService {
    id: string;
    name: string;
    stages: WorkflowStage[];
}

export interface ServiceWorkflow {
    id: string;
    name: string;
    description?: string;
    clientRequirements?: ClientRequirement[];
    stages?: WorkflowStage[];
    subServices: SubService[];
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | string;
  exactMatch?: boolean;
  requiredPermission: keyof AppPermissions;
}
