
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Save, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useCRMData, type Task } from '@/contexts/CRMDataContext';
import { useGlobalNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdd: (taskData: Omit<Task, 'id' | 'clientName' | 'status'>) => Promise<boolean>;
  preselectedClient?: { id: string; name: string };
  initialTaskData?: Partial<Omit<Task, 'id'>>;
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  onTaskAdd,
  preselectedClient,
  initialTaskData,
}: AddTaskDialogProps) {
  const { clients } = useCRMData();
  const { showNotification } = useGlobalNotification();

  const getInitialState = useCallback(() => {
    const today = new Date();
    return {
      title: initialTaskData?.title || '',
      description: initialTaskData?.description || '',
      clientId: preselectedClient?.id || '',
      dueDate: initialTaskData?.dueDate || format(today, 'yyyy-MM-dd'),
      dueTime: initialTaskData?.dueTime || '',
    };
  }, [initialTaskData, preselectedClient]);

  const [formData, setFormData] = useState(getInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
    }
  }, [isOpen, getInitialState]);

  const handleDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, clientId: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, dueDate: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.clientId || !formData.dueDate) {
      showNotification('error', 'Campos requeridos', 'Por favor, complete el título, el cliente y la fecha de vencimiento.');
      return;
    }

    setIsSubmitting(true);
    const success = await onTaskAdd({
      title: formData.title,
      description: formData.description,
      clientId: formData.clientId,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime,
    });
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };
  
  const dueDateAsDate = formData.dueDate ? new Date(formData.dueDate) : new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-accent" />
              Añadir Nueva Tarea
            </DialogTitle>
            <DialogDescription>
              Complete los detalles de la nueva tarea.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div>
              <Label htmlFor="title">Título de la Tarea <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleDataChange}
                required
                disabled={isSubmitting}
                placeholder="Ej. Llamada de seguimiento"
              />
            </div>
            <div>
              <Label htmlFor="clientId">Asignar a Cliente <span className="text-destructive">*</span></Label>
              <Select
                name="clientId"
                value={formData.clientId}
                onValueChange={handleSelectChange}
                required
                disabled={isSubmitting || !!preselectedClient}
              >
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Seleccione un cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Fecha de Vencimiento <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.dueDate && 'text-muted-foreground'
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? (
                        format(dueDateAsDate, 'PPP', { locale: es })
                      ) : (
                        <span>Seleccione fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDateAsDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="dueTime">Hora (Opcional)</Label>
                <Input
                  id="dueTime"
                  name="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={handleDataChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleDataChange}
                disabled={isSubmitting}
                placeholder="Añada más detalles sobre la tarea..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    