

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
    stages: [
        {
            id: 's1-st1', title: 'Prospecto', order: 1, actions: [
                { id: 's1-st1-obj1', title: 'Enviar correo de bienvenida', order: 1, subActions: [] },
                { id: 's1-st1-obj2', title: 'Agendar llamada inicial', order: 2, subActions: [] }
            ],
            subStages: []
        },
        {
            id: 's1-st2', title: 'Contacto Inicial', order: 2, actions: [
                { id: 's1-st2-obj1', title: 'Realizar llamada de descubrimiento', order: 1, subActions: [] }
            ],
            subStages: []
        },
        {
            id: 's1-st3', title: 'Propuesta', order: 3, actions: [
                { id: 's1-st3-obj1', title: 'Preparar y enviar propuesta', order: 1, subActions: [] },
                { id: 's1-st3-obj2', title: 'Agendar reunión de revisión de propuesta', order: 2, subActions: [] }
            ],
            subStages: []
        },
        {
            id: 's1-st4', title: 'Cierre', order: 4, actions: [
                { id: 's1-st4-obj1', title: 'Recibir contrato firmado', order: 1, requiredDocumentForCompletion: true, requiredDocuments: [{id: 'doc-req-1', description: 'Contrato firmado'}] },
                { id: 's1-st4-obj2', title: 'Enviar factura inicial', order: 2, subActions: [] },
                { id: 's1-st4-obj3', title: 'Coordinar instalación', order: 3, subActions: [] }
            ],
            subStages: []
        }
    ],
    subServices: []
  },
  {
    id: 'service-credito-2',
    name: 'Crédito Empresarial',
    description: 'Gestión y asesoría para la obtención de créditos para empresas.',
    clientRequirements: [{id: 'req-3', text: 'Estados financieros de los últimos 2 años'}, {id: 'req-4', text: 'Declaración de impuestos'}],
    commissions: [{id: 'com-4', name: 'Comisión por éxito', rate: 5}],
    stages: [
        { 
            id: 's2-st1', title: 'Análisis Preliminar', order: 1,
            actions: [
                { id: 's2-st1-obj1', title: 'Recopilar documentación inicial', order: 1, requiredDocumentForCompletion: true, requiredDocuments: [{id: 'doc-req-2', description: 'Acta constitutiva'}] },
                { id: 's2-st1-obj2', title: 'Evaluar viabilidad del crédito', order: 2, subActions: [] }
            ],
            subStages: [
                { 
                    id: 's2-st1-sst1', title: 'Revisión de Buró', order: 1, actions: [],
                    subSubStages: []
                },
            ]
        },
        {
            id: 's2-st2', title: 'Armado de Expediente', order: 2,
            actions: [
                { id: 's2-st2-obj1', title: 'Completar expediente para banco', order: 1, subActions: [] }
            ],
            subStages: []
        },
        {
            id: 's2-st3', title: 'Seguimiento con Banco', order: 3,
            actions: [
                { id: 's2-st3-obj1', title: 'Llamada semanal de seguimiento', order: 1, subActions: [] },
                { id: 's2-st3-obj2', title: 'Notificar al cliente sobre avances', order: 2, subActions: [] }
            ],
            subStages: []
        }
    ],
    subServices: []
  },
  {
      id: 'service-divisas-3',
      name: 'Operaciones con Divisas',
      description: 'Asesoría y ejecución de operaciones de cambio de divisas para empresas.',
      clientRequirements: [{id: 'req-5', text: 'Cuenta en dólares y moneda local'}],
      commissions: [{id: 'com-5', name: 'Spread por operación', rate: 0.5}],
      stages: [
          {
              id: 's3-st1', title: 'Alta de Cliente', order: 1, actions: [
                  { id: 's3-st1-obj1', title: 'Verificar identidad del cliente (KYC)', order: 1, subActions: [] }
              ],
              subStages: []
          },
          {
              id: 's3-st2', title: 'Preparación de Operación', order: 2, actions: [
                   { id: 's3-st2-obj1', title: 'Análisis de mercado cambiario', order: 1, subActions: [] },
                   { id: 's3-st2-obj2', title: 'Confirmar tipo de cambio con cliente', order: 2, subActions: [] }
              ],
              subStages: []
          },
           {
              id: 's3-st3', title: 'Ejecución y Cierre', order: 3, actions: [
                  { id: 's3-st3-obj3', title: 'Ejecutar operación en mercado', order: 1, subActions: [] },
                  { id: 's3-st3-obj4', title: 'Enviar confirmación de operación al cliente', order: 2, subActions: [] }
              ],
              subStages: []
           }
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
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st2', currentActionId: 's1-st2-obj1',
  },
  {
    id: '2', name: 'Synergy Corp.', owner: 'Juan Carlos Bodoque', category: 'Finanzas',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st1', currentActionId: 's2-st1-obj2',
  },
  {
    id: '3', name: 'Solutions LLC', owner: 'Mariana Fernandez', category: 'Salud',
    subscribedServiceIds: ['service-divisas-3'], currentWorkflowStageId: 's3-st1', currentActionId: 's3-st1-obj1',
  },
  {
    id: '4', name: 'Global Net', owner: 'Sofía Rodriguez', category: 'Logística',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st4', currentActionId: 's1-st4-obj2',
  },
  {
    id: '5', name: 'Marketing Pro', owner: 'Carla Santamaria', category: 'Marketing',
    subscribedServiceIds: ['service-divisas-3'], currentWorkflowStageId: 's3-st3', currentActionId: 's3-st3-obj3',
  },
  {
    id: '6', name: 'QuantumLeap', owner: 'Sofía Rodriguez', category: 'Investigación',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st2', currentActionId: 's2-st2-obj1',
  },
  {
    id: '7', name: 'Nexus Enterprises', owner: 'Mariana Fernandez', category: 'Retail',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st3', currentActionId: 's1-st3-obj1',
  },
  {
    id: '8', name: 'BioGen', owner: 'Juan Carlos Bodoque', category: 'Biotecnología',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st3', currentActionId: 's2-st3-obj2',
  },
  {
    id: '9', name: 'AeroDynamics', owner: 'Carla Santamaria', category: 'Aeroespacial',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st4', currentActionId: 's1-st4-obj3',
  },
  {
    id: '10', name: 'EcoBuild', owner: 'Mariana Fernandez', category: 'Construcción',
    subscribedServiceIds: ['service-divisas-3'], currentWorkflowStageId: 's3-st2', currentActionId: 's3-st2-obj2',
  },
  {
    id: '11', name: 'AlphaStream', owner: 'Juan Carlos Bodoque', category: 'Entretenimiento',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st1', currentActionId: 's1-st1-obj1',
  },
  {
    id: '12', name: 'Zenith Real Estate', owner: 'Sofía Rodriguez', category: 'Inmobiliaria',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st1', currentActionId: 's2-st1-obj2',
  },
  {
    id: '13', name: 'Starlight Foods', owner: 'Carla Santamaria', category: 'Alimentos',
    subscribedServiceIds: ['service-divisas-3'], currentWorkflowStageId: 's3-st2', currentActionId: 's3-st2-obj1',
  },
  {
    id: '14', name: 'Meridian Shipping', owner: 'Mariana Fernandez', category: 'Transporte',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st3', currentActionId: 's1-st3-obj2',
  },
  {
    id: '15', name: 'Vertex Software', owner: 'Juan Carlos Bodoque', category: 'Tecnología',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st3', currentActionId: 's2-st3-obj1',
  },
  {
    id: '16', name: 'Phoenix Holdings', owner: 'Sofía Rodriguez', category: 'Inversiones',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st1',
  },
  {
    id: '17', name: 'Momentum Dynamics', owner: 'Carla Santamaria', category: 'Ingeniería',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st2',
  },
  {
    id: '18', name: 'Horizon Labs', owner: 'Mariana Fernandez', category: 'Investigación',
    subscribedServiceIds: ['service-divisas-3'], currentWorkflowStageId: 's3-st1',
  },
  {
    id: '19', name: 'Evergreen Organics', owner: 'Juan Carlos Bodoque', category: 'Agricultura',
    subscribedServiceIds: ['service-terminales-1'], currentWorkflowStageId: 's1-st1',
  },
  {
    id: '20', name: 'Pinnacle Arch', owner: 'Sofía Rodriguez', category: 'Arquitectura',
    subscribedServiceIds: ['service-credito-2'], currentWorkflowStageId: 's2-st2',
  }
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
  { id: 'D3', name: 'Recurso_Terminales.pdf', type: 'Descargable', uploadedAt: new Date(), serviceId: 'service-terminales-1' },
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
