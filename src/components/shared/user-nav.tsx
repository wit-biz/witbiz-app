
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";
import { SidebarTrigger } from "../ui/sidebar";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { useAuth } from "@/firebase/provider";
import { useCRMData } from "@/contexts/CRMDataContext";

const UserMenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="user-nav-glow h-6 w-6">
        <circle cx="12" cy="6" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
    </svg>
);

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const { currentUser } = useCRMData();
  const auth = useAuth();

  if (isUserLoading || (user && !currentUser)) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canViewAdmin = currentUser?.permissions.admin_view ?? false;

  return (
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
        <DropdownMenuContent align="end">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => initiateSignOut(auth)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </>
          ) : (
             <>
                <DropdownMenuLabel>
                    <p>No autenticado</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
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
      >
          <Activity className="h-5 w-5" />
          <span className="sr-only">Ver actividad del equipo</span>
      </Button>

      <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
      >
          <TrendingUp className="h-5 w-5" />
          <span className="sr-only">Ver resumen financiero</span>
      </Button>
    </div>
  );
}
