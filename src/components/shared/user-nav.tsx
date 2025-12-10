
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
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { useAuth } from "@/firebase/provider";
import { useCRMData } from "@/contexts/CRMDataContext";
import React, { useMemo, useState } from "react";
import { LogAction, Log, Transaction } from "@/lib/types";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


const LOG_ACTION_DETAILS: Record<LogAction, { text: string; icon: React.ElementType }> = {
    client_created: { text: "Cliente Creado", icon: Briefcase },
    client_updated: { text: "Cliente Actualizado", icon: Briefcase },
    client_archived: { text: "Cliente Archivado", icon: Briefcase },
    task_created: { text: "Tarea Creada", icon: PlusCircle },
    task_completed: { text: "Tarea Completada", icon: PlusCircle },
    task_updated: { text: "Tarea Actualizada", icon: PlusCircle },
    document_uploaded: { text: "Documento Subido", icon: PlusCircle },
    note_created: { text: "Nota Creada", icon: MessageSquare },
    transaction_created: { text: "Transacción Registrada", icon: PlusCircle },
    user_invited: { text: "Usuario Invitado", icon: PlusCircle },
};

type Period = 'day' | 'week' | 'month';

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const { currentUser, logs, bankAccounts, transactions } = useCRMData();
  const auth = useAuth();

  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
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
      
      <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setIsActivityDialogOpen(true)}
      >
          <Activity className="h-5 w-5" />
          <span className="sr-only">Ver actividad del equipo</span>
      </Button>

      <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setIsFinanceDialogOpen(true)}
      >
          <TrendingUp className="h-5 w-5" />
          <span className="sr-only">Ver resumen financiero</span>
      </Button>
    </div>
    
    <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-md">
             <DialogHeader>
                <DialogTitle className="sr-only">Actividad Reciente</DialogTitle>
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
                <DialogTitle className="sr-only">Resumen Financiero</DialogTitle>
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
