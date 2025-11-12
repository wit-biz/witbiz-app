

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
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
import { Loader2, Save, ChevronsUpDown, PlusCircle, Trash2, Percent } from 'lucide-react';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useToast } from '@/hooks/use-toast';
import type { Client, ServiceWorkflow } from '@/lib/types';
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
import { Switch } from '../ui/switch';


const posTerminalSchema = z.object({
  id: z.string().optional(),
  serialNumber: z.string().min(1, "El número de serie es requerido."),
});

const promoterRefSchema = z.object({
  promoterId: z.string().min(1, "Debe seleccionar un promotor."),
  percentage: z.coerce.number().min(0, "El porcentaje no puede ser negativo.").max(100, "El porcentaje no puede ser mayor a 100."),
});

const customCommissionSchema = z.object({
    serviceId: z.string(),
    commissionId: z.string(),
    rate: z.coerce.number().optional(), // Opcional para que se pueda dejar vacío
});

const clientSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  owner: z.string().optional(),
  category: z.string().optional(),
  contactEmail: z.string().email({ message: "Por favor, introduzca un email válido." }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().url({ message: "Por favor, introduzca una URL válida." }).optional().or(z.literal('')),
  promoters: z.array(promoterRefSchema).optional(),
  subscribedServiceIds: z.array(z.string()).min(1, { message: "Debe seleccionar al menos un servicio." }),
  customCommissionServiceIds: z.array(z.string()).optional(), // Tracks services with custom commissions ON
  status: z.enum(['Activo', 'Inactivo']),
  hasPosTerminals: z.boolean().default(false),
  posTerminals: z.array(posTerminalSchema).optional(),
  customCommissions: z.array(customCommissionSchema).optional(),
}).refine(data => {
    if (data.promoters && data.promoters.length > 0) {
        const totalPercentage = data.promoters.reduce((sum, p) => sum + p.percentage, 0);
        // Use a small tolerance for floating point issues
        return Math.abs(totalPercentage - 100) < 0.01;
    }
    return true;
}, {
    message: "La suma de los porcentajes de los promotores debe ser exactamente 100.",
    path: ["promoters"],
});


type AddEditClientDialogProps = {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AddEditClientDialog({ client, isOpen, onClose }: AddEditClientDialogProps) {
  const { addClient, updateClient, serviceWorkflows = [], promoters } = useCRMData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditMode = !!client;

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      status: 'Activo',
      subscribedServiceIds: [],
      customCommissionServiceIds: [],
      promoters: [],
      hasPosTerminals: false,
      posTerminals: [],
      customCommissions: [],
    },
  });
  
   const { fields: terminalFields, append: appendTerminal, remove: removeTerminal, replace: replaceTerminals } = useFieldArray({
    control: form.control,
    name: "posTerminals",
  });
  
   const { fields: promoterFields, append: appendPromoter, remove: removePromoter } = useFieldArray({
    control: form.control,
    name: "promoters",
  });
  
  React.useEffect(() => {
    if (isOpen && serviceWorkflows) {
        // Filter out any stale service IDs that might be stored on the client
        const availableServiceIds = new Set(serviceWorkflows.map(s => s.id));
        
        const validSubscribedServiceIds = (client?.subscribedServiceIds || []).filter(id => availableServiceIds.has(id));
        const validCustomCommissionServiceIds = (client?.customCommissionServiceIds || []).filter(id => availableServiceIds.has(id));

        const defaultValues = {
            name: client?.name || '',
            owner: client?.owner || '',
            category: client?.category || '',
            contactEmail: client?.contactEmail || '',
            contactPhone: client?.contactPhone || '',
            website: client?.website || '',
            promoters: client?.promoters || [],
            subscribedServiceIds: validSubscribedServiceIds,
            customCommissionServiceIds: validCustomCommissionServiceIds,
            status: client?.status || 'Activo',
            hasPosTerminals: !!client?.posTerminals && client.posTerminals.length > 0,
            posTerminals: client?.posTerminals || [],
            customCommissions: client?.customCommissions || [],
        };
        form.reset(defaultValues);
    }
  }, [isOpen, client, form, serviceWorkflows]);

  const subscribedServicesWatch = useWatch({
      control: form.control,
      name: 'subscribedServiceIds'
  }) || [];
  
  const customCommissionServicesWatch = useWatch({
      control: form.control,
      name: 'customCommissionServiceIds'
  }) || [];

   const hasPosTerminalsWatch = useWatch({
    control: form.control,
    name: 'hasPosTerminals',
  });

  useEffect(() => {
    if (!hasPosTerminalsWatch) {
      replaceTerminals([]);
    }
  }, [hasPosTerminalsWatch, replaceTerminals]);

  const commissionsForSelectedServices = useMemo(() => {
    if (!subscribedServicesWatch || !serviceWorkflows || !customCommissionServicesWatch) return [];
    return serviceWorkflows
        .filter(sw => customCommissionServicesWatch.includes(sw.id) && sw.commissions && sw.commissions.length > 0)
        .flatMap(sw => sw.commissions!.map(c => ({ ...c, serviceId: sw.id, serviceName: sw.name })));
  }, [subscribedServicesWatch, serviceWorkflows, customCommissionServicesWatch]);

  const onSubmit = async (values: z.infer<typeof clientSchema>) => {
    setIsSubmitting(true);
    let success = false;
    
    const finalValues = {
        ...values,
        customCommissions: values.customCommissions?.filter(cc => values.customCommissionServiceIds?.includes(cc.serviceId)),
        posTerminals: values.hasPosTerminals ? values.posTerminals : [],
    };
    
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

  const selectedServiceIds = form.watch('subscribedServiceIds') || [];

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
                                                className={cn("w-full justify-between", !selectedServiceIds.length && "text-muted-foreground")}
                                            >
                                                <span className="truncate">
                                                   {selectedServiceIds.length > 0
                                                     ? `${selectedServiceIds.length} servicio(s) seleccionado(s)`
                                                     : "Seleccione servicios..."}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                       <div className="p-2 space-y-1">
                                        {(serviceWorkflows || []).map((service) => {
                                            const isChecked = selectedServiceIds?.includes(service.id);
                                            return (
                                                <div
                                                    key={service.id}
                                                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted"
                                                >
                                                    <div
                                                        className="flex items-center gap-2 flex-grow cursor-pointer"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const currentIds = form.getValues("subscribedServiceIds") || [];
                                                            const newIds = isChecked
                                                                ? currentIds.filter(id => id !== service.id)
                                                                : [...currentIds, service.id];
                                                            form.setValue("subscribedServiceIds", newIds, { shouldValidate: true, shouldDirty: true });
                                                        }}
                                                    >
                                                        <Checkbox checked={isChecked} />
                                                        <span className="text-sm font-medium">{service.name}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Label htmlFor={`custom-comm-${service.id}`} className="text-xs text-muted-foreground">Personalizar</Label>
                                                        <Switch
                                                            id={`custom-comm-${service.id}`}
                                                            disabled={!isChecked}
                                                            checked={customCommissionServicesWatch?.includes(service.id)}
                                                            onCheckedChange={(checked) => {
                                                                const currentCustomIds = form.getValues("customCommissionServiceIds") || [];
                                                                const newCustomIds = checked
                                                                    ? [...currentCustomIds, service.id]
                                                                    : currentCustomIds.filter(id => id !== service.id);
                                                                form.setValue("customCommissionServiceIds", newCustomIds, { shouldDirty: true });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                       </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                     {commissionsForSelectedServices.length > 0 && (
                        <>
                        <Separator />
                        <div>
                            <Label>Comisiones Personalizadas</Label>
                            <p className="text-xs text-muted-foreground">Deje en blanco para usar la tasa estándar del servicio.</p>
                            <div className="space-y-3 mt-2 max-h-40 overflow-y-auto">
                                {commissionsForSelectedServices.map((commission, index) => {
                                    const customCommissionIndex = form.getValues('customCommissions')?.findIndex(cc => cc.serviceId === commission.serviceId && cc.commissionId === commission.id) ?? -1;
                                    const fieldIndex = customCommissionIndex !== -1 ? customCommissionIndex : (form.getValues('customCommissions')?.length || 0) + index;
                                    
                                    return (
                                        <div key={`${commission.serviceId}-${commission.id}`} className="p-2 border rounded-md">
                                             <FormField
                                                control={form.control}
                                                name={`customCommissions.${fieldIndex}.rate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">
                                                            <span className="text-green-600 font-semibold">{commission.serviceName}:</span> {commission.name} (Estándar: {commission.rate}%)
                                                        </FormLabel>
                                                        <div className="relative">
                                                        <FormControl>
                                                            <Input 
                                                                type="number" 
                                                                placeholder="Tasa personalizada"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <input type="hidden" {...form.register(`customCommissions.${fieldIndex}.serviceId`)} value={commission.serviceId} />
                                            <input type="hidden" {...form.register(`customCommissions.${fieldIndex}.commissionId`)} value={commission.id} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        </>
                    )}


                    <Separator />
                    
                    <div>
                        <Label>Promotores Referidos</Label>
                        <div className="space-y-3 mt-2">
                          {promoterFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                               <div className="flex-grow space-y-2">
                                  <FormField
                                        control={form.control}
                                        name={`promoters.${index}.promoterId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione un promotor..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {promoters.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`promoters.${index}.percentage`}
                                        render={({ field }) => (
                                            <FormItem>
                                                 <div className="relative">
                                                      <FormControl>
                                                        <Input type="number" placeholder="Porcentaje" {...field} />
                                                      </FormControl>
                                                      <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                  </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                               </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removePromoter(index)} disabled={isSubmitting}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendPromoter({ promoterId: '', percentage: 0 })}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Promotor
                          </Button>
                          {form.formState.errors.promoters && <p className="text-sm font-medium text-destructive">{form.formState.errors.promoters.message}</p>}
                        </div>
                    </div>


                    <Separator />

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
                    
                    <FormField
                        control={form.control}
                        name="hasPosTerminals"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>¿Tiene Terminales Punto de Venta (TPV)?</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     
                    {hasPosTerminalsWatch && (
                        <div className="space-y-2 mt-2 pl-4 border-l-2">
                          {terminalFields.map((field, index) => (
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
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeTerminal(index)} disabled={isSubmitting}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTerminal({ id: `new-${terminalFields.length}`, serialNumber: '' })}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Terminal
                          </Button>
                        </div>
                    )}
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
