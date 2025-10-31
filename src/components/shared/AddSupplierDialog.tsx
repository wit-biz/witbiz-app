
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

const supplierSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  contact: z.string().optional(),
  service: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface AddSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: SupplierFormValues) => void;
}

export function AddSupplierDialog({ isOpen, onClose, onAdd }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact: '',
      service: '',
    },
  });
  
  React.useEffect(() => {
    if (!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    onAdd(values);
    setIsSubmitting(false);
    toast({
      title: 'Proveedor Creado',
      description: `El proveedor "${values.name}" ha sido creado correctamente (simulación).`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-accent"/>Añadir Nuevo Proveedor</DialogTitle>
                    <DialogDescription>
                        Complete los detalles para crear un nuevo proveedor.
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
                        name="contact"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contacto (Email/Teléfono)</FormLabel>
                                <FormControl>
                                    <Input placeholder="ventas@techsol.com" {...field} disabled={isSubmitting}/>
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
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Crear Proveedor
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
