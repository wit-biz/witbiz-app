
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
import { Loader2, Save, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const promoterSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
});

type PromoterFormValues = z.infer<typeof promoterSchema>;

interface AddPromoterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: PromoterFormValues) => void;
}

export function AddPromoterDialog({ isOpen, onClose, onAdd }: AddPromoterDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PromoterFormValues>({
    resolver: zodResolver(promoterSchema),
    defaultValues: {
      name: '',
    },
  });
  
  React.useEffect(() => {
    if (!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: PromoterFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    onAdd(values);
    setIsSubmitting(false);
    toast({
      title: 'Promotor Creado',
      description: `El promotor "${values.name}" ha sido creado correctamente (simulación).`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-accent"/>Añadir Nuevo Promotor</DialogTitle>
                    <DialogDescription>
                        Complete los detalles para crear un nuevo promotor.
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
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Crear Promotor
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
