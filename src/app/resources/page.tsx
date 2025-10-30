import type { Client, Task, Document, Note, WorkflowStage, NavItem, Promoter, ServiceWorkflow } from './types';

export const serviceWorkflows: ServiceWorkflow[] = [
  {
    id: 'service-1',
    name: 'Asesoría de Crédito Empresarial',
    subServices: [
      {
        id: 'sub-service-1-1',
        name: 'Crédito Principal',
        stages: [
          { 
            id: 's1-st1', title: 'Análisis Inicial', order: 1, 
            objectives: [
              { id: 's1-st1-obj1', description: 'Recopilar documentación financiera del cliente (últimos 2 años).', order: 1, subObjectives: [], requiredDocumentForCompletion: 'Informe' },
              { id: 's1-st1-obj2', description: 'Evaluar perfil de riesgo crediticio preliminar.', order: 2, subObjectives: [] },
            ]
          },
          { 
            id: 's1-st2', title: 'Desarrollo de Estrategia', order: 2,
            objectives: [
              { id: 's1-st2-obj1', description: 'Identificar 3-5 opciones de financiamiento viables.', order: 1, subObjectives: [] },
              { id: 's1-st2-obj2', description: 'Preparar propuesta de asesoría y estructura de comisiones.', order: 2, subObjectives: [], requiredDocumentForCompletion: 'Propuesta' },
            ]
          },
          { 
            id: 's1-st3', title: 'Implementación', order: 3,
            objectives: [
              { id: 's1-st3-obj1', description: 'Presentar solicitud de crédito a instituciones financieras.', order: 1, subObjectives: [] },
              { id: 's1-st3-obj2', description: 'Negociar términos y condiciones del crédito.', order: 2, subObjectives: [] },
            ]
          },
          { 
            id: 's1-st4', title: 'Seguimiento y Cierre', order: 4,
            objectives: [
              { id: 's1-st4-obj1', description: 'Obtener aprobación final del crédito.', order: 1, subObjectives: [] },
              { id: 's1-st4-obj2', description: 'Coordinar firma de contrato y desembolso.', order: 2, subObjectives: [], requiredDocumentForCompletion: 'Contrato' },
              { id: 's1-st4-obj3', description: 'Facturar comisión de éxito.', order: 3, subObjectives: [], requiredDocumentForCompletion: 'Factura' },
            ]
          },
        ]
      }
    ]
  },
  {
    id: 'service-2',
    name: 'Gestión Patrimonial',
    subServices: [
      {
        id: 'sub-service-2-1',
        name: 'Inversiones',
        stages: [
          {
            id: 's2-st1', title: 'Perfil de Inversionista', order: 1,
            objectives: [
              { id: 's2-st1-obj1', description: 'Realizar cuestionario de tolerancia al riesgo.', order: 1, subObjectives: [] },
              { id: 's2-st1-obj2', description: 'Definir horizonte de inversión y objetivos financieros.', order: 2, subObjectives: [] },
            ]
          },
          {
            id: 's2-st2', title: 'Propuesta de Inversión', order: 2,
            objectives: [
              { id: 's2-st2-obj1', description: 'Elaborar cartera de inversión diversificada.', order: 1, subObjectives: [], requiredDocumentForCompletion: 'Propuesta' },
              { id: 's2-st2-obj2', description: 'Presentar y validar la propuesta con el cliente.', order: 2, subObjectives: [] },
            ]
          },
        ]
      },
      {
        id: 'sub-service-2-2',
        name: 'Planificación Fiscal',
        stages: [
          {
            id: 's2-st3', title: 'Análisis Fiscal', order: 3,
            objectives: [
              { id: 's2-st3-obj1', description: 'Revisar declaraciones de impuestos de años anteriores.', order: 1, subObjectives: [] },
              { id: 's2-st3-obj2', description: 'Identificar oportunidades de optimización fiscal.', order: 2, subObjectives: [] },
            ]
          },
        ]
      }
    ]
  },
  {
    id: 'service-3',
    name: 'Operaciones de Divisas',
    subServices: [
      {
        id: 'sub-service-3-1',
        name: 'Operaciones Spot',
        stages: [
          { 
            id: 's3-st1', title: 'Cotización', order: 1,
            objectives: [
              { id: 's3-st1-obj1', description: 'Confirmar pares de divisas y monto.', order: 1, subObjectives: [] },
              { id: 's3-st1-obj2', description: 'Proporcionar cotización de tipo de cambio en tiempo real.', order: 2, subObjectives: [] },
            ]
          },
          {
            id: 's3-st2', title: 'Ejecución', order: 2,
            objectives: [
              { id: 's3-st2-obj1', description: 'Recibir confirmación de la operación por parte del cliente.', order: 1, subObjectives: [] },
              { id: 's3-st2-obj2', description: 'Ejecutar la operación en el mercado.', order: 2, subObjectives: [] },
            ]
          },
          {
            id: 's3-st3', title: 'Liquidación', order: 3,
            objectives: [
              { id: 's3-st3-obj1', description: 'Confirmar recepción de fondos.', order: 1, subObjectives: [] },
              { id: 's3-st3-obj2', description: 'Enviar fondos convertidos a la cuenta del cliente.', order: 2, subObjectives: [] },
              { id: 's3-st3-obj3', description: 'Enviar comprobante de la operación.', order: 3, subObjectives: [], requiredDocumentForCompletion: 'Informe' },
            ]
          },
        ]
      }
    ]
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
    { href: '/contacts', label: 'Directorio', icon: 'Users', requiredPermission: 'clients_view' },
    { href: '/tasks', label: 'Tareas', icon: 'ListTodo', requiredPermission: 'tasks_view' },
    { href: '/crm', label: 'CRM', icon: 'Workflow', requiredPermission: 'crm_view' },
    { href: '/services', label: 'Servicios', icon: 'Briefcase', requiredPermission: 'services_view' },
    { href: '/audit', label: 'Auditoría', icon: 'Scale', requiredPermission: 'audit_view' },
    { href: '/settings', label: 'Administración', icon: 'Shield', requiredPermission: 'admin_view' },
];