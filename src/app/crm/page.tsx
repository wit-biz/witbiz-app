
"use client";

import React, { useMemo, useState, ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Users,
  Workflow,
  Settings,
  ListTodo,
  ChevronDown,
  ChevronsRight,
  ChevronRight,
  Briefcase,
  Eye,
  Mail,
  Phone,
  Building2,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, WorkflowStage, ServiceWorkflow, SubStage, SubSubStage, ServicePackage, Task } from '@/lib/types';
import { useCRMData } from "@/contexts/CRMDataContext";
import { Package, CheckSquare, Square, Clock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ClientDetailView } from "@/components/shared/ClientDetailView";

type AnyStage = WorkflowStage | SubStage | SubSubStage;

// Professional solid color palette (same as services)
const stageColorPalette = [
  { solid: 'bg-slate-700 dark:bg-slate-600', text: 'text-white', border: 'border-slate-700 dark:border-slate-500' },
  { solid: 'bg-blue-700 dark:bg-blue-600', text: 'text-white', border: 'border-blue-700 dark:border-blue-500' },
  { solid: 'bg-emerald-700 dark:bg-emerald-600', text: 'text-white', border: 'border-emerald-700 dark:border-emerald-500' },
  { solid: 'bg-violet-700 dark:bg-violet-600', text: 'text-white', border: 'border-violet-700 dark:border-violet-500' },
  { solid: 'bg-amber-600 dark:bg-amber-500', text: 'text-white', border: 'border-amber-600 dark:border-amber-500' },
  { solid: 'bg-rose-700 dark:bg-rose-600', text: 'text-white', border: 'border-rose-700 dark:border-rose-500' },
];

// Client badge with popover and detail sheet (same as services)
const ClientBadge = ({ client }: { client: Client }) => {
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const { serviceWorkflows } = useCRMData();
  
  const currentStageInfo = React.useMemo(() => {
    if (!client.currentWorkflowStageId) return null;
    for (const workflow of serviceWorkflows) {
      for (const stage of workflow.stages || []) {
        if (stage.id === client.currentWorkflowStageId) {
          return { stage, service: workflow };
        }
        for (const sub of stage.subStages || []) {
          if (sub.id === client.currentWorkflowStageId) {
            return { stage: sub, service: workflow };
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
          <button className="flex items-center gap-1.5 transition-all cursor-pointer group hover:bg-muted/50 rounded px-1.5 py-0.5 w-full text-left">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))] flex-shrink-0" />
            <span className="truncate text-xs group-hover:underline">{client.name}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-3">
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
            
            {currentStageInfo && (
              <div className="p-2 rounded-md bg-muted/50 border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Etapa Actual</p>
                <p className="text-sm font-medium">{currentStageInfo.stage.title}</p>
                <p className="text-xs text-muted-foreground">{currentStageInfo.service.name}</p>
              </div>
            )}
            
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
            
            <div className="pt-2 border-t">
              <Button size="sm" className="w-full" onClick={() => setIsDetailOpen(true)}>
                <Eye className="h-3.5 w-3.5 mr-2" />
                Ver Detalles Completos
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <ClientDetailView client={client} onClose={() => setIsDetailOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

const StageNumberIcon = ({ index }: { index: number }) => {
    const color = stageColorPalette[index % stageColorPalette.length];
    return (
        <div className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center font-semibold text-lg shadow-md",
            color.solid, color.text
        )}>
            {index + 1}
        </div>
    );
};
  
// Task display component
const TaskItem = ({ task }: { task: Task }) => {
    const isCompleted = task.status === 'Completada';
    const isPending = task.status === 'Pendiente';
    return (
        <div className={cn(
            "flex items-start gap-2 text-xs py-1 px-2 rounded",
            isCompleted ? "bg-emerald-50 dark:bg-emerald-950/30" : isPending ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted/30"
        )}>
            {isCompleted ? (
                <CheckSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
                <Square className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
                <span className={cn("truncate block", isCompleted && "line-through text-muted-foreground")}>{task.title}</span>
                {task.dueDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
};

// Full stage card with sub-stages, sub-sub-stages, and tasks
const FullStageCard = ({ 
    stage,
    index,
    clientsByStage,
    tasksByStage
}: { 
    stage: WorkflowStage,
    index: number,
    clientsByStage: Map<string, Client[]>,
    tasksByStage: Map<string, Task[]>
}) => {
    const color = stageColorPalette[index % stageColorPalette.length];
    const stageClients = clientsByStage.get(stage.id) || [];
    const stageTasks = tasksByStage.get(stage.id) || [];
    
    return (
        <div className={cn("border-l-4 rounded-lg bg-card shadow-sm", color.border)}>
            {/* Main Stage Header */}
            <div className="p-4">
                <div className="flex items-center gap-4">
                    <StageNumberIcon index={index} />
                    <div className="flex-grow">
                        <h3 className="font-semibold text-lg">{stage.title}</h3>
                        <p className="text-sm text-muted-foreground">{stage.actions?.length || 0} acciones automáticas</p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1.5 text-sm px-3 py-1">
                        <Users className="h-4 w-4" />
                        {stageClients.length}
                    </Badge>
                </div>
                
                {/* Main Stage Content */}
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {/* Tasks */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-foreground/80 flex items-center gap-1.5">
                            <ListTodo className="h-3.5 w-3.5" />
                            Tareas ({stageTasks.length})
                        </h4>
                        {stageTasks.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {stageTasks.map(task => (
                                    <TaskItem key={task.id} task={task} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Sin tareas</p>
                        )}
                    </div>
                    
                    {/* Clients */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-foreground/80 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            Clientes ({stageClients.length})
                        </h4>
                        {stageClients.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {stageClients.map(client => (
                                    <ClientBadge key={client.id} client={client} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Sin clientes</p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Sub-stages */}
            {stage.subStages && stage.subStages.length > 0 && (
                <div className="border-t bg-muted/20 p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">📋 Etapas</h4>
                    <div className="space-y-3">
                        {stage.subStages.map((subStage, subIdx) => {
                            const subClients = clientsByStage.get(subStage.id) || [];
                            const subTasks = tasksByStage.get(subStage.id) || [];
                            return (
                                <div key={subStage.id} className="ml-4 pl-4 border-l-2 border-muted-foreground/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-background",
                                            color.border
                                        )}>
                                            {index + 1}.{subIdx + 1}
                                        </div>
                                        <span className="font-medium text-sm">{subStage.title}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 ml-auto">
                                            <Users className="h-3 w-3 mr-1" />
                                            {subClients.length}
                                        </Badge>
                                    </div>
                                    
                                    {/* Sub-stage content */}
                                    <div className="grid md:grid-cols-2 gap-2 ml-9">
                                        {subTasks.length > 0 && (
                                            <div className="space-y-1">
                                                {subTasks.slice(0, 3).map(task => (
                                                    <TaskItem key={task.id} task={task} />
                                                ))}
                                                {subTasks.length > 3 && (
                                                    <p className="text-[10px] text-muted-foreground">+{subTasks.length - 3} más</p>
                                                )}
                                            </div>
                                        )}
                                        {subClients.length > 0 && (
                                            <div className="space-y-1">
                                                {subClients.slice(0, 3).map(client => (
                                                    <ClientBadge key={client.id} client={client} />
                                                ))}
                                                {subClients.length > 3 && (
                                                    <p className="text-[10px] text-muted-foreground">+{subClients.length - 3} más</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Sub-sub-stages */}
                                    {subStage.subSubStages && subStage.subSubStages.length > 0 && (
                                        <div className="mt-2 ml-9 space-y-2">
                                            {subStage.subSubStages.map((subSubStage, subSubIdx) => {
                                                const subSubClients = clientsByStage.get(subSubStage.id) || [];
                                                const subSubTasks = tasksByStage.get(subSubStage.id) || [];
                                                return (
                                                    <div key={subSubStage.id} className="pl-3 border-l border-dotted border-muted-foreground/20">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium bg-muted/50 border">
                                                                {subSubIdx + 1}
                                                            </div>
                                                            <span className="text-xs">{subSubStage.title}</span>
                                                            {subSubClients.length > 0 && (
                                                                <Badge variant="outline" className="text-[9px] h-4 ml-auto">
                                                                    {subSubClients.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {(subSubClients.length > 0 || subSubTasks.length > 0) && (
                                                            <div className="ml-7 mt-1 flex flex-wrap gap-2">
                                                                {subSubClients.slice(0, 2).map(client => (
                                                                    <ClientBadge key={client.id} client={client} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


export default function CrmPage() {
  const { clients, isLoadingClients, serviceWorkflows, isLoadingWorkflows, servicePackages, isLoadingPackages, tasks, isLoadingTasks } = useCRMData();

  const clientsByStage = useMemo(() => {
    if (isLoadingClients || !clients) return new Map<string, Client[]>();
    const map = new Map<string, Client[]>();
    clients.forEach(client => {
      const stageId = client.currentWorkflowStageId;
      if (stageId) {
        if (!map.has(stageId)) {
          map.set(stageId, []);
        }
        map.get(stageId)!.push(client);
      }
    });
    return map;
  }, [clients, isLoadingClients]);

  // Group tasks by stage ID
  const tasksByStage = useMemo(() => {
    if (isLoadingTasks || !tasks) return new Map<string, Task[]>();
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const stageId = task.stageId;
      if (stageId) {
        if (!map.has(stageId)) {
          map.set(stageId, []);
        }
        map.get(stageId)!.push(task);
      }
    });
    return map;
  }, [tasks, isLoadingTasks]);
  
  const activeWorkflows = useMemo(() => {
    if (!serviceWorkflows) return [];
    return serviceWorkflows.filter(s => s.status !== 'Archivado').sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [serviceWorkflows]);

  const activePackages = useMemo(() => {
    if (!servicePackages) return [];
    return servicePackages.filter(p => p.status !== 'Archivado');
  }, [servicePackages]);


  if (isLoadingClients || isLoadingWorkflows || isLoadingPackages || isLoadingTasks) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header
                title="Flujos de Trabajo (CRM)"
                description="Vista general de todos los clientes en cada etapa del flujo."
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
        title="Flujos de Trabajo (CRM)"
        description="Vista general de todos los clientes en cada etapa del flujo."
      >
        <Button asChild>
            <Link href="/workflows?from=crm">
                <Workflow className="mr-2 h-4 w-4" />
                Configurar Flujo y Servicio
            </Link>
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8 space-y-8">
        {/* Packages Section */}
        {activePackages && activePackages.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paquetes de Servicios
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {activePackages.map(pkg => (
                <AccordionItem value={pkg.id} key={pkg.id} asChild>
                  <Card className="border-l-4 border-violet-500">
                    <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                      <CardHeader className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-violet-500" />
                          <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        </div>
                        <CardDescription>{pkg.serviceIds?.length || 0} servicios incluidos</CardDescription>
                      </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                      <div className="space-y-6">
                        {pkg.serviceIds?.map((serviceId, svcIdx) => {
                          const service = activeWorkflows.find(s => s.id === serviceId);
                          if (!service) return null;
                          return (
                            <div key={serviceId} className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">{service.name}</h3>
                              </div>
                              <div className="space-y-4">
                                {(service.stages || []).sort((a,b) => a.order - b.order).map((stage, index) => (
                                  <FullStageCard
                                    key={stage.id}
                                    stage={stage}
                                    index={index}
                                    clientsByStage={clientsByStage}
                                    tasksByStage={tasksByStage}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Individual Services Section */}
        {activeWorkflows && activeWorkflows.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Servicios Individuales
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={activeWorkflows[0]?.id}>
              {activeWorkflows.map(service => (
                <AccordionItem value={service.id} key={service.id} asChild>
                  <Card>
                    <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                      <CardHeader className="flex-1 text-left">
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                        <CardDescription>Pipeline de clientes para este servicio.</CardDescription>
                      </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                      <div className="space-y-4">
                        {(service.stages || []).sort((a,b) => a.order - b.order).map((stage, index) => (
                          <FullStageCard
                            key={stage.id}
                            stage={stage}
                            index={index}
                            clientsByStage={clientsByStage}
                            tasksByStage={tasksByStage}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Empty State */}
        {(!activeWorkflows || activeWorkflows.length === 0) && (!activePackages || activePackages.length === 0) && (
          <div className="col-span-full text-center text-muted-foreground py-16 border border-dashed rounded-lg">
            <Briefcase className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">No hay servicios ni paquetes configurados</h3>
            <p className="text-sm mt-1">Vaya a la sección de configuración para añadir un nuevo servicio o paquete.</p>
          </div>
        )}
      </main>
    </div>
  );
}
