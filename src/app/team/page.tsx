
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, PlusCircle, Edit, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InviteMemberDialog } from "@/components/shared/InviteMemberDialog";
import { type AppPermissions, type AppUser } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditMemberDialog } from "@/components/shared/EditMemberDialog";
import { Loader2 } from "lucide-react";


const allPermissions: { key: keyof AppPermissions; label: string; section: string }[] = [
    // General
    { key: "dashboard_view", label: "Ver Dashboard de Inicio", section: "General" },

    // Clientes, Proveedores, Promotores
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
    { key: "documents_delete", label: "Eliminar Documentos", section: "Documentos" },

    // Servicios y Flujos de Trabajo
    { key: "services_view", label: "Ver Página de Servicios", section: "Servicios y Flujos" },
    { key: "crm_view", label: "Ver Flujos de Trabajo (CRM)", section: "Servicios y Flujos" },
    { key: "workflow_edit", label: "Editar Etapas y Acciones de Flujos", section: "Servicios y Flujos" },
    { key: "services_edit", label: "Editar Detalles de Servicios (descripción, comisiones, etc.)", section: "Servicios y Flujos" },

    // Finanzas
    { key: "intelligence_view", label: "Ver Centro de Inteligencia", section: "Finanzas" },
    { key: "accounting_view", label: "Ver Módulo de Contabilidad", section: "Finanzas" },
    { key: "accounting_config", label: "Configurar Contabilidad (empresas, cuentas)", section: "Finanzas" },

    // Administración
    { key: "admin_view", label: "Ver Secciones de Administración (Equipo, Papelera, etc.)", section: "Administración" },
    { key: "team_manage_members", label: "Invitar, Editar y Archivar Miembros", section: "Administración" },
    { key: "team_manage_roles", label: "Gestionar Roles y Permisos", section: "Administración" },
];


const initialRoles = [
    { 
        id: 'director', 
        name: 'Director', 
        permissions: allPermissions.reduce((acc, p) => ({...acc, [p.key]: true}), {}) as AppPermissions,
    },
    { 
        id: 'admin', 
        name: 'Administrador', 
        permissions: {
            dashboard_view: true, 
            clients_view: true, clients_create: true, clients_edit: true, clients_delete: true,
            suppliers_view: true, suppliers_create: true, suppliers_edit: true, suppliers_delete: true,
            promoters_view: true, promoters_create: true, promoters_edit: true, promoters_delete: true,
            tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: true,
            documents_view: true, documents_upload: true, documents_delete: true,
            services_view: true, crm_view: true, workflow_edit: true, services_edit: true,
            intelligence_view: true, accounting_view: true, accounting_config: true,
            admin_view: true, team_manage_members: true, team_manage_roles: true,
        }
    },
    { 
        id: 'collaborator', 
        name: 'Colaborador', 
        permissions: {
            dashboard_view: true,
            clients_view: true, clients_create: true, clients_edit: true, clients_delete: false,
            suppliers_view: true, suppliers_create: false, suppliers_edit: false, suppliers_delete: false,
            promoters_view: true, promoters_create: false, promoters_edit: false, promoters_delete: false,
            tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: false,
            documents_view: true, documents_upload: true, documents_delete: false,
            services_view: true, crm_view: true, workflow_edit: false, services_edit: false,
            intelligence_view: false, accounting_view: false, accounting_config: false,
            admin_view: false, team_manage_members: false, team_manage_roles: false,
        }
    },
];


export default function TeamPage() {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [roles, setRoles] = useState(initialRoles);
    const { currentUser, teamMembers, registerUser, updateUser, deleteUser } = useCRMData();
    const { toast } = useToast();

    const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const canManageMembers = currentUser?.permissions?.team_manage_members ?? false;
    const canManageRoles = currentUser?.permissions?.team_manage_roles ?? false;

    const sortedTeamMembers = useMemo(() => {
        if (!teamMembers) return [];
        const roleOrder = {
            'Director': 1,
            'Administrador': 2,
            'Colaborador': 3,
        };
        // Filter out promoters and archived users from the team members list
        return teamMembers
            .filter(member => member.role !== 'Promotor' && member.status !== 'Archivado')
            .sort((a, b) => {
                const roleA = roleOrder[a.role as keyof typeof roleOrder] || 99;
                const roleB = roleOrder[b.role as keyof typeof roleOrder] || 99;
                return roleA - roleB;
            });
    }, [teamMembers]);

    const handlePermissionChange = (roleId: string, permissionKey: keyof AppPermissions, value: boolean) => {
        setRoles(currentRoles => 
            currentRoles.map(role => 
                role.id === roleId 
                    ? { ...role, permissions: { ...role.permissions, [permissionKey]: value } }
                    : role
            )
        );
        toast({
            title: "Permiso Actualizado",
            description: `Se ha guardado la actualización para el rol ${roleId}.`,
        });
    };
    
    const permissionsBySection = useMemo(() => {
        return allPermissions.reduce((acc, permission) => {
            if (!acc[permission.section]) {
                acc[permission.section] = [];
            }
            acc[permission.section].push(permission);
            return acc;
        }, {} as Record<string, typeof allPermissions>);
    }, []);

    const handleInvite = async (name: string, email: string, role: string) => {
        await registerUser(name, email, 'WitBiz!123', role);
    };

    const handleEditUser = (user: AppUser) => {
        setUserToEdit(user);
    };

    const handleDeleteClick = (user: AppUser) => {
        setUserToDelete(user);
    };
    
    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsProcessing(true);
        const success = await deleteUser(userToDelete.id);
        if (success) {
            toast({ title: 'Usuario Archivado', description: `El usuario ${userToDelete.name} ha sido enviado a la papelera.` });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el usuario.' });
        }
        setIsProcessing(false);
        setUserToDelete(null);
    };
    
    const handleUpdateUser = async (userId: string, name: string, role: string) => {
        setIsProcessing(true);
        const success = await updateUser(userId, { name, role });
        if (success) {
            toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido actualizados.' });
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el usuario.' });
        }
        setIsProcessing(false);
        setUserToEdit(null);
    };


  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header
        title="Equipo y Permisos"
        description="Gestione los miembros de su equipo y configure los roles y permisos."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Miembros del Equipo
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="mr-2 h-4 w-4" />
              Roles y Permisos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Listado de Miembros</CardTitle>
                        <CardDescription>
                            Usuarios con acceso a la plataforma.
                        </CardDescription>
                    </div>
                    {canManageMembers && (
                        <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Miembro
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTeamMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.photoURL} alt={member.name} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{member.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                                    <TableCell className="text-right">
                                      {canManageMembers && member.role !== 'Director' && (
                                        <>
                                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(member)}><Edit className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(member)}><Trash2 className="h-4 w-4" /></Button>
                                        </>
                                      )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="permissions" className="mt-6">
             <Accordion type="single" collapsible className="w-full space-y-4">
                {roles.filter(r => r.id !== 'director').map((role) => (
                    <AccordionItem value={role.id} key={role.id} asChild>
                        <Card>
                            <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4" disabled={!canManageRoles}>
                                <CardHeader className="flex-1">
                                    <CardTitle className="flex items-center gap-2 text-left"><KeyRound className="h-5 w-5 text-accent"/>{role.name}</CardTitle>
                                    <CardDescription className="text-left">
                                        Configure los permisos para el rol de {role.name}.
                                    </CardDescription>
                                </CardHeader>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
                                    {Object.entries(permissionsBySection).map(([section, permissions]) => (
                                        <div key={section}>
                                            <h4 className="font-semibold mb-2">{section}</h4>
                                            <div className="space-y-3 pl-4">
                                            {permissions.map(permission => (
                                                <div key={permission.key} className="flex items-center justify-between">
                                                    <Label htmlFor={`perm-${role.id}-${permission.key}`}>{permission.label}</Label>
                                                    <Switch
                                                        id={`perm-${role.id}-${permission.key}`}
                                                        checked={role.permissions[permission.key as keyof AppPermissions] || false}
                                                        onCheckedChange={(value) => handlePermissionChange(role.id, permission.key as keyof AppPermissions, value)}
                                                        disabled={!canManageRoles}
                                                    />
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
              </Accordion>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        roles={roles.map(r => r.name).filter(name => name !== 'Director' && name !== 'Promotor')}
        onInvite={handleInvite}
    />
    {userToEdit && (
        <EditMemberDialog
            isOpen={!!userToEdit}
            onOpenChange={() => setUserToEdit(null)}
            user={userToEdit}
            roles={roles.map(r => r.name).filter(name => name !== 'Director' && name !== 'Promotor')}
            onSave={handleUpdateUser}
            isProcessing={isProcessing}
        />
    )}
     <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Archivar Usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción enviará al usuario "{userToDelete?.name}" a la papelera. Podrás restaurarlo más tarde. El usuario no podrá iniciar sesión mientras esté archivado.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Archivar'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
