

import type { Client, Task, Document, Note, WorkflowStage, NavItem, Promoter, ServiceWorkflow, SubService } from './types';

export const serviceWorkflows: ServiceWorkflow[] = [
  {
    id: 'service-1',
    name: 'Asesoría de Crédito Empresarial',
    description: 'Servicio completo para la obtención y gestión de créditos para empresas.',
    clientRequirements: [
      { id: 'req-1', text: 'Acta Constitutiva' },
      { id: 'req-2', text: 'Últimas 3 declaraciones de impuestos' },
    ],
    subServices: [
      {
        id: 'sub-1-1',
        name: 'Análisis y Diagnóstico',
        stages: [
          {
            id: 's1-st1', title: 'Recopilación de Documentos', order: 1,
            actions: [
              { id: 's1-st1-obj1', title: 'Verificar recepción de todos los documentos', dueDays: 1, order: 1, subActions: [] },
              { id: 's1-st1-obj2', title: 'Digitalizar y clasificar documentación', dueDays: 2, order: 2, subActions: [] },
            ]
          },
          {
            id: 's1-st2', title: 'Análisis Financiero', order: 2,
            actions: [
              { id: 's1-st2-obj1', title: 'Realizar análisis de ratios financieros', dueDays: 3, order: 1, subActions: [] },
            ]
          },
        ]
      },
      {
        id: 'sub-1-2',
        name: 'Gestión con Bancos',
        stages: [
          {
            id: 's1-st3', title: 'Envío de Solicitudes', order: 3,
            actions: [
              { id: 's1-st3-obj1', title: 'Enviar solicitud a 3 bancos principales', dueDays: 1, order: 1, subActions: [] },
            ]
          },
          {
            id: 's1-st4', title: 'Negociación', order: 4,
            actions: [
              { id: 's1-st4-obj2', title: 'Negociar tasas con ejecutivo bancario', dueDays: 7, order: 2, subActions: [] },
              { id: 's1-st4-obj3', title: 'Confirmar oferta de crédito con cliente', dueDays: 1, order: 3, subActions: [] },
            ]
          },
        ]
      }
    ]
  },
  {
    id: 'service-2',
    name: 'Gestión Patrimonial',
    description: 'Asesoramiento para la inversión y crecimiento de capital.',
    clientRequirements: [],
    subServices: [
      {
        id: 'sub-2-1',
        name: 'Perfil de Riesgo',
        stages: [
          {
            id: 's2-st1', title: 'Entrevista Inicial', order: 1,
            actions: [
              { id: 's2-st1-obj2', title: 'Aplicar cuestionario de perfil de inversionista', dueDays: 0, order: 2, subActions: [] },
            ]
          },
          {
            id: 's2-st2', title: 'Definición de Perfil', order: 2,
            actions: [
              { id: 's2-st2-obj1', title: 'Generar reporte de perfil de riesgo', dueDays: 2, order: 1, subActions: [] },
            ]
          },
          {
            id: 's2-st3', title: 'Estrategia de Inversión', order: 3,
            actions: [
              { id: 's2-st3-obj2', title: 'Presentar estrategia de inversión al cliente', dueDays: 3, order: 2, subActions: [] },
            ]
          },
        ]
      }
    ]
  },
  {
    id: 'service-3',
    name: 'Operaciones de Divisas',
    description: 'Servicios de cambio de divisas y cobertura cambiaria.',
    clientRequirements: [],
    subServices: [
      {
        id: 'sub-3-1',
        name: 'General',
        stages: [
          {
            id: 's3-st1', title: 'Alta de Cliente', order: 1,
            actions: [
              { id: 's3-st1-obj1', title: 'Validar identidad (KYC)', dueDays: 1, order: 1, subActions: [] },
            ]
          },
          {
            id: 's3-st2', title: 'Depósito Inicial', order: 2,
            actions: [
              { id: 's3-st2-obj2', title: 'Confirmar recepción de fondos', dueDays: 0, order: 2, subActions: [] },
            ]
          },
          {
            id: 's3-st3', title: 'Operación Activa', order: 3,
            actions: [
              { id: 's3-st3-obj3', title: 'Realizar primera operación de cambio', dueDays: 1, order: 3, subActions: [] },
            ]
          },
        ]
      }
    ]
  },
  {
    id: 'service-terminales-1',
    name: 'Terminales',
    description: '',
    clientRequirements: [],
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
    { href: '/settings', label: 'Contabilidad', icon: 'DollarSign', requiredPermission: 'admin_view' },
    { href: '/finances', label: 'Finanzas', icon: 'Landmark', requiredPermission: 'finances_view' },
];
