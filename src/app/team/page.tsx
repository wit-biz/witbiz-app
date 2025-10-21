
"use client";

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


const teamMembers = [
    { id: 'user-1', name: 'Admin User', email: 'admin@witbiz.com', role: 'Director' },
    { id: 'user-2', name: 'Carla Collaborator', email: 'carla@witbiz.com', role: 'Colaborador' },
    { id: 'user-3', name: 'Andrea Admin', email: 'andrea@witbiz.com', role: 'Administrador' },
];

const roles = [
    { 
        id: 'director', 
        name: 'Director', 
        permissions: [
            { key: 'all_access', label: 'Acceso Total', value: true, disabled: true },
        ] 
    },
    { 
        id: 'admin', 
        name: 'Administrador', 
        permissions: [
            { key: 'clients_manage', label: 'Gestionar Clientes', value: true },
            { key: 'team_manage', label: 'Gestionar Equipo', value: true },
            { key: 'finances_view', label: 'Ver Finanzas', value: true },
            { key: 'crm_edit', label: 'Editar CRM', value: true },
        ] 
    },
    { 
        id: 'collaborator', 
        name: 'Colaborador', 
        permissions: [
            { key: 'clients_view', label: 'Ver Clientes', value: true },
            { key: 'tasks_manage', label: 'Gestionar Tareas Propias', value: true },
            { key: 'bookings_view', label: 'Ver Reservaciones', value: false },
            { key: 'crm_view', label: 'Ver CRM', value: false },
        ]
    },
];


export default function TeamPage() {
  return (
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
                    <Button size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Invitar Miembro
                    </Button>
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
                            {teamMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
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
            <Card>
              <CardHeader>
                <CardTitle>Roles y Permisos</CardTitle>
                <CardDescription>
                  Configure qué puede hacer cada rol dentro de la aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {roles.map((role) => (
                     <div key={role.id}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full"><KeyRound className="h-5 w-5 text-accent"/></div>
                            <h3 className="text-lg font-semibold">{role.name}</h3>
                        </div>
                        <div className="pl-12 pt-4 space-y-4">
                            {role.permissions.map(permission => (
                                <div key={permission.key} className="flex items-center justify-between">
                                    <Label htmlFor={`perm-${role.id}-${permission.key}`}>{permission.label}</Label>
                                    <Switch
                                        id={`perm-${role.id}-${permission.key}`}
                                        checked={permission.value}
                                        disabled={permission.disabled}
                                    />
                                </div>
                            ))}
                        </div>
                        <Separator className="mt-6"/>
                     </div>
                 ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

