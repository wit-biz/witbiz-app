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
import { Users, Shield, PlusCircle, Edit3, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InviteMemberDialog } from "@/components/shared/InviteMemberDialog";
import { type AppPermissions, type AppUser, type UserRole } from "@/lib/types";
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
import { allPermissions } from "@/lib/permissions";
import { PromptNameDialog } from "@/components/shared/PromptNameDialog";


export default function TeamPage() {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const { currentUser, teamMembers, registerUser, updateUser, deleteUser, roles: serverRoles, setRoles: setServerRoles } = useCRMData();
    const { toast } = useToast();

    const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
    
    const [isRolesEditMode, setIsRolesEditMode] = useState(false);
    const [localRoles, setLocalRoles] = useState<UserRole[]>([]);
    const [roleToDelete, setRoleToDelete] = useState<UserRole | null>(null);
    const [roleToEdit, setRoleToEdit] = useState<UserRole | null>(null);
    const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setLocalRoles(JSON.parse(JSON.stringify(serverRoles)));
    }, [serverRoles]);


    const canManageMembers = currentUser?.permissions?.team_manage_members ?? false;
    const canManageRoles = currentUser?.permissions?.team_manage_roles ?? false;

    const sortedTeamMembers = useMemo(() => {
        if (!teamMembers) return [];
        const roleOrder: { [key: string]: number } = { 'Director': 1, 'Administrador': 2 };
        return [...teamMembers]
            .filter(member => member.status !== 'Archivado' && member.email !== 'saidsaigar@gmail.com')
            .sort((a, b) => {
                const roleA = roleOrder[a.role] || 99;
                const roleB = roleOrder[b.role] || 99;
                if (roleA !== roleB) return roleA - roleB;
                return a.name.localeCompare(b.name);
            });
    }, [teamMembers]);

    const handlePermissionChange = (roleId: string, permissionKey: keyof AppPermissions, value: boolean) => {
        setLocalRoles(prevRoles => prevRoles.map(role => 
            role.id === roleId 
                ? { ...role, permissions: { ...role.permissions, [permissionKey]: value } }
                : role
        ));
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

    const confirmDeleteUser = async () => {
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
    
    const handleSaveRole = (name: string) => {
        if (roleToEdit) { // Editing existing role name
            setLocalRoles(prevRoles => prevRoles.map(r => r.id === roleToEdit.id ? { ...r, name } : r));
        } else { // Creating a new role
            const newRole: UserRole = {
                id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                name,
                isBaseRole: false,
                permissions: localRoles.find(r => r.id === 'collaborator')?.permissions || {}
            };
            const updatedRoles = [...localRoles, newRole];
            setServerRoles(updatedRoles);
            toast({ title: "Rol Creado", description: `El rol "${name}" ha sido creado.` });
        }
        setRoleToEdit(null);
    };
    
    const confirmDeleteRole = () => {
        if (!roleToDelete) return;
        const updatedRoles = localRoles.filter(r => r.id !== roleToDelete.id);
        setLocalRoles(updatedRoles);
        // Persist deletion immediately
        setServerRoles(updatedRoles);
        setRoleToDelete(null);
        toast({ title: "Rol Eliminado", description: `El rol "${roleToDelete.name}" ha sido eliminado.`});
    };

    const handleSaveChanges = () => {
        setServerRoles(localRoles);
        setIsRolesEditMode(false);
        toast({ title: 'Roles Guardados', description: 'Los cambios en los roles y permisos han sido guardados.' });
    };

    const handleCancelChanges = () => {
        setLocalRoles(JSON.parse(JSON.stringify(serverRoles)));
        setIsRolesEditMode(false);
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
                                          <Button variant="ghost" size="icon" onClick={() => setUserToEdit(member)}><Edit3 className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setUserToDelete(member)}><Trash2 className="h-4 w-4" /></Button>
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
              <div className="mb-4 flex gap-2">
                 {!isRolesEditMode ? (
                      <Button onClick={() => setIsRolesEditMode(true)} disabled={!canManageRoles}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Configurar Roles
                      </Button>
                 ) : (
                      <>
                          <Button onClick={handleSaveChanges}>
                              <Save className="mr-2 h-4 w-4" />
                              Guardar Cambios
                          </Button>
                           <Button variant="ghost" onClick={handleCancelChanges}>
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                          </Button>
                      </>
                 )}
              </div>
             <Accordion type="single" collapsible className="w-full space-y-4">
                {localRoles.filter(role => role.id !== 'director').map((role) => (
                    <AccordionItem value={role.id} key={role.id} asChild>
                        <Card>
                            <CardHeader className="flex flex-row items-center p-0">
                                <AccordionTrigger className="flex-1 p-6 hover:no-underline [&_svg]:ml-auto" disabled={!isRolesEditMode && role.id === 'director'}>
                                    <div className="text-left">
                                      <CardTitle>{role.name}</CardTitle>
                                      <CardDescription className="mt-1">
                                          Permisos para el rol de {role.name}.
                                      </CardDescription>
                                    </div>
                                </AccordionTrigger>
                                {isRolesEditMode && (
                                    <div className="flex items-center pr-4">
                                        {role.id !== 'director' && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setRoleToEdit(role); setIsPromptNameOpen(true);}}>
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {!role.isBaseRole && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setRoleToDelete(role); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardHeader>
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
                                                        disabled={!isRolesEditMode}
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
                {isRolesEditMode && (
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => { setRoleToEdit(null); setIsPromptNameOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Nuevo Rol
                        </Button>
                    </div>
                )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
    <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        roles={localRoles.filter(r => r.name !== 'Director').map(r => r.name)}
        onInvite={handleInvite}
    />
    {userToEdit && (
        <EditMemberDialog
            isOpen={!!userToEdit}
            onOpenChange={() => setUserToEdit(null)}
            user={userToEdit}
            roles={localRoles.filter(r => r.name !== 'Director').map(r => r.name)}
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
                <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isProcessing}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteUser} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                    Archivar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar Rol?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción eliminará permanentemente el rol "{roleToDelete?.name}". Los usuarios con este rol deberán ser reasignados a un nuevo rol. ¿Está seguro?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteRole} className="bg-destructive hover:bg-destructive/90">
                    Eliminar Rol
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    {isPromptNameOpen && (
        <PromptNameDialog 
            isOpen={isPromptNameOpen}
            onOpenChange={(open) => { if (!open) { setIsPromptNameOpen(false); setRoleToEdit(null); } else { setIsPromptNameOpen(true); }}}
            title={roleToEdit ? "Editar Nombre del Rol" : "Crear Nuevo Rol"}
            description={roleToEdit ? `Introduzca un nuevo nombre para el rol "${roleToEdit.name}".` : "Introduzca un nombre para el nuevo rol de usuario."}
            label="Nombre del Rol"
            initialValue={roleToEdit?.name || ""}
            onSave={handleSaveRole}
        />
    )}
    </>
  );
}