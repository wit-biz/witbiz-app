"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Plus, ChevronLeft, ChevronRight, Info, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useAuth } from '@/firebase';
import { type TimeOffRequest } from '@/lib/types';
import { RequestTimeOffDialog } from '@/components/shared/RequestTimeOffDialog';
import { ApproveTimeOffDialog } from '@/components/shared/ApproveTimeOffDialog';

interface PersonalCalendarProps {
  userId?: string;
}

export function PersonalCalendar({ userId }: PersonalCalendarProps) {
  const { currentUser, teamMembers } = useCRMData();
  const auth = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<TimeOffRequest[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [activeTab, setActiveTab] = useState('mis-solicitudes');

  const currentUserId = userId || currentUser?.uid;
  const isOwnCalendar = currentUserId === currentUser?.uid;
  
  // Check if user can approve based on role (Director or Administrador)
  const userCanApprove = currentUser?.role === 'Director' || currentUser?.role === 'Administrador';

  useEffect(() => {
    if (auth.currentUser) {
      loadData();
    }
  }, [currentUserId, auth.currentUser]);

  const loadData = async () => {
    if (!currentUserId || !auth.currentUser) return;
    
    setIsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      // Load my time off requests
      const response = await fetch(`/api/users/${currentUserId}/time-off`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📅 My time off requests:', data.requests);
        setTimeOffRequests(data.requests || []);
      } else {
        console.error('Failed to load time off requests:', response.status);
      }

      // Load tasks to block dates
      const tasksResponse = await fetch(`/api/users/${currentUserId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }

      // Load pending approvals if viewing own calendar
      if (isOwnCalendar) {
        const approvalsResponse = await fetch('/api/users/time-off/pending-approvals', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (approvalsResponse.ok) {
          const approvalsData = await approvalsResponse.json();
          console.log('📋 Pending approvals:', approvalsData.requests);
          setPendingApprovals(approvalsData.requests || []);
        }
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get dates with requests
  const datesWithRequests = useMemo(() => {
    const dates = new Map<string, TimeOffRequest[]>();
    
    timeOffRequests.forEach(request => {
      request.dates.forEach(dateStr => {
        if (!dates.has(dateStr)) {
          dates.set(dateStr, []);
        }
        dates.get(dateStr)!.push(request);
      });
    });

    return dates;
  }, [timeOffRequests]);

  // Get dates with tasks (blocked dates)
  const datesWithTasks = useMemo(() => {
    const dates = new Set<string>();
    
    tasks.forEach(task => {
      if (task.dueDate) {
        dates.add(task.dueDate);
      }
    });

    return dates;
  }, [tasks]);

  // Check if a date has a request
  const getDateRequests = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return datesWithRequests.get(dateStr) || [];
  };

  // Check if a date has tasks
  const hasTaskOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return datesWithTasks.has(dateStr);
  };

  // Custom day content - receives props from react-day-picker
  const DayContent = ({ date }: { date: Date }) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return <span>-</span>;
    }
    
    const requests = getDateRequests(date);
    const hasTask = hasTaskOnDate(date);
    const isPending = requests.some(r => r.status === 'pending');
    const isApproved = requests.some(r => r.status === 'approved');
    const isRejected = requests.some(r => r.status === 'rejected');

    return (
      <div className="relative w-full h-full">
        <div className={`flex items-center justify-center h-full text-sm rounded-md transition-colors ${
          isToday(date) ? 'bg-primary text-primary-foreground' : ''
        } ${hasTask ? 'bg-orange-50 dark:bg-orange-900/20' : ''} ${isApproved ? 'bg-green-50 dark:bg-green-900/20' : ''} ${isPending ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
          {date.getDate()}
        </div>
        {requests.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 pb-0.5">
            {isPending && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
            {isApproved && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
            {isRejected && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </div>
        )}
        {hasTask && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full m-0.5" />
        )}
      </div>
    );
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    if (!auth.currentUser) return;
    
    try {
      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');

      const response = await fetch('/api/users/time-off/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Error al cancelar la solicitud');
      }

      toast({
        title: 'Solicitud cancelada',
        description: 'La solicitud ha sido cancelada exitosamente.',
      });
      
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cancelar la solicitud',
      });
    }
  };

  // Get requests for selected date
  const selectedDateRequests = selectedDate ? getDateRequests(selectedDate) : [];

  // Get pending requests for approval
  const pendingRequests = pendingApprovals;

  return (
    <div className="space-y-6">
      {/* Rules Banner */}
      {isOwnCalendar && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <FileText className="h-4 w-4" />
              Reglas de Solicitudes de Tiempo Libre
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Aprobación:</strong> Las solicitudes requieren aprobación de un superior</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Cancelación:</strong> Solo hasta 24 horas antes de la fecha</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Bloqueo:</strong> Los días aprobados bloquean asignación de tareas</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Historial:</strong> Todas las acciones quedan registradas en bitácora</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Calendario Personal
                </CardTitle>
                <CardDescription>
                  {isOwnCalendar ? 'Gestiona tus días libres y urgencias' : 'Calendario del colaborador'}
                </CardDescription>
              </div>
              {isOwnCalendar && (
                <Button onClick={() => setIsRequestDialogOpen(true)} size="sm" className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Solicitar Día
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                  className="hover:bg-background"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                  className="hover:bg-background"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar */}
              <div className="border rounded-xl p-4 bg-card shadow-sm">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  locale={es}
                  components={{
                    DayContent,
                  }}
                  disabled={hasTaskOnDate}
                  className="mx-auto"
                  styles={{
                    caption: { color: 'hsl(var(--foreground))' },
                    nav: { color: 'hsl(var(--foreground))' },
                    head_cell: { color: 'hsl(var(--muted-foreground))' },
                  }}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm" />
                  <span className="text-muted-foreground">Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm" />
                  <span className="text-muted-foreground">Aprobado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" />
                  <span className="text-muted-foreground">Rechazado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm" />
                  <span className="text-muted-foreground">Tarea asignada</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Tabs for My Requests + Pending Approvals */}
        {isOwnCalendar && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Gestión de Solicitudes
              </CardTitle>
              <CardDescription>
                {userCanApprove ? 'Tus solicitudes y solicitudes por aprobar' : 'Estado de tus solicitudes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${userCanApprove ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <TabsTrigger value="mis-solicitudes" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mis Solicitudes
                  </TabsTrigger>
                  {userCanApprove && (
                    <TabsTrigger value="aprobar" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Aprobar
                      {pendingRequests.length > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {pendingRequests.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="mis-solicitudes" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : timeOffRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No tienes solicitudes</p>
                      <p className="text-sm mt-1">Usa el botón "Solicitar Día" para crear una</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {timeOffRequests.map((request) => {
                          const firstDate = new Date(request.dates?.[0]);
                          const hoursUntilStart = (firstDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                          const canCancel = (request.status === 'pending' || request.status === 'approved') && hoursUntilStart >= 24;
                          
                          return (
                            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {request.type === 'libre' ? 'Día Libre' : 'Urgencia'}
                                  </span>
                                  <Badge variant={
                                    request.status === 'pending' ? 'secondary' :
                                    request.status === 'approved' ? 'default' : 
                                    request.status === 'cancelled' ? 'outline' : 'destructive'
                                  }>
                                    {request.status === 'pending' ? 'Pendiente' :
                                     request.status === 'approved' ? 'Aprobado' : 
                                     request.status === 'cancelled' ? 'Cancelado' : 'Rechazado'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {request.dates?.[0]} {request.dates?.length > 1 ? `- ${request.dates[request.dates.length - 1]}` : ''}
                                </p>
                              </div>
                              {canCancel && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleCancelRequest(request.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {userCanApprove && (
                  <TabsContent value="aprobar" className="mt-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : pendingRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No hay solicitudes pendientes</p>
                        <p className="text-sm mt-1">Las solicitudes de tu equipo aparecerán aquí</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {pendingRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div>
                                <p className="font-medium">{request.userName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {request.type === 'libre' ? 'Día Libre' : 'Urgencia'} - {request.dates?.length || 0} día(s)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {request.dates?.[0]} {request.dates?.length > 1 ? `- ${request.dates[request.dates.length - 1]}` : ''}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setIsApproveDialogOpen(true)}
                              >
                                Revisar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      {isOwnCalendar && (
        <RequestTimeOffDialog
          isOpen={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          onRequestSubmitted={(autoApproved) => {
            setIsRequestDialogOpen(false);
            loadData();
            // Only show toast if not auto-approved (auto-approved shows its own toast)
            if (!autoApproved) {
              toast({
                title: 'Solicitud enviada',
                description: 'Tu solicitud ha sido enviada para aprobación.',
              });
            }
          }}
        />
      )}

      <ApproveTimeOffDialog
        isOpen={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        onDecisionMade={() => {
          setIsApproveDialogOpen(false);
          loadData();
          toast({
            title: 'Decisión registrada',
            description: 'La solicitud ha sido actualizada.',
          });
        }}
      />
    </div>
  );
}
