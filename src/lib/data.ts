import type { Client, Task, Document, Note, Booking, WorkflowStage } from './types';

// This file now only exports the types and initial mock data.
// The CRMDataProvider will manage the state of the data.

export const workflowStages: WorkflowStage[] = [
  { id: 'stage-1', title: 'Prospect', order: 1, objectives: [] },
  { id: 'stage-2', title: 'Qualification', order: 2, objectives: [] },
  { id: 'stage-3', title: 'Negotiation', order: 3, objectives: [] },
  { id: 'stage-4', title: 'Closed-Won', order: 4, objectives: [] },
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'Innovate Inc.',
    owner: 'You',
    category: 'Tech',
    stage: 'Qualification',
    currentObjective: 'Complete technical needs analysis.',
  },
  {
    id: '2',
    name: 'Synergy Corp.',
    owner: 'Alex Smith',
    category: 'Finance',
    stage: 'Negotiation',
    currentObjective: 'Finalize pricing and contract terms.',
  },
  {
    id: '3',
    name: 'Solutions LLC',
    owner: 'You',
    category: 'Healthcare',
    stage: 'Prospect',
    currentObjective: 'Initial contact and introduction.',
  },
  {
    id: '4',
    name: 'Global Net',
    owner: 'Jane Doe',
    category: 'Logistics',
    stage: 'Closed-Won',
    currentObjective: 'Project kickoff.',
  },
   {
    id: '5',
    name: 'Marketing Pro',
    owner: 'You',
    category: 'Marketing',
    stage: 'Prospect',
    currentObjective: 'Schedule discovery call.',
  },
];

export const tasks: Task[] = [
  {
    id: 'T1',
    title: 'Follow up with Innovate Inc.',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '1',
    clientName: 'Innovate Inc.',
  },
  {
    id: 'T2',
    title: 'Prepare Synergy Corp. contract',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '2',
    clientName: 'Synergy Corp.',
  },
  {
    id: 'T3',
    title: 'Send initial email to Solutions LLC',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '3',
    clientName: 'Solutions LLC',
  },
  {
    id: 'T4',
    title: 'Schedule project kickoff with Global Net',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '4',
    clientName: 'Global Net',
  },
   {
    id: 'T5',
    title: 'Review old client files',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    status: 'Completada',
    clientId: '2',
    clientName: 'Synergy Corp.',
  },
];

export const documents: Document[] = [
  { id: 'D1', name: 'Innovate_Proposal_v1.pdf', type: 'Propuesta', uploadedAt: new Date(), clientId: '1' },
  { id: 'D2', name: 'Synergy_MSA.docx', type: 'Contrato', uploadedAt: new Date(), clientId: '2' },
];

export const notes: Note[] = [
  { id: 'N1', content: 'Initial call went well, they are interested in our premium package.', text: 'Initial call went well, they are interested in our premium package.', createdAt: new Date(), clientId: '1' },
  { id: 'N2', content: 'Client is reviewing the contract. Waiting for feedback on section 3.2.', text: 'Client is reviewing the contract. Waiting for feedback on section 3.2.', createdAt: new Date(), clientId: '2' },
];

export const bookings: Reservation[] = [
    { id: 'B1', clientName: 'Innovate Inc.', date: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], clientId: '1', type: 'Cita', time: '10:00', details: 'Follow-up call', status: 'Confirmada' },
    { id: 'B2', clientName: 'Synergy Corp.', date: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], clientId: '2', type: 'Cita', time: '14:30', details: 'Contract Review', status: 'Confirmada' },
];
