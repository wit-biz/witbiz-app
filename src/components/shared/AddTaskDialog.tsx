

"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Loader2, Save, Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { type Client, type AppUser } from '@/lib/types';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from '@/components/ui/switch';
import { useCRMData } from '@/contexts/CRMDataContext';


const requiredDocSchema = z.object({
  description: z.string().min(1, "La descripción del documento no puede estar vacía."),
});

const subTaskSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "La descripción del requisito no puede estar vacía."),
  completed: z.boolean(),
});

const baseSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  requiredDocumentForCompletion: z.boolean().default(false),
  requiredDocuments: z.array(requiredDocSchema).optional(),
  subTasks: z.array(subTaskSchema).optional(),
  assignedToId: z.string().optional(),
});

const taskSchema = baseSchema.extend({
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  dueDate: z.date({ required_error: "La fecha de vencimiento es requerida." }),
  dueTime: z.string().optional(),
});

const workflowActionSchema = baseSchema.extend({});

const combinedSchema = z.discriminatedUnion("isWorkflowMode", [
  z.object({ isWorkflowMode: z.literal(true) }).merge(workflowActionSchema),
  z.object({ isWorkflowMode: z.literal(false) }).merge(taskSchema),
]).refine(data => {
    if (data.requiredDocumentForCompletion) {
        return Array.isArray(data.requiredDocuments) && data.requiredDocuments.length > 0 && data.requiredDocuments.every(doc => doc.description.trim().length > 0);
    }
    return true;
}, {
    message: "Debe especificar al menos un documento requerido.",
    path: ["requiredDocuments"],
});

type AddTaskFormValues = z.infer<typeof combinedSchema>;

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onTaskAdd: (data: any) => void;
  isWorkflowMode?: boolean;
  stageId?: string; 
  preselectedClientId?: string; 
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  clients,
  onTaskAdd,
  isWorkflowMode = false,
  stageId,
  preselectedClientId
}: AddTaskDialogProps) {
  const { toast } = useToast();
  const { currentUser, teamMembers } = useCRMData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: isWorkflowMode ?
      { isWorkflowMode: true, title: '', description: '', requiredDocumentForCompletion: false, requiredDocuments: [], subTasks: [], assignedToId: currentUser?.uid } :
      { isWorkflowMode: false, title: '', description: '', clientId: preselectedClientId || '', dueDate: new Date(), dueTime: '', requiredDocumentForCompletion: false, requiredDocuments: [], subTasks: [], assignedToId: currentUser?.uid },
  });
  
  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({
    control: form.control,
    name: "requiredDocuments",
  });

  const { fields: subTaskFields, append: appendSubTask, remove: removeSubTask } = useFieldArray({
    control: form.control,
    name: "subTasks",
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(isWorkflowMode ?
        { isWorkflowMode: true, title: '', description: '', requiredDocumentForCompletion: false, requiredDocuments: [], subTasks: [], assignedToId: currentUser?.uid } :
        { isWorkflowMode: false, title: '', description: '', clientId: preselectedClientId || '', dueDate: new Date(), dueTime: '', requiredDocumentForCompletion: false, requiredDocuments: [], subTasks: [], assignedToId: currentUser?.uid }
      );
    }
  }, [isOpen, isWorkflowMode, preselectedClientId, form, currentUser]);
  
  useEffect(() => {
    // Automatically set requiredDocumentForCompletion based on whether there are documents
    form.setValue('requiredDocumentForCompletion', docFields.length > 0);
  }, [docFields, form]);

  const onSubmit = (data: AddTaskFormValues) => {
    setIsSubmitting(true);
    // Simulación de llamada a API
    setTimeout(() => {
      // Add completed: false to each subtask before submitting
      const finalData = {
          ...data,
          subTasks: data.subTasks?.map(st => ({ ...st, completed: false, id: `subtask-${Date.now()}-${Math.random()}` }))
      };
      onTaskAdd(finalData);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-accent"/>
                Crear Nueva Tarea
              </DialogTitle>
              <DialogDescription>
                {isWorkflowMode ? "Defina los detalles para esta tarea automática." : "Complete la información para crear una nueva tarea."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-3 -mr-2 pl-1">
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

              {!isWorkflowMode && (
                // --- VISTA PARA PÁGINA DE TAREAS ---
                <>
                  <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Asignar a Cliente <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!!preselectedClientId}>
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
                                <FormLabel>Asignar a Miembro del Equipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Seleccione un miembro..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {teamMembers.map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                        ))}
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
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                </>
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

              <div className="space-y-2">
                <Label>Requisitos de la Tarea (Opcional)</Label>
                {subTaskFields.map((field, index) => (
                   <FormField
                        key={field.id}
                        control={form.control}
                        name={`subTasks.${index}.description`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder={`Requisito #${index + 1}`} {...field} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSubTask(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendSubTask({ id: `new-${subTaskFields.length}`, description: '', completed: false })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Requisito
                  </Button>
              </div>

              <div className="space-y-2">
                <Label>Documentos Requeridos (Opcional)</Label>
                 {docFields.map((field, index) => (
                      <FormField
                          key={field.id}
                          control={form.control}
                          name={`requiredDocuments.${index}.description`}
                          render={({ field }) => (
                              <FormItem>
                                  <div className="flex items-center gap-2">
                                      <FormControl>
                                          <Input placeholder={`Documento requerido #${index + 1}`} {...field} />
                                      </FormControl>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(index)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                  </div>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  ))}
                   <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendDoc({ description: '' })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Documento Requerido
                    </Button>
                    {form.formState.errors.requiredDocuments && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.requiredDocuments.message}</p>
                    )}
                </div>

            </div>

            <DialogFooter className="mt-auto pt-4 border-t">
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
