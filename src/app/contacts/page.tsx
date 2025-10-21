
"use client";

import React from "react";
import { Header } from "@/components/header";
import { Users, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/shared/ClientsTab";
import { PromotersTab } from "@/components/shared/PromotersTab";

export default function DirectoryPage() {

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
                    <ClientsTab />
                </TabsContent>
                <TabsContent value="promoters" className="mt-6">
                    <PromotersTab />
                </TabsContent>
            </Tabs>
        </main>
      </div>
  );
}

    