
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
  Settings
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
    return serviceWorkflows.flatMap(s => s.subServices?.flatMap(ss => ss.stages) || s.stages || []);
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
                <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(service.subServices?.flatMap(ss => ss.stages) || service.stages || []).sort((a,b) => a.order - b.order).map((stage, index) => {
                        const clientsInStage = clientsByStage.get(stage.id) || [];
                        return (
                            <Card key={stage.id} id={`stage-card-${stage.id}`} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                <StageNumberIcon index={index} />
                                <span className="flex-grow text-base">{stage.title}</span>
                                <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                                    {clientsInStage.length}
                                </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2 overflow-y-auto">
                                {clientsInStage.length > 0 ? (
                                clientsInStage.map(client => (
                                    <div 
                                        key={client.id}
                                        onClick={() => handleClientClick(client)}
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
                        )
                        })}
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
