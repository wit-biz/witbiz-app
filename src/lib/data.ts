
import type { Client, Task, Document, Note, Reservation, WorkflowStage, NavItem } from './types';

export const workflowStages: WorkflowStage[] = [
  { id: 'stage-1', title: 'Prospecto', order: 1, objectives: [] },
  { id: 'stage-2', title: 'Cualificación', order: 2, objectives: [] },
  { id: 'stage-3', title: 'Negociación', order: 3, objectives: [] },
  { id: 'stage-4', title: 'Cierre', order: 4, objectives: [] },
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'Innovate Inc.',
    owner: 'Tú',
    category: 'Tecnología',
    stage: 'Cualificación',
    currentObjective: 'Análisis completo de necesidades técnicas.',
  },
  {
    id: '2',
    name: 'Synergy Corp.',
    owner: 'Alex Smith',
    category: 'Finanzas',
    stage: 'Negociación',
    currentObjective: 'Finalizar precios y términos del contrato.',
  },
  {
    id: '3',
    name: 'Solutions LLC',
    owner: 'Tú',
    category: 'Salud',
    stage: 'Prospecto',
    currentObjective: 'Contacto inicial e introducción.',
  },
  {
    id: '4',
    name: 'Global Net',
    owner: 'Jane Doe',
    category: 'Logística',
    stage: 'Cierre',
    currentObjective: 'Inicio del proyecto.',
  },
   {
    id: '5',
    name: 'Marketing Pro',
    owner: 'Tú',
    category: 'Marketing',
    stage: 'Prospecto',
    currentObjective: 'Agendar llamada de descubrimiento.',
  },
];

export const tasks: Task[] = [
  {
    id: 'T1',
    title: 'Seguimiento con Innovate Inc.',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '1',
    clientName: 'Innovate Inc.',
  },
  {
    id: 'T2',
    title: 'Preparar contrato de Synergy Corp.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '2',
    clientName: 'Synergy Corp.',
  },
  {
    id: 'T3',
    title: 'Enviar email inicial a Solutions LLC',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '3',
    clientName: 'Solutions LLC',
  },
  {
    id: 'T4',
    title: 'Agendar inicio de proyecto con Global Net',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '4',
    clientName: 'Global Net',
  },
   {
    id: 'T5',
    title: 'Revisar archivos de cliente antiguo',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    status: 'Completada',
    clientId: '2',
    clientName: 'Synergy Corp.',
  },
];

export const documents: Document[] = [
  { id: 'D1', name: 'Innovate_Propuesta_v1.pdf', type: 'Propuesta', uploadedAt: new Date(), clientId: '1' },
  { id: 'D2', name: 'Synergy_MSA.docx', type: 'Contrato', uploadedAt: new Date(), clientId: '2' },
];

export const notes: Note[] = [
  { id: 'N1', content: 'La llamada inicial fue bien, están interesados en nuestro paquete premium.', text: 'La llamada inicial fue bien, están interesados en nuestro paquete premium.', createdAt: new Date(), clientId: '1' },
  { id: 'N2', content: 'El cliente está revisando el contrato. Esperando comentarios sobre la sección 3.2.', text: 'El cliente está revisando el contrato. Esperando comentarios sobre la sección 3.2.', createdAt: new Date(), clientId: '2' },
];

export const bookings: Reservation[] = [
    { id: 'B1', clientName: 'Innovate Inc.', date: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], clientId: '1', type: 'Cita', time: '10:00', details: 'Llamada de seguimiento', status: 'Confirmada' },
    { id: 'B2', clientName: 'Synergy Corp.', date: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], clientId: '2', type: 'Cita', time: '14:30', details: 'Revisión de contrato', status: 'Confirmada' },
];

export const navItems: NavItem[] = [
    { href: '/', label: 'Inicio', icon: 'LayoutDashboard', exactMatch: true, requiredPermission: 'dashboard' },
    { href: '/contacts', label: 'Directorio de usuarios', icon: 'Users', requiredPermission: 'clients_view' },
    { href: '/tasks', label: 'Tareas', icon: 'ListTodo', requiredPermission: 'tasks_view' },
    { href: '/bookings', label: 'Reservaciones', icon: 'Calendar', requiredPermission: 'reservations_view' },
    { href: '/crm', label: 'CRM', icon: 'Workflow', requiredPermission: 'crm_view' },
    { href: '/audit', label: 'Auditoría', icon: 'Scale', requiredPermission: 'audit_view' },
    { href: '/settings', label: 'Administración', icon: 'Shield', requiredPermission: 'admin_view' },
];



