
"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Briefcase, Workflow } from "lucide-react";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useDialogs } from "@/contexts/DialogsContext";

export default function ServicesPage() {
  const { serviceWorkflows, isLoadingWorkflows, addService, currentUser } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();

  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  if (isLoadingWorkflows) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Servicios"
          description="Gestione los servicios que ofrece su empresa."
        >
            {canEditWorkflow && (
                <Button disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Nuevo Servicio
                </Button>
            )}
        </Header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Servicios"
        description="Gestione los servicios que ofrece su empresa."
      >
        {canEditWorkflow && (
            <Button onClick={() => addService()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Nuevo Servicio
            </Button>
        )}
      </Header>
      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceWorkflows && serviceWorkflows.length > 0 ? (
            serviceWorkflows.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-accent" />
                    {service.name}
                  </CardTitle>
                  <CardDescription>
                    {service.subServices.reduce((acc, ss) => acc + ss.stages.length, 0)} etapas en el flujo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Este es uno de los servicios principales de su negocio. Puede configurar su flujo de trabajo asociado.
                    </p>
                </CardContent>
                <CardContent>
                   <Button asChild variant="outline" className="w-full">
                       <Link href={`/workflows?serviceId=${service.id}`}>
                          <Workflow className="mr-2 h-4 w-4"/>
                          Configurar Flujo
                       </Link>
                   </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-16 border border-dashed rounded-lg">
              <Briefcase className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">No hay servicios configurados</h3>
              <p className="text-sm mt-1">
                Empiece por añadir un nuevo servicio para poder configurar su flujo de trabajo.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
