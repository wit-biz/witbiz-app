
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { type AppUser } from '@/lib/types';

const editMemberSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido." }),
  role: z.string().min(1, { message: "Por favor, seleccione un rol." }),
});

interface EditMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser;
  roles: string[];
  onSave: (userId: string, name: string, role: string) => Promise<void>;
  isProcessing: boolean;
}

export function EditMemberDialog({
  isOpen,
  onOpenChange,
  user,
  roles,
  onSave,
  isProcessing
}: EditMemberDialogProps) {
  
  const form = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      name: user?.name || '',
      role: user?.role || '',
    },
  });
  
  useEffect(() => {
    if(user) {
        form.reset({
            name: user.name,
            role: user.role,
        })
    }
  }, [user, form])

  const onSubmit = async (values: z.infer<typeof editMemberSchema>) => {
    await onSave(user.id, values.name, values.role);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Editar Miembro del Equipo</DialogTitle>
              <DialogDescription>
                Actualice el nombre y el rol para {user?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Juan Pérez"
                        {...field}
                        disabled={isProcessing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isProcessing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isProcessing || !form.formState.isValid}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
