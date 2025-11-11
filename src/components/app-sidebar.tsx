
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, UploadCloud, UserPlus, ListTodo, Users, UserCheck, Truck, Search } from 'lucide-react';
import { useDialogs } from '@/contexts/DialogsContext';
import { cn } from '@/lib/utils';
import { Logo } from './shared/logo';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCRMData } from '@/contexts/CRMDataContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


export function AppSidebar() {
  const { 
    setIsSmartUploadDialogOpen,
    setIsAddClientDialogOpen,
    setIsAddTaskDialogOpen,
    setIsAddPromoterDialogOpen,
    setIsAddSupplierDialogOpen,
   } = useDialogs();
   
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { clients, promoters, suppliers, serviceWorkflows } = useCRMData();

  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return { clients: [], promoters: [], suppliers: [], services: [] };
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return {
      clients: clients.filter(c => c.name.toLowerCase().includes(lowerSearchTerm)),
      promoters: promoters.filter(p => p.name.toLowerCase().includes(lowerSearchTerm)),
      suppliers: suppliers.filter(s => s.name.toLowerCase().includes(lowerSearchTerm)),
      services: serviceWorkflows.filter(s => s.name.toLowerCase().includes(lowerSearchTerm)),
    };
  }, [searchTerm, clients, promoters, suppliers, serviceWorkflows]);

  const hasResults = useMemo(() => {
    return (
      searchResults.clients.length > 0 ||
      searchResults.promoters.length > 0 ||
      searchResults.suppliers.length > 0 ||
      searchResults.services.length > 0
    );
  }, [searchResults]);
  
  const handleSelect = (url: string) => {
    router.push(url);
    setSearchTerm('');
    setIsSearching(false);
  };


  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground sr-only">WitBiz</h1>
        </div>
        <div className="p-2 flex justify-center">
            {isSearching ? (
                 <Popover open={isSearching && searchTerm.length > 0 && hasResults}>
                    <PopoverTrigger asChild>
                         <div className="relative w-full">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onBlur={() => {
                                    if(!hasResults) setIsSearching(false);
                                }}
                                placeholder="Buscar..."
                                className="pl-8 h-9"
                            />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0 bg-card"
                        side="bottom"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={() => setIsSearching(false)}
                    >
                        <Command>
                            <CommandList>
                                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                {searchResults.clients.length > 0 && (
                                    <CommandGroup heading="Clientes">
                                        {searchResults.clients.map(client => (
                                            <CommandItem key={`client-${client.id}`} onSelect={() => handleSelect(`/contacts?openClient=${client.id}`)}>
                                                <Users className="mr-2 h-4 w-4" />
                                                <span>{client.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {searchResults.promoters.length > 0 && (
                                     <CommandGroup heading="Promotores">
                                        {searchResults.promoters.map(p => (
                                            <CommandItem key={`promoter-${p.id}`} onSelect={() => handleSelect(`/contacts?openPromoter=${p.id}`)}>
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                <span>{p.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                 {searchResults.suppliers.length > 0 && (
                                     <CommandGroup heading="Proveedores">
                                        {searchResults.suppliers.map(s => (
                                            <CommandItem key={`supplier-${s.id}`} onSelect={() => handleSelect(`/contacts?openSupplier=${s.id}`)}>
                                                <Truck className="mr-2 h-4 w-4" />
                                                <span>{s.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {searchResults.services.length > 0 && (
                                     <CommandGroup heading="Servicios">
                                        {searchResults.services.map(s => (
                                            <CommandItem key={`service-${s.id}`} onSelect={() => handleSelect(`/services`)}>
                                                <ListTodo className="mr-2 h-4 w-4" />
                                                <span>{s.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            ) : (
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
                    <DropdownMenuContent side="bottom" align="start" className="mb-2 bg-card">
                         <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsSearching(true); }}>
                           <Search className="mr-2 h-4 w-4" />
                           <span>Buscar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setIsSmartUploadDialogOpen(true)}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            <span>Subir Documento</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsAddTaskDialogOpen(true)}>
                            <ListTodo className="mr-2 h-4 w-4" />
                            <span>Crear Tarea</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setIsAddClientDialogOpen(true)}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Crear Cliente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsAddPromoterDialogOpen(true)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Crear Promotor</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => setIsAddSupplierDialogOpen(true)}>
                            <Truck className="mr-2 h-4 w-4" />
                            <span>Crear Proveedor</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
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

import { SidebarNav } from "./shared/sidebar-nav";
