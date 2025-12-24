"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, UploadCloud, UserPlus, ListTodo, Users, UserCheck, Truck, Search, Trash2, X, Minus, Maximize2 } from "lucide-react";
import { useDialogs } from "@/contexts/DialogsContext";
import { cn } from "@/lib/utils";
import { Logo } from "./shared/logo";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCRMData as useCRMDataClient } from "@/contexts/CRMDataContext";
import { VertexAIChat } from "./shared/VertexAIChat";


export function AppSidebar() {
  const { 
    setIsSmartUploadDialogOpen,
    setIsAddClientDialogOpen,
    setIsAddTaskDialogOpen,
    setIsAddPromoterDialogOpen,
    setIsAddSupplierDialogOpen,
   } = useDialogs();
   
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const { clients, promoters, suppliers, serviceWorkflows, currentUser } = useCRMData();

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
    setSearchTerm("");
    setIsSearching(false);
  };

  const canViewRecyclingBin = currentUser?.permissions.admin_view ?? false;


  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground sr-only">WitBiz</h1>
        </div>
        <div className="p-2 flex justify-center">
{isSearching && (
                <div 
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isMinimized) {
                    setIsSearching(false);
                    setIsMinimized(false);
                  }
                }}
                className={cn(
                  "fixed z-50 transition-all duration-300",
                  isMinimized 
                    ? "bottom-4 right-4 w-80" 
                    : "inset-0 bg-black/50 flex items-center justify-center p-4"
                )}>
                    <div className={cn(
                      "bg-background rounded-lg shadow-xl overflow-hidden",
                      isMinimized ? "w-full" : "max-w-2xl w-full max-h-[80vh]"
                    )}>
                        <div className="p-3 border-b flex items-center justify-between bg-card">
                            <div className="flex items-center gap-2">
                              <img 
                                src="https://firebasestorage.googleapis.com/v0/b/wit-biz-07943714-b10c8.firebasestorage.app/o/assets%2FDonna.png?alt=media&token=fca9a5aa-2bb0-47dc-b695-e8624c3a35ce" 
                                alt="Donna" 
                                className="h-6 w-6 rounded-full object-cover"
                              />
                              <h2 className="text-sm font-semibold">Donna - Asistente IA</h2>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsMinimized(!isMinimized)}
                              >
                                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => { setIsSearching(false); setIsMinimized(false); }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                        </div>
                        {!isMinimized && (
                          <div className="p-4">
                            <VertexAIChat />
                          </div>
                        )}
                    </div>
                </div>
            )}
            
            {!isSearching && (
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
                           <img 
                             src="https://firebasestorage.googleapis.com/v0/b/wit-biz-07943714-b10c8.firebasestorage.app/o/assets%2FDonna.png?alt=media&token=fca9a5aa-2bb0-47dc-b695-e8624c3a35ce" 
                             alt="Donna" 
                             className="mr-2 h-5 w-5 rounded-full object-cover"
                           />
                           <span>Donna - Asistente IA</span>
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
      <SidebarFooter className="mt-auto p-2">
         {canViewRecyclingBin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  isActive={pathname === "/recycling-bin"}
                  tooltip="Papelera"
                  variant="outline"
                  className="w-full justify-center"
              >
                  <Link href="/recycling-bin">
                      <Trash2 />
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
         )}
      </SidebarFooter>
    </Sidebar>
  );
}

import { SidebarNav } from "./shared/sidebar-nav";