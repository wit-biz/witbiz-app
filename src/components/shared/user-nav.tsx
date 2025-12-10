
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  LogOut,
  Loader2,
  LogIn,
  Users,
  Shield,
  Trash2,
  Activity,
  TrendingUp,
  Briefcase,
  PlusCircle,
  MessageSquare,
  ArrowUpCircle,
  ArrowDownCircle,
  ListTodo,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { useAuth } from "@/firebase/provider";
import { useCRMData } from "@/contexts/CRMDataContext";
import React, { useMemo, useState } from "react";
import { LogAction, Log, Transaction, Task, AppUser } from "@/lib/types";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { parseDateString } from "@/lib/utils";


const LOG_ACTION_DETAILS: Record<LogAction, { text: string; icon: React.ElementType }> = {
    client_created: { text: "Cliente Creado", icon: Briefcase },
    client_updated: { text: "Cliente Actualizado", icon: Briefcase },
    client_archived: { text: "Cliente Archivado", icon: Briefcase },
    client_deleted_permanently: { text: "Cliente Eliminado (Per.)", icon: Trash2 },
    task_created: { text: "Tarea Creada", icon: PlusCircle },
    task_completed: { text: "Tarea Completada", icon: PlusCircle },
    task_updated: { text: "Tarea Actualizada", icon: PlusCircle },
    task_deleted_permanently: { text: "Tarea Eliminada (Per.)", icon: Trash2 },
    document_uploaded: { text: "Documento Subido", icon: PlusCircle },
    document_deleted_permanently: { text: "Documento Eliminado (Per.)", icon: Trash2 },
    note_created: { text: "Nota Creada", icon: MessageSquare },
    note_deleted_permanently: { text: "Nota Eliminada (Per.)", icon: Trash2 },
    transaction_created: { text: "Transacción Registrada", icon: PlusCircle },
    user_invited: { text: "Usuario Invitado", icon: PlusCircle },
    user_deleted_permanently: { text: "Usuario Eliminado (Per.)", icon: Trash2 },
    service_deleted_permanently: { text: "Servicio Eliminado (Per.)", icon: Trash2 },
    supplier_deleted_permanently: { text: "Proveedor Eliminado (Per.)", icon: Trash2 },
    promoter_deleted_permanently: { text: "Promotor Eliminado (Per.)", icon: Trash2 },
    entity_deleted_automatically: { text: "Entidad Eliminada (Auto)", icon: Trash2 },
};

type Period = 'day' | 'week' | 'month';

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const { currentUser, logs, bankAccounts, transactions, teamMembers, tasks } = useCRMData();
  const auth = useAuth();

  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
  const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
  
  const [activityPeriod, setActivityPeriod] = useState<Period>('day');
  const [financePeriod, setFinancePeriod] = useState<Period>('day');

  const getPeriodInterval = (period: Period) => {
      const now = new Date();
      switch(period) {
          case 'day':
              return { start: startOfDay(now), end: endOfDay(now) };
          case 'week':
              return { start: startOfWeek(now, { locale: es }), end: endOfWeek(now, { locale: es }) };
          case 'month':
              return { start: startOfMonth(now), end: endOfMonth(now) };
      }
  };
  
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const interval = getPeriodInterval(activityPeriod);
    return logs
        .filter(log => log.createdAt && isWithinInterval(log.createdAt.toDate(), interval))
        .sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [logs, activityPeriod]);
  
  const financialSummary = useMemo(() => {
    const totalBalance = (bankAccounts || []).reduce((sum, acc) => sum + acc.balance, 0);

    const interval = getPeriodInterval(financePeriod);
    const periodTransactions = (transactions || []).filter(t => isWithinInterval(new Date(t.date), interval));
    
    const totalIncome = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    return {
      totalBalance,
      totalIncome,
      totalExpense: Math.abs(totalExpense),
      netIncome: totalIncome + totalExpense,
    };
  }, [bankAccounts, transactions, financePeriod]);


  if (isUserLoading || (user && !currentUser)) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canViewAdmin = currentUser?.permissions.admin_view ?? false;
  const canViewTeamTasks = currentUser?.permissions.team_tasks_view ?? false;
  const canViewTeamActivity = currentUser?.permissions.team_activity_view ?? false;
  const canViewTeamFinance = currentUser?.permissions.team_finance_view ?? false;


  return (
    <>
    <div className="fixed top-4 right-4 z-50 flex flex-col items-center gap-1 p-1 rounded-full bg-background/80 backdrop-blur-sm sidebar-glowing-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
          >
            <UserCircle className="h-5 w-5" />
            <span className="sr-only">Abrir menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start" sideOffset={8}>
          {user && currentUser ? (
            <>
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                     <AvatarImage src={currentUser.photoURL || user.photoURL || ''} alt={currentUser.displayName || 'User'}/>
                     <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{currentUser.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'No email'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="mt-1 pt-1 border-t">
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
               {canViewAdmin && (
                <>
                  <DropdownMenuItem asChild>
                      <Link href="/team">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Equipo y Permisos</span>
                      </Link>
                  </DropdownMenuItem>
                </>
               )}
              <DropdownMenuItem onClick={() => initiateSignOut(auth)} className="mt-1 pt-1 border-t">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </>
          ) : (
             <>
                <DropdownMenuLabel>
                    <p>No autenticado</p>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="mt-1 pt-1 border-t">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Iniciar Sesión</span>
                    </Link>
                </DropdownMenuItem>
             </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {canViewTeamTasks && (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setIsTasksDialogOpen(true)}
        >
            <ListTodo className="h-5 w-5" />
            <span className="sr-only">Ver tareas del equipo</span>
        </Button>
      )}
      
      {canViewTeamActivity && (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setIsActivityDialogOpen(true)}
        >
            <Activity className="h-5 w-5" />
            <span className="sr-only">Ver actividad del equipo</span>
        </Button>
      )}

      {canViewTeamFinance && (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setIsFinanceDialogOpen(true)}
        >
            <TrendingUp className="h-5 w-5" />
            <span className="sr-only">Ver resumen financiero</span>
        </Button>
      )}

    </div>
    
    <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Actividad Reciente</DialogTitle>
             </DialogHeader>
            <Tabs value={activityPeriod} onValueChange={(v) => setActivityPeriod(v as Period)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="day">Hoy</TabsTrigger>
                    <TabsTrigger value="week">Esta Semana</TabsTrigger>
                    <TabsTrigger value="month">Este Mes</TabsTrigger>
                </TabsList>
                <TabsContent value="day">
                    {renderActivityLog(filteredLogs)}
                </TabsContent>
                 <TabsContent value="week">
                    {renderActivityLog(filteredLogs)}
                </TabsContent>
                 <TabsContent value="month">
                   {renderActivityLog(filteredLogs)}
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
    
    <Dialog open={isFinanceDialogOpen} onOpenChange={setIsFinanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Resumen Financiero</DialogTitle>
            </DialogHeader>
            <Tabs value={financePeriod} onValueChange={(v) => setFinancePeriod(v as Period)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="day">Hoy</TabsTrigger>
                    <TabsTrigger value="week">Esta Semana</TabsTrigger>
                    <TabsTrigger value="month">Este Mes</TabsTrigger>
                </TabsList>
                <TabsContent value="day">
                    {renderFinanceSummary(financialSummary)}
                </TabsContent>
                 <TabsContent value="week">
                    {renderFinanceSummary(financialSummary)}
                </TabsContent>
                 <TabsContent value="month">
                   {renderFinanceSummary(financialSummary)}
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>

    <Dialog open={isTasksDialogOpen} onOpenChange={setIsTasksDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Resumen de Tareas del Equipo</DialogTitle>
            </DialogHeader>
            <TasksDialogContent teamMembers={teamMembers || []} allTasks={tasks || []} />
        </DialogContent>
    </Dialog>

    </>
  );
}

function renderActivityLog(logs: Log[]) {
    return (
        <div className="max-h-80 overflow-y-auto mt-4">
            <div className="p-1 space-y-3">
                {logs.length > 0 ? logs.map(log => {
                    const logDetails = LOG_ACTION_DETAILS[log.action] || { text: log.action, icon: Activity };
                    const Icon = logDetails.icon;
                    return (
                        <div key={log.id} className="flex items-start gap-3 text-sm">
                            <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p><span className="font-semibold">{log.authorName}</span> {logDetails.text.toLowerCase()} <span className="font-semibold text-primary">{log.entityName}</span>.</p>
                                <p className="text-xs text-muted-foreground">{format(log.createdAt.toDate(), "Pp", { locale: es })}</p>
                            </div>
                        </div>
                    )
                }) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No hay actividad en este período.</p>
                )}
            </div>
        </div>
    );
}

function renderFinanceSummary(summary: { totalBalance: number; totalIncome: number; totalExpense: number; netIncome: number; }) {
    return (
        <div className="mt-4 p-1 space-y-4">
            <div className="p-4 rounded-lg bg-secondary">
                <h3 className="text-sm font-medium text-muted-foreground">Balance Total Consolidado</h3>
                <p className="text-2xl font-bold">{summary.totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <h3 className="text-sm font-medium flex items-center gap-1 text-green-900 dark:text-green-200"><ArrowUpCircle className="h-4 w-4"/> Ingresos</h3>
                    <p className="text-xl font-bold text-green-800 dark:text-green-300">{summary.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                </div>
                 <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <h3 className="text-sm font-medium flex items-center gap-1 text-red-900 dark:text-red-200"><ArrowDownCircle className="h-4 w-4"/> Egresos</h3>
                    <p className="text-xl font-bold text-red-800 dark:text-red-300">{summary.totalExpense.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                </div>
            </div>
             <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground">Utilidad Neta del Período</h3>
                <p className="text-2xl font-bold text-blue-600">{summary.netIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            </div>
        </div>
    );
}

function TasksDialogContent({ teamMembers, allTasks }: { teamMembers: AppUser[], allTasks: Task[] }) {
    const [mainTab, setMainTab] = useState<'member' | 'time'>('member');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [timePeriod, setTimePeriod] = useState<Period>('day');

    const handleTabChange = (value: string) => {
        setMainTab(value as any);
        setSelectedMemberId(null); // Reset member selection when changing main tabs
    };
    
    const selectedMember = useMemo(() => {
        if (!selectedMemberId) return null;
        return teamMembers.find(m => m.id === selectedMemberId);
    }, [selectedMemberId, teamMembers]);

    const tasksToShow = useMemo(() => {
        if (mainTab === 'member') {
            if (!selectedMemberId) return [];
            return allTasks.filter(task => task.assignedToId === selectedMemberId);
        } else { // time
            const now = new Date();
            const interval = {
                day: { start: startOfDay(now), end: endOfDay(now) },
                week: { start: startOfWeek(now, { locale: es }), end: endOfWeek(now, { locale: es }) },
                month: { start: startOfMonth(now), end: endOfMonth(now) },
            }[timePeriod];
            return allTasks.filter(task => {
                const taskDate = parseDateString(task.dueDate);
                return taskDate ? isWithinInterval(taskDate, interval) : false;
            });
        }
    }, [mainTab, selectedMemberId, timePeriod, allTasks]);
    
    if (mainTab === 'member' && !selectedMemberId) {
        return (
             <Tabs value={mainTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="member">Por Miembro</TabsTrigger>
                    <TabsTrigger value="time">Por Tiempo</TabsTrigger>
                </TabsList>
                <TabsContent value="member" className="mt-4">
                     <div className="max-h-96 overflow-y-auto space-y-1 pr-2">
                        {teamMembers.map(member => (
                            <Button
                                key={member.id}
                                variant={'ghost'}
                                className="w-full justify-start gap-2"
                                onClick={() => setSelectedMemberId(member.id)}
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.photoURL} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {member.name}
                            </Button>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        )
    }

    return (
        <Tabs value={mainTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="member">Por Miembro</TabsTrigger>
                <TabsTrigger value="time">Por Tiempo</TabsTrigger>
            </TabsList>
            <TabsContent value="member" className="mt-4">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={selectedMember?.photoURL} />
                                <AvatarFallback>{selectedMember?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold">Tareas de {selectedMember?.name}</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedMemberId(null)}>
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Volver
                        </Button>
                    </div>
                    {renderTaskList(tasksToShow)}
                </div>
            </TabsContent>
            <TabsContent value="time" className="mt-4">
                <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="day">Hoy</TabsTrigger>
                        <TabsTrigger value="week">Esta Semana</TabsTrigger>
                        <TabsTrigger value="month">Este Mes</TabsTrigger>
                    </TabsList>
                </Tabs>
                {renderTaskList(tasksToShow)}
            </TabsContent>
        </Tabs>
    );
}

function renderTaskList(tasks: Task[]) {
     const getStatusColor = (task: Task) => {
        if (task.status === 'Completada') return 'text-green-500';
        if (task.status === 'Pospuesta') return 'text-amber-500';
        const dueDate = parseDateString(task.dueDate);
        if (dueDate && dueDate < startOfDay(new Date())) return 'text-red-500';
        return 'text-blue-500';
    }

    return (
        <div className="max-h-80 overflow-y-auto mt-4 space-y-2">
            {tasks.length > 0 ? tasks.map(task => (
                <div key={task.id} className="p-3 rounded-md border flex items-center gap-3">
                    <ListTodo className={`h-5 w-5 shrink-0 ${getStatusColor(task)}`} />
                    <div className="flex-grow">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.clientName || 'Sin cliente'}</p>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                </div>
            )) : (
                <p className="text-center text-muted-foreground p-8">No hay tareas para mostrar.</p>
            )}
        </div>
    );
}
