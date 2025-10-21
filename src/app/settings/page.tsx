
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Palette,
  Users,
  Lock,
  Mail,
  UserCog,
  LogOut,
  Save,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const PasswordInput = ({ id, placeholder }: { id: string, placeholder: string }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative">
            <Input type={showPassword ? "text" : "password"} id={id} placeholder={placeholder} />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    );
};

const teamMembers = [
    { name: "Admin User", email: "admin@witbiz.com", role: "Administrador", status: "Activo" },
    { name: "Cajero 1", email: "cajero1@witbiz.com", role: "Colaborador", status: "Activo" },
    { name: "Cajero 2", email: "cajero2@witbiz.com", role: "Colaborador", status: "Activo" },
];


export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Administración"
        description="Gestiona tu información y las preferencias del sistema."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
            <TabsTrigger value="summary">
              <User className="mr-2 h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4" />
              Apariencia
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="mr-2 h-4 w-4" />
              Miembros del Equipo
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Lock className="mr-2 h-4 w-4" />
              Permisos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Resumen del Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="https://picsum.photos/seed/99/100/100" data-ai-hint="professional person" />
                    <AvatarFallback>AU</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">Admin User</h2>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col">
                           <span className="text-sm text-muted-foreground">Email</span>
                           <span className="font-medium">admin@witbiz.com</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-muted-foreground" />
                         <div className="flex flex-col">
                           <span className="text-sm text-muted-foreground">Rol</span>
                           <span className="font-medium">Administrador</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
             <div className="grid gap-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-accent"/> Nombre de Usuario</CardTitle>
                            <CardDescription>Esta información es visible para otros miembros del equipo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="fullName">Nombre Completo</Label>
                                <Input id="fullName" defaultValue="Admin User" />
                            </div>
                             <Button><Save className="mr-2 h-4 w-4" />Guardar Nombre</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-accent"/> Cambiar Correo Electrónico</CardTitle>
                            <CardDescription>Actualice la dirección de correo electrónico asociada a su cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="newEmail">Nuevo Correo Electrónico</Label>
                                <Input id="newEmail" type="email" placeholder="su.nuevo@correo.com" />
                            </div>
                            <div>
                                <Label htmlFor="currentPasswordEmail">Contraseña Actual</Label>
                                <PasswordInput id="currentPasswordEmail" placeholder="••••••••" />
                            </div>
                            <Button><Save className="mr-2 h-4 w-4" />Guardar Correo</Button>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-accent"/> Cambiar Contraseña</CardTitle>
                        <CardDescription>Asegúrese de usar una contraseña segura.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                <PasswordInput id="currentPassword" placeholder="••••••••" />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <PasswordInput id="newPassword" placeholder="••••••••" />
                            </div>
                            <div>
                                <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                                <PasswordInput id="confirmNewPassword" placeholder="••••••••" />
                            </div>
                        </div>
                        <Button><Save className="mr-2 h-4 w-4" />Guardar Contraseña</Button>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>
                  Personaliza la apariencia de la aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeToggle />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Miembros del Equipo</CardTitle>
                        <CardDescription>Gestiona los miembros de tu equipo y sus roles.</CardDescription>
                    </div>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Miembro</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.map((member, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                                    <TableCell><Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{member.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permisos</CardTitle>
                <CardDescription>
                  Configura los roles y permisos de tu equipo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Aquí podrás definir qué acciones puede realizar cada rol.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
