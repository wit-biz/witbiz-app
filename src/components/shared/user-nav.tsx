
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
  LifeBuoy,
  LogOut,
  Loader2,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
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
  const { currentUser, isLoadingCurrentUser } = useCRMData();

  if (isLoadingCurrentUser) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted/90",
              "sidebar-glowing-border"
            )}
          >
            {currentUser ? (
              <Avatar className="h-8 w-8">
                {currentUser.photoURL ? (
                  <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || 'User'}/>
                ) : (
                  <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                )}
              </Avatar>
            ) : (
              <UserMenuIcon />
            )}
            <span className="sr-only">Abrir menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentUser ? (
            <>
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {currentUser.photoURL ? (
                      <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || 'User'}/>
                    ) : (
                      <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{currentUser.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email || 'No email'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Soporte</span>
              </DropdownMenuItem>
            </>
          ) : (
             <>
                <DropdownMenuLabel>
                    <p>No autenticado</p>
                </DropdownMenuLabel>
             </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
