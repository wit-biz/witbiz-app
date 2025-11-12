
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type ServiceWorkflow, type ClientRequirement, type Commission } from "@/contexts/CRMDataContext";
import { Loader2, FileText, Workflow as WorkflowIcon, Download, Briefcase } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function ServiceDocuments({ serviceId }: { serviceId: string }) {
  const { getDocumentsByServiceId } = useCRMData();
  const documents = getDocumentsByServiceId(serviceId);
  const { toast } = useToast();
  
  const handleDownload = (doc: Document) => {
    toast({
        title: "Descarga Simulada",
        description: `Se ha iniciado la descarga de "${doc.name}".`
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Documentos del Servicio</h4>
      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
              </div>
              <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No hay documentos para este servicio.</p>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const { serviceWorkflows, isLoadingWorkflows } = useCRMData();
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);

  const sortedWorkflows = useMemo(() => {
    if (!serviceWorkflows) return [];
    return [...serviceWorkflows].sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [serviceWorkflows]);


  if (isLoadingWorkflows) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Servicios" description="Consulte los servicios y la documentación asociada.">
            <Button asChild>
                <Link href="/workflows?from=services"><WorkflowIcon className="mr-2 h-4 w-4" />Configurar Flujo y Servicio</Link>
            </Button>
        </Header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Servicios" description="Consulte los servicios y la documentación asociada.">
        <Button asChild>
            <Link href="/workflows?from=services"><WorkflowIcon className="mr-2 h-4 w-4" />Configurar Flujo y Servicio</Link>
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8">
        {sortedWorkflows && sortedWorkflows.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordionItem} onValueChange={setOpenAccordionItem}>
              {sortedWorkflows.map((service) => {
                return (
                  <AccordionItem value={service.id} key={service.id} asChild>
                     <Card>
                        <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                            <CardHeader className="flex-1 text-left">
                                <CardTitle className="text-lg">
                                    {service.name}
                                </CardTitle>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-sm">Descripción</h4>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{service.description || 'No hay descripción.'}</p>
                                </div>
                                
                                <ServiceDocuments serviceId={service.id} />

                                <div>
                                    <h4 className="font-semibold text-sm">Requisitos del Cliente</h4>
                                    {service.clientRequirements && service.clientRequirements.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-muted-foreground">
                                            {service.clientRequirements.map(req => <li key={req.id}>{req.text}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-1">No hay requisitos especificados.</p>
                                    )}
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-sm">Tarifas de Comisión</h4>
                                  {service.commissions && service.commissions.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-muted-foreground">
                                      {service.commissions.map(com => <li key={com.id}>{com.name}: {com.rate}%</li>)}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-muted-foreground mt-1">No hay comisiones especificadas.</p>
                                  )}
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                  </AccordionItem>
                )
              })}
            </Accordion>
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-16 border border-dashed rounded-lg">
            <Briefcase className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">No hay servicios configurados</h3>
            <p className="text-sm mt-1">Vaya a la sección de configuración para añadir un nuevo servicio.</p>
          </div>
        )}
      </main>
    </div>
  );
}
