
"use client";

import React from "react";
import { Header } from "@/components/header";
import { Users, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/shared/UsersTab";
import { PromotersTab } from "@/components/shared/PromotersTab";

export default function DirectoryPage() {

  return (
      <div className="flex flex-col min-h-screen">
        <Header title="Directorio" description="Gestione sus usuarios y promotores." />
        <main className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">
                        <Users className="mr-2 h-4 w-4"/>
                        Usuarios
                    </TabsTrigger>
                    <TabsTrigger value="promoters">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Promotores
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-6">
                    <UsersTab />
                </TabsContent>
                <TabsContent value="promoters" className="mt-6">
                    <PromotersTab />
                </TabsContent>
            </Tabs>
        </main>
      </div>
  );
}
