

import type { Client, Task, Document, Note, WorkflowStage, NavItem, Promoter, ServiceWorkflow } from './types';

export const serviceWorkflows: ServiceWorkflow[] = [];

export const promoters: Promoter[] = [
    { id: 'p1', name: 'Mariana Fernandez', referredClients: 5, totalCommissions: 1250.50, status: 'Activo' },
    { id: 'p2', name: 'Juan Carlos Bodoque', referredClients: 3, totalCommissions: 850.00, status: 'Activo' },
    { id: 'p3', name: 'Sofía Rodriguez', referredClients: 8, totalCommissions: 2100.75, status: 'Activo' },
    { id: 'p4', name: 'Pedro Pascal', referredClients: 1, totalCommissions: 150.00, status: 'Inactivo' },
    { id: 'p5', name: 'Carla Santamaria', referredClients: 12, totalCommissions: 3500.00, status: 'Activo' },
];

export const clients: Client[] = [
  {
    id: '1', name: 'Innovate Inc.', owner: 'Mariana Fernandez', category: 'Tecnología',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st2', currentObjectiveId: 's1-st2-obj1',
  },
  {
    id: '2', name: 'Synergy Corp.', owner: 'Juan Carlos Bodoque', category: 'Finanzas',
    subscribedServiceIds: ['service-2'], currentWorkflowStageId: 's2-st1', currentObjectiveId: 's2-st1-obj2',
  },
  {
    id: '3', name: 'Solutions LLC', owner: 'Mariana Fernandez', category: 'Salud',
    subscribedServiceIds: ['service-3'], currentWorkflowStageId: 's3-st1', currentObjectiveId: 's3-st1-obj1',
  },
  {
    id: '4', name: 'Global Net', owner: 'Sofía Rodriguez', category: 'Logística',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st4', currentObjectiveId: 's1-st4-obj2',
  },
  {
    id: '5', name: 'Marketing Pro', owner: 'Carla Santamaria', category: 'Marketing',
    subscribedServiceIds: ['service-3'], currentWorkflowStageId: 's3-st3', currentObjectiveId: 's3-st3-obj3',
  },
  {
    id: '6', name: 'QuantumLeap', owner: 'Sofía Rodriguez', category: 'Investigación',
    subscribedServiceIds: ['service-2'], currentWorkflowStageId: 's2-st2', currentObjectiveId: 's2-st2-obj1',
  },
  {
    id: '7', name: 'Nexus Enterprises', owner: 'Mariana Fernandez', category: 'Retail',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st3', currentObjectiveId: 's1-st3-obj1',
  },
  {
    id: '8', name: 'BioGen', owner: 'Juan Carlos Bodoque', category: 'Biotecnología',
    subscribedServiceIds: ['service-2'], currentWorkflowStageId: 's2-st3', currentObjectiveId: 's2-st3-obj2',
  },
  {
    id: '9', name: 'AeroDynamics', owner: 'Carla Santamaria', category: 'Aeroespacial',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st4', currentObjectiveId: 's1-st4-obj3',
  },
  {
    id: '10', name: 'EcoBuild', owner: 'Mariana Fernandez', category: 'Construcción',
    subscribedServiceIds: ['service-3'], currentWorkflowStageId: 's3-st2', currentObjectiveId: 's3-st2-obj2',
  },
];


export const tasks: Task[] = [
  {
    id: 'T1',
    title: 'Seguimiento con Innovate Inc.',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    status: 'Pendiente',
    clientId: '1',
    clientName: 'Innovate Inc.',
    description: 'Llamada de seguimiento sobre la propuesta enviada.',
    type: 'Cita',
  },
  {
    id: 'T2',
    title: 'Preparar contrato de Synergy Corp.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '2',
    clientName: 'Synergy Corp.',
    description: 'Revisión final del contrato antes de enviarlo.',
    type: 'Tarea'
  },
  {
    id: 'T3',
    title: 'Enviar email inicial a Solutions LLC',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '3',
    clientName: 'Solutions LLC',
    type: 'Tarea',
  },
  {
    id: 'T4',
    title: 'Agendar inicio de proyecto con Global Net',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '4',
    clientName: 'Global Net',
    type: 'Cita',
    dueTime: '14:30',
  },
   {
    id: 'T5',
    title: 'Revisar archivos de cliente antiguo',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    status: 'Completada',
    clientId: '2',
    clientName: 'Synergy Corp.',
    type: 'Tarea',
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

export const navItems: NavItem[] = [
    { href: '/', label: 'Inicio', icon: 'LayoutDashboard', exactMatch: true, requiredPermission: 'dashboard' },
    { href: '/contacts', label: 'Base de Datos', icon: 'Database', requiredPermission: 'clients_view' },
    { href: '/tasks', label: 'Tareas', icon: 'ListTodo', requiredPermission: 'tasks_view' },
    { href: '/crm', label: 'CRM', icon: 'Workflow', requiredPermission: 'crm_view' },
    { href: '/services', label: 'Servicios', icon: 'Briefcase', requiredPermission: 'services_view' },
    { href: '/settings', label: 'Contabilidad', icon: 'Landmark', requiredPermission: 'admin_view' },
    { href: '/audit', label: 'Auditoría', icon: 'Scale', requiredPermission: 'audit_view' },
];

    
