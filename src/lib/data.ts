

import type { Client, Task, Document, Note, WorkflowStage, NavItem, Promoter, ServiceWorkflow, SubService, AppUser } from './types';
import { addDays, format, subDays } from 'date-fns';

export const teamMembers: AppUser[] = [
    { id: 'user-1', name: 'Admin User', email: 'admin@witbiz.com', role: 'Director', photoURL: 'https://picsum.photos/seed/99/40/40' },
    { id: 'user-2', name: 'Carla Collaborator', email: 'carla@witbiz.com', role: 'Colaborador', photoURL: 'https://picsum.photos/seed/2/40/40' },
    { id: 'user-3', name: 'Andrea Admin', email: 'andrea@witbiz.com', role: 'Administrador', photoURL: 'https://picsum.photos/seed/1/40/40' },
];

export const serviceWorkflows: ServiceWorkflow[] = [
  {
    id: 'service-terminales-1',
    name: 'Terminales',
    description: 'Proceso para la venta e instalación de terminales de punto de venta.',
    clientRequirements: [{id: 'req-1', text: 'Acta constitutiva'}, {id: 'req-2', text: 'Comprobante de domicilio'}],
    commissions: [
        {id: 'com-1', name: 'Visa/Mastercard Débito', rate: 1.5},
        {id: 'com-2', name: 'Visa/Mastercard Crédito', rate: 2.5},
        {id: 'com-3', name: 'American Express', rate: 3.5},
    ],
    subServices: []
  }
];

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
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st2', currentActionId: 's1-st2-obj1',
  },
  {
    id: '2', name: 'Synergy Corp.', owner: 'Juan Carlos Bodoque', category: 'Finanzas',
    subscribedServiceIds: ['service-2'], currentWorkflowStageId: 's2-st1', currentActionId: 's2-st1-obj2',
  },
  {
    id: '3', name: 'Solutions LLC', owner: 'Mariana Fernandez', category: 'Salud',
    subscribedServiceIds: ['service-3'], currentWorkflowStageId: 's3-st1', currentActionId: 's3-st1-obj1',
  },
  {
    id: '4', name: 'Global Net', owner: 'Sofía Rodriguez', category: 'Logística',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st4', currentActionId: 's1-st4-obj2',
  },
  {
    id: '5', name: 'Marketing Pro', owner: 'Carla Santamaria', category: 'Marketing',
    subscribedServiceIds: ['service-3'], currentWorkflowStageId: 's3-st3', currentActionId: 's3-st3-obj3',
  },
  {
    id: '6', name: 'QuantumLeap', owner: 'Sofía Rodriguez', category: 'Investigación',
    subscribedServiceIds: ['service-2'], currentWorkflowStageId: 's2-st2', currentActionId: 's2-st2-obj1',
  },
  {
    id: '7', name: 'Nexus Enterprises', owner: 'Mariana Fernandez', category: 'Retail',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st3', currentActionId: 's1-st3-obj1',
  },
  {
    id: '8', name: 'BioGen', owner: 'Juan Carlos Bodoque', category: 'Biotecnología',
    subscribedServiceIds: ['service-2'], currentWorkflowStageId: 's2-st3', currentActionId: 's2-st3-obj2',
  },
  {
    id: '9', name: 'AeroDynamics', owner: 'Carla Santamaria', category: 'Aeroespacial',
    subscribedServiceIds: ['service-1'], currentWorkflowStageId: 's1-st4', currentActionId: 's1-st4-obj3',
  },
  {
    id: '10', name: 'EcoBuild', owner: 'Mariana Fernandez', category: 'Construcción',
    subscribedServiceIds: ['service-3'], currentWorkflowStageId: 's3-st2', currentActionId: 's3-st2-obj2',
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
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
  {
    id: 'T2',
    title: 'Preparar contrato de Synergy Corp.',
    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    status: 'Pendiente',
    clientId: '2',
    clientName: 'Synergy Corp.',
    description: 'Revisión final del contrato antes de enviarlo.',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
  {
    id: 'T3',
    title: 'Enviar email inicial a Solutions LLC',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    clientId: '3',
    clientName: 'Solutions LLC',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
  {
    id: 'T4',
    title: 'Agendar inicio de proyecto con Global Net',
    dueDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    status: 'Pendiente',
    clientId: '4',
    clientName: 'Global Net',
    type: 'Cita',
    dueTime: '14:30',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
   {
    id: 'T5',
    title: 'Revisar archivos de cliente antiguo',
    dueDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    status: 'Completada',
    clientId: '2',
    clientName: 'Synergy Corp.',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
  {
    id: 'T6',
    title: 'Analizar competencia de Marketing Pro',
    dueDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    status: 'Pospuesta',
    postponedAt: format(subDays(new Date(), 4), 'yyyy-MM-dd'),
    reactivationDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    postponedReason: 'En espera de informe de mercado.',
    clientId: '5',
    clientName: 'Marketing Pro',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
  {
    id: 'T7',
    title: 'Definir KPIs para QuantumLeap',
    dueDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    status: 'Pospuesta',
    postponedAt: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    reactivationDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    postponedReason: 'El cliente está de vacaciones, se retoma al regreso.',
    clientId: '6',
    clientName: 'QuantumLeap',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
   {
    id: 'T8',
    title: 'Validar documentación legal de Nexus',
    dueDate: format(subDays(new Date(), 22), 'yyyy-MM-dd'),
    status: 'Pospuesta',
    postponedAt: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    reactivationDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    postponedReason: 'Falta documentación por parte del cliente.',
    clientId: '7',
    clientName: 'Nexus Enterprises',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
  },
  {
    id: 'T9',
    title: 'Investigación de patentes para BioGen',
    dueDate: format(subDays(new Date(), 35), 'yyyy-MM-dd'),
    status: 'Pospuesta',
    postponedAt: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    reactivationDate: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
    postponedReason: 'Proceso de alta complejidad, requiere más tiempo del estimado.',
    clientId: '8',
    clientName: 'BioGen',
    type: 'Tarea',
    assignedToId: 'user-1',
    assignedToName: 'Admin User',
    assignedToPhotoURL: 'https://picsum.photos/seed/99/40/40',
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
    { href: '/settings', label: 'Contabilidad', icon: 'DollarSign', requiredPermission: 'admin_view' },
    { href: '/finances', label: 'Finanzas', icon: 'Landmark', requiredPermission: 'finances_view' },
];
