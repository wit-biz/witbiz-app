

"use client";

import React, { useState, useEffect } from 'react';
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
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type Promoter } from '@/lib/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { serverTimestamp } from 'firebase/firestore';

const promoterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['Activo', 'Inactivo']),
  accessCode: z.string().optional(),
  referredClients: z.number().optional(),
  totalCommissions: z.number().optional(),
});

type PromoterFormValues = z.infer<typeof promoterSchema>;

interface AddPromoterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promoter?: Promoter | null;
  onAdd?: (data: Omit<PromoterFormValues, 'id' | 'referredClients' | 'totalCommissions'>) => void;
  onSave?: (data: Promoter) => void;
}

const generateAccessCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export function AddPromoterDialog({ isOpen, onClose, promoter, onAdd, onSave }: AddPromoterDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!promoter;

  const form = useForm<PromoterFormValues>({
    resolver: zodResolver(promoterSchema),
    defaultValues: {
      id: promoter?.id || '',
      name: promoter?.name || '',
      email: promoter?.email || '',
      phone: promoter?.phone || '',
      status: promoter?.status || 'Activo',
      accessCode: promoter?.accessCode || generateAccessCode(),
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            id: promoter?.id || '',
            name: promoter?.name || '',
            email: promoter?.email || '',
            phone: promoter?.phone || '',
            status: promoter?.status || 'Activo',
            accessCode: promoter?.accessCode || generateAccessCode(),
        });
    }
  }, [isOpen, promoter, form]);

  const onSubmit = async (values: PromoterFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditMode && onSave) {
          await onSave(values as Promoter);
          toast({ title: 'Promotor Actualizado', description: `El promotor "${values.name}" ha sido actualizado.` });
      } else if (onAdd) {
          const { id, referredClients, totalCommissions, ...addValues } = values;
          await onAdd(addValues);
          toast({ title: 'Promotor Creado', description: `El promotor "${values.name}" ha sido creado.` });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el promotor.' });
    }

    setIsSubmitting(false);
    onClose();
  };
  
  const handleGenerateNewCode = () => {
      form.setValue('accessCode', generateAccessCode());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-accent"/>
                        {isEditMode ? 'Editar Promotor' : 'Añadir Nuevo Promotor'}
                    </DialogTitle>
                    <DialogDescription>
                        Complete los detalles para {isEditMode ? 'actualizar' : 'crear'} un nuevo promotor.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Completo <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Mariana Fernandez" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="ej. mariana.f@email.com" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. +52 55 1234 5678" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Activo">Activo</SelectItem>
                                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="accessCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Código de Acceso</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input {...field} readOnly disabled={isSubmitting} className="font-mono bg-muted"/>
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={handleGenerateNewCode} disabled={isSubmitting}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isEditMode ? 'Guardar Cambios' : 'Crear Promotor'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
