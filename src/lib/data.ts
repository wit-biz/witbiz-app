

import type { Client, Task, Document, Note, WorkflowStage, NavItem, Promoter, ServiceWorkflow, SubService, AppUser } from './types';
import { addDays, format, subDays } from 'date-fns';

export const teamMembers: AppUser[] = [];

// This will now be fetched from Firestore, so we can keep it empty.
export const serviceWorkflows: ServiceWorkflow[] = [];

// This will now be fetched from Firestore, so we can keep it empty.
export const clients: Client[] = [];

// This will now be fetched from Firestore, so we can keep it empty.
export const tasks: Task[] = [];

// This will now be fetched from Firestore, so we can keep it empty.
export const documents: Document[] = [];


// Mock data for entities not yet in Firestore.
export const promoters: Promoter[] = [];
export const suppliers: { id: string; name: string; contact: string; service: string }[] = [];
export const notes: Note[] = [];

export const navItems: NavItem[] = [
    { href: '/', label: 'Inicio', icon: 'LayoutDashboard', exactMatch: true, requiredPermission: 'dashboard' },
    { href: '/contacts', label: 'Base de Datos', icon: 'Database', requiredPermission: 'clients_view' },
    { href: '/tasks', label: 'Tareas', icon: 'ListTodo', requiredPermission: 'tasks_view' },
    { href: '/crm', label: 'CRM', icon: 'Workflow', requiredPermission: 'crm_view' },
    { href: '/services', label: 'Servicios', icon: 'Briefcase', requiredPermission: 'services_view' },
    { href: '/settings', label: 'Contabilidad', icon: 'DollarSign', requiredPermission: 'admin_view' },
    { href: '/finances', label: 'Finanzas', icon: 'Landmark', requiredPermission: 'finances_view' },
];

    
