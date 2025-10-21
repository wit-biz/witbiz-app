
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
  const { clients, isLoadingClients, tasks, serviceWorkflows, isLoadingWorkflows } = useCRMData();
  const { setHasTasksForToday } = useTasksContext();

  const [currentClientDateForDashboard, setCurrentClientDateForDashboard] = useState<Date | null>(null);
  
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentClientDateForDashboard(today);
  }, []);

  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [isStageClientsDialogOpen, setIsStageClientsDialogOpen] = useState(false);

  const [searchTermDashboard, setSearchTermDashboard] = useState("");
  const [isPopoverOpenDashboard, setIsPopoverOpenDashboard] = useState(false);
  const [highlightedStageId, setHighlightedStageId] = useState<string | null>(null);
  const inputRefDashboard = useRef<HTMLInputElement>(null);
  
  const workflowStagesForDisplay: WorkflowStage[] = useMemo(() => {
      if (!serviceWorkflows || serviceWorkflows.length === 0) return [];
      // Flatten all stages from all sub-services of all services
      return serviceWorkflows.flatMap(sw => sw.subServices.flatMap(ss => ss.stages)).sort((a,b) => a.order - b.order);
  }, [serviceWorkflows]);

  const clientsInSelectedStageWithDetails = useMemo(() => {
    if (!selectedStage || isLoadingClients || !clients || !tasks) return [];

    return clients
      .filter(client => client.currentWorkflowStageId === selectedStage.id)
      .map(client => {
        const clientTasks = tasks.filter(t => t.clientId === client.id);
        const pendingTask = clientTasks.find(task => task.status === 'Pendiente');

        return {
          ...client,
          currentObjectiveDisplay: client.currentObjective,
          pendingTaskInfo: pendingTask ? { title: pendingTask.title, dueDate: new Date(pendingTask.dueDate) } : undefined,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedStage, clients, isLoadingClients, tasks]);


  const filteredClientsDashboard = useMemo(() => {
    if (isLoadingClients || !clients) return [];
    if (!searchTermDashboard.trim()) {
      return clients.slice(0, 10);
    }
    const lowerSearchTerm = searchTermDashboard.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowerSearchTerm) ||
      (client.owner && client.owner.toLowerCase().includes(lowerSearchTerm)) ||
      (client.category && client.category.toLowerCase().includes(lowerSearchTerm))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTermDashboard, clients, isLoadingClients]);

  const handleStageClick = (stage: WorkflowStage) => {
    setHighlightedStageId(stage.id);
    setSelectedStage(stage);
    setIsStageClientsDialogOpen(true);
  };

  const populatedStageIds = useMemo(() => {
    if (isLoadingClients || !clients) return new Set<string>();
    return new Set(clients.map(client => client.currentWorkflowStageId || ''));
  }, [clients, isLoadingClients]);


  const handleClientSearchSelection = useCallback((client: Client) => {
    setSearchTermDashboard(client.name);
    setHighlightedStageId(client.currentWorkflowStageId || null);
    setIsPopoverOpenDashboard(false);
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
         <CardHeader className="flex flex-row justify-between items-center w-full">
            <div className="flex-grow text-left">
                <CardTitle className="flex items-center gap-2">CRM de WitBiz</CardTitle>
                <CardDescription>Etapas clave en el ciclo de vida del Cliente.</CardDescription>
            </div>
            <div className="ml-auto flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                <Popover open={isPopoverOpenDashboard} onOpenChange={setIsPopoverOpenDashboard}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-2 py-1 text-xs w-full sm:w-40">
                    <Search className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    <span className="text-muted-foreground truncate max-w-[100px] sm:max-w-[120px]">
                        {highlightedStageId && clients && clients.find(c => c.currentWorkflowStageId === highlightedStageId && c.name === searchTermDashboard) ? searchTermDashboard : "Buscar Cliente..."}
                    </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-1 w-52 sm:w-60 bg-popover shadow-lg border"
                    align="end"
                    sideOffset={5}
                    onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    inputRefDashboard.current?.focus();
                    }}
                >
                    <div className="p-2">
                       <Input
                        ref={inputRefDashboard}
                        value={searchTermDashboard}
                        onChange={(e) => setSearchTermDashboard(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="h-40 overflow-y-auto">
                    {isLoadingClients && <div className="p-2 text-center"><Loader2 className="h-4 w-4 animate-spin inline mr-1 text-accent"/>Cargando...</div>}
                    {!isLoadingClients && filteredClientsDashboard.length === 0 && searchTermDashboard.trim() && (
                        <p className="text-xs text-muted-foreground p-2 text-center">Ningún cliente coincide.</p>
                    )}
                    {!isLoadingClients && filteredClientsDashboard.length > 0 && (
                        filteredClientsDashboard.map(client => (
                        <div
                            key={client.id}
                            className="p-1.5 hover:bg-accent cursor-pointer rounded-md text-xs"
                            onClick={() => handleClientSearchSelection(client)}
                        >
                            <p className="font-medium truncate">{client.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                            Etapa: {client.stage || 'N/A'}
                            </p>
                        </div>
                        ))
                    )}
                    {!isLoadingClients && clients && clients.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2 text-center">No hay clientes.</p>
                    )}
                    </div>
                </PopoverContent>
                </Popover>
            </div>
        </CardHeader>
        <CardContent className="pt-0">
            {isLoadingWorkflows ? (
                <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
            ) : (
            <>
            {/* Mobile: Vertical flow */}
            <div className="flex flex-col items-center gap-2 sm:hidden">
                {workflowStagesForDisplay.map((stage, index) => {
                const isPopulated = populatedStageIds.has(stage.id);
                const isHighlighted = stage.id === highlightedStageId;
                let currentStatusForStyling: 'locked' | 'active' | 'completed' = 'locked';

                if (isPopulated && !isHighlighted) {
                    currentStatusForStyling = 'completed';
                } else if (isHighlighted) {
                    currentStatusForStyling = 'active';
                }

                let baseStageClass = 'bg-secondary dark:bg-secondary/50 border border-border';
                let baseTextClass = 'text-muted-foreground';

                if (currentStatusForStyling === 'completed') {
                    baseStageClass = 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700';
                    baseTextClass = cn('text-green-700 dark:text-green-300', isHighlighted && 'text-inherit');
                } else if (currentStatusForStyling === 'active') {
                    baseStageClass = 'bg-accent/20 dark:bg-accent/30 border-2 border-accent shadow-lg';
                    baseTextClass = cn('text-accent-foreground dark:text-accent font-semibold', isHighlighted && 'text-inherit');
                }

                return (
                    <React.Fragment key={stage.id}>
                    <div
                        onClick={() => handleStageClick(stage)}
                        className={cn(
                        "flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all",
                        "w-full min-h-[4rem] p-3 flex flex-row items-center justify-start text-left",
                        baseStageClass,
                        'hover:opacity-90 cursor-pointer',
                        isHighlighted ? 'stage-pulse-highlight' : ''
                        )}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStageClick(stage); }}
                        aria-label={stage.title}
                    >
                        <StageNumberIcon index={index} variant="default" />
                        <div className="min-w-0">
                        <span className={cn("leading-tight break-words text-sm font-medium", isHighlighted ? 'text-inherit' : baseTextClass)}>
                            {stage.title}
                        </span>
                        </div>
                    </div>
                    {index < workflowStagesForDisplay.length - 1 && (
                        <ChevronDown className="w-5 h-5 text-muted-foreground my-1" />
                    )}
                    </React.Fragment>
                );
                })}
            </div>
            {/* Desktop: Horizontal wrap flow */}
            <div className="hidden sm:flex flex-wrap items-start gap-2">
                {workflowStagesForDisplay.map((stage, index) => {
                 const isPopulated = populatedStageIds.has(stage.id);
                 const isHighlighted = stage.id === highlightedStageId;
                 let currentStatusForStyling: 'locked' | 'active' | 'completed' = 'locked';
                
                 if (isPopulated && !isHighlighted) {
                     currentStatusForStyling = 'completed';
                 } else if (isHighlighted) {
                    currentStatusForStyling = 'active';
                 }

                let baseStageClass = 'bg-muted/50 dark:bg-muted/30 border border-border';
                let baseTextClass = 'text-muted-foreground';

                if (currentStatusForStyling === 'locked') {
                     baseStageClass = 'bg-muted/50 dark:bg-muted/30 border border-border';
                     if(isPopulated) baseStageClass += ' opacity-70';
                     else baseStageClass += ' opacity-50 cursor-not-allowed';
                } else if (currentStatusForStyling === 'completed') {
                    baseStageClass = 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700';
                    baseTextClass = cn('text-green-700 dark:text-green-300', isHighlighted && 'text-inherit');
                } else if (currentStatusForStyling === 'active') {
                    baseStageClass = 'bg-accent/20 dark:bg-accent/30 border-2 border-accent shadow-lg';
                    baseTextClass = cn('text-accent-foreground dark:text-accent font-semibold', isHighlighted && 'text-inherit');
                }

                return (
                    <React.Fragment key={stage.id}>
                    <div
                        onClick={() => handleStageClick(stage)}
                        className={cn(
                        "flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all",
                        "sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 p-1.5 sm:p-2 m-0.5 flex flex-col justify-center items-center text-center",
                        baseStageClass,
                        'hover:opacity-90 cursor-pointer',
                        isHighlighted ? 'stage-pulse-highlight' : ''
                        )}
                        role={"button"}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStageClick(stage); }}
                        aria-label={stage.title}
                    >
                        <StageNumberIcon index={index} variant="large" />
                        <span className={cn("leading-tight break-words text-[10px] sm:text-xs w-full px-0.5", isHighlighted ? 'text-inherit' : baseTextClass)}>
                        {stage.title}
                        </span>
                    </div>
                    {index < workflowStagesForDisplay.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
                    )}
                    </React.Fragment>
                );
                })}
            </div>
            </>
            )}
        </CardContent>
      </Card>


      {selectedStage && (
        <Dialog open={isStageClientsDialogOpen} onOpenChange={setIsStageClientsDialogOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <StageNumberIcon index={workflowStagesForDisplay.findIndex(s => s.id === selectedStage.id)} variant="dialog" />
                Clientes en Etapa: {selectedStage.title}
              </DialogTitle>
              <DialogDescription>
                Listado de clientes actuales en esta etapa y su objetivo principal.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] my-4 pr-4 -mr-4 overflow-y-auto">
              {isLoadingClients && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-accent mr-2" />
                  <p className="text-sm text-muted-foreground">Cargando clientes...</p>
                </div>
              )}
              {!isLoadingClients && clientsInSelectedStageWithDetails.length > 0 ? (
                <ul className="space-y-3">
                  {clientsInSelectedStageWithDetails.map(client => (
                    <li key={client.id} className="p-3 border rounded-md bg-card hover:bg-secondary/50 transition-colors">
                      <Link href={`/contacts?openClient=${client.id}`} passHref>
                        <div className="cursor-pointer">
                            <p className="font-semibold text-card-foreground">{client.name}</p>
                            <div className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5">
                                <Target className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-grow">
                                    <p className="font-medium text-foreground/90">Objetivo Actual:</p>
                                    <p className="break-words italic">{client.currentObjectiveDisplay}</p>
                                </div>
                            </div>
                            {client.pendingTaskInfo && (
                                <div className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5">
                                <ListChecks className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-grow">
                                    <p className="font-medium text-foreground/90">Próx. Tarea Pendiente:</p>
                                    <p className="break-words" title={client.pendingTaskInfo.title}>{client.pendingTaskInfo.title}</p>
                                     <p>Vence: {client.pendingTaskInfo.dueDate.toLocaleDateString()}</p>
                                </div>
                                </div>
                            )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : !isLoadingClients && (
                <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
                  <Info className="h-10 w-10 mb-3 text-gray-400" />
                  <p className="text-sm">No hay clientes actualmente en la etapa "{selectedStage.title}".</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

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
