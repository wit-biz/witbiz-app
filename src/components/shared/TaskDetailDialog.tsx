
"use client";

import React, { useState } from 'react';
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
import { Edit, Trash, CheckCircle, Loader2, PlusCircle, UploadCloud } from 'lucide-react';
import { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { parseDateString, formatTimeString } from '@/lib/utils';
import { useCRMData } from '@/contexts/CRMDataContext';
import { AddTaskDialog } from './AddTaskDialog';
import { useDialogs } from '@/contexts/DialogsContext';


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
  const { clients, addTask, addDocument } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableTask, setEditableTask] = useState<Partial<Task>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);


  React.useEffect(() => {
    if (task) {
      setEditableTask(task);
    }
  }, [task]);

  if (!task) return null;
  
  const dueDate = parseDateString(task.dueDate);
  
  const handleAddTask = async (data: Omit<Task, 'id' | 'status'>) => {
    await addTask(data);
  };

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

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <TooltipProvider>
            <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>
                Vence: {dueDate ? format(dueDate, 'PPP', { locale: es }) : 'N/A'} {task.dueTime && `a las ${formatTimeString(task.dueTime)}`} | Estado: {task.status}
            </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
            <p>
                <strong>Cliente:</strong> {task.clientName}
            </p>
            <p>
                <strong>Detalles:</strong> {task.description || 'Sin detalles.'}
            </p>
             {task.requiredDocumentForCompletion && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                    <strong>Nota:</strong> Para completar esta tarea, se requiere el siguiente documento: <strong>{task.requiredDocumentDescription || 'No especificado'}</strong>.
                </p>
            )}
            </div>
            <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setIsAddTaskDialogOpen(true)} disabled={isSubmitting}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Añadir nueva tarea para este cliente</p></TooltipContent>
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
            </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
     <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        clients={clients}
        onTaskAdd={handleAddTask}
        isWorkflowMode={false}
        preselectedClientId={task.clientId}
    />
    </>
  );
}
