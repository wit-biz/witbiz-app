
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  UserCircle,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SidebarNav } from './shared/sidebar-nav';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');

const Logo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="h-8 w-8"
      aria-label="WitBiz Logo"
    >
      <style>
        {`
          .witbiz-logo-circle { fill: hsl(var(--primary)); }
          @media (prefers-color-scheme: dark) {
            .witbiz-logo-circle { fill: hsl(var(--primary)); }
          }
        `}
      </style>
      <circle cx="50" cy="50" r="50" className="witbiz-logo-circle" />
      <rect x="15" y="40" width="30" height="20" fill="black" />
      <text
        x="30"
        y="55"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fill="white"
        textAnchor="middle"
        fontWeight="bold"
      >
        WIT
      </text>
      <text
        x="52"
        y="55"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fill="black"
        fontWeight="bold"
      >
        BIZ
      </text>
    </svg>
  );

export function AppSidebar() {

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground">WitBiz</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="w-full justify-start"
              tooltip="Perfil de Usuario"
            >
              <Avatar className="h-8 w-8">
                {userAvatar && <AvatarImage src={userAvatar.imageUrl} data-ai-hint={userAvatar.imageHint}/>}
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Perfil de Usuario</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={12}>
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Perfil</span>
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
      </SidebarFooter>
    </Sidebar>
  );
}
