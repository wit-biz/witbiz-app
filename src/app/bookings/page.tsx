
"use client";

import React, { useState, useMemo, useCallback, type FormEvent, useEffect } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Calendar as CalendarIcon, Loader2, Save, Building, Briefcase, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDateString, formatTimeString, parseDateString } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { type Reservation as Booking } from "@/lib/types";
import { useCRMData } from "@/contexts/CRMDataContext";

type ReservationType = 'Cita' | 'Operación Divisas';
type ReservationStatus = 'Confirmada' | 'Pendiente' | 'Cancelada';
type FormData = Omit<Booking, 'id' | 'createdAt'>;

const initialNewReservationData: FormData = {
  clientId: "",
  clientName: "",
  type: 'Cita',
  date: new Date().toISOString().split('T')[0],
  time: "",
  details: "",
  status: 'Confirmada',
};

export default function ReservationsPage() {
    const { toast } = useToast();
    const { 
        clients, 
        reservations: bookings, 
        isLoadingReservations: isLoadingBookings,
        currentUser, 
        addReservation, 
        updateReservation, 
        deleteReservation 
    } = useCRMData();

    const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    
    const [reservationToEdit, setReservationToEdit] = useState<Booking | null>(null);
    const [reservationToDelete, setReservationToDelete] = useState<Booking | null>(null);
    const [formData, setFormData] = useState<any>(initialNewReservationData);
    
    const [isClient, setIsClient] = useState(false);
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        setIsClient(true);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        setToday(todayDate);
    }, []);
  
    const canCreateReservation = currentUser?.permissions.reservations_create ?? true;
    const canEditReservation = currentUser?.permissions.reservations_edit ?? true;
    const canDeleteReservation = currentUser?.permissions.reservations_delete ?? true;


    const handleDataChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSelectChange = useCallback((name: keyof FormData) => (value: string) => {
        if (name === 'clientId') {
        const selectedClient = clients.find(c => c.id === value);
        setFormData(prev => ({ ...prev, clientId: value, clientName: selectedClient?.name || '' }));
        } else {
        setFormData(prev => ({ ...prev, [name]: value as any }));
        }
    }, [clients]);

    const handleDateChangeForAddDialog = useCallback((date: Date | undefined) => {
        if (date) {
        setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
        }
    }, []);

    const handleOpenFormDialog = (reservation: Booking | null) => {
        if (reservation) {
        setReservationToEdit(reservation);
        setFormData({
            ...reservation,
            date: reservation.date ? format(parseDateString(reservation.date) || new Date(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        });
        } else {
        setReservationToEdit(null);
        setFormData({ ...initialNewReservationData, date: format(calendarDate || new Date(), 'yyyy-MM-dd')});
        }
        setIsFormDialogOpen(true);
    }

    const handleOpenDeleteDialog = (reservation: Booking) => {
        setReservationToDelete(reservation);
        setIsDeleteConfirmOpen(true);
    }

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.clientId || !formData.date || !formData.time) {
        toast({ title: 'Error', description: 'Cliente, fecha y hora son obligatorios.', variant: 'destructive'});
        return;
        }
        setIsSubmitting(true);
        const action = reservationToEdit 
            ? updateReservation(reservationToEdit.id, formData)
            : addReservation(formData);
        
        action.then(() => {
            toast({ title: 'Éxito', description: `Reservación ${reservationToEdit ? 'actualizada' : 'creada'}.` });
            setIsSubmitting(false);
            setIsFormDialogOpen(false);
        }).catch(err => {
            toast({ title: 'Error', description: `No se pudo guardar la reservación: ${err.message}`, variant: 'destructive' });
            setIsSubmitting(false);
        });
    }, [formData, reservationToEdit, toast, addReservation, updateReservation]);

    const handleDelete = async () => {
        if (!reservationToDelete) return;
        setIsSubmitting(true);
        deleteReservation(reservationToDelete.id).then(() => {
            toast({ title: 'Éxito', description: 'Reservación eliminada.' });
            setIsSubmitting(false);
            setIsDeleteConfirmOpen(false);
            setReservationToDelete(null);
        }).catch(err => {
            toast({ title: 'Error', description: `No se pudo eliminar la reservación: ${err.message}`, variant: 'destructive' });
            setIsSubmitting(false);
        });
    };
    
    const reservationsForSelectedDate = useMemo(() => {
        if (!calendarDate) return [];
        const selectedDayString = format(calendarDate, 'yyyy-MM-dd');
        return bookings.filter(res => format(parseDateString(res.date) || new Date(), 'yyyy-MM-dd') === selectedDayString).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    }, [bookings, calendarDate]);
    
    const dayModifiers = useMemo(() => {
        if (!today) return {};
        const reservationDates = bookings.map(res => parseDateString(res.date)).filter((date): date is Date => date !== null);
        const todayReservations = reservationDates.filter(date => date.getTime() === today.getTime());
        const futureReservations = reservationDates.filter(date => date.getTime() > today.getTime());
        return { today_reservations: todayReservations, future_reservations: futureReservations };
    }, [bookings, today]);

    const dayModifiersClassNames = {
        today_reservations: 'day-reserved-today',
        future_reservations: 'day-reserved-future'
    };

    return (
        <div className="flex flex-col min-h-screen">
        <Header
            title="Reservaciones"
            description="Gestione y programe citas y operaciones."
        >
            {canCreateReservation ? (
                <Button onClick={() => handleOpenFormDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Reservación
                </Button>
            ) : null}
        </Header>
        <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Calendario de Reservas</CardTitle>
                <CardDescription className="flex items-center gap-x-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Hoy</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Futuras</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                {!isClient ? (
                <div className="p-3 rounded-md border w-[280px] h-[321px] flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
                ) : (
                <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    className="rounded-md border"
                    modifiers={dayModifiers}
                    modifiersClassNames={dayModifiersClassNames}
                    disabled={!today || isLoadingBookings ? (date) => true : (date) => {
                    if (!today) return true;
                    const oneYearAgo = new Date(today);
                    oneYearAgo.setFullYear(today.getFullYear() - 1);
                    const twoYearsFromNow = new Date(today);
                    twoYearsFromNow.setFullYear(today.getFullYear() + 2);
                    return date < oneYearAgo || date > twoYearsFromNow;
                    }}
                />
                )}
            </CardContent>
            </Card>
            
            <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>
                    Reservaciones para {calendarDate && isClient ? formatDateString(format(calendarDate, 'yyyy-MM-dd'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Seleccione una fecha"}
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[300px]">
                {isLoadingBookings ? (
                    <div className="text-center py-12 text-muted-foreground"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
                ) : reservationsForSelectedDate.length > 0 ? (
                    reservationsForSelectedDate.map(res => (
                    <div key={res.id} className="p-3 border rounded-md flex items-start gap-4 hover:bg-secondary/50">
                        <div className="text-center w-16 flex-shrink-0">
                        <p className="font-bold text-lg">{isClient && res.time ? formatTimeString(res.time) : res.time}</p>
                        <p className="text-xs text-muted-foreground">{res.type === 'Cita' ? <Briefcase className="inline h-3 w-3 mr-1"/> : <Building className="inline h-3 w-3 mr-1"/>}{res.type}</p>
                        </div>
                        <div className="flex-grow border-l pl-4">
                        <p className="font-semibold">{res.clientName}</p>
                        <p className="text-sm text-muted-foreground">{res.details || 'Sin detalles.'}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <Badge variant={res.status === 'Confirmada' ? 'default' : res.status === 'Pendiente' ? 'secondary' : 'destructive'}
                            className={cn(res.status === 'Confirmada' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300')}>
                            {res.status}
                        </Badge>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canEditReservation && <DropdownMenuItem onClick={() => handleOpenFormDialog(res)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
                                {canDeleteReservation && <DropdownMenuItem onClick={() => handleOpenDeleteDialog(res)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">No hay reservaciones</h3>
                    <p className="text-sm">Seleccione otro día o cree una nueva reservación.</p>
                    </div>
                )}
                </CardContent>
            </Card>
            </div>
        </div>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{reservationToEdit ? 'Editar Reservación' : 'Nueva Reservación'}</DialogTitle>
                <DialogDescription>Complete los detalles para {reservationToEdit ? 'actualizar' : 'crear'} una reservación.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div>
                    <Label htmlFor="clientId">Cliente</Label>
                    <Select name="clientId" value={formData.clientId} onValueChange={handleSelectChange('clientId')} required disabled={isSubmitting}>
                    <SelectTrigger id="clientId"><SelectValue placeholder="Seleccione un cliente..." /></SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="type">Tipo de Reservación</Label>
                    <Select name="type" value={formData.type} onValueChange={handleSelectChange('type')} disabled={isSubmitting}>
                        <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Cita">Cita / Reunión</SelectItem>
                        <SelectItem value="Operación Divisas">Operación Divisas</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" value={formData.status} onValueChange={handleSelectChange('status')} disabled={isSubmitting}>
                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Confirmada">Confirmada</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="date">Fecha</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")} disabled={isSubmitting}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? format(parseDateString(formData.date) || new Date(), "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={parseDateString(formData.date)} onSelect={handleDateChangeForAddDialog} initialFocus /></PopoverContent>
                    </Popover>
                    </div>
                    <div>
                    <Label htmlFor="time">Hora (HH:MM)</Label>
                    <Input id="time" name="time" type="time" value={formData.time} onChange={handleDataChange} required disabled={isSubmitting} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="details">Detalles / Notas</Label>
                    <Textarea id="details" name="details" value={formData.details || ''} onChange={handleDataChange} disabled={isSubmitting} placeholder="Detalles de la operación, tema de la cita, etc." />
                </div>
                </div>
                <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Guardar Reservación
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar la reservación para "{reservationToDelete?.clientName}" el {reservationToDelete?.date ? formatDateString(reservationToDelete.date as string) : ''}?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Eliminar"}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </main>
    </div>
  );
}
    
    