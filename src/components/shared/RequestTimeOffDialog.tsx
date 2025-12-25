"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useAuth } from '@/firebase';

const requestSchema = z.object({
  type: z.enum(['libre', 'urgencia'], {
    required_error: 'Seleccione un tipo de solicitud',
  }),
  startDate: z.date({
    required_error: 'Seleccione una fecha de inicio',
  }),
  endDate: z.date({
    required_error: 'Seleccione una fecha de fin',
  }),
  reason: z.string().min(5, {
    message: 'La razón debe tener al menos 5 caracteres',
  }),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
  path: ['endDate'],
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestTimeOffDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestSubmitted: (autoApproved?: boolean) => void;
}

export function RequestTimeOffDialog({
  isOpen,
  onOpenChange,
  onRequestSubmitted,
}: RequestTimeOffDialogProps) {
  const { currentUser } = useCRMData();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: undefined,
      startDate: undefined,
      endDate: undefined,
      reason: '',
    },
  });

  const onSubmit = async (values: RequestFormData) => {
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      // Generate array of dates between start and end
      const dates: string[] = [];
      const currentDate = new Date(values.startDate);
      const endDate = new Date(values.endDate);

      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Get auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');

      // Submit request
      const response = await fetch('/api/users/time-off/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: values.type,
          dates,
          reason: values.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar la solicitud');
      }

      const result = await response.json();
      
      // Show different message if auto-approved (Director)
      if (result.autoApproved) {
        toast({
          title: 'Días registrados',
          description: 'Tus días libres han sido registrados automáticamente.',
        });
      }

      onRequestSubmitted(result.autoApproved);
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar la solicitud',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Solicitar Día Libre</DialogTitle>
              <DialogDescription>
                Envía tu solicitud para que sea aprobada por tu supervisor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Solicitud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="libre">Día Libre</SelectItem>
                        <SelectItem value="urgencia">Urgencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            onClick={() => setIsStartDateOpen(true)}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsStartDateOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Fin</FormLabel>
                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            onClick={() => setIsEndDateOpen(true)}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsEndDateOpen(false);
                          }}
                          disabled={(date) => {
                            const startDate = form.getValues('startDate');
                            return date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                                   (startDate && date < startDate);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe la razón de tu solicitud..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && 'Enviando...'}
                {!isSubmitting && 'Enviar Solicitud'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
