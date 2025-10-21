
"use client";

import React, { useState, useMemo, useEffect, useRef, type ChangeEvent, type ReactNode, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Activity,
  ChevronRight,
  ChevronDown,
  ListChecks,
  Info,
  Search,
  CheckSquare,
  Loader2,
  Target,
  Clock,
  Briefcase,
  MailWarning,
  Send,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, Task, WorkflowStage } from '@/lib/types';
import { useTasksContext } from "@/contexts/TasksContext";
import { TaskDetailDialog } from "@/components/shared/TaskDetailDialog";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useToast } from "@/hooks/use-toast";


const StageNumberIcon = ({ index, variant = 'default' }: { index: number, variant?: 'default' | 'large' | 'dialog' }) => {
  const variants = {
    default: "text-3xl mr-3 text-accent",
    large: "text-5xl mb-2 text-accent",
    dialog: "text-2xl text-accent"
  };
  return (
    <div className={cn("flex items-center justify-center font-bold flex-shrink-0", variants[variant])}>
      {index + 1}
    </div>
  );
};

export default function InicioPage() {
  const { clients, isLoadingClients, tasks, serviceWorkflows, isLoadingWorkflows, getObjectiveById } = useCRMData();
  const { setHasTasksForToday } = useTasksContext();

  const [currentClientDateForDashboard, setCurrentClientDateForDashboard] = useState<Date | null>(null);
  
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentClientDateForDashboard(today);
  }, []);

  const [searchTermDashboard, setSearchTermDashboard] = useState("");
  const [highlightedClientId, setHighlightedClientId] = useState<string | null>(null);
  
  const workflowStagesForDisplay: WorkflowStage[] = useMemo(() => {
      if (!serviceWorkflows || serviceWorkflows.length === 0) return [];
      // Flatten all stages from all sub-services of all services
      return serviceWorkflows.flatMap(sw => sw.subServices.flatMap(ss => ss.stages)).sort((a,b) => a.order - b.order);
  }, [serviceWorkflows]);

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


  const filteredClientsDashboard = useMemo(() => {
    if (isLoadingClients || !clients) return [];
    if (!searchTermDashboard.trim()) {
      return [];
    }
    const lowerSearchTerm = searchTermDashboard.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowerSearchTerm) ||
      (client.owner && client.owner.toLowerCase().includes(lowerSearchTerm)) ||
      (client.category && client.category.toLowerCase().includes(lowerSearchTerm))
    ).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 5);
  }, [searchTermDashboard, clients, isLoadingClients]);


  const handleClientSearchSelection = useCallback((client: Client) => {
    setSearchTermDashboard(""); // Clear search term to hide results
    setHighlightedClientId(client.id || null);
    
    // Scroll to the stage card
    const stageCard = document.getElementById(`stage-card-${client.currentWorkflowStageId}`);
    stageCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        // Remove highlight after animation
        setHighlightedClientId(null);
    }, 2500);
  }, []);

  const todaysTasks = useMemo(() => {
    if (!tasks || !currentClientDateForDashboard) return [];
    const today = currentClientDateForDashboard;
    return tasks
      .filter(task => {
        if (task.status !== 'Pendiente') return false;
        try {
          const taskDueDate = new Date(task.dueDate);
          taskDueDate.setHours(0,0,0,0);
          return taskDueDate && taskDueDate.getTime() === today.getTime();
        } catch { return false; }
      })
      .sort((a, b) => (a.title).localeCompare(b.title));
  }, [tasks, currentClientDateForDashboard]);
  
  const handleTaskClick = useCallback((task: Task) => { 
    setSelectedTaskDetail(task); 
    setIsDetailDialogOpen(true); 
  }, []);
  
  return (
    <div className="w-full space-y-6 p-4 md:p-8">
      <Header
        title="Inicio"
        description="Bienvenido a WitBiz. Aquí tienes un resumen y accesos rápidos."
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Tareas Pendientes Para Hoy
          </CardTitle>
          <CardDescription>Estas son las tareas que requieren su atención hoy.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingWorkflows || !tasks ? (
              <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                <CheckSquare className="h-12 w-12 mb-4 text-green-500" />
                <p className="text-lg font-semibold">¡Todo al día!</p>
                <p className="text-sm mt-1">No tienes tareas pendientes programadas para hoy.</p>
              </div>
          ) : todaysTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task); }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalles de la tarea: ${task.title}`}
                  >
                    <div className="bg-muted p-2 rounded-full flex-shrink-0 mt-1">
                      <ListChecks className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="text-xs text-muted-foreground space-x-2">
                        {task.clientName && (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {task.clientName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                <CheckSquare className="h-12 w-12 mb-4 text-green-500" />
                <p className="text-lg font-semibold">¡Todo al día!</p>
                <p className="text-sm mt-1">No tienes tareas pendientes programadas para hoy.</p>
              </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
         <CardHeader>
            <CardTitle className="flex items-center gap-2">Pipeline de Clientes (CRM)</CardTitle>
            <CardDescription>Vista general de todos los clientes en cada etapa del flujo de trabajo.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={searchTermDashboard}
                    onChange={(e) => setSearchTermDashboard(e.target.value)}
                    placeholder="Buscar cliente para resaltar..."
                    className="pl-10"
                />
                {filteredClientsDashboard.length > 0 && (
                    <div className="absolute z-10 top-full mt-2 w-full rounded-md border bg-popover shadow-lg text-popover-foreground">
                        <div className="max-h-60 overflow-y-auto p-1">
                           {filteredClientsDashboard.map(client => (
                                <div
                                    key={client.id}
                                    className="p-2 hover:bg-accent rounded-md cursor-pointer text-sm"
                                    onClick={() => handleClientSearchSelection(client)}
                                >
                                    <p className="font-medium truncate">{client.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Etapa: {workflowStagesForDisplay.find(s => s.id === client.currentWorkflowStageId)?.title || 'N/A'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isLoadingWorkflows || isLoadingClients ? (
                <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {workflowStagesForDisplay.map((stage, index) => {
                  const clientsInStage = clientsByStage.get(stage.id) || [];
                  return (
                    <Card key={stage.id} id={`stage-card-${stage.id}`} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <StageNumberIcon index={index} variant="dialog" /> 
                           <span className="flex-grow">{stage.title}</span>
                           <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                             {clientsInStage.length}
                           </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-2 overflow-y-auto">
                        {clientsInStage.length > 0 ? (
                           clientsInStage.map(client => (
                             <Link key={client.id} href={`/contacts?openClient=${client.id}`} passHref>
                                <div className={cn(
                                  "p-2 border rounded-md cursor-pointer hover:bg-secondary/50 transition-all",
                                   highlightedClientId === client.id ? 'bg-accent/30 border-accent ring-2 ring-accent' : 'bg-background'
                                )}>
                                  <p className="font-semibold text-sm truncate">{client.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{client.category}</p>
                                </div>
                             </Link>
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
            )}
        </CardContent>
      </Card>

      {selectedTaskDetail && (
        <TaskDetailDialog
          key={selectedTaskDetail.id}
          isOpen={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          task={selectedTaskDetail}
        />
      )}
    </div>
  );
}
