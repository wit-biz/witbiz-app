
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { SidebarNav } from './shared/sidebar-nav';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, UploadCloud, UserPlus } from 'lucide-react';
import { useDialogs } from '@/contexts/DialogsContext';
import { cn } from '@/lib/utils';
import { Logo } from './shared/logo';


export function AppSidebar() {
  const { setIsSmartUploadDialogOpen } = useDialogs();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground sr-only">WitBiz</h1>
        </div>
        <div className="p-2 flex justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "rounded-full h-9 w-9 transition-all duration-300 hover:rotate-90",
                        "sidebar-glowing-border"
                      )}
                    >
                        <Plus className="h-5 w-5" />
                        <span className="sr-only">Nuevo...</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="mb-2">
                    <DropdownMenuItem onSelect={() => setIsSmartUploadDialogOpen(true)}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        <span>Subir Documento</span>
                    </DropdownMenuItem>
                    {/* The AddEditClientDialog will be opened from the contacts page */}
                    {/* <DropdownMenuItem onSelect={() => {}}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Crear Usuario</span>
                    </DropdownMenuItem> */}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <SidebarSeparator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        
      </SidebarFooter>
    </Sidebar>
  );
}
