
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
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, WorkflowStage, ServiceWorkflow, SubStage, SubSubStage } from '@/lib/types';
import { useCRMData } from "@/contexts/CRMDataContext";
import { ClientStageDetailDialog } from "@/components/shared/ClientStageDetailDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { serviceWorkflows as staticServiceWorkflows } from "@/lib/data";


type AnyStage = WorkflowStage | SubStage | SubSubStage;

const StageClientCard = ({ client, onClientClick }: { client: Client, onClientClick: (client: Client) => void }) => (
  <div
    onClick={() => onClientClick(client)}
    className="p-2 border rounded-md cursor-pointer hover:bg-secondary/50 transition-all bg-background"
  >
    <p className="font-semibold text-sm truncate">{client.name}</p>
    <p className="text-xs text-muted-foreground truncate">{client.category}</p>
  </div>
);

const StageCard = ({ 
    stage, 
    clientsInStage, 
    onClientClick
}: { 
    stage: AnyStage, 
    clientsInStage: Client[], 
    onClientClick: (client: Client) => void
}) => {

  return (
    <Card id={`stage-card-${stage.id}`} className="flex flex-col w-64 shrink-0">
        <CardHeader className="flex-grow-0 p-3">
            <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{stage.title}</CardTitle>
                <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5 ml-auto">
                    {clientsInStage.length}
                </span>
            </div>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto flex-1 p-3">
           {stage.actions && stage.actions.length > 0 && (
                <div className="text-sm text-muted-foreground pt-2 space-y-2">
                     <h4 className="font-semibold text-xs text-foreground/80 pl-1">Acciones</h4>
                     <ul className="space-y-1">
                        {stage.actions.map(action => (
                            <li key={action.id} className="flex items-start gap-2 text-xs">
                                <ListTodo className="h-3 w-3 shrink-0 mt-0.5" />
                                <span className="truncate" title={action.title}>{action.title}</span>
                            </li>
                        ))}
                     </ul>
                </div>
           )}
           <div className="space-y-2 pt-2 border-t">
               {clientsInStage.length > 0 ? (
                    clientsInStage.map(client => (
                        <StageClientCard key={client.id} client={client} onClientClick={onClientClick} />
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-4 text-sm flex flex-col items-center">
                        <Users className="h-6 w-6 mb-1" />
                        <p>No hay clientes.</p>
                    </div>
                )}
           </div>
        </CardContent>
    </Card>
  );
};


export default function CrmPage() {
  const { clients, isLoadingClients, /* serviceWorkflows, */ isLoadingWorkflows } = useCRMData();
  const serviceWorkflows = staticServiceWorkflows;

  const [selectedClientForDialog, setSelectedClientForDialog] = useState<Client | null>(null);
  const [selectedStageForDialog, setSelectedStageForDialog] = useState<AnyStage | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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

  const allStages: AnyStage[] = useMemo(() => {
    if (!serviceWorkflows) return [];
    const stages: AnyStage[] = [];
    serviceWorkflows.forEach(service => {
        if (!service.stages) return;
        (service.stages || []).forEach(stage1 => {
            stages.push(stage1);
            (stage1.subStages || []).forEach(stage2 => {
                stages.push(stage2);
                (stage2.subSubStages || []).forEach(stage3 => {
                    stages.push(stage3);
                });
            });
        });
    });
    return stages;
  }, [serviceWorkflows]);

  const handleClientClick = (client: Client) => {
    const stage = allStages.find(s => s.id === client.currentWorkflowStageId);
    if (stage) {
        setSelectedClientForDialog(client);
        setSelectedStageForDialog(stage);
        setIsDetailDialogOpen(true);
    }
  };
  
  const activeWorkflows = useMemo(() => {
    if (!serviceWorkflows) return [];
    return serviceWorkflows.filter(s => s.status !== 'Archivado').sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [serviceWorkflows]);


  if (isLoadingWorkflows || isLoadingClients) {
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
      <main className="flex-1 p-4 md:p-8 space-y-6">
        {activeWorkflows && activeWorkflows.length > 0 ? (
          activeWorkflows.map(service => (
            <Card key={service.id} className="w-full">
                <CardHeader>
                    <CardTitle className="text-xl">
                        {service.name}
                    </CardTitle>
                    <CardDescription>Pipeline de clientes para este servicio.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex overflow-x-auto py-4 space-x-4">
                        {(service.stages || []).sort((a,b) => a.order - b.order).map((stage, index) => (
                           <React.Fragment key={stage.id}>
                             <StageCard
                                stage={stage}
                                clientsInStage={clientsByStage.get(stage.id) || []}
                                onClientClick={handleClientClick}
                            />
                            {index < service.stages.length - 1 && (
                                <div className="flex items-center justify-center shrink-0">
                                    <ChevronsRight className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                            )}
                           </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-16 border border-dashed rounded-lg">
            <Briefcase className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">No hay servicios configurados</h3>
            <p className="text-sm mt-1">Vaya a la sección de configuración para añadir un nuevo servicio.</p>
          </div>
        )}
      </main>
      
      <ClientStageDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        client={selectedClientForDialog}
        stage={selectedStageForDialog}
      />
    </div>
  );
}
