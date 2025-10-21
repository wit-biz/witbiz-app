
"use client";

import React from "react";
import { Header } from "@/components/header";
import { Users, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/shared/ClientsTab";
import { PromotersTab } from "@/components/shared/PromotersTab";
import { clients, promoters } from "@/lib/data";
import { useCRMData } from "@/contexts/CRMDataContext";

export default function DirectoryPage() {
  const { clients: liveClients, isLoadingClients } = useCRMData();

  // For now, we will use the mock data as the live data isn't wired up.
  // In a real scenario, you'd likely pass liveClients and a list of promoters.
  const displayClients = isLoadingClients ? [] : clients;
  
  return (
      <div className="flex flex-col min-h-screen">
        <Header title="Directorio" description="Gestione sus clientes y promotores." />
        <main className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="clients" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="clients">
                        <Users className="mr-2 h-4 w-4"/>
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="promoters">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Promotores
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="clients" className="mt-6">
                    <ClientsTab clients={displayClients} isLoading={isLoadingClients} />
                </TabsContent>
                <TabsContent value="promoters" className="mt-6">
                    <PromotersTab promoters={promoters} isLoading={false} />
                </TabsContent>
            </Tabs>
        </main>
      </div>
  );
}
