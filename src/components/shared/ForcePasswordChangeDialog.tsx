
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
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Loader2, Save, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useCRMData } from '@/contexts/CRMDataContext';
import { updatePassword } from 'firebase/auth';
import { initiateSignOut } from '@/firebase/non-blocking-login';
import { Logo } from './logo';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export function ForcePasswordChangeDialog() {
  const { user, auth } = useUser();
  const { updateUser } = useCRMData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se ha encontrado un usuario válido. Por favor, inicie sesión de nuevo.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(user, values.password);
      await updateUser(user.uid, { requiresPasswordChange: false });

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu nueva contraseña ha sido guardada. Ahora tienes acceso a la plataforma.',
      });
      // The parent component (`AppContent`) will re-render and grant access.
    } catch (error: any) {
      console.error('Error updating password:', error);
      let description = 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.';
      if (error.code === 'auth/requires-recent-login') {
        description = 'Esta operación requiere un inicio de sesión reciente. Por favor, cierre sesión y vuelva a entrar.';
      } else if (error.code === 'auth/weak-password') {
        description = 'La contraseña es demasiado débil.';
      }
      toast({
        variant: 'destructive',
        title: 'Error al cambiar contraseña',
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (auth) {
        initiateSignOut(auth);
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="items-center text-center">
                <Logo className="h-12 w-auto mb-4" />
              <DialogTitle>Cambio de Contraseña Requerido</DialogTitle>
              <DialogDescription>
                Por tu seguridad, debes cambiar la contraseña temporal antes de continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={handleLogout} disabled={isSubmitting}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar y Continuar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
