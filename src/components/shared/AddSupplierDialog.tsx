

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
import { Loader2, Save, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMData } from '@/contexts/CRMDataContext';
import { type Supplier } from '@/lib/types';


const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  rfc: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  service: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['Activo', 'Inactivo']),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface AddSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onAdd?: (data: Omit<SupplierFormValues, 'id'>) => void;
  onSave?: (data: Supplier) => void;
}

export function AddSupplierDialog({ isOpen, onClose, supplier, onAdd, onSave }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const { promoters } = useCRMData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!supplier;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      id: supplier?.id || '',
      name: supplier?.name || '',
      rfc: supplier?.rfc || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      service: supplier?.service || '',
      address: supplier?.address || '',
      status: supplier?.status === 'Archivado' ? 'Activo' : (supplier?.status || 'Activo'),
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            id: supplier?.id || '',
            name: supplier?.name || '',
            rfc: supplier?.rfc || '',
            email: supplier?.email || '',
            phone: supplier?.phone || '',
            service: supplier?.service || '',
            address: supplier?.address || '',
            status: supplier?.status === 'Archivado' ? 'Activo' : (supplier?.status || 'Activo'),
        });
    }
  }, [isOpen, supplier, form]);

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    
    try {
        const finalValues: Partial<Supplier> = { ...values };

        if (isEditMode && onSave) {
            await onSave(finalValues as Supplier);
            toast({ title: 'Proveedor Actualizado', description: `El proveedor "${values.name}" ha sido actualizado.` });
        } else if (onAdd) {
            const { id, ...addValues } = finalValues;
            await onAdd(addValues as Omit<SupplierFormValues, 'id'>);
            toast({ title: 'Proveedor Creado', description: `El proveedor "${values.name}" ha sido creado.` });
        }
    } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el proveedor.' });
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-accent"/>
                        {isEditMode ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}
                    </DialogTitle>
                    <DialogDescription>
                        Complete los detalles para {isEditMode ? 'actualizar' : 'crear'} un proveedor.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Proveedor <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Tech Solutions" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rfc"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>RFC</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. TSO123456ABC" {...field} disabled={isSubmitting}/>
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
                                <FormLabel>Estado <span className="text-destructive">*</span></FormLabel>
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
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email de Contacto</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="ventas@techsol.com" {...field} disabled={isSubmitting}/>
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
                                <FormLabel>Teléfono de Contacto</FormLabel>
                                <FormControl>
                                    <Input placeholder="+52 55 8765 4321" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="service"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Servicio / Producto</FormLabel>
                                <FormControl>
                                    <Input placeholder="Soporte TI" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dirección</FormLabel>
                                <FormControl>
                                    <Input placeholder="Calle, Ciudad, CP" {...field} disabled={isSubmitting}/>
                                </FormControl>
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
                        {isEditMode ? 'Guardar Cambios' : 'Crear Proveedor'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
