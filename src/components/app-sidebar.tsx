
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SidebarNav } from './shared/sidebar-nav';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, UploadCloud, UserPlus } from 'lucide-react';
import { useDialogs } from '@/contexts/DialogsContext';

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 40"
    className="h-8 w-auto"
    aria-label="WitBiz Logo"
  >
    <rect className="logo-rect" x="0" y="0" width="80" height="40" fill="black" />
    
    <text
      className="logo-wit-text"
      x="40"
      y="27"
      fontSize="20"
      fill="white"
      textAnchor="middle"
      fontWeight="bold"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      WIT
    </text>
    
    <text
      x="120"
      y="27"
      fontSize="20"
      fill="black"
      textAnchor="middle"
      fontWeight="bold"
      className="logo-biz-text"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      BIZ
    </text>
    
    <style>
      {`
        .dark .logo-rect {
            fill: white;
        }
        .dark .logo-wit-text {
            fill: black;
        }
        .dark .logo-biz-text {
            fill: white;
        }
      `}
    </style>
  </svg>
);


export function AppSidebar() {
  const { setIsAddClientDialogOpen, setIsSmartUploadDialogOpen } = useDialogs();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground sr-only">WitBiz</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-10">
                    <Plus className="h-5 w-5"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="mb-2">
                <DropdownMenuItem onSelect={() => setIsSmartUploadDialogOpen(true)}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    <span>Subir Documento</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsAddClientDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Crear Usuario</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
