

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Loader2, FileText, Download, Briefcase, Workflow as WorkflowIcon, Eye, Package, ChevronRight, Users, Circle, CheckCircle2, ArrowRight, ExternalLink, Phone, Mail, Building2, Calendar, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ClientDetailView } from "@/components/shared/ClientDetailView";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Document, type ServicePackage, type WorkflowStage, type SubStage, type SubSubStage, type Client } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Professional color palette for stages
const professionalColors = [
  { solid: 'bg-slate-700 dark:bg-slate-600', text: 'text-white', accent: 'border-slate-700 dark:border-slate-500' },
  { solid: 'bg-blue-700 dark:bg-blue-600', text: 'text-white', accent: 'border-blue-700 dark:border-blue-500' },
  { solid: 'bg-emerald-700 dark:bg-emerald-600', text: 'text-white', accent: 'border-emerald-700 dark:border-emerald-500' },
  { solid: 'bg-violet-700 dark:bg-violet-600', text: 'text-white', accent: 'border-violet-700 dark:border-violet-500' },
  { solid: 'bg-amber-600 dark:bg-amber-500', text: 'text-white', accent: 'border-amber-600 dark:border-amber-500' },
  { solid: 'bg-rose-700 dark:bg-rose-600', text: 'text-white', accent: 'border-rose-700 dark:border-rose-500' },
];

// Clickable client badge with popover and detail sheet
function ClientBadge({ client, compact = false }: { client: Client; compact?: boolean }) {
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const { serviceWorkflows } = useCRMData();
  
  // Get current stage info
  const currentStageInfo = React.useMemo(() => {
    if (!client.currentWorkflowStageId) return null;
    for (const workflow of serviceWorkflows) {
      for (const stage of workflow.stages || []) {
        if (stage.id === client.currentWorkflowStageId) {
          return { stage, service: workflow };
        }
        for (const sub of stage.subStages || []) {
          if (sub.id === client.currentWorkflowStageId) {
            return { stage: sub, service: workflow, parent: stage };
          }
          for (const subSub of sub.subSubStages || []) {
            if (subSub.id === client.currentWorkflowStageId) {
              return { stage: subSub, service: workflow, parent: stage };
            }
          }
        }
      }
    }
    return null;
  }, [client.currentWorkflowStageId, serviceWorkflows]);
  
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 transition-all cursor-pointer group hover:bg-muted/50 rounded px-1.5 py-0.5 w-full text-left",
          )}>
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))] flex-shrink-0" />
            <span className={cn(
              "truncate group-hover:underline",
              compact ? "text-[11px]" : "text-xs"
            )}>
              {client.name}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--accent))] flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{client.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={client.status === 'Activo' ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {client.status || 'Sin estado'}
                  </Badge>
                  {client.category && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {client.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Current Stage */}
            {currentStageInfo && (
              <div className="p-2 rounded-md bg-muted/50 border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Etapa Actual</p>
                <p className="text-sm font-medium">{currentStageInfo.stage.title}</p>
                <p className="text-xs text-muted-foreground">{currentStageInfo.service.name}</p>
              </div>
            )}
            
            {/* Contact Info */}
            <div className="space-y-1.5 text-sm">
              {client.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs">{client.phone}</span>
                </div>
              )}
              {client.rfc && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs">{client.rfc}</span>
                </div>
              )}
            </div>
            
            {/* Action Button */}
            <div className="pt-2 border-t">
              <Button size="sm" className="w-full" onClick={() => setIsDetailOpen(true)}>
                <Eye className="h-3.5 w-3.5 mr-2" />
                Ver Detalles Completos
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Full Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <ClientDetailView client={client} onClose={() => setIsDetailOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

// Stage node component with client list
function StageNode({ 
  number, 
  title, 
  clients, 
  colorIndex,
  hasSubStages,
  subStages,
  getClientsInStage
}: { 
  number: string;
  title: string;
  clients: Client[];
  colorIndex: number;
  hasSubStages?: boolean;
  subStages?: SubStage[];
  getClientsInStage: (stageId: string) => Client[];
}) {
  const color = professionalColors[colorIndex % professionalColors.length];
  
  return (
    <div className="flex flex-col min-w-[180px]">
      {/* Main stage */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-md flex-shrink-0",
          color.solid, color.text
        )}>
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          {clients.length > 0 && (
            <div className="mt-2 space-y-1">
              {clients.slice(0, 4).map(client => (
                <ClientBadge key={client.id} client={client} />
              ))}
              {clients.length > 4 && (
                <span className="text-xs text-muted-foreground block ml-3.5">
                  +{clients.length - 4} más
                </span>
              )}
            </div>
          )}
          {clients.length === 0 && (
            <p className="text-xs text-muted-foreground/50 mt-1">Sin clientes</p>
          )}
        </div>
      </div>
      
      {/* Sub-stages */}
      {hasSubStages && subStages && subStages.length > 0 && (
        <div className="ml-5 mt-3 pl-4 border-l-2 border-dashed border-muted-foreground/20 space-y-3">
          {subStages.map((subStage, subIdx) => {
            const subClients = getClientsInStage(subStage.id);
            return (
              <div key={subStage.id}>
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shadow-sm flex-shrink-0",
                    "bg-muted border-2", color.accent
                  )}>
                    {number}.{subIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{subStage.title}</p>
                    {subClients.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {subClients.slice(0, 3).map(client => (
                          <ClientBadge key={client.id} client={client} compact />
                        ))}
                        {subClients.length > 3 && (
                          <span className="text-[10px] text-muted-foreground block ml-3">+{subClients.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sub-sub-stages */}
                {subStage.subSubStages && subStage.subSubStages.length > 0 && (
                  <div className="ml-4 mt-2 pl-3 border-l border-dotted border-muted-foreground/15 space-y-2">
                    {subStage.subSubStages.map((subSubStage, subSubIdx) => {
                      const subSubClients = getClientsInStage(subSubStage.id);
                      return (
                        <div key={subSubStage.id} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium bg-muted/50 border flex-shrink-0">
                            {subSubIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{subSubStage.title}</p>
                            {subSubClients.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {subSubClients.slice(0, 2).map(client => (
                                  <ClientBadge key={client.id} client={client} compact />
                                ))}
                                {subSubClients.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground block ml-3">+{subSubClients.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Visual workflow component
function WorkflowTimeline({ stages, getClientsInStage }: { 
  stages: WorkflowStage[], 
  getClientsInStage: (stageId: string) => Client[] 
}) {
  if (!stages || stages.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin etapas definidas</p>;
  }

  return (
    <div className="space-y-1">
      {stages.map((stage, idx) => {
        const clientsInStage = getClientsInStage(stage.id);
        const hasSubStages = stage.subStages && stage.subStages.length > 0;
        
        return (
          <div key={stage.id} className="relative">
            {/* Connector line */}
            {idx < stages.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/10" />
            )}
            
            <div className="py-3">
              <StageNode
                number={String(idx + 1)}
                title={stage.title}
                clients={clientsInStage}
                colorIndex={idx}
                hasSubStages={hasSubStages}
                subStages={stage.subStages}
                getClientsInStage={getClientsInStage}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServiceDocuments({ serviceId }: { serviceId: string }) {
  const { getDocumentsByServiceId } = useCRMData();
  const documents = getDocumentsByServiceId(serviceId);
  const { toast } = useToast();
  
  const handleDownload = (doc: Document) => {
    if (doc.downloadURL) {
        window.open(doc.downloadURL, '_blank');
    } else {
        toast({
            variant: "destructive",
            title: "Sin URL",
            description: "No se pudo encontrar la URL de descarga para este archivo."
        });
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Documentos del Servicio</h4>
      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li 
              key={doc.id} 
              className="flex items-center justify-between p-2 bg-secondary/30 rounded-md cursor-pointer hover:bg-secondary/60"
              onClick={() => handleDownload(doc)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
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
  const { serviceWorkflows, isLoadingWorkflows, servicePackages, isLoadingPackages, clients } = useCRMData();
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);

  const sortedWorkflows = useMemo(() => {
    if (!serviceWorkflows) return [];
    return [...serviceWorkflows]
      .filter(s => s.status !== 'Archivado')
      .sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [serviceWorkflows]);

  const activePackages = useMemo(() => {
    if (!servicePackages) return [];
    return servicePackages.filter(p => p.status !== 'Archivado');
  }, [servicePackages]);

  // Get combined stages for a package (all stages from all services in order)
  const getPackageStages = (pkg: ServicePackage) => {
    const stages: { stage: WorkflowStage; serviceName: string; serviceId: string }[] = [];
    pkg.serviceIds.forEach(serviceId => {
      const service = sortedWorkflows.find(s => s.id === serviceId);
      if (service) {
        (service.stages || []).forEach(stage => {
          stages.push({ stage, serviceName: service.name, serviceId: service.id });
        });
      }
    });
    return stages;
  };

  // Get clients subscribed to a package
  const getPackageClients = (pkg: ServicePackage) => {
    return clients.filter(c => 
      c.status === 'Activo' && 
      c.subscribedPackageIds?.includes(pkg.id)
    );
  };

  // Get clients in a specific stage
  const getClientsInStage = (stageId: string) => {
    return clients.filter(c => c.status === 'Activo' && c.currentWorkflowStageId === stageId);
  };


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
      <main className="flex-1 p-4 md:p-8 space-y-8">
        {/* Packages Section */}
        {activePackages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paquetes de Servicios
            </h2>
            <div className="space-y-6">
              {activePackages.map(pkg => {
                const packageStages = getPackageStages(pkg);
                const packageClients = getPackageClients(pkg);
                const serviceNames = pkg.serviceIds
                  .map(id => sortedWorkflows.find(s => s.id === id)?.name)
                  .filter(Boolean);
                
                return (
                  <Card key={pkg.id} className="border-2 border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            {pkg.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {serviceNames.join(' + ')}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {packageClients.length} clientes
                        </Badge>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pkg.serviceIds.map((serviceId, svcIdx) => {
                          const service = sortedWorkflows.find(s => s.id === serviceId);
                          if (!service) return null;
                          const color = professionalColors[svcIdx % professionalColors.length];
                          return (
                            <Card key={serviceId} className={cn("border-t-4", color.border)}>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  {service.name}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <WorkflowTimeline 
                                  stages={service.stages || []} 
                                  getClientsInStage={getClientsInStage} 
                                />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Individual Services Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Servicios Individuales
          </h2>
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
                                  
                                  {/* Service Flow Preview */}
                                  <div className="p-4 rounded-lg bg-muted/30 border">
                                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                      <WorkflowIcon className="h-4 w-4" />
                                      Flujo del Servicio
                                    </h4>
                                    <WorkflowTimeline 
                                      stages={service.stages || []} 
                                      getClientsInStage={getClientsInStage} 
                                    />
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
        </section>
      </main>
    </div>
  );
}
