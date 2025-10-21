
"use client";

import React from 'react';
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
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


const clientSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  owner: z.string().optional(),
  category: z.string().optional(),
  contactEmail: z.string().email({ message: "Por favor, introduzca un email válido." }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().url({ message: "Por favor, introduzca una URL válida." }).optional().or(z.literal('')),
});


type AddEditClientDialogProps = {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AddEditClientDialog({ client, isOpen, onClose }: AddEditClientDialogProps) {
  const { addClient, updateClient } = useCRMData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditMode = !!client;

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      owner: client?.owner || '',
      category: client?.category || '',
      contactEmail: client?.contactEmail || '',
      contactPhone: client?.contactPhone || '',
      website: client?.website || '',
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
        form.reset({
            name: client?.name || '',
            owner: client?.owner || '',
            category: client?.category || '',
            contactEmail: client?.contactEmail || '',
            contactPhone: client?.contactPhone || '',
            website: client?.website || '',
        });
    }
  }, [isOpen, client, form]);


  const onSubmit = async (values: z.infer<typeof clientSchema>) => {
    setIsSubmitting(true);
    let success = false;
    
    if (isEditMode && client) {
        success = await updateClient(client.id, values);
    } else {
        const newClient = await addClient(values);
        success = !!newClient;
    }
    
    setIsSubmitting(false);

    if (success) {
      toast({
        title: isEditMode ? 'Usuario Actualizado' : 'Usuario Creado',
        description: `El usuario "${values.name}" ha sido ${isEditMode ? 'actualizado' : 'creado'} correctamente.`,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</DialogTitle>
                    <DialogDescription>
                    Complete los detalles para {isEditMode ? 'actualizar' : 'crear'} un usuario.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del usuario" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="owner"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Propietario</FormLabel>
                                <FormControl>
                                    <Input placeholder="Propietario asignado" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <FormControl>
                                    <Input placeholder="Categoría del usuario" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email de Contacto</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="ejemplo@email.com" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="+1 234 567 890" {...field} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sitio Web</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://ejemplo.com" {...field} disabled={isSubmitting}/>
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
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
