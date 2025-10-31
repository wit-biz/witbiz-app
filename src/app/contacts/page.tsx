
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


export default function DirectoryPage() {
  const { clients, isLoadingClients, getClientById, currentUser } = useCRMData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('clients');
  
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

  const headerInfo: { [key: string]: { title: string; description: string } } = {
    suppliers: {
        title: "Directorio de Proveedores",
        description: "Consulte y gestione la información de sus proveedores."
    },
    clients: {
      title: "Base de Datos de Clientes",
      description: "Gestione su base de datos de clientes.",
    },
    promoters: {
      title: "Directorio de Promotores",
      description: "Consulte y filtre la información de sus promotores.",
    },
  };

  const buttonLabels: { [key: string]: string } = {
    suppliers: "Añadir Proveedor",
    clients: "Añadir Cliente",
    promoters: "Añadir Promotor",
  };

  const handleAddButtonClick = () => {
    if (activeTab === 'clients') {
      setIsAddClientDialogOpen(true);
    } else {
      toast({
        title: "Función en desarrollo",
        description: `La funcionalidad para añadir un nuevo ${activeTab === 'suppliers' ? 'proveedor' : 'promotor'} aún no está implementada.`,
      });
    }
  };
  
  const currentHeaderInfo = headerInfo[activeTab] || headerInfo.clients;
  const currentButtonLabel = buttonLabels[activeTab] || "Añadir";

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title={currentHeaderInfo.title}
          description={currentHeaderInfo.description}
        >
          {canCreate && (
              <button
                onClick={handleAddButtonClick}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                  <PlusCircle />
                  <span>{currentButtonLabel}</span>
              </button>
          )}
        </Header>
        <main className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="clients" className="w-full" onValueChange={setActiveTab}>
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

      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => !open && handleCloseDetailView()}>
        <DialogContent className="max-w-2xl">
           <ClientDetailView client={selectedClient} onClose={handleCloseDetailView} />
        </DialogContent>
      </Dialog>
    </>
  );
}
