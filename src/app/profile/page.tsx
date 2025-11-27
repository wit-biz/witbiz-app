
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
  User,
  Shield,
  Palette,
  Lock,
  Mail,
  UserCog,
  LogOut,
  Save,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useUser, useAuth } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { useCRMData } from "@/contexts/CRMDataContext";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { currentUser } = useCRMData();
  const auth = useAuth();

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
         <Header
          title="Mi Perfil"
          description="Gestiona tu información personal y las preferencias de la aplicación."
        />
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Mi Perfil"
        description="Gestiona tu información personal y las preferencias de la aplicación."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
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
          </TabsList>
          <TabsContent value="summary">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Resumen del Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.photoURL || undefined} data-ai-hint="professional person" />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{user.displayName || 'Usuario'}</h2>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col">
                           <span className="text-sm text-muted-foreground">Email</span>
                           <span className="font-medium">{user.email}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-muted-foreground" />
                         <div className="flex flex-col">
                           <span className="text-sm text-muted-foreground">Rol</span>
                           <span className="font-medium">{currentUser?.role}</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => initiateSignOut(auth)}>
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
                                <Input id="fullName" defaultValue={user.displayName || ''} />
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
                                <PasswordInput id="currentPasswordEmail" placeholder="••••••••" autoComplete="current-password" />
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
                                <PasswordInput id="currentPassword" placeholder="••••••••" autoComplete="current-password" />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <PasswordInput id="newPassword" placeholder="••••••••" autoComplete="new-password"/>
                            </div>
                            <div>
                                <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                                <PasswordInput id="confirmNewPassword" placeholder="••••••••" autoComplete="new-password"/>
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
        </Tabs>
      </main>
    </div>
  );
}
