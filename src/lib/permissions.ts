
import { type AppPermissions } from "./types";

export const allPermissions: { key: keyof AppPermissions; label: string; section: string }[] = [
    // General
    { key: "dashboard_view", label: "Ver Dashboard de Inicio", section: "General" },

    // Contactos
    { key: "clients_view", label: "Ver Clientes", section: "Contactos" },
    { key: "clients_create", label: "Crear Clientes", section: "Contactos" },
    { key: "clients_edit", label: "Editar Clientes", section: "Contactos" },
    { key: "clients_delete", label: "Archivar Clientes", section: "Contactos" },
    { key: "suppliers_view", label: "Ver Proveedores", section: "Contactos" },
    { key: "suppliers_create", label: "Crear Proveedores", section: "Contactos" },
    { key: "suppliers_edit", label: "Editar Proveedores", section: "Contactos" },
    { key: "suppliers_delete", label: "Archivar Proveedores", section: "Contactos" },
    { key: "promoters_view", label: "Ver Promotores", section: "Contactos" },
    { key: "promoters_create", label: "Crear Promotores", section: "Contactos" },
    { key: "promoters_edit", label: "Editar Promotores", section: "Contactos" },
    { key: "promoters_delete", label: "Archivar Promotores", section: "Contactos" },

    // Tareas
    { key: "tasks_view", label: "Ver Tareas", section: "Tareas" },
    { key: "tasks_create", label: "Crear Tareas", section: "Tareas" },
    { key: "tasks_edit", label: "Editar Tareas", section: "Tareas" },
    { key: "tasks_delete", label: "Archivar Tareas", section: "Tareas" },
    
    // Documentos
    { key: "documents_view", label: "Ver y Descargar Documentos", section: "Documentos" },
    { key: "documents_upload", label: "Subir Documentos", section: "Documentos" },
    { key: "documents_edit", label: "Editar información de documentos", section: "Documentos" },
    { key: "documents_archive", label: "Archivar Documentos", section: "Documentos" },

    // Servicios y Flujos de Trabajo
    { key: "services_view", label: "Ver Página de Servicios", section: "Servicios y Flujos" },
    { key: "crm_view", label: "Ver Flujos de Trabajo (CRM)", section: "Servicios y Flujos" },
    { key: "workflow_edit", label: "Editar Etapas y Acciones de Flujos", section: "Servicios y Flujos" },
    { key: "services_edit", label: "Editar Detalles de Servicios (descripción, comisiones, etc.)", section: "Servicios y Flujos" },

    // Finanzas
    { key: "intelligence_view", label: "Ver Centro de Inteligencia", section: "Finanzas" },
    { key: "accounting_view", label: "Ver Módulo de Contabilidad", section: "Finanzas" },
    { key: "accounting_config", label: "Configurar Contabilidad (empresas, cuentas)", section: "Finanzas" },

    // Administración y Equipo
    { key: "admin_view", label: "Ver Secciones de Administración (Equipo, Papelera, etc.)", section: "Administración y Equipo" },
    { key: "team_manage_members", label: "Invitar, Editar y Archivar Miembros", section: "Administración y Equipo" },
    { key: "team_manage_roles", label: "Gestionar Roles y Permisos", section: "Administración y Equipo" },
    { key: "team_tasks_view", label: "Ver Tareas de todo el equipo", section: "Administración y Equipo" },
    { key: "team_activity_view", label: "Ver Actividad de todo el equipo", section: "Administración y Equipo" },
    { key: "team_finance_view", label: "Ver Resumen financiero del equipo", section: "Administración y Equipo" },
];
