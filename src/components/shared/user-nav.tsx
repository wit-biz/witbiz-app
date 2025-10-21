
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
  MoreVertical,
  UserCircle,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { cn } from "@/lib/utils";

const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

export function UserNav() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-9 w-9 rounded-full bg-background/60 backdrop-blur-sm transition-all hover:bg-muted/80",
              "shadow-sm dark:shadow-lg dark:shadow-primary/10",
              "hover:shadow-md hover:dark:shadow-primary/20"
              )}
            >
             <MoreVertical className="h-5 w-5" />
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
