
import type { Client, Task, Document, Note, WorkflowStage, NavItem, Promoter, ServiceWorkflow, SubService, AppUser, Supplier } from './types';
import { addDays, format, subDays } from 'date-fns';
import { Trash2 } from 'lucide-react';

export const teamMembers: AppUser[] = [
    { id: '1', name: 'Andrea Admin', email: 'admin@witbiz.com', role: 'Administrador', photoURL: 'https://picsum.photos/seed/1/40/40' },
    { id: '2', name: 'Carla Collaborator', email: 'carla@witbiz.com', role: 'Colaborador', photoURL: 'https://picsum.photos/seed/2/40/40' },
];

export const serviceWorkflows: ServiceWorkflow[] = [
  {
    id: 'estimulos-fiscales',
    name: 'Estímulos Fiscales',
    order: 1,
    status: 'Activo',
    stages: [
      {
        id: 'ef-prospecto',
        title: 'Prospecto',
        order: 1,
        actions: [
          { id: 'ef-prospecto-1', title: 'Cual servicio le interesa al cliente', order: 1, subActions: [], requiresInput: true },
          { id: 'ef-prospecto-2', title: 'Agendar reunión', order: 2, subActions: [] },
        ],
        subStages: [],
      },
      {
        id: 'ef-propuesta',
        title: 'Propuesta y Negociación',
        order: 2,
        actions: [
          { id: 'ef-propuesta-1', title: 'Solicitud de propuesta', order: 1, subActions: [] },
          { id: 'ef-propuesta-2', title: 'Reunión con el cliente para explicación de propuesta', order: 2, subActions: [] },
          { id: 'ef-propuesta-3', title: 'Cual fue la negociación del cierre', order: 3, subActions: [], requiresInput: true },
        ],
        subStages: [],
      },
      {
        id: 'ef-onboarding',
        title: 'Onboarding',
        order: 3,
        actions: [
          { id: 'ef-onboarding-1', title: 'Alta del cliente', order: 1, subActions: [] },
          { id: 'ef-onboarding-2', title: 'Check list de documentos – Persona Moral', order: 2, subActions: [], requiredDocumentForCompletion: true, requiredDocuments: [
              {id: 'doc-ef-pm-1', description: 'Acta constitutiva'}, 
              {id: 'doc-ef-pm-2', description: 'Poder Notarial'}, 
              {id: 'doc-ef-pm-3', description: 'Constancia de situación fiscal'}, 
              {id: 'doc-ef-pm-4', description: 'Identificación de Representante Legal'}, 
              {id: 'doc-ef-pm-5', description: 'Comprobante de Domicilio'}, 
              {id: 'doc-ef-pm-6', description: 'La vista previa de la declaración correspondiente'}, 
              {id: 'doc-ef-pm-7', description: 'El correo electrónico de la empresa que se tiene dado de alta ante el SAT para recibir notificaciones'}, 
              {id: 'doc-ef-pm-8', description: 'La CIEC de la empresa'}
          ] },
          { id: 'ef-onboarding-3', title: 'Check list de documentos – Persona Física', order: 3, subActions: [], requiredDocumentForCompletion: true, requiredDocuments: [
              {id: 'doc-ef-pf-1', description: 'Identificación oficial vigente'}, 
              {id: 'doc-ef-pf-2', description: 'Constancia de situación fiscal'}, 
              {id: 'doc-ef-pf-3', description: 'CURP'}, {id: 'doc-ef-pf-4', description: 'Comprobante de Domicilio'}, 
              {id: 'doc-ef-pf-5', description: 'La vista previa de la declaración correspondiente'}, 
              {id: 'doc-ef-pf-6', description: 'El correo electrónico de la empresa que se tiene dado de alta ante el SAT para recibir notificaciones'}, 
              {id: 'doc-ef-pf-7', description: 'La CIEC de la empresa'}
          ] },
        ],
        subStages: [],
      },
      {
        id: 'ef-ejecucion',
        title: 'Proyecto en Ejecución',
        order: 4,
        actions: [
          { id: 'ef-ejecucion-1', title: 'Solicitud de contratos', order: 1, subActions: [] },
          { id: 'ef-ejecucion-2', title: 'Envío de contrato para firma', order: 2, subActions: [] },
          { id: 'ef-ejecucion-3', title: 'Recepción de contratos firmados', order: 3, subActions: [] },
          { id: 'ef-ejecucion-4', title: 'Solicitud de facturas', order: 4, subActions: [] },
          { id: 'ef-ejecucion-5', title: 'Entrega de facturas', order: 5, subActions: [] },
          { id: 'ef-ejecucion-6', title: 'Solicitud de escrito de asunción de responsabilidad solidaria', order: 6, subActions: [] },
          { id: 'ef-ejecucion-7', title: 'Entrega de escrito de asunción de responsabilidad solidaria', order: 7, subActions: [] },
          { id: 'ef-ejecucion-8', title: 'Recepción de comprobantes de pago', order: 8, subActions: [] },
          { id: 'ef-ejecucion-9', title: 'Entrega de comprobantes de pago', order: 9, subActions: [] },
          { id: 'ef-ejecucion-10', title: 'Solicitud de expediente', order: 10, subActions: [] },
          { id: 'ef-ejecucion-11', title: 'Entrega de expediente', order: 11, subActions: [] },
        ],
        subStages: [],
      },
      {
        id: 'ef-expansion',
        title: 'Desarrollo y Expansión',
        order: 5,
        actions: [
          { id: 'ef-expansion-1', title: 'Proponer nuevos servicios al cliente', order: 1, subActions: [], requiresInput: true },
        ],
        subStages: [],
      },
      {
        id: 'ef-cierre',
        title: 'Cierre y Renovación',
        order: 6,
        actions: [
          { id: 'ef-cierre-1', title: 'Registrar y cerrar formalmente la relación', order: 1, subActions: [] },
        ],
        subStages: [],
      },
    ],
  },
  {
    id: 'facturacion',
    name: 'Facturación',
    order: 2,
    status: 'Activo',
    stages: [
      {
        id: 'f-prospecto',
        title: 'Prospecto',
        order: 1,
        actions: [
          { id: 'f-prospecto-1', title: 'Cual servicio le interesa al cliente', order: 1, subActions: [], requiresInput: true },
          { id: 'f-prospecto-2', title: 'Agendar reunión', order: 2, subActions: [] },
        ],
        subStages: [],
      },
      {
        id: 'f-propuesta',
        title: 'Propuesta y Negociación',
        order: 2,
        actions: [
          { id: 'f-propuesta-1', title: 'Cual fue la negociación del cierre', order: 1, subActions: [], requiresInput: true },
        ],
        subStages: [],
      },
      {
        id: 'f-onboarding',
        title: 'Onboarding',
        order: 3,
        actions: [
          { id: 'f-onboarding-1', title: 'Alta del cliente', order: 1, subActions: [] },
          { id: 'f-onboarding-2', title: 'Recopilar documentos generales para contrato (Opcional)', order: 2, subActions: [], requiredDocumentForCompletion: true, requiredDocuments: [
              {id: 'doc-fact-pm-1', description: 'Acta constitutiva (Persona Moral)'},
              {id: 'doc-fact-pm-2', description: 'Poder Notarial (Persona Moral)'},
              {id: 'doc-fact-pm-3', description: 'Identificación de Representante Legal (Persona Moral)'},
              {id: 'doc-fact-pm-4', description: 'Comprobante de Domicilio (Persona Moral)'},
              {id: 'doc-fact-pf-1', description: 'Identificación oficial vigente (Persona Física)'},
              {id: 'doc-fact-pf-2', description: 'CURP (Persona Física)'},
              {id: 'doc-fact-pf-3', description: 'Comprobante de Domicilio (Persona Física)'},
          ]},
          { id: 'f-onboarding-3', title: 'Recopilar Constancia de Situación Fiscal (Obligatorio)', order: 3, subActions: [], requiredDocumentForCompletion: true, requiredDocuments: [{id: 'doc-fact-csf', description: 'Constancia de Situación Fiscal'}] },
          { id: 'f-onboarding-4', title: 'Recopilar Concepto de facturación sugerido (Obligatorio)', order: 4, subActions: [], requiredDocumentForCompletion: true, requiredDocuments: [{id: 'doc-fact-concepto', description: 'Concepto de facturación sugerido'}] },
        ],
        subStages: [],
      },
      {
        id: 'f-ejecucion',
        title: 'Proyecto en Ejecución',
        order: 4,
        actions: [
          { id: 'f-ejecucion-1', title: 'Solicitud de contratos. (Depende del cliente)', order: 1, subActions: [] },
          { id: 'f-ejecucion-2', title: 'Envío de contrato para firma', order: 2, subActions: [] },
          { id: 'f-ejecucion-3', title: 'Recepción de contratos firmados', order: 3, subActions: [] },
          { id: 'f-ejecucion-4', title: 'Solicitud de facturas', order: 4, subActions: [] },
          { id: 'f-ejecucion-5', title: 'Entrega de facturas', order: 5, subActions: [] },
          { id: 'f-ejecucion-6', title: 'Recepción de comprobantes de pago', order: 6, subActions: [] },
          { id: 'f-ejecucion-7', title: 'Entrega de comprobante de pago', order: 7, subActions: [] },
          { id: 'f-ejecucion-8', title: 'Modo de retorno. (efectivo, transferencia,etc)', order: 8, subActions: [], requiresInput: true },
        ],
        subStages: [],
      },
      {
        id: 'f-expansion',
        title: 'Desarrollo y Expansión de la Cuenta',
        order: 5,
        actions: [
          { id: 'f-expansion-1', title: 'Proponer nuevos servicios al cliente', order: 1, subActions: [], requiresInput: true },
        ],
        subStages: [],
      },
      {
        id: 'f-cierre',
        title: 'Cierre y Renovación',
        order: 6,
        actions: [
          { id: 'f-cierre-1', title: 'Registrar y cerrar formalmente la relación. (En caso de que ya no trabaje con Wit)', order: 1, subActions: [] },
        ],
        subStages: [],
      },
    ],
  },
];


export const clients: Client[] = [];
export const tasks: Task[] = [];
export const documents: Document[] = [];
export const promoters: Promoter[] = [];
export const suppliers: Supplier[] = [];
export const notes: Note[] = [];

export const navItems: NavItem[] = [
    { href: '/', label: 'Inicio', icon: 'LayoutDashboard', exactMatch: true, requiredPermission: 'dashboard' },
    { href: '/contacts', label: 'Base de Datos', icon: 'Database', requiredPermission: 'clients_view' },
    { href: '/tasks', label: 'Tareas', icon: 'ListTodo', requiredPermission: 'tasks_view' },
    { href: '/crm', label: 'CRM', icon: 'Workflow', requiredPermission: 'crm_view' },
    { href: '/services', label: 'Servicios', icon: 'Briefcase', requiredPermission: 'services_view' },
    { href: '/settings', label: 'Contabilidad', icon: 'DollarSign', requiredPermission: 'admin_view' },
    { href: '/finances', label: 'Centro de inteligencia', icon: 'BarChartIcon', requiredPermission: 'finances_view' },
];
