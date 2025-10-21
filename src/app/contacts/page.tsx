
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Users, UserCheck, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/shared/ClientsTab";
import { PromotersTab } from "@/components/shared/PromotersTab";
import { promoters } from "@/lib/data";
import { useCRMData } from "@/contexts/CRMDataContext";
import { AddEditClientDialog } from "@/components/shared/AddEditClientDialog";
import { ClientDetailView } from "@/components/shared/ClientDetailView";
import type { Client } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function DirectoryPage() {
  const { clients, isLoadingClients, getClientById, currentUser } = useCRMData();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const canCreateClient = currentUser?.permissions.clients_create ?? true;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title={activeTab === 'clients' ? "Directorio de Clientes" : "Directorio de Promotores"}
          description={activeTab === 'clients' ? "Gestione su base de datos de clientes." : "Consulte la información de sus promotores."}
        >
          {canCreateClient && activeTab === 'clients' && (
              <button
                onClick={() => setIsAddClientDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                  <PlusCircle />
                  <span>Añadir Cliente</span>
              </button>
          )}
        </Header>
        <main className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="clients" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="clients">
                        <Users className="mr-2 h-4 w-4"/>
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="promoters">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Promotores
                    </TabsTrigger>
                </TabsList>
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
