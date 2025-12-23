
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Search,
  CheckSquare,
  Loader2,
  Briefcase,
  ListChecks,
  Users,
  AlertTriangle,
  Clock,
  History,
  ListTodo,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn, parseDateString, formatTimeString } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Client, Task, WorkflowStage } from '@/lib/types';
import { TaskDetailDialog } from "@/components/shared/TaskDetailDialog";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ClientDetailView } from "@/components/shared/ClientDetailView";
import { useRouter } from "next/navigation";


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

// Componente para mostrar tareas en la página de inicio
const TaskItemHome = ({ task, icon: Icon, iconColor, onClick, showDate = false, isTeamTask = false }: { 
  task: Task; 
  icon: React.ElementType; 
  iconColor: string; 
  onClick: (task: Task) => void;
  showDate?: boolean;
  isTeamTask?: boolean;
}) => {
  const taskDueDate = parseDateString(task.dueDate);
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors border",
        isTeamTask && "border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/20"
      )}
      onClick={() => onClick(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(task); }}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isTeamTask ? "text-purple-500" : iconColor)} />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.clientName && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {task.clientName}
            </span>
          )}
          {task.assignedToName && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-4 w-4">
                  <AvatarImage src={task.assignedToPhotoURL} />
                  <AvatarFallback className="text-[8px]">{task.assignedToName.charAt(0)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent><p>Asignado a: {task.assignedToName}</p></TooltipContent>
            </Tooltip>
          )}
          {showDate && taskDueDate && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {taskDueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.dueTime && (
            <span>{formatTimeString(task.dueTime)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InicioPage() {
  const { clients, isLoadingClients, tasks, serviceWorkflows, isLoadingWorkflows, currentUser } = useCRMData();
  const router = useRouter();
  
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);

  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [isClientDetailDialogOpen, setIsClientDetailDialogOpen] = useState(false);

  const [searchTermDashboard, setSearchTermDashboard] = useState("");
  const [highlightedClientId, setHighlightedClientId] = useState<string | null>(null);
  
  const workflowStagesForDisplay: WorkflowStage[] = useMemo(() => {
      if (!serviceWorkflows || serviceWorkflows.length === 0) return [];
      // Flatten all stages from all services
      return serviceWorkflows.flatMap(sw => sw.stages || []).sort((a,b) => a.order - b.order);
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

  // Calcular todas las secciones de tareas del usuario
  const { overdueTasks, postponedTasks, todayTasks, upcomingWeekTasks } = useMemo(() => {
    if (!tasks || !currentUser) {
      return { overdueTasks: [], postponedTasks: [], todayTasks: [], upcomingWeekTasks: [] };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Solo tareas asignadas al usuario actual
    const userTasks = tasks.filter(task => task && task.assignedToId === currentUser.uid);
    
    const allPostponed = userTasks
      .filter(task => task.status === 'Pospuesta')
      .sort((a, b) => (parseDateString(a.reactivationDate || a.dueDate)?.getTime() || 0) - (parseDateString(b.reactivationDate || b.dueDate)?.getTime() || 0));
    
    const postponed = allPostponed.filter(t => {
      const originalDueDate = parseDateString(t.dueDate);
      if (!originalDueDate) return false;
      const daysDiff = differenceInDays(today, originalDueDate);
      return daysDiff < 10;
    });
    
    const pendingTasks = userTasks.filter(task => task.status === 'Pendiente');
    
    const overdue = pendingTasks
      .filter(task => {
        const taskDueDate = parseDateString(task.dueDate);
        return taskDueDate && taskDueDate < today;
      })
      .sort((a, b) => {
        const dateA = parseDateString(a.dueDate);
        const dateB = parseDateString(b.dueDate);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    
    const forToday = pendingTasks
      .filter(task => {
        const taskDueDate = parseDateString(task.dueDate);
        return taskDueDate && taskDueDate.getTime() === today.getTime();
      })
      .sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));
    
    const upcomingThisWeek = pendingTasks
      .filter(task => {
        const taskDueDate = parseDateString(task.dueDate);
        if (!taskDueDate) return false;
        const taskDayStart = new Date(taskDueDate);
        taskDayStart.setHours(0, 0, 0, 0);
        return taskDayStart > today && taskDayStart <= endOfWeek;
      })
      .sort((a, b) => {
        const dateA = parseDateString(a.dueDate);
        const dateB = parseDateString(b.dueDate);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    
    return { overdueTasks: overdue, postponedTasks: postponed, todayTasks: forToday, upcomingWeekTasks: upcomingThisWeek };
  }, [tasks, currentUser]);
  
  const handleTaskClick = useCallback((task: Task) => { 
    setSelectedTaskDetail(task); 
    setIsTaskDetailDialogOpen(true); 
  }, []);
  
  const handleClientClick = (client: Client) => {
    setSelectedClientDetail(client);
    setIsClientDetailDialogOpen(true);
  };
  
  return (
    <TooltipProvider>
      <div className="w-full space-y-6 p-4 md:p-8">
        <Header
        title="Inicio"
        description="Bienvenido a WitBiz. Aquí tienes un resumen y accesos rápidos."
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Mis Tareas
          </CardTitle>
          <CardDescription>Tus tareas pendientes organizadas por prioridad.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingWorkflows || !tasks ? (
              <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="today-tasks">
              {/* Tareas Para Hoy */}
              <AccordionItem value="today-tasks" className="border-none">
                <Card>
                  <AccordionTrigger className="w-full hover:no-underline p-0 [&_svg]:ml-auto [&_svg]:mr-2">
                    <CardHeader className="flex-1 p-3">
                      <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-base">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-center">Tareas Para Hoy</span>
                        <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{todayTasks.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-2 pt-0 p-3">
                      {todayTasks.length > 0 ? todayTasks.map(task => (
                        <TaskItemHome key={task.id} task={task} icon={CheckCircle2} iconColor="text-green-500" onClick={handleTaskClick} isTeamTask={(task as any).createdById && (task as any).createdById !== currentUser?.uid} />
                      )) : (
                        <div className="text-sm text-muted-foreground p-4 text-center flex flex-col items-center">
                          <CheckSquare className="h-8 w-8 text-green-500 mb-2" />
                          <p>¡Sin tareas para hoy!</p>
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
              
              {/* Próximas Tareas */}
              <AccordionItem value="upcoming-tasks" className="border-none">
                <Card>
                  <AccordionTrigger className="w-full hover:no-underline p-0 [&_svg]:ml-auto [&_svg]:mr-2">
                    <CardHeader className="flex-1 p-3">
                      <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-base">
                        <ListTodo className="h-5 w-5 text-blue-500" />
                        <span className="text-center">Próximas Tareas</span>
                        <Badge className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">{upcomingWeekTasks.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-2 pt-0 p-3">
                      {upcomingWeekTasks.length > 0 ? upcomingWeekTasks.map(task => (
                        <TaskItemHome key={task.id} task={task} icon={ListTodo} iconColor="text-blue-500" onClick={handleTaskClick} showDate isTeamTask={(task as any).createdById && (task as any).createdById !== currentUser?.uid} />
                      )) : (
                        <div className="text-sm text-muted-foreground p-4 text-center"><Info className="h-8 w-8 mb-2 mx-auto" /><p>No hay tareas próximas.</p></div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
              
              {/* Tareas Atrasadas */}
              <AccordionItem value="overdue-tasks" className="border-none">
                <Card>
                  <AccordionTrigger className="w-full hover:no-underline p-0 [&_svg]:ml-auto [&_svg]:mr-2">
                    <CardHeader className="flex-1 p-3">
                      <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span className="text-center">Tareas Atrasadas</span>
                        <Badge className="ml-auto bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{overdueTasks.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-2 pt-0 p-3">
                      {overdueTasks.length > 0 ? overdueTasks.map(task => (
                        <TaskItemHome key={task.id} task={task} icon={AlertTriangle} iconColor="text-destructive" onClick={handleTaskClick} showDate isTeamTask={(task as any).createdById && (task as any).createdById !== currentUser?.uid} />
                      )) : (
                        <div className="text-sm text-muted-foreground p-4 text-center"><CheckSquare className="h-8 w-8 text-green-500 mb-2 mx-auto" /><p>¡Sin tareas atrasadas!</p></div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
              
              {/* Tareas Pospuestas */}
              <AccordionItem value="postponed-tasks" className="border-none">
                <Card>
                  <AccordionTrigger className="w-full hover:no-underline p-0 [&_svg]:ml-auto [&_svg]:mr-2">
                    <CardHeader className="flex-1 p-3">
                      <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-base">
                        <History className="h-5 w-5 text-amber-500" />
                        <span className="text-center">Tareas Pospuestas</span>
                        <Badge className="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">{postponedTasks.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-2 pt-0 p-3">
                      {postponedTasks.length > 0 ? postponedTasks.map(task => (
                        <TaskItemHome key={task.id} task={task} icon={History} iconColor="text-amber-500" onClick={handleTaskClick} showDate isTeamTask={(task as any).createdById && (task as any).createdById !== currentUser?.uid} />
                      )) : (
                        <div className="text-sm text-muted-foreground p-4 text-center"><Info className="h-8 w-8 mb-2 mx-auto" /><p>Sin tareas pospuestas.</p></div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
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
                             <div 
                                key={client.id} 
                                onClick={() => handleClientClick(client)}
                                className={cn(
                                  "p-2 border rounded-md cursor-pointer hover:bg-secondary/50 transition-all",
                                   highlightedClientId === client.id ? 'bg-accent/30 border-accent ring-2 ring-accent' : 'bg-background'
                                )}>
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
            )}
        </CardContent>
      </Card>

      {selectedTaskDetail && (
        <TaskDetailDialog
          key={selectedTaskDetail.id}
          isOpen={isTaskDetailDialogOpen}
          onOpenChange={setIsTaskDetailDialogOpen}
          task={selectedTaskDetail}
        />
      )}
      
      <Dialog open={isClientDetailDialogOpen} onOpenChange={setIsClientDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
           <ClientDetailView client={selectedClientDetail} onClose={() => setIsClientDetailDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
