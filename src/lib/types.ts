export type Client = {
  id: string;
  name: string;
  owner: string;
  category: string;
  stage: string;
  currentObjective: string;
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
  dueDate: Date;
  status: 'To-Do' | 'In Progress' | 'Done' | 'Overdue';
  clientId: string;
  clientName: string;
  description?: string;
  dueTime?: string;
};

export type Document = {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  clientId: string;
  downloadURL?: string;
  uploadDate?: string;
};

export type Note = {
  id: string;
  content: string;
  createdAt: Date;
  clientId: string;
  authorName?: string;
  updatedAt?: Date;
  text: string;
};

export type Booking = {
  id: string;
  title: string;
  date: Date;
  clientId: string;
  clientName?: string;
  type?: 'Cita' | 'Operación Divisas';
  time?: string;
  details?: string;
  status?: 'Confirmada' | 'Pendiente' | 'Cancelada';
};

export type WorkflowStage = string;

export type WorkflowStageObjective = {
  id: string;
  description: string;
  documentTypeTrigger?: string;
  subObjectives?: SubObjective[];
  requiredDocumentForCompletion?: string;
};

export type SubObjective = {
    id: string;
    text: string;
};

export type DocumentType = "Contrato" | "Factura" | "Propuesta" | "Informe" | "Otro";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  permissions: {
    donna: {
      clients_create: boolean;
      clients_edit: boolean;
      clients_delete: boolean;
      documents_create: boolean;
      documents_edit: boolean;
      documents_delete: boolean;
      tasks_create: boolean;
      reservations_create: boolean;
      reservations_edit: boolean;
      reservations_delete: boolean;
    };
  };
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
    stages: WorkflowStage[];
    subServices: SubService[];
}
