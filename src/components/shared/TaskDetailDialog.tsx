
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
import { Edit, Trash, CheckCircle, Loader2 } from 'lucide-react';
import { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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
  const [isEditing, setIsEditing] = useState(false);
  const [editableTask, setEditableTask] = useState<Partial<Task>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (task) {
      setEditableTask(task);
    }
  }, [task]);

  if (!task) return null;

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <TooltipProvider>
            <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>
                Vence: {format(new Date(task.dueDate), 'PPP')} | Estado: {task.status}
            </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
            <p>
                <strong>Cliente:</strong> {task.clientName}
            </p>
            <p>
                <strong>Detalles:</strong> {task.description || 'Sin detalles.'}
            </p>
            </div>
            <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsEditing(!isEditing)}
                            disabled={isSubmitting}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Eliminar</p></TooltipContent>
                </Tooltip>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        onClick={handleMarkAsComplete}
                        disabled={isSubmitting || task.status === 'Completada'}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                         {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Marcar como Completada</p></TooltipContent>
            </Tooltip>
            </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
