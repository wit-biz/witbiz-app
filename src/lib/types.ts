export type Client = {
  id: string;
  name: string;
  owner: string;
  category: string;
  stage: string;
  currentObjective: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate: Date;
  status: 'To-Do' | 'In Progress' | 'Done' | 'Overdue';
  clientId: string;
  clientName: string;
};

export type Document = {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  clientId: string;
};

export type Note = {
  id: string;
  content: string;
  createdAt: Date;
  clientId: string;
};

export type Booking = {
  id: string;
  title: string;
  date: Date;
  clientId: string;
};

export type WorkflowStage = string;

export type WorkflowStageObjective = {
  id: string;
  description: string;
  documentTypeTrigger?: string;
};
