
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Users, UserCheck, Truck, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/shared/ClientsTab";
import { PromotersTab } from "@/components/shared/PromotersTab";
import { SuppliersTab } from "@/components/shared/SuppliersTab";
import { useCRMData } from "@/contexts/CRMDataContext";
import { ClientDetailView } from "@/components/shared/ClientDetailView";
import type { Client } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DirectoryPage() {
  const { 
    clients, isLoadingClients, getClientById,
    promoters, isLoadingPromoters,
    suppliers, isLoadingSuppliers,
  } = useCRMData();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  useEffect(() => {
    const openClientId = searchParams.get('openClient');
    if (openClientId && !selectedClient) {
      const client = getClientById(openClientId);
      if(client) {
        setSelectedClient(client);
        setIsDetailDialogOpen(true);
      }
    }
  }, [searchParams, clients, getClientById, selectedClient]);
  
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

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title="Base de Datos de Contactos"
          description="Consulte sus clientes, proveedores y promotores."
        >
          <Button asChild>
            <Link href="/contacts/config">
              <Settings className="mr-2 h-4 w-4" />
              Configurar Base de Datos
            </Link>
          </Button>
        </Header>
        <main className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="suppliers" className="w-full">
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
                    <SuppliersTab suppliers={suppliers} isLoading={isLoadingSuppliers} showActions={false}/>
                </TabsContent>
                <TabsContent value="clients">
                    <ClientsTab 
                      clients={clients} 
                      isLoading={isLoadingClients}
                      onClientSelect={handleClientSelect}
                      selectedClientId={selectedClient?.id || null}
                      showActions={false}
                    />
                </TabsContent>
                <TabsContent value="promoters">
                    <PromotersTab promoters={promoters} isLoading={isLoadingPromoters} showActions={false} />
                </TabsContent>
            </Tabs>
        </main>
      </div>
      
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => !open && handleCloseDetailView()}>
        <DialogContent className="max-w-2xl">
           <ClientDetailView client={selectedClient} onClose={handleCloseDetailView} />
        </DialogContent>
      </Dialog>
    </>
  );
}
