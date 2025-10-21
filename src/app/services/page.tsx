
"use client";

import React from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, Download, Briefcase, Loader2 } from "lucide-react";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useDialogs } from "@/contexts/DialogsContext";
import { useToast } from "@/hooks/use-toast";

export default function ServicesPage() {
  const { serviceWorkflows, isLoadingWorkflows } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();
  const { toast } = useToast();

  const handleDownload = (fileName: string) => {
    toast({
      title: "Descarga iniciada (simulación)",
      description: `El archivo "${fileName}" ha comenzado a descargarse.`,
    });
  };

  if (isLoadingWorkflows) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header
                title="Servicios"
                description="Gestione los recursos y documentos para cada servicio."
            />
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Servicios"
        description="Gestione los recursos y documentos para cada servicio."
      />
      <main className="flex-1 p-4 md:p-8">
        {serviceWorkflows && serviceWorkflows.length > 0 ? (
          <Tabs defaultValue={serviceWorkflows[0].id} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {serviceWorkflows.map((service) => (
                <TabsTrigger key={service.id} value={service.id}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    {service.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {serviceWorkflows.map((service) => (
              <TabsContent key={service.id} value={service.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Documentos para: {service.name}</CardTitle>
                            <CardDescription>
                            Recursos y plantillas específicas para este servicio.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsSmartUploadDialogOpen(true)}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Subir Documento
                        </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                       <ul className="divide-y">
                            {/* Placeholder for documents */}
                            <li className="text-center text-muted-foreground p-8">
                                <FileText className="mx-auto h-10 w-10 mb-2"/>
                                No hay documentos específicos para este servicio todavía.
                            </li>
                       </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
            <Card className="text-center text-muted-foreground p-8">
                 <Briefcase className="mx-auto h-12 w-12 mb-4"/>
                <h3 className="text-lg font-semibold">No hay servicios configurados</h3>
                <p className="text-sm mt-1">Vaya a la sección de CRM para configurar sus servicios y flujos de trabajo.</p>
            </Card>
        )}
      </main>
    </div>
  );
}

