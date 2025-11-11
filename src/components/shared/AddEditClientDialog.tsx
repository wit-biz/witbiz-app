
"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, Save, Check, ChevronsUpDown, PlusCircle, Trash2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';


const posTerminalSchema = z.object({
  id: z.string().optional(),
  serialNumber: z.string().min(1, "El número de serie es requerido."),
});

const clientSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  owner: z.string().optional(),
  category: z.string().optional(),
  contactEmail: z.string().email({ message: "Por favor, introduzca un email válido." }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().url({ message: "Por favor, introduzca una URL válida." }).optional().or(z.literal('')),
  promoterId: z.string().optional(),
  subscribedServiceIds: z.array(z.string()).min(1, { message: "Debe seleccionar al menos un servicio." }),
  status: z.enum(['Activo', 'Inactivo']),
  posTerminals: z.array(posTerminalSchema).optional(),
});


type AddEditClientDialogProps = {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AddEditClientDialog({ client, isOpen, onClose }: AddEditClientDialogProps) {
  const { addClient, updateClient, serviceWorkflows, promoters } = useCRMData();
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
      promoterId: client?.promoterId || 'none',
      subscribedServiceIds: client?.subscribedServiceIds || [],
      status: client?.status || 'Activo',
      posTerminals: client?.posTerminals || [],
    },
  });
  
   const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "posTerminals",
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
            promoterId: client?.promoterId || 'none',
            subscribedServiceIds: client?.subscribedServiceIds || [],
            status: client?.status || 'Activo',
            posTerminals: client?.posTerminals || [],
        });
    }
  }, [isOpen, client, form]);


  const onSubmit = async (values: z.infer<typeof clientSchema>) => {
    setIsSubmitting(true);
    let success = false;

    const { promoterId, ...restOfValues } = values;
    const finalValues: Partial<Client> = { ...restOfValues };

    if (promoterId && promoterId !== 'none') {
        finalValues.promoterId = promoterId;
    } else {
        delete finalValues.promoterId;
    }
    
    if (isEditMode && client) {
        success = await updateClient(client.id, finalValues);
    } else {
        const newClient = await addClient(finalValues as Omit<Client, 'id'>);
        success = !!newClient;
    }
    
    setIsSubmitting(false);

    if (success) {
      toast({
        title: isEditMode ? 'Cliente Actualizado' : 'Cliente Creado',
        description: `El cliente "${values.name}" ha sido ${isEditMode ? 'actualizado' : 'creado'} correctamente.`,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                    Complete los detalles para {isEditMode ? 'actualizar' : 'crear'} un cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la Empresa <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del cliente" {...field} disabled={isSubmitting}/>
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
                        name="subscribedServiceIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Servicios Contratados <span className="text-destructive">*</span></FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}
                                            >
                                                <span className="truncate">
                                                   Seleccione servicios...
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                       <div className="p-2 space-y-1">
                                        {serviceWorkflows.map((service) => (
                                            <div
                                                key={service.id}
                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                                onClick={() => {
                                                    const currentIds = field.value || [];
                                                    const newIds = currentIds.includes(service.id)
                                                        ? currentIds.filter(id => id !== service.id)
                                                        : [...currentIds, service.id];
                                                    field.onChange(newIds);
                                                }}
                                            >
                                                <Checkbox
                                                    checked={field.value?.includes(service.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentIds = field.value || [];
                                                        return checked
                                                            ? field.onChange([...currentIds, service.id])
                                                            : field.onChange(currentIds.filter(id => id !== service.id));
                                                    }}
                                                />
                                                <span className="text-sm">{service.name}</span>
                                            </div>
                                        ))}
                                       </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="promoterId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Referido por (Promotor)</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione un promotor (opcional)..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguno</SelectItem>
                                        {promoters.map(promoter => (
                                            <SelectItem key={promoter.id} value={promoter.id}>{promoter.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="owner"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contacto Principal</FormLabel>
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
                                    <Input placeholder="Categoría del cliente" {...field} disabled={isSubmitting}/>
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
                    <Separator />

                     <div>
                        <Label>Terminales Punto de Venta (TPV)</Label>
                        <div className="space-y-2 mt-2">
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                               <FormField
                                    control={form.control}
                                    name={`posTerminals.${index}.serialNumber`}
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                                <Input placeholder={`Número de Serie #${index + 1}`} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ id: `new-${fields.length}`, serialNumber: '' })}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Terminal
                          </Button>
                        </div>
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
                    {isEditMode ? 'Guardar Cambios' : 'Crear Cliente'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    