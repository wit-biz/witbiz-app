
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash, CheckCircle, Loader2, PlusCircle, UploadCloud, Calendar as CalendarIcon, Save, History, Redo, MessageSquare, MapPin } from 'lucide-react';
import { Task, Client, SubTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { parseDateString, formatTimeString, cn } from '@/lib/utils';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useDialogs } from '@/contexts/DialogsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';


const taskEditSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  location: z.string().optional(),
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  assignedToId: z.string().optional(),
  dueDate: z.date({ required_error: "La fecha de vencimiento es requerida." }),
  dueTime: z.string().optional(),
});

const postponeSchema = z.object({
    reactivationDate: z.date({ required_error: "La fecha de reactivación es requerida." }),
    postponedReason: z.string().min(5, "Debe proveer una razón para posponer."),
});


interface TaskDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask?: (taskId: string, permanent?: boolean) => Promise<boolean>;
}

export function TaskDetailDialog({
  isOpen,
  onOpenChange,
  task: initialTask,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailDialogProps) {
  const { toast } = useToast();
  const { clients, teamMembers, addNote } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();
  
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [isPostponing, setIsPostponing] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const form = useForm<z.infer<typeof taskEditSchema>>({
    resolver: zodResolver(taskEditSchema),
  });
  
  const postponeForm = useForm<z.infer<typeof postponeSchema>>({
    resolver: zodResolver(postponeSchema),
  });

  useEffect(() => {
    setTask(initialTask);
    if (initialTask) {
        form.reset({
            title: initialTask.title,
            description: initialTask.description,
            location: initialTask.location,
            clientId: initialTask.clientId,
            assignedToId: initialTask.assignedToId,
            dueDate: parseDateString(initialTask.dueDate) || new Date(),
            dueTime: initialTask.dueTime,
        });
        postponeForm.reset({
            reactivationDate: initialTask.reactivationDate ? parseDateString(initialTask.reactivationDate) || new Date() : new Date(),
            postponedReason: initialTask.postponedReason || '',
        });
    }
    if (!isOpen) {
      setIsEditing(false);
      setIsPostponing(false);
      setIsAddingNote(false);
      setNoteContent("");
    }
  }, [initialTask, isOpen, form, postponeForm]);

  if (!task) return null;
  
  const areAllSubTasksCompleted = task.subTasks ? task.subTasks.every(st => st.completed) : true;
  const progress = task.subTasks && task.subTasks.length > 0
    ? (task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100
    : 100;

  const dueDate = parseDateString(task.dueDate);
  const reactivationDate = task.reactivationDate ? parseDateString(task.reactivationDate) : null;
  
  const handleMarkAsComplete = async () => {
    if (!onUpdateTask) return;
    
    if (task.requiresInput && !isAddingNote) {
        setIsAddingNote(true);
        return;
    }
    
    if (!areAllSubTasksCompleted) {
        toast({
            variant: 'destructive',
            title: 'Requisitos pendientes',
            description: 'Debe completar todos los requisitos antes de marcar la tarea como completada.'
        });
        return;
    }

    setIsSubmitting(true);
    
    if (isAddingNote && noteContent.trim()) {
        await addNote(task.clientId, `Nota de la tarea "${task.title}":\n${noteContent.trim()}`);
    }
    
    const success = await onUpdateTask(task.id, { status: 'Completada' });
    if (success) {
      toast({ title: 'Éxito', description: 'Tarea marcada como completada.' });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la tarea.',
      });
    }
    setIsSubmitting(false);
  };
  
  const handleReactivate = async () => {
    if (!onUpdateTask) return;
    setIsSubmitting(true);
    const success = await onUpdateTask(task.id, { 
        status: 'Pendiente', 
        dueDate: task.reactivationDate || task.dueDate, // Use reactivation date as new due date
        reactivationDate: undefined,
        postponedReason: undefined,
        postponedAt: undefined,
    });
    if (success) {
      toast({ title: 'Tarea Reactivada', description: 'La tarea ha vuelto al estado pendiente.' });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo reactivar la tarea.' });
    }
    setIsSubmitting(false);
  };

  const handleCompleteWithDocument = () => {
    setIsSmartUploadDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!onDeleteTask) return;
    setIsSubmitting(true);
    const success = await onDeleteTask(task.id);
    if (success) {
      toast({ title: 'Éxito', description: 'Tarea enviada a la papelera.' });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo archivar la tarea.',
      });
    }
    setIsSubmitting(false);
    setIsConfirmingDelete(false);
  };
  
  const handleEditSubmit = async (data: z.infer<typeof taskEditSchema>) => {
    if (!onUpdateTask || !task) return;
    setIsSubmitting(true);

    const clientName = clients.find(c => c.id === data.clientId)?.name || task.clientName;
    const assignedUser = teamMembers.find(m => m.id === data.assignedToId);
    
    const updates: Partial<Task> = {
        ...task,
        ...data,
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
        clientName: clientName,
        assignedToId: assignedUser?.id,
        assignedToName: assignedUser?.name,
        assignedToPhotoURL: assignedUser?.photoURL,
    };
    
    const success = await onUpdateTask(task.id, updates);
    if (success) {
        toast({ title: 'Éxito', description: 'Tarea actualizada correctamente.' });
        setIsEditing(false);
        onOpenChange(false); // Close dialog on successful update
    } else {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo actualizar la tarea.',
        });
    }
    setIsSubmitting(false);
  };

  const handlePostponeSubmit = async (data: z.infer<typeof postponeSchema>) => {
    if (!onUpdateTask || !task) return;
    setIsSubmitting(true);
    const updates: Partial<Task> = {
      status: 'Pospuesta',
      postponedReason: data.postponedReason,
      postponedAt: format(new Date(), 'yyyy-MM-dd'),
      reactivationDate: format(data.reactivationDate, 'yyyy-MM-dd'),
    };
    const success = await onUpdateTask(task.id, updates);
    if (success) {
      toast({ title: 'Tarea Pospuesta', description: 'La tarea ha sido marcada como pospuesta.' });
      setIsPostponing(false);
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo posponer la tarea.' });
    }
    setIsSubmitting(false);
  };
  
   const handleSubTaskToggle = async (subTaskId: string) => {
    if (!onUpdateTask) return;
    
    const updatedSubTasks = task.subTasks?.map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );

    if (updatedSubTasks) {
        setTask(prev => prev ? { ...prev, subTasks: updatedSubTasks } : null); // Optimistic UI update
        const success = await onUpdateTask(task.id, { subTasks: updatedSubTasks });
        if (!success) {
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el requisito.' });
             setTask(initialTask); // Revert on failure
        }
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <TooltipProvider>
            <DialogHeader>
                {isEditing || isPostponing ? (
                    <DialogTitle>{isEditing ? 'Editando Tarea' : isPostponing ? 'Posponer Tarea' : 'Añadir Nota'}</DialogTitle>
                ) : (
                    <>
                        <DialogTitle>{task.title}</DialogTitle>
                        <DialogDescription>
                            Vence: {dueDate ? format(dueDate, 'PPP', { locale: es }) : 'N/A'} {task.dueTime && `a las ${formatTimeString(task.dueTime)}`} | Estado: <span className={cn(task.status === 'Pospuesta' && 'text-amber-600 font-semibold')}>{task.status}</span>
                        </DialogDescription>
                    </>
                )}
            </DialogHeader>
            
            {isEditing ? (
                 <Form {...form}>
                    <form id="edit-task-form" onSubmit={form.handleSubmit(handleEditSubmit)} className="py-4 space-y-4">
                       <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccione un cliente..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="assignedToId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asignar a</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccione un miembro..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Seleccione fecha</span>}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora (Opcional)</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ubicación (Opcional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Dirección de la cita" className="pl-10" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                 </Form>
            ) : isPostponing ? (
                 <Form {...postponeForm}>
                    <form id="postpone-task-form" onSubmit={postponeForm.handleSubmit(handlePostponeSubmit)} className="py-4 space-y-4">
                        <FormField
                            control={postponeForm.control}
                            name="reactivationDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nueva Fecha de Reactivación</FormLabel>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccione fecha</span>}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus fromDate={new Date()} /></PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={postponeForm.control}
                            name="postponedReason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Razón</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ej. Esperando confirmación del cliente..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                 </Form>
            ) : isAddingNote ? (
                <div className="py-4 space-y-2">
                    <Label htmlFor="note-content">Añada una nota para completar la tarea:</Label>
                    <Textarea 
                        id="note-content"
                        placeholder="Escriba aquí los detalles requeridos..." 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        autoFocus
                    />
                </div>
            ) : (
                <div className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">Cliente:</p>
                        <p>{task.clientName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">Asignada a:</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignedToPhotoURL} />
                                <AvatarFallback>{task.assignedToName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p>{task.assignedToName}</p>
                        </div>
                    </div>
                    {task.location && (
                        <div>
                            <p className="font-semibold">Ubicación:</p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <p>{task.location}</p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <a href={`https://waze.com/ul?q=${encodeURIComponent(task.location)}`} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-4.4 0-8 3.6-8 8 0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" /></svg>
                                            </Button>
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Abrir en Waze</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`} target="_blank" rel="noopener noreferrer">
                                             <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <MapPin className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Abrir en Google Maps</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">Detalles:</p>
                        <p className="text-muted-foreground">{task.description || 'Sin detalles.'}</p>
                    </div>
                    
                    {task.subTasks && task.subTasks.length > 0 && (
                        <div>
                            <p className="font-semibold mb-2">Requisitos de la Tarea:</p>
                            <div className="space-y-2">
                                {task.subTasks.map(st => (
                                    <div key={st.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`subtask-${st.id}`}
                                            checked={st.completed}
                                            onCheckedChange={() => handleSubTaskToggle(st.id)}
                                            disabled={task.status !== 'Pendiente'}
                                        />
                                        <label
                                            htmlFor={`subtask-${st.id}`}
                                            className={cn("text-sm leading-none", st.completed && "line-through text-muted-foreground")}
                                        >
                                            {st.description}
                                        </label>
                                    </div>
                                ))}
                                <Progress value={progress} className="h-2 mt-3" />
                            </div>
                        </div>
                    )}

                    {task.status === 'Pospuesta' && (
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md border border-amber-300 dark:border-amber-800">
                             <p className="font-semibold text-amber-800 dark:text-amber-300">Tarea Pospuesta</p>
                             {reactivationDate && <p className="text-sm text-amber-700 dark:text-amber-400">Reactivar el: {format(reactivationDate, 'PPP', { locale: es })}</p>}
                             <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Razón: {task.postponedReason || 'No especificada'}</p>
                        </div>
                    )}
                    {task.requiredDocumentForCompletion && (
                        <div className="text-sm text-amber-600 dark:text-amber-500 pt-2">
                            <p className="font-semibold">Documento(s) Requerido(s) para Completar:</p>
                            {task.requiredDocuments && task.requiredDocuments.length > 0 ? (
                                <ul className="list-disc list-inside pl-4">
                                    {task.requiredDocuments.map(doc => (
                                        <li key={doc.id}>{doc.description}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No se especificaron documentos.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            <DialogFooter className="sm:justify-between">
                {isEditing ? (
                    <>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" form="edit-task-form" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </>
                ) : isPostponing ? (
                    <>
                        <Button variant="outline" onClick={() => setIsPostponing(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" form="postpone-task-form" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Pospuesto
                        </Button>
                    </>
                ) : isAddingNote ? (
                    <>
                        <Button variant="outline" onClick={() => setIsAddingNote(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleMarkAsComplete} disabled={isSubmitting || !noteContent.trim()}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Nota y Completar
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} disabled={isSubmitting || task.status !== 'Pendiente'}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar Tarea</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsPostponing(true)} disabled={isSubmitting || task.status === 'Completada'}>
                                        <History className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Posponer</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => setIsConfirmingDelete(true)}
                                        disabled={isSubmitting || !onDeleteTask}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Enviar a papelera</p></TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex gap-2">
                             {task.status === 'Pospuesta' ? (
                                <Button onClick={handleReactivate} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Redo className="mr-2 h-4 w-4"/>}
                                    Reactivar Tarea
                                </Button>
                             ) : (
                                <>
                                    {task.requiredDocumentForCompletion ? (
                                        <Button onClick={handleCompleteWithDocument} disabled={isSubmitting || task.status === 'Completada'} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                            Completar con Documento
                                        </Button>
                                    ) : (
                                        <Button onClick={handleMarkAsComplete} disabled={isSubmitting || task.status === 'Completada' || !onUpdateTask || !areAllSubTasksCompleted} className="bg-green-600 hover:bg-green-700 text-white">
                                            {isSubmitting && onUpdateTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (task.requiresInput ? <MessageSquare className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />)}
                                            {task.requiresInput ? 'Añadir Nota y Completar' : 'Completada'}
                                        </Button>
                                    )}
                                </>
                             )}
                        </div>
                    </>
                )}
            </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
    <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Enviar a la papelera</AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Estás seguro de que quieres enviar esta tarea a la papelera de reciclaje? Podrás restaurarla más tarde.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmingDelete(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
