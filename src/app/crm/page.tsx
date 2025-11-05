
"use client";

import React, { useMemo, useState } from "react";
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
  FolderCog,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, WorkflowStage, ServiceWorkflow } from '@/lib/types';
import { useCRMData } from "@/contexts/CRMDataContext";
import { ClientStageDetailDialog } from "@/components/shared/ClientStageDetailDialog";

const StageNumberIcon = ({ index }: { index: number }) => {
  return (
    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-muted text-lg font-bold text-accent">
      {index + 1}
    </div>
  );
};

const StageCard = ({ stage, index, clientsInStage, onClientClick }: { stage: WorkflowStage, index: number, clientsInStage: Client[], onClientClick: (client: Client) => void }) => {
  return (
    <Card id={`stage-card-${stage.id}`} className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StageNumberIcon index={index} />
          <span className="flex-grow text-base">{stage.title}</span>
          <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {clientsInStage.length}
          </span>
        </CardTitle>
        {stage.actions && stage.actions.length > 0 && (
            <ul className="text-sm text-muted-foreground pt-2 space-y-1">
                {stage.actions.map(action => (
                    <li key={action.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ListTodo className="h-4 w-4 shrink-0" />
                        <span className="truncate" title={action.title}>{action.title}</span>
                    </li>
                ))}
            </ul>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-2 overflow-y-auto">
        {clientsInStage.length > 0 ? (
          clientsInStage.map(client => (
            <div
              key={client.id}
              onClick={() => onClientClick(client)}
              className="p-2 border rounded-md cursor-pointer hover:bg-secondary/50 transition-all bg-background"
            >
              <p className="font-semibold text-sm truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground truncate">{client.category}</p>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-6 text-sm flex flex-col items-center">
            <Users className="h-8 w-8 mb-2" />
            <p>No hay clientes en esta etapa.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function CrmPage() {
  const { clients, isLoadingClients, serviceWorkflows, isLoadingWorkflows } = useCRMData();

  const [selectedClientForDialog, setSelectedClientForDialog] = useState<Client | null>(null);
  const [selectedStageForDialog, setSelectedStageForDialog] = useState<WorkflowStage | null>(null);
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

  const allStages = useMemo(() => {
    if (!serviceWorkflows) return [];
    return serviceWorkflows.flatMap(service => [
        ...(service.stages || []),
        ...(service.subServices?.flatMap(ss => ss.stages) || [])
    ]);
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
                        <Workflow className="h-5 w-5 text-primary" />
                        {service.name}
                    </CardTitle>
                    <CardDescription>Pipeline de clientes para este servicio.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                    {/* Render Direct Stages */}
                    {(service.stages && service.stages.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {service.stages.sort((a,b) => a.order - b.order).map((stage, index) => (
                                <StageCard
                                    key={stage.id}
                                    stage={stage}
                                    index={index}
                                    clientsInStage={clientsByStage.get(stage.id) || []}
                                    onClientClick={handleClientClick}
                                />
                            ))}
                        </div>
                    )}
                    
                    {/* Render Sub-Services */}
                    {service.subServices && service.subServices.map(subService => (
                        <div key={subService.id} className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FolderCog className="h-5 w-5 text-accent"/>
                                {subService.name}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {subService.stages.sort((a,b) => a.order - b.order).map((stage, index) => (
                                    <StageCard
                                        key={stage.id}
                                        stage={stage}
                                        index={index}
                                        clientsInStage={clientsByStage.get(stage.id) || []}
                                        onClientClick={handleClientClick}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

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
