

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
import { Edit, Trash, CheckCircle, Loader2, PlusCircle, UploadCloud, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Task, Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { parseDateString, formatTimeString, cn } from '@/lib/utils';
import { useCRMData } from '@/contexts/CRMDataContext';
import { AddTaskDialog } from './AddTaskDialog';
import { useDialogs } from '@/contexts/DialogsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const taskEditSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  dueDate: z.date({ required_error: "La fecha de vencimiento es requerida." }),
  dueTime: z.string().optional(),
});


interface TaskDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
}

export function TaskDetailDialog({
  isOpen,
  onOpenChange,
  task,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailDialogProps) {
  const { toast } = useToast();
  const { clients, addTask } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof taskEditSchema>>({
    resolver: zodResolver(taskEditSchema),
  });

  useEffect(() => {
    if (task) {
        form.reset({
            title: task.title,
            description: task.description,
            clientId: task.clientId,
            dueDate: parseDateString(task.dueDate) || new Date(),
            dueTime: task.dueTime,
        });
    }
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [task, isOpen, form]);

  if (!task) return null;
  
  const dueDate = parseDateString(task.dueDate);
  
  const handleMarkAsComplete = async () => {
    if (!onUpdateTask) return;
    setIsSubmitting(true);
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
  
  const handleCompleteWithDocument = () => {
    setIsSmartUploadDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!onDeleteTask) return;
    setIsSubmitting(true);
    const success = await onDeleteTask(task.id);
    if (success) {
      toast({ title: 'Éxito', description: 'Tarea eliminada.' });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la tarea.',
      });
    }
    setIsSubmitting(false);
  };
  
  const handleEditSubmit = async (data: z.infer<typeof taskEditSchema>) => {
    if (!onUpdateTask || !task) return;
    setIsSubmitting(true);

    const clientName = clients.find(c => c.id === data.clientId)?.name || task.clientName;
    
    const updates: Partial<Task> = {
        ...task,
        ...data,
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
        clientName: clientName,
    };
    
    const success = await onUpdateTask(task.id, updates);
    if (success) {
        toast({ title: 'Éxito', description: 'Tarea actualizada correctamente.' });
        setIsEditing(false);
    } else {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo actualizar la tarea.',
        });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <TooltipProvider>
            <DialogHeader>
                {isEditing ? (
                    <DialogTitle>Editando Tarea</DialogTitle>
                ) : (
                    <>
                        <DialogTitle>{task.title}</DialogTitle>
                        <DialogDescription>
                            Vence: {dueDate ? format(dueDate, 'PPP', { locale: es }) : 'N/A'} {task.dueTime && `a las ${formatTimeString(task.dueTime)}`} | Estado: {task.status}
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
                    <div>
                        <p className="font-semibold">Detalles:</p>
                        <p className="text-muted-foreground">{task.description || 'Sin detalles.'}</p>
                    </div>
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
                ) : (
                    <>
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} disabled={isSubmitting || task.status === 'Completada'}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar Tarea</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleDelete}
                                        disabled={isSubmitting || !onDeleteTask}
                                    >
                                        {isSubmitting && onDeleteTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Eliminar</p></TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex gap-2">
                            {task.requiredDocumentForCompletion ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleCompleteWithDocument}
                                            disabled={isSubmitting || task.status === 'Completada'}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                            Completar con Documento
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Subir documento para completar la tarea</p></TooltipContent>
                                </Tooltip>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleMarkAsComplete}
                                            disabled={isSubmitting || task.status === 'Completada' || !onUpdateTask}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {isSubmitting && onUpdateTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Marcar como Completada
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Marcar como Completada</p></TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </>
                )}
            </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
