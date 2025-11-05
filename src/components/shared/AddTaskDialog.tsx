
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, Calendar as CalendarIcon, PlusCircle, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { type Client } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


// Esquema base
const baseSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
});

// Esquema para Tarea Real (con fecha)
const taskSchema = baseSchema.extend({
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  dueDate: z.date({ required_error: "La fecha de vencimiento es requerida." }),
  dueTime: z.string().optional(),
});

// Esquema para Plantilla de Tarea (con días regresivos)
const workflowActionSchema = baseSchema.extend({
  dueDays: z.number().min(0).max(30).default(0),
});

// Discriminated union para validar según el modo
const combinedSchema = z.discriminatedUnion("isWorkflowMode", [
  z.object({ isWorkflowMode: z.literal(true) }).merge(workflowActionSchema),
  z.object({ isWorkflowMode: z.literal(false) }).merge(taskSchema),
]);

type AddTaskFormValues = z.infer<typeof combinedSchema>;

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onTaskAdd: (data: any) => void;
  isWorkflowMode?: boolean;
  stageId?: string; // Para identificar la etapa en modo workflow
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  clients,
  onTaskAdd,
  isWorkflowMode = false,
  stageId,
}: AddTaskDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: isWorkflowMode ?
      { isWorkflowMode: true, title: '', description: '', dueDays: 0 } :
      { isWorkflowMode: false, title: '', description: '', clientId: '', dueDate: new Date(), dueTime: '' },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(isWorkflowMode ?
        { isWorkflowMode: true, title: '', description: '', dueDays: 0 } :
        { isWorkflowMode: false, title: '', description: '', clientId: '', dueDate: new Date(), dueTime: '' }
      );
    }
  }, [isOpen, isWorkflowMode, form]);

  const onSubmit = (data: AddTaskFormValues) => {
    setIsSubmitting(true);
    // Simulación de llamada a API
    setTimeout(() => {
      onTaskAdd(data);
      toast({
        title: "Tarea Creada",
        description: `Se ha guardado "${data.title}" correctamente.`,
      });
      setIsSubmitting(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-accent"/>
                Crear Nueva Tarea
              </DialogTitle>
              <DialogDescription>
                {isWorkflowMode ? "Defina los detalles para esta tarea automática." : "Complete la información para crear una nueva tarea."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Título de la Tarea <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                              <Input {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />

              {!isWorkflowMode ? (
                // --- VISTA PARA PÁGINA DE TAREAS ---
                <>
                  <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Asignar a Cliente <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                  <FormLabel>Fecha de Vencimiento</FormLabel>
                                  <Popover>
                                      <PopoverTrigger asChild>
                                          <FormControl>
                                              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                                  {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccione fecha</span>}
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
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                </>
              ) : (
                // --- VISTA PARA WORKFLOWS (PLANTILLA) ---
                <FormField
                    control={form.control}
                    name="dueDays"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Días para Vencer</FormLabel>
                            <div className="flex items-center gap-4 pt-2">
                                <Slider
                                    min={0}
                                    max={30}
                                    step={1}
                                    value={[field.value ?? 0]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                />
                                <span className="text-sm font-medium w-8 text-center">{field.value}</span>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              )}

              <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Descripción (Opcional)</FormLabel>
                          <FormControl>
                              <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
            </div>

            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Tarea
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
