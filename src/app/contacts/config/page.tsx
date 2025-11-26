

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Users, UserCheck, PlusCircle, Truck, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/shared/ClientsTab";
import { PromotersTab } from "@/components/shared/PromotersTab";
import { SuppliersTab } from "@/components/shared/SuppliersTab";
import { useCRMData } from "@/contexts/CRMDataContext";
import { AddEditClientDialog } from "@/components/shared/AddEditClientDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddSupplierDialog } from "@/components/shared/AddSupplierDialog";
import { AddPromoterDialog } from "@/components/shared/AddPromoterDialog";
import { type Promoter, type Supplier } from "@/lib/types";

export default function DirectoryConfigPage() {
  const { 
    clients, isLoadingClients, 
    promoters, isLoadingPromoters, addPromoter, updatePromoter, deletePromoter,
    suppliers, isLoadingSuppliers, addSupplier, updateSupplier, deleteSupplier,
    currentUser 
  } = useCRMData();
  
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isAddPromoterDialogOpen, setIsAddPromoterDialogOpen] = useState(false);

  const canCreate = currentUser?.permissions.clients_create ?? true;

  const handleAddOptionClick = (type: 'client' | 'supplier' | 'promoter') => {
    if (type === 'client') {
      setIsAddClientDialogOpen(true);
    } else if (type === 'supplier') {
        setIsAddSupplierDialogOpen(true);
    } else if (type === 'promoter') {
        setIsAddPromoterDialogOpen(true);
    }
  };

  const handleAddSupplier = async (data: Omit<Supplier, 'id'>) => {
    await addSupplier(data);
  };
  
  const handleUpdateSupplier = async (data: Supplier) => {
    await updateSupplier(data.id, data);
  };

  const handleAddPromoter = async (data: Omit<Promoter, 'id' | 'referredClients' | 'totalCommissions' | 'status'> & {status: string}) => {
    await addPromoter({
      ...data,
      status: data.status as 'Activo' | 'Inactivo',
      referredClients: 0,
      totalCommissions: 0,
    });
  };

  const handleUpdatePromoter = async (data: Promoter) => {
    await updatePromoter(data.id, data);
  };
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title="Configuración de Base de Datos"
          description="Gestione sus clientes, proveedores y promotores."
        >
          <Button variant="outline" asChild>
            <Link href="/contacts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Base de Datos
            </Link>
          </Button>
          {canCreate && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Nuevo
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
                    <SuppliersTab 
                      suppliers={suppliers || []} 
                      isLoading={isLoadingSuppliers}
                      onUpdate={handleUpdateSupplier}
                      onDelete={deleteSupplier}
                      showActions={true} 
                    />
                </TabsContent>
                <TabsContent value="clients">
                    <ClientsTab 
                      clients={clients || []} 
                      isLoading={isLoadingClients}
                      onClientSelect={() => {}} // No detail view from config page
                      selectedClientId={null}
                      showActions={true}
                    />
                </TabsContent>
                <TabsContent value="promoters">
                    <PromotersTab 
                      promoters={promoters || []} 
                      isLoading={isLoadingPromoters} 
                      onUpdate={handleUpdatePromoter}
                      onDelete={deletePromoter}
                      showActions={true} 
                    />
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
        onAdd={handleAddSupplier}
      />

      <AddPromoterDialog
        isOpen={isAddPromoterDialogOpen}
        onClose={() => setIsAddPromoterDialogOpen(false)}
        onAdd={handleAddPromoter as any}
      />
    </>
  );
}
