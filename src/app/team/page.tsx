

"use client";

import React, { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
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

const allPermissions: { key: keyof AppPermissions; label: string; section: string }[] = [
    // Dashboard
    { key: "dashboard", label: "Ver Dashboard", section: "General" },

    // Clients
    { key: "clients_view", label: "Ver Clientes", section: "Clientes" },
    { key: "clients_create", label: "Crear Clientes", section: "Clientes" },
    { key: "clients_edit", label: "Editar Clientes", section: "Clientes" },
    { key: "clients_delete", label: "Eliminar Clientes", section: "Clientes" },
    
    // Tasks
    { key: "tasks_view", label: "Ver Tareas", section: "Tareas" },
    { key: "tasks_create", label: "Crear Tareas", section: "Tareas" },
    { key: "tasks_edit", label: "Editar Tareas", section: "Tareas" },
    { key: "tasks_delete", label: "Eliminar Tareas", section: "Tareas" },

    // CRM
    { key: "crm_view", label: "Ver Flujos CRM", section: "CRM y Servicios" },
    { key: "crm_edit", label: "Editar Flujos CRM", section: "CRM y Servicios" },
    { key: "services_view", label: "Ver Servicios", section: "CRM y Servicios" },

    // Admin & Finances
    { key: "finances_view", label: "Ver Finanzas", section: "Administración" },
    { key: "admin_view", label: "Ver Contabilidad", section: "Administración" },
    { key: "team_invite", label: "Invitar Miembros", section: "Administración" },

    // Documents
    { key: "documents_view", label: "Ver Documentos", section: "Documentos" },
];


const initialRoles = [
    { 
        id: 'director', 
        name: 'Director', 
        permissions: {
            dashboard: true, clients_view: true, clients_create: true, clients_edit: true, clients_delete: true,
            tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: true,
            crm_view: true, crm_edit: true, finances_view: true, admin_view: true, team_invite: true,
            documents_view: true, services_view: true,
        }
    },
    { 
        id: 'admin', 
        name: 'Administrador', 
        permissions: {
            dashboard: true, clients_view: true, clients_create: true, clients_edit: true, clients_delete: false,
            tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: false,
            crm_view: true, crm_edit: true, finances_view: false, admin_view: true, team_invite: true,
            documents_view: true, services_view: true,
        }
    },
    { 
        id: 'collaborator', 
        name: 'Colaborador', 
        permissions: {
            dashboard: true, clients_view: true, clients_create: true, clients_edit: false, clients_delete: false,
            tasks_view: true, tasks_create: true, tasks_edit: true, tasks_delete: false,
            crm_view: true, crm_edit: false, finances_view: false, admin_view: false, team_invite: false,
            documents_view: true, services_view: true,
        }
    },
    { 
        id: 'promoter', 
        name: 'Promotor', 
        permissions: {
            dashboard: false, clients_view: false, clients_create: false, clients_edit: false, clients_delete: false,
            tasks_view: false, tasks_create: false, tasks_edit: false, tasks_delete: false,
            crm_view: false, crm_edit: false, finances_view: false, admin_view: false, team_invite: false,
            documents_view: false, services_view: false,
        }
    },
];


export default function TeamPage() {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [roles, setRoles] = useState(initialRoles);
    const { currentUser, teamMembers, registerUser } = useCRMData();

    const canInvite = currentUser?.permissions?.team_invite ?? false;

    const sortedTeamMembers = useMemo(() => {
        if (!teamMembers) return [];
        const roleOrder = {
            'Director': 1,
            'Administrador': 2,
            'Colaborador': 3,
        };
        // Filter out promoters from the team members list
        return teamMembers
            .filter(member => member.role !== 'Promotor')
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
        // The default password is 'WitBiz!123'
        await registerUser(name, email, 'WitBiz!123', role);
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
                    {canInvite && (
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
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
                {roles.filter(r => r.id !== 'director' && r.id !== 'promoter').map((role) => (
                    <AccordionItem value={role.id} key={role.id} asChild>
                        <Card>
                            <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                                <CardHeader className="flex-1">
                                    <CardTitle className="flex items-center gap-2 text-left"><KeyRound className="h-5 w-5 text-accent"/>{role.name}</CardTitle>
                                    <CardDescription className="text-left">Configure los permisos para el rol de {role.name}.</CardDescription>
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
                                                        checked={role.permissions[permission.key] || false}
                                                        onCheckedChange={(value) => handlePermissionChange(role.id, permission.key, value)}
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
    </>
  );
}
