

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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, WorkflowStage, ServiceWorkflow, SubStage, SubSubStage } from '@/lib/types';
import { useCRMData } from "@/contexts/CRMDataContext";
import { ClientStageDetailDialog } from "@/components/shared/ClientStageDetailDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
    level = 1,
    clientsInStage, 
    onClientClick, 
    clientsByStage
}: { 
    stage: AnyStage, 
    level?: number, 
    clientsInStage: Client[], 
    onClientClick: (client: Client) => void,
    clientsByStage: Map<string, Client[]>
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const renderSubStages = (subStages: (SubStage | SubSubStage)[], subLevel: number) => {
    if (!subStages || subStages.length === 0) return null;
    return (
      <div className={cn("ml-4 pl-4 border-l", subLevel > 2 && "ml-2 pl-2")}>
        {subStages.map(subStage => (
          <StageCard
            key={subStage.id}
            stage={subStage}
            level={subLevel}
            clientsInStage={clientsByStage.get(subStage.id) || []}
            onClientClick={onClientClick}
            clientsByStage={clientsByStage}
          />
        ))}
      </div>
    );
  };

  const hasSubStages = 'subStages' in stage && stage.subStages && stage.subStages.length > 0;
  const hasSubSubStages = 'subSubStages' in stage && stage.subSubStages && stage.subSubStages.length > 0;
  const canToggle = hasSubStages || hasSubSubStages;

  return (
    <div className="space-y-2 py-2">
      <Card id={`stage-card-${stage.id}`} className="flex flex-col bg-card">
        <CardHeader onClick={() => canToggle && setIsOpen(!isOpen)} className={cn(canToggle && "cursor-pointer")}>
          <div className="flex items-center gap-2">
            {canToggle ? (
                isOpen ? <ChevronDown className="h-4 w-4 shrink-0"/> : <ChevronRight className="h-4 w-4 shrink-0"/>
            ) : <div className="w-4"/>}
            <CardTitle className="text-base flex-grow">{stage.title}</CardTitle>
            <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {clientsInStage.length}
            </span>
          </div>
          {stage.actions && stage.actions.length > 0 && (
            <div className="text-sm text-muted-foreground pt-2 pl-6 space-y-1">
                {stage.actions.map(action => (
                    <div key={action.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ListTodo className="h-4 w-4 shrink-0" />
                        <span className="truncate" title={action.title}>{action.title}</span>
                    </div>
                ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2 overflow-y-auto px-4 pb-4">
          {clientsInStage.length > 0 ? (
            clientsInStage.map(client => (
              <StageClientCard key={client.id} client={client} onClientClick={onClientClick} />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6 text-sm flex flex-col items-center">
              <Users className="h-8 w-8 mb-2" />
              <p>No hay clientes en esta etapa.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isOpen && 'subStages' in stage && renderSubStages(stage.subStages, level + 1)}
      {isOpen && 'subSubStages' in stage && renderSubStages(stage.subSubStages, level + 1)}
    </div>
  );
};


export default function CrmPage() {
  const { clients, isLoadingClients, serviceWorkflows, isLoadingWorkflows } = useCRMData();

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
        service.stages.forEach(stage1 => {
            stages.push(stage1);
            stage1.subStages.forEach(stage2 => {
                stages.push(stage2);
                stage2.subSubStages.forEach(stage3 => {
                    stages.push(stage3);
                })
            })
        })
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
            <Link href="/workflows">
                <Settings className="mr-2 h-4 w-4" />
                Configurar Flujos
            </Link>
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8 space-y-6">
        {serviceWorkflows && serviceWorkflows.map(service => (
            <Card key={service.id} className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        {service.name}
                    </CardTitle>
                    <CardDescription>Pipeline de clientes para este servicio.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(service.stages || []).sort((a,b) => a.order - b.order).map((stage, index) => (
                            <StageCard
                                key={stage.id}
                                stage={stage}
                                level={1}
                                clientsInStage={clientsByStage.get(stage.id) || []}
                                onClientClick={handleClientClick}
                                clientsByStage={clientsByStage}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        ))}
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
