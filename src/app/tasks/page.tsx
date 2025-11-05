

"use client";

import React, { useState, useEffect, useMemo, type ChangeEvent, useCallback } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, AlertTriangle, CalendarClock, Loader2, Briefcase, Clock, CalendarDays, Info, CheckCircle2, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DayModifiers } from "react-day-picker";
import { cn, parseDateString, formatDateString, formatTimeString } from "@/lib/utils"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { TaskDetailDialog } from "@/components/shared/TaskDetailDialog";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { Task } from "@/lib/types";
import { AddTaskDialog } from "@/components/shared/AddTaskDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const MemoizedTaskItemDisplay = React.memo(function TaskItemDisplay({ task, icon: Icon, iconColor = "text-gray-500", showDate = true, isClient, onClickHandler }: { task: Task; icon?: React.ElementType; iconColor?: string, showDate?: boolean, isClient: boolean, onClickHandler: (task: Task) => void }) {
  const taskDueDate = parseDateString(task.dueDate);
  return ( 
    <div 
      className="flex items-start gap-3 p-3 bg-background hover:bg-secondary/50 rounded-md border cursor-pointer transition-colors" 
      onClick={() => onClickHandler(task)} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClickHandler(task); }} 
      aria-label={`Ver detalles de la tarea: ${task.title}`} 
    > 
      {Icon && <Icon className={`h-5 w-5 mt-1 flex-shrink-0 ${iconColor}`} />} 
      <div className="flex-grow min-w-0"> 
        <p className="font-semibold text-card-foreground truncate">{task.title}</p> 
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {task.clientName && ( 
              <span className="inline-flex items-center gap-1"> 
                <Briefcase className="h-3 w-3" /> {task.clientName} 
              </span> 
            )} 
            {task.clientName && task.assignedToName && <span className="text-muted-foreground/50">|</span>}
            {task.assignedToName && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar className="h-4 w-4">
                            <AvatarImage src={task.assignedToPhotoURL} />
                            <AvatarFallback>{task.assignedToName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Asignado a: {task.assignedToName}</p>
                    </TooltipContent>
                </Tooltip>
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
  const { toast } = useToast();

  const { clients, tasks: allTasks, isLoadingTasks, currentUser, addTask, updateTask, deleteTask } = useCRMData();
  const { setHasTasksForToday } = useTasksContext();

  const [isClient, setIsClient] = useState(false);
  const [currentClientDate, setCurrentClientDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>();
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("overdue-tasks");
  
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
  
  const { overdueTasks, todayTasks, upcomingWeekTasks } = useMemo(() => {
    if (!currentClientDate || !Array.isArray(allTasks) || !currentUser) {
      return { overdueTasks: [], todayTasks: [], upcomingWeekTasks: [] };
    }
    const today = new Date(currentClientDate);
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
  
    const userPendingTasks = allTasks.filter(task => task && task.status !== 'Completada' && task.assignedToId === currentUser.uid);
  
    const overdue = userPendingTasks
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
  
    const forToday = userPendingTasks
      .filter(task => {
        const taskDueDate = parseDateString(task.dueDate);
        return taskDueDate && taskDueDate.getTime() === today.getTime();
      })
      .sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));
  
    const upcomingThisWeek = userPendingTasks
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
  
    return { overdueTasks: overdue, todayTasks: forToday, upcomingWeekTasks: upcomingThisWeek };
  }, [allTasks, currentClientDate, currentUser]);
    
  
 const dayModifiers = useMemo(() => {
    if (!currentClientDate || !Array.isArray(allTasks)) return {};

    const today = new Date(currentClientDate);
    today.setHours(0, 0, 0, 0);

    const modifiers: {
      overdue_highlight: Date[];
      today_task_highlight: Date[];
      upcoming_highlight: Date[];
    } = {
      overdue_highlight: [],
      today_task_highlight: [],
      upcoming_highlight: [],
    };

    allTasks.forEach((task) => {
      if (!task || task.status === 'Completada') return;

      const date = parseDateString(task.dueDate);
      if (date) {
        if (date < today) {
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
  
  const dayModifiersClassNames = { overdue_highlight: 'calendar-day--overdue-bg', today_task_highlight: 'calendar-day--today-task-bg', upcoming_highlight: 'calendar-day--upcoming-bg' };
  
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate || !Array.isArray(allTasks) || !currentUser) return [];
    const selectedDayStart = new Date(selectedDate);
    selectedDayStart.setHours(0,0,0,0);
    return allTasks.filter(task => {
        if (!task) return false;
        if (task.assignedToId !== currentUser.uid) return false;
        const taskDueDate = parseDateString(task.dueDate);
        return taskDueDate && taskDueDate.getTime() === selectedDayStart.getTime() && task.status !== 'Completada';
    }).sort((a,b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));
  }, [selectedDate, allTasks, currentUser]);
  
  const handleTaskClick = useCallback((task: Task) => { setSelectedTaskDetail(task); setIsDetailDialogOpen(true); }, []);
  
  const taskSections = [
    { id: "overdue-tasks", title: "Tareas Atrasadas", tasks: overdueTasks, icon: AlertTriangle, color: "text-destructive", emptyMsg: "¡Ninguna tarea atrasada! Buen trabajo." },
    { id: "today-tasks", title: "Tareas Para Hoy", tasks: todayTasks, icon: CheckCircle2, color: "text-green-500", emptyMsg: "No hay tareas programadas para hoy." },
    { id: "upcoming-tasks", title: "Próximas Tareas", tasks: upcomingWeekTasks, icon: ListTodo, color: "text-blue-500", emptyMsg: "No hay más tareas para esta semana." }
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
          title="Mis Tareas"
          description="Organiza y sigue tus actividades y compromisos diarios y semanales."
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
              <Card> 
                <CardHeader> 
                  <CardTitle className="flex items-center gap-2"> 
                    <CalendarDays className="h-6 w-6 text-accent" /> Calendario 
                  </CardTitle> 
                  <CardDescription> Selecciona una fecha para ver las tareas. Fechas resaltadas: <span className="inline-block w-3 h-3 rounded-full mx-1 align-middle bg-indicator-overdue" ></span> Atrasadas, <span className="inline-block w-3 h-3 rounded-full mx-1 align-middle bg-indicator-today" ></span> Hoy, <span className="inline-block w-3 h-3 rounded-full mx-1 align-middle bg-indicator-upcoming" ></span> Futuras. </CardDescription> 
                </CardHeader> 
                <CardContent className="flex justify-center">
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
              {selectedDate && ( <Card> <CardHeader> <CardTitle>Tareas para el {isClient ? format(selectedDate, 'PPP', { locale: es }) : '...'}</CardTitle> </CardHeader> <CardContent className="space-y-3"> {tasksForSelectedDate.length > 0 ? ( tasksForSelectedDate.map(task => <MemoizedTaskItemDisplay key={task.id} task={task} showDate={false} icon={Clock} iconColor="text-blue-500" isClient={isClient} onClickHandler={handleTaskClick} />) ) : ( <div className="text-sm text-muted-foreground p-4 text-center flex flex-col items-center"> <Info className="h-8 w-8 text-muted-foreground mb-2"/> No hay tareas pendientes para esta fecha. </div> )} </CardContent> </Card> )}
            </div>
            <div className="lg:col-span-2 space-y-1">
              <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordionItem} onValueChange={handleAccordionChange} >
                {taskSections.map(section => ( 
                  <AccordionItem value={section.id} key={section.id} className="border-none"> 
                    <Card> 
                      <AccordionTrigger className="w-full hover:no-underline p-0 [&_svg]:ml-auto [&_svg]:mr-2"> 
                        <CardHeader className="flex-1 p-4"> 
                          <CardTitle className="flex items-center gap-2 text-lg"> 
                            <section.icon className={`h-6 w-6 ${section.color}`} /> {section.title} <Badge variant={section.tasks.length > 0 && section.id === "overdue-tasks" ? "destructive" : "secondary"} className="ml-auto mr-2" > {section.tasks.length} </Badge> 
                          </CardTitle> 
                        </CardHeader> 
                      </AccordionTrigger> 
                      <AccordionContent> 
                        <CardContent className="space-y-3 pt-0 p-4"> 
                          {isLoadingTasks ? (
                             <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                          ) : section.tasks.length > 0 ? ( section.tasks.map(task => <MemoizedTaskItemDisplay key={task.id} task={task} icon={section.icon} iconColor={section.color} showDate={section.id !== 'today-tasks'} isClient={isClient} onClickHandler={handleTaskClick} />) ) : ( <div className="text-sm text-muted-foreground p-4 text-center flex flex-col items-center"> <Info className="h-8 w-8 text-muted-foreground mb-2"/> {section.emptyMsg} </div> )} 
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
