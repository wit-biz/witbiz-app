
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Users, UserCheck, PlusCircle, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/shared/ClientsTab";
import { PromotersTab } from "@/components/shared/PromotersTab";
import { SuppliersTab } from "@/components/shared/SuppliersTab";
import { promoters } from "@/lib/data";
import { useCRMData } from "@/contexts/CRMDataContext";
import { AddEditClientDialog } from "@/components/shared/AddEditClientDialog";
import { ClientDetailView } from "@/components/shared/ClientDetailView";
import type { Client } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AddSupplierDialog } from "@/components/shared/AddSupplierDialog";
import { AddPromoterDialog } from "@/components/shared/AddPromoterDialog";


export default function DirectoryPage() {
  const { clients, isLoadingClients, getClientById, currentUser } = useCRMData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isAddPromoterDialogOpen, setIsAddPromoterDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('suppliers');
  
  useEffect(() => {
    const openClientId = searchParams.get('openClient');
    if (openClientId) {
      const client = getClientById(openClientId);
      if(client) {
        setSelectedClient(client);
        setIsDetailDialogOpen(true);
      }
    } else {
        setSelectedClient(null);
        setIsDetailDialogOpen(false);
    }
  }, [searchParams, clients, getClientById]);
  
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsDetailDialogOpen(true);
    router.push(`/contacts?openClient=${client.id}`, { scroll: false });
  };
  
  const handleCloseDetailView = () => {
    setIsDetailDialogOpen(false);
    // Allow animation to finish before removing from URL
    setTimeout(() => {
        setSelectedClient(null);
        router.push('/contacts', { scroll: false });
    }, 300);
  }

  const canCreate = currentUser?.permissions.clients_create ?? true; // Assuming similar permissions for others

  const handleAddOptionClick = (type: 'client' | 'supplier' | 'promoter') => {
    if (type === 'client') {
      setIsAddClientDialogOpen(true);
    } else if (type === 'supplier') {
        setIsAddSupplierDialogOpen(true);
    } else if (type === 'promoter') {
        setIsAddPromoterDialogOpen(true);
    }
  };
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title="Base de Datos de Contactos"
          description="Gestione sus clientes, proveedores y promotores."
        >
          {canCreate && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleAddOptionClick('supplier')}>
                        <Truck className="mr-2 h-4 w-4" />
                        <span>Añadir Proveedor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleAddOptionClick('client')}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Añadir Cliente</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onSelect={() => handleAddOptionClick('promoter')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>Añadir Promotor</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          )}
        </Header>
        <main className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="suppliers" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                     <TabsTrigger value="suppliers">
                        <Truck className="mr-2 h-4 w-4"/>
                        Proveedores
                    </TabsTrigger>
                    <TabsTrigger value="clients">
                        <Users className="mr-2 h-4 w-4"/>
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="promoters">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Promotores
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="suppliers">
                    <SuppliersTab />
                </TabsContent>
                <TabsContent value="clients">
                    <ClientsTab 
                      clients={clients} 
                      isLoading={isLoadingClients}
                      onClientSelect={handleClientSelect}
                      selectedClientId={selectedClient?.id || null}
                    />
                </TabsContent>
                <TabsContent value="promoters">
                    <PromotersTab promoters={promoters} isLoading={false} />
                </TabsContent>
            </Tabs>
        </main>
      </div>
      
      <AddEditClientDialog
        client={null}
        isOpen={isAddClientDialogOpen}
        onClose={() => setIsAddClientDialogOpen(false)}
      />

      <AddSupplierDialog
        isOpen={isAddSupplierDialogOpen}
        onClose={() => setIsAddSupplierDialogOpen(false)}
        onAdd={(data) => console.log('New Supplier:', data)}
      />

      <AddPromoterDialog
        isOpen={isAddPromoterDialogOpen}
        onClose={() => setIsAddPromoterDialogOpen(false)}
        onAdd={(data) => console.log('New Promoter:', data)}
      />


      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => !open && handleCloseDetailView()}>
        <DialogContent className="max-w-2xl">
           <ClientDetailView client={selectedClient} onClose={handleCloseDetailView} />
        </DialogContent>
      </Dialog>
    </>
  );
}
