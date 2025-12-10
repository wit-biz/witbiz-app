
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCircle,
  LogOut,
  Loader2,
  LogIn,
  Users,
  Shield,
  Trash2,
  Activity,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { useAuth } from "@/firebase/provider";
import { useCRMData } from "@/contexts/CRMDataContext";
import React from "react";


export function UserNav() {
  const { user, isUserLoading } = useUser();
  const { currentUser } = useCRMData();
  const auth = useAuth();

  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("activity");

  const openDialog = (tab: "activity" | "finance") => {
    setActiveTab(tab);
    setIsSummaryDialogOpen(true);
  };

  if (isUserLoading || (user && !currentUser)) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canViewAdmin = currentUser?.permissions.admin_view ?? false;

  return (
    <>
    <div className="fixed top-4 right-4 z-50 flex flex-col items-center gap-1 p-1 rounded-full bg-background/80 backdrop-blur-sm sidebar-glowing-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
          >
            <UserCircle className="h-5 w-5" />
            <span className="sr-only">Abrir menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start" sideOffset={8}>
          {user && currentUser ? (
            <>
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                     <AvatarImage src={currentUser.photoURL || user.photoURL || ''} alt={currentUser.displayName || 'User'}/>
                     <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{currentUser.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'No email'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="mt-1 pt-1 border-t">
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
               {canViewAdmin && (
                <>
                  <DropdownMenuItem asChild>
                      <Link href="/team">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Equipo y Permisos</span>
                      </Link>
                  </DropdownMenuItem>
                </>
               )}
              <DropdownMenuItem onClick={() => initiateSignOut(auth)} className="mt-1 pt-1 border-t">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </>
          ) : (
             <>
                <DropdownMenuLabel>
                    <p>No autenticado</p>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="mt-1 pt-1 border-t">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Iniciar Sesión</span>
                    </Link>
                </DropdownMenuItem>
             </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => openDialog("activity")}
      >
          <Activity className="h-5 w-5" />
          <span className="sr-only">Ver actividad del equipo</span>
      </Button>

      <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => openDialog("finance")}
      >
          <TrendingUp className="h-5 w-5" />
          <span className="sr-only">Ver resumen financiero</span>
      </Button>
    </div>
    
    <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Resumen Rápido</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="activity">Actividad</TabsTrigger>
                    <TabsTrigger value="finance">Finanzas</TabsTrigger>
                </TabsList>
                <TabsContent value="activity">
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Contenido de la actividad del equipo aquí...</p>
                    </div>
                </TabsContent>
                <TabsContent value="finance">
                     <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Contenido del resumen financiero aquí...</p>
                    </div>
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
    </>
  );
}
