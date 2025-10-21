
import { type LucideIcon } from "lucide-react";

export type Client = {
  id: string;
  name: string;
  owner: string;
  category: string;
  stage?: string; // Opcional, legado
  currentObjective?: string; // Opcional, legado
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  subscribedServiceIds?: string[];
  currentWorkflowStageId?: string;
  currentObjectiveId?: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate: string; // ISO String YYYY-MM-DD
  status: 'Pendiente' | 'Completada';
  clientId: string;
  clientName: string;
  description?: string;
  dueTime?: string; // HH:MM
};

export type Document = {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: any; // Firestore Timestamp o Date
  clientId: string;
  downloadURL?: string;
  uploadDate?: string; // ISO String YYYY-MM-DD
};

export type Note = {
  id: string;
  content: string; // Legado o para visualización
  text: string;
  createdAt: any; // Firestore Timestamp o Date
  clientId: string;
  authorName?: string;
  updatedAt?: any; // Firestore Timestamp o Date
};

export type Reservation = {
  id: string;
  clientId: string;
  clientName: string;
  type: 'Cita' | 'Operación Divisas';
  date: string; // ISO String YYYY-MM-DD
  time: string; // HH:MM
  details: string;
  status: 'Confirmada' | 'Pendiente' | 'Cancelada';
  createdAt?: any; // Firestore Timestamp o Date
};

export type WorkflowStage = {
  id: string;
  title: string;
  order: number;
  objectives: WorkflowStageObjective[];
};

export type WorkflowStageObjective = {
  id: string;
  description: string;
  order: number;
  subObjectives: SubObjective[];
  requiredDocumentForCompletion?: string;
};

export type SubObjective = {
    id: string;
    text: string;
    order?: number; // Opcional para simplicidad en datos de ejemplo
};

export type DocumentType = "Contrato" | "Factura" | "Propuesta" | "Informe" | "Otro";

export type AppPermissions = {
    clients_create: boolean;
    clients_edit: boolean;
    clients_delete: boolean;
    clients_view: boolean;
    documents_create: boolean;
    documents_edit: boolean;
    documents_delete: boolean;
    documents_view: boolean;
    tasks_create: boolean;
    tasks_edit: boolean;
    tasks_delete: boolean;
    tasks_view: boolean;
    reservations_create: boolean;
    reservations_edit: boolean;
    reservations_delete: boolean;
    reservations_view: boolean;
    crm_edit: boolean;
    crm_view: boolean;
    reports_view: boolean;
    audit_view: boolean;
    admin_view: boolean;
    dashboard: boolean;
}

export type UserRole = {
    id: string;
    name: string;
    permissions: Partial<AppPermissions>;
}

export interface AppUser {
    uid: string;
    roleId: string;
    // ... otros campos del perfil de usuario
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

export interface SubService {
    id: string;
    name: string;
    stages: WorkflowStage[];
}

export interface ServiceWorkflow {
    id: string;
    name: string;
    stages: WorkflowStage[]; // Legado o para flujos simples
    subServices: SubService[];
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | string;
  exactMatch?: boolean;
  requiredPermission: keyof AppPermissions;
  subItems?: NavItem[];
}
