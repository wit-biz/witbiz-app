
"use client";

import React, { useState, useEffect } from "react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromoterDetailView } from "@/components/shared/PromoterDetailView";
import { SupplierDetailView } from "@/components/shared/SupplierDetailView";

type DetailEntityType = 'client' | 'promoter' | 'supplier';

export default function DirectoryPage() {
  const { 
    clients, isLoadingClients,
    promoters, isLoadingPromoters,
    suppliers, isLoadingSuppliers,
  } = useCRMData();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedEntity, setSelectedEntity] = useState<{type: DetailEntityType, data: any} | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  useEffect(() => {
    const openClientId = searchParams.get('openClient');
    const openPromoterId = searchParams.get('openPromoter');
    const openSupplierId = searchParams.get('openSupplier');

    if (openClientId && clients) {
      const client = clients.find(c => c.id === openClientId);
      if(client) {
        setSelectedEntity({ type: 'client', data: client });
        setIsDetailDialogOpen(true);
      }
    } else if (openPromoterId && promoters) {
      const promoter = promoters.find(p => p.id === openPromoterId);
      if(promoter) {
        setSelectedEntity({ type: 'promoter', data: promoter });
        setIsDetailDialogOpen(true);
      }
    } else if (openSupplierId && suppliers) {
       const supplier = suppliers.find(s => s.id === openSupplierId);
      if(supplier) {
        setSelectedEntity({ type: 'supplier', data: supplier });
        setIsDetailDialogOpen(true);
      }
    }
  }, [searchParams, clients, promoters, suppliers]);
  
  const handleEntitySelect = (entity: any, type: DetailEntityType) => {
    setSelectedEntity({ type, data: entity });
    setIsDetailDialogOpen(true);
    router.push(`/contacts?open${type.charAt(0).toUpperCase() + type.slice(1)}=${entity.id}`, { scroll: false });
  };
  
  const handleCloseDetailView = () => {
    setIsDetailDialogOpen(false);
    setTimeout(() => {
        setSelectedEntity(null);
        router.push('/contacts', { scroll: false });
    }, 300);
  }
  
  const renderDetailView = () => {
    if (!selectedEntity) return null;
    switch(selectedEntity.type) {
      case 'client':
        return <ClientDetailView client={selectedEntity.data} onClose={handleCloseDetailView} />;
      case 'promoter':
        return <PromoterDetailView promoter={selectedEntity.data} onClose={handleCloseDetailView} />;
      case 'supplier':
        return <SupplierDetailView supplier={selectedEntity.data} onClose={handleCloseDetailView} />;
      default:
        return null;
    }
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
            <Tabs defaultValue="clients" className="w-full">
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
                    <SuppliersTab 
                      suppliers={suppliers || []} 
                      isLoading={isLoadingSuppliers} 
                      onSupplierSelect={(supplier) => handleEntitySelect(supplier, 'supplier')} 
                      selectedSupplierId={selectedEntity?.type === 'supplier' ? selectedEntity.data.id : null}
                      showActions={false}
                    />
                </TabsContent>
                <TabsContent value="clients">
                    <ClientsTab 
                      clients={clients || []} 
                      isLoading={isLoadingClients}
                      onClientSelect={(client) => handleEntitySelect(client, 'client')}
                      selectedClientId={selectedEntity?.type === 'client' ? selectedEntity.data.id : null}
                      showActions={false}
                    />
                </TabsContent>
                <TabsContent value="promoters">
                    <PromotersTab 
                      promoters={promoters || []} 
                      isLoading={isLoadingPromoters}
                      onPromoterSelect={(promoter) => handleEntitySelect(promoter, 'promoter')}
                      selectedPromoterId={selectedEntity?.type === 'promoter' ? selectedEntity.data.id : null}
                      showActions={false} 
                    />
                </TabsContent>
                            </Tabs>
        </main>
      </div>
      
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => !open && handleCloseDetailView()}>
        <DialogContent className="max-w-2xl">
           {renderDetailView()}
        </DialogContent>
      </Dialog>
    </>
  );
}
