
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
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

const UserMenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="user-nav-glow h-6 w-6">
        <circle cx="12" cy="6" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
    </svg>
);


export function UserNav() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted/90"
          >
            <UserMenuIcon />
            <span className="sr-only">Abrir menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {userAvatar && <AvatarImage src={userAvatar.imageUrl} data-ai-hint={userAvatar.imageHint}/>}
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">Usuario</p>
                <p className="text-xs leading-none text-muted-foreground">
                  usuario@ejemplo.com
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
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
