import type { Client, Task, Document, Note, Booking, WorkflowStage } from './types';

export const workflowStages: WorkflowStage[] = [
  'Prospect',
  'Qualification',
  'Negotiation',
  'Closed-Won',
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
    dueDate: new Date(),
    status: 'To-Do',
    clientId: '1',
    clientName: 'Innovate Inc.',
  },
  {
    id: 'T2',
    title: 'Prepare Synergy Corp. contract',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    status: 'In Progress',
    clientId: '2',
    clientName: 'Synergy Corp.',
  },
  {
    id: 'T3',
    title: 'Send initial email to Solutions LLC',
    dueDate: new Date(),
    status: 'To-Do',
    clientId: '3',
    clientName: 'Solutions LLC',
  },
  {
    id: 'T4',
    title: 'Schedule project kickoff with Global Net',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
    status: 'Overdue',
    clientId: '4',
    clientName: 'Global Net',
  },
   {
    id: 'T5',
    title: 'Review old client files',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    status: 'Done',
    clientId: '2',
    clientName: 'Synergy Corp.',
  },
];

export const documents: Document[] = [
  { id: 'D1', name: 'Innovate_Proposal_v1.pdf', type: 'Proposal', uploadedAt: new Date(), clientId: '1' },
  { id: 'D2', name: 'Synergy_MSA.docx', type: 'Contract', uploadedAt: new Date(), clientId: '2' },
];

export const notes: Note[] = [
  { id: 'N1', content: 'Initial call went well, they are interested in our premium package.', createdAt: new Date(), clientId: '1' },
  { id: 'N2', content: 'Client is reviewing the contract. Waiting for feedback on section 3.2.', createdAt: new Date(), clientId: '2' },
];

export const bookings: Booking[] = [
    { id: 'B1', title: 'Follow-up Call with Innovate Inc.', date: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), clientId: '1' },
    { id: 'B2', title: 'Contract Review with Synergy Corp.', date: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000), clientId: '2' },
];

// Remove old unused data
// Keep this file clean
