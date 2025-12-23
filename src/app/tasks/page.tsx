
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, AlertTriangle, Loader2, Briefcase, Clock, CalendarDays, Info, CheckCircle2, ListTodo, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn, parseDateString, formatTimeString } from "@/lib/utils"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskDetailDialog } from "@/components/shared/TaskDetailDialog";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { Task } from "@/lib/types";
import { AddTaskDialog } from "@/components/shared/AddTaskDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Tipo extendido para tareas agrupadas
interface GroupedTask extends Task {
  assignees?: Array<{ id: string; name: string; photoURL?: string }>;
}

// Función para agrupar tareas por taskGroupId
function groupTasksByGroupId(tasks: Task[]): GroupedTask[] {
  const groupMap = new Map<string, GroupedTask>();
  const result: GroupedTask[] = [];
  
  for (const task of tasks) {
    const groupId = (task as any).taskGroupId;
    
    if (groupId) {
      if (groupMap.has(groupId)) {
        // Agregar asignado al grupo existente
        const existingGroup = groupMap.get(groupId)!;
        if (!existingGroup.assignees?.find(a => a.id === task.assignedToId)) {
          existingGroup.assignees?.push({
            id: task.assignedToId,
            name: task.assignedToName,
            photoURL: task.assignedToPhotoURL
          });
        }
      } else {
        // Crear nuevo grupo
        const groupedTask: GroupedTask = {
          ...task,
          assignees: [{
            id: task.assignedToId,
            name: task.assignedToName,
            photoURL: task.assignedToPhotoURL
          }]
        };
        groupMap.set(groupId, groupedTask);
        result.push(groupedTask);
      }
    } else {
      // Tarea individual (sin grupo)
      result.push({
        ...task,
        assignees: [{
          id: task.assignedToId,
          name: task.assignedToName,
          photoURL: task.assignedToPhotoURL
        }]
      });
    }
  }
  
  return result;
}

const MemoizedTaskItemDisplay = React.memo(function TaskItemDisplay({ task, icon: Icon, iconColor = "text-gray-500", showDate = true, isClient, onClickHandler, isTeamTask = false }: { task: GroupedTask; icon?: React.ElementType; iconColor?: string, showDate?: boolean, isClient: boolean, onClickHandler: (task: Task) => void, isTeamTask?: boolean }) {
  const taskDueDate = parseDateString(task.dueDate);
  const assignees = task.assignees || [{ id: task.assignedToId, name: task.assignedToName, photoURL: task.assignedToPhotoURL }];
  const isGroupTask = assignees.length > 1;
  
  return ( 
    <div 
      className={cn(
        "flex items-start gap-3 p-3 bg-background hover:bg-secondary/50 rounded-md border cursor-pointer transition-colors",
        (isTeamTask || isGroupTask) && "border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/20"
      )}
      onClick={() => onClickHandler(task)} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClickHandler(task); }} 
      aria-label={`Ver detalles de la tarea: ${task.title}`} 
    > 
      {Icon && <Icon className={`h-5 w-5 mt-1 flex-shrink-0 ${(isTeamTask || isGroupTask) ? "text-purple-500" : iconColor}`} />}
      <div className="flex-grow min-w-0"> 
        <p className="font-semibold text-card-foreground truncate">{task.title}</p> 
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {task.clientName && ( 
              <span className="inline-flex items-center gap-1"> 
                <Briefcase className="h-3 w-3" /> {task.clientName} 
              </span> 
            )} 
            {task.clientName && assignees.length > 0 && <span className="text-muted-foreground/50">|</span>}
            {assignees.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {assignees.slice(0, 4).map((assignee, idx) => (
                    <Tooltip key={assignee.id || idx}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-5 w-5 border-2 border-background">
                          <AvatarImage src={assignee.photoURL} />
                          <AvatarFallback className="text-[9px]">{assignee.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{assignee.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {assignees.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{assignees.length - 4}</span>
                )}
              </div>
            )}
        </div>
        {showDate && taskDueDate && isClient && ( 
          <p className="text-xs text-muted-foreground mt-1"> 
             {format(taskDueDate, 'PPP', { locale: es })}
            {task.dueTime && ( 
              <span className="ml-2 inline-flex items-center"> 
                <Clock className="h-3 w-3 mr-1" /> {formatTimeString(task.dueTime)}
              </span> 
            )} 
          </p> 
        )} 
        {!showDate && task.dueTime && ( 
          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center"> 
            <Clock className="h-3 w-3 mr-1" /> {formatTimeString(task.dueTime)}
          </p> 
        )} 
      </div> 
      {task.status === 'Completada' && ( 
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" /> 
      )} 
    </div> 
  );
});
MemoizedTaskItemDisplay.displayName = 'TaskItemDisplay';

export default function TasksPage() {
  const { clients, tasks: allTasks, isLoadingTasks, currentUser, addTask, updateTask, deleteTask } = useCRMData();
  const { setHasTasksForToday } = useTasksContext();

  const [isClient, setIsClient] = useState(false);
  const [currentClientDate, setCurrentClientDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>();
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("today-tasks");
  
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  
  useEffect(() => { 
    setIsClient(true);
    const today = new Date(); 
    today.setHours(0, 0, 0, 0); 
    setCurrentClientDate(today); 
    setCalendarMonth(today); 
  }, []);
  
  const { overdueTasks, postponedTasks, todayTasks, upcomingWeekTasks, postponedTasks10, postponedTasks20, postponedTasks30 } = useMemo(() => {
    if (!currentClientDate || !Array.isArray(allTasks) || !currentUser) {
      return { overdueTasks: [], postponedTasks: [], todayTasks: [], upcomingWeekTasks: [], postponedTasks10: [], postponedTasks20: [], postponedTasks30: [] };
    }
    const today = new Date(currentClientDate);
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
  
    // Tareas asignadas al usuario O creadas por el usuario para otros
    const userTasks = allTasks.filter(task => {
      if (!task) return false;
      // Tareas asignadas a mí
      if (task.assignedToId === currentUser.uid) return true;
      // Tareas que yo creé para otros (tienen createdById)
      if ((task as any).createdById === currentUser.uid && task.assignedToId !== currentUser.uid) return true;
      return false;
    });
  
    const allPostponed = userTasks.filter(task => task.status === 'Pospuesta')
        .sort((a,b) => (parseDateString(a.reactivationDate || a.dueDate)?.getTime() || 0) - (parseDateString(b.reactivationDate || b.dueDate)?.getTime() || 0));

    const postponed = allPostponed.filter(t => {
      const originalDueDate = parseDateString(t.dueDate);
      if (!originalDueDate) return false;
      const daysDiff = differenceInDays(today, originalDueDate);
      return daysDiff < 10;
    });
    const postponed10 = allPostponed.filter(t => {
      const originalDueDate = parseDateString(t.dueDate);
      if (!originalDueDate) return false;
      const daysDiff = differenceInDays(today, originalDueDate);
      return daysDiff >= 10 && daysDiff < 20;
    });
    const postponed20 = allPostponed.filter(t => {
      const originalDueDate = parseDateString(t.dueDate);
      if (!originalDueDate) return false;
      const daysDiff = differenceInDays(today, originalDueDate);
      return daysDiff >= 20 && daysDiff < 30;
    });
     const postponed30 = allPostponed.filter(t => {
      const originalDueDate = parseDateString(t.dueDate);
      if (!originalDueDate) return false;
      const daysDiff = differenceInDays(today, originalDueDate);
      return daysDiff >= 30;
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
        return dateA.getTime() - dateB.getTime() || (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59");
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
        return dateA.getTime() - dateB.getTime() || (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59");
      });
  
    // Agrupar tareas por taskGroupId antes de retornar
    return { 
      overdueTasks: groupTasksByGroupId(overdue), 
      postponedTasks: groupTasksByGroupId(postponed), 
      todayTasks: groupTasksByGroupId(forToday), 
      upcomingWeekTasks: groupTasksByGroupId(upcomingThisWeek), 
      postponedTasks10: groupTasksByGroupId(postponed10), 
      postponedTasks20: groupTasksByGroupId(postponed20), 
      postponedTasks30: groupTasksByGroupId(postponed30) 
    };
  }, [allTasks, currentClientDate, currentUser]);
    
  
 const dayModifiers = useMemo(() => {
    if (!currentClientDate || !Array.isArray(allTasks)) return {};

    const today = new Date(currentClientDate);
    today.setHours(0, 0, 0, 0);

    const modifiers: {
      overdue_highlight: Date[];
      today_task_highlight: Date[];
      upcoming_highlight: Date[];
      postponed_highlight: Date[];
    } = {
      overdue_highlight: [],
      today_task_highlight: [],
      upcoming_highlight: [],
      postponed_highlight: [],
    };

    allTasks.forEach((task) => {
      if (!task || task.status === 'Completada') return;

      const date = parseDateString(task.dueDate);
      if (date) {
        if(task.status === 'Pospuesta'){
            modifiers.postponed_highlight.push(date);
            if(task.reactivationDate) {
                const reactivationDate = parseDateString(task.reactivationDate);
                if(reactivationDate) modifiers.postponed_highlight.push(reactivationDate);
            }
        }
        else if (date < today) {
          modifiers.overdue_highlight.push(date);
        } else if (date.getTime() === today.getTime()) {
          modifiers.today_task_highlight.push(date);
        } else {
          modifiers.upcoming_highlight.push(date);
        }
      }
    });

    return modifiers;
  }, [allTasks, currentClientDate]);
  
  const dayModifiersClassNames = { 
      overdue_highlight: 'calendar-day--overdue-bg', 
      today_task_highlight: 'calendar-day--today-task-bg', 
      upcoming_highlight: 'calendar-day--upcoming-bg',
      postponed_highlight: 'calendar-day--postponed-bg'
  };
  
  // Calendario: mostrar TODAS las tareas del equipo para la fecha seleccionada (agrupadas)
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate || !Array.isArray(allTasks)) return [];

    const selectedDayStart = new Date(selectedDate);
    selectedDayStart.setHours(0, 0, 0, 0);

    const filtered = allTasks.filter(task => {
        if (!task || task.status === 'Completada') return false;

        const taskDueDate = parseDateString(task.dueDate);
        if (!taskDueDate) return false;
        
        const taskDayStart = new Date(taskDueDate);
        taskDayStart.setHours(0, 0, 0, 0);
        
        return taskDayStart.getTime() === selectedDayStart.getTime();
    }).sort((a,b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));
    
    return groupTasksByGroupId(filtered);
  }, [selectedDate, allTasks]);
  
  const handleTaskClick = useCallback((task: Task) => { setSelectedTaskDetail(task); setIsDetailDialogOpen(true); }, []);
  
  const taskSections = [
    { id: "upcoming-tasks", title: "Próximas Tareas", tasks: upcomingWeekTasks, icon: ListTodo, color: "text-blue-500", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300", emptyMsg: "No hay más tareas para esta semana." },
    { id: "today-tasks", title: "Tareas Para Hoy", tasks: todayTasks, icon: CheckCircle2, color: "text-green-500", badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300", emptyMsg: "No hay tareas programadas para hoy." },
    { id: "overdue-tasks", title: "Tareas Atrasadas", tasks: overdueTasks, icon: AlertTriangle, color: "text-red-500", badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300", emptyMsg: "¡Ninguna tarea atrasada! Buen trabajo." },
    { id: "postponed-tasks", title: "Tareas Pospuestas", tasks: postponedTasks, icon: History, color: "text-amber-500", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300", emptyMsg: "No tienes tareas pospuestas recientemente." }
  ];

  const postponedSections = [
    { id: "postponed-tasks-10", title: "Pospuestas: Nivel 1 (10+ días)", tasks: postponedTasks10, color: "border-amber-300 bg-amber-50 dark:bg-amber-950/50" },
    { id: "postponed-tasks-20", title: "Pospuestas: Nivel 2 (20+ días)", tasks: postponedTasks20, color: "border-orange-300 bg-orange-50 dark:bg-orange-950/50" },
    { id: "postponed-tasks-30", title: "Pospuestas: Nivel 3 (30+ días)", tasks: postponedTasks30, color: "border-red-300 bg-red-50 dark:bg-red-950/50" },
  ];

  const handleAccordionChange = (value: string) => {
    setOpenAccordionItem(value);
    setSelectedDate(undefined);
  };
  
  const canCreateTask = currentUser?.permissions.tasks_create ?? true; 

  const handleAddTask = async (data: Omit<Task, 'id' | 'status'>) => {
    await addTask(data);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Tareas del Equipo"
          description="Calendario y gestión de tareas de todo el equipo."
        >
          {canCreateTask && (
            <Button onClick={() => setIsAddTaskDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Tarea
            </Button>
          )}
        </Header>
        <main className="flex-1 p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="flex flex-col h-full"> 
                <CardHeader> 
                  <CardTitle className="flex items-center gap-2"> 
                    <CalendarDays className="h-6 w-6 text-accent" /> Calendario 
                  </CardTitle> 
                  <CardDescription> 
                    Selecciona una fecha para ver las tareas. Fechas resaltadas:
                  </CardDescription>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indicator-upcoming" /> Próximas</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indicator-today" /> Hoy</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-destructive" /> Atrasadas</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indicator-postponed" /> Pospuestas</div>
                  </div>
                </CardHeader> 
                <CardContent className="flex justify-center flex-grow items-center">
                  {!isClient ? (
                    <div className="p-3 rounded-md border w-[280px] h-[321px] flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Calendar 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={(date) => { setSelectedDate(date); setOpenAccordionItem(''); }} 
                      month={calendarMonth} 
                      onMonthChange={setCalendarMonth} 
                      locale={es} 
                      className="rounded-md border" 
                      disabled={!currentClientDate} 
                      modifiers={dayModifiers} 
                      modifiersClassNames={dayModifiersClassNames} 
                    />
                  )}
                </CardContent> 
              </Card>
              {selectedDate && ( <Card> <CardHeader> <CardTitle>Tareas para el {isClient ? format(selectedDate, 'PPP', { locale: es }) : '...'}</CardTitle> </CardHeader> <CardContent className="space-y-3"> {tasksForSelectedDate.length > 0 ? ( tasksForSelectedDate.map(task => <MemoizedTaskItemDisplay key={task.id} task={task} showDate={false} icon={Clock} iconColor={task.status === 'Pospuesta' ? 'text-amber-500' : 'text-blue-500'} isClient={isClient} onClickHandler={handleTaskClick} isTeamTask={task.assignedToId !== currentUser?.uid} />) ) : ( <div className="text-sm text-muted-foreground p-4 text-center flex flex-col items-center"> <Info className="h-8 w-8 text-muted-foreground mb-2"/> No hay tareas para esta fecha. </div> )} </CardContent> </Card> )}
            </div>
            <div className="lg:col-span-2 space-y-1">
              <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordionItem} onValueChange={handleAccordionChange} >
                {taskSections.map(section => ( 
                  <AccordionItem value={section.id} key={section.id} className="border-none"> 
                    <Card> 
                      <AccordionTrigger className="w-full hover:no-underline p-0 [&_svg]:ml-auto [&_svg]:mr-2"> 
                        <CardHeader className="flex-1 p-4"> 
                          <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-lg">
                            <section.icon className={cn("h-5 w-5", section.color)} />
                            <span className="text-center">{section.title}</span>
                            <Badge variant={section.id === "overdue-tasks" && section.tasks.length > 0 ? "destructive" : "secondary"} className={cn("ml-auto", section.badgeClass)} > {section.tasks.length} </Badge> 
                          </CardTitle> 
                        </CardHeader> 
                      </AccordionTrigger> 
                      <AccordionContent> 
                        <CardContent className="space-y-3 pt-0 p-4"> 
                          {isLoadingTasks ? (
                             <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                          ) : section.tasks.length > 0 ? ( section.tasks.map(task => <MemoizedTaskItemDisplay key={task.id} task={task} icon={section.icon} iconColor={section.color} showDate={section.id !== 'today-tasks'} isClient={isClient} onClickHandler={handleTaskClick} isTeamTask={task.assignedToId !== currentUser?.uid} />) ) : ( <div className="text-sm text-muted-foreground p-4 text-center flex flex-col items-center justify-center h-full"> <Info className="h-8 w-8 text-muted-foreground mb-2"/> <p>{section.emptyMsg}</p> </div> )} 
                          {section.id === 'postponed-tasks' && (
                            <Accordion type="multiple" className="w-full space-y-2 mt-4">
                              {postponedSections.map(pSection => (
                                pSection.tasks.length > 0 && (
                                <AccordionItem value={pSection.id} key={pSection.id} className="border-none">
                                  <Card className={pSection.color}>
                                     <AccordionTrigger className="w-full hover:no-underline p-0 text-sm font-semibold [&_svg]:ml-auto [&_svg]:mr-2">
                                       <CardHeader className="flex-1 p-3">
                                          <CardTitle className="flex items-center gap-2 text-sm">
                                            {pSection.title}
                                            <Badge variant="secondary" className="ml-auto mr-2">{pSection.tasks.length}</Badge>
                                          </CardTitle>
                                       </CardHeader>
                                     </AccordionTrigger>
                                     <AccordionContent>
                                        <CardContent className="space-y-3 pt-0 p-3">
                                            {pSection.tasks.map(task => <MemoizedTaskItemDisplay key={task.id} task={task} icon={History} iconColor="text-amber-500" showDate isClient={isClient} onClickHandler={handleTaskClick} isTeamTask={task.assignedToId !== currentUser?.uid} />)}
                                        </CardContent>
                                     </AccordionContent>
                                  </Card>
                                </AccordionItem>
                                )
                              ))}
                            </Accordion>
                          )}
                        </CardContent> 
                      </AccordionContent> 
                    </Card> 
                  </AccordionItem> 
                ))} 
              </Accordion>
            </div>
          </div>
        </main>
        {selectedTaskDetail && (
          <TaskDetailDialog
            key={selectedTaskDetail.id}
            isOpen={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            task={selectedTaskDetail}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
        <AddTaskDialog
            isOpen={isAddTaskDialogOpen}
            onOpenChange={setIsAddTaskDialogOpen}
            clients={clients}
            onTaskAdd={handleAddTask}
            isWorkflowMode={false}
        />
      </div>
    </TooltipProvider>
  );
}
