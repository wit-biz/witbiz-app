
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
import { Loader2, Save, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { initiateSignOut } from '@/firebase/non-blocking-login';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

const passwordRequirements = {
  length: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(passwordRequirements.length, { message: `La contraseña debe tener al menos ${passwordRequirements.length} caracteres.` })
      .regex(passwordRequirements.uppercase, { message: 'Debe contener al menos una mayúscula.' })
      .regex(passwordRequirements.lowercase, { message: 'Debe contener al menos una minúscula.' })
      .regex(passwordRequirements.number, { message: 'Debe contener al menos un número.' })
      .regex(passwordRequirements.special, { message: 'Debe contener al menos un carácter especial.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

  interface PasswordRequirementIndicatorProps {
    meets: boolean;
    label: string;
  }
  
  const PasswordRequirementIndicator: React.FC<PasswordRequirementIndicatorProps> = ({ meets, label }) => (
    <div className={cn("flex items-center text-sm", meets ? "text-green-600" : "text-muted-foreground")}>
      {meets ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
      <span>{label}</span>
    </div>
  );
  
  interface PasswordStrengthProps {
    password?: string;
  }
  
  const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
    const checks = {
      length: password.length >= passwordRequirements.length,
      uppercase: passwordRequirements.uppercase.test(password),
      lowercase: passwordRequirements.lowercase.test(password),
      number: passwordRequirements.number.test(password),
      special: passwordRequirements.special.test(password),
    };
  
    return (
      <div className="p-3 bg-muted rounded-md space-y-2">
        <PasswordRequirementIndicator meets={checks.length} label={`Al menos ${passwordRequirements.length} caracteres`} />
        <PasswordRequirementIndicator meets={checks.lowercase} label="Al menos una letra minúscula" />
        <PasswordRequirementIndicator meets={checks.uppercase} label="Al menos una letra mayúscula" />
        <PasswordRequirementIndicator meets={checks.number} label="Al menos un número" />
        <PasswordRequirementIndicator meets={checks.special} label="Al menos un carácter especial" />
      </div>
    );
  };


export function ForcePasswordChangeDialog() {
  const { user, auth } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched'
  });

  const passwordValue = form.watch('password');

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se ha encontrado un usuario o base de datos válida. Por favor, inicie sesión de nuevo.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Update the password in Firebase Auth
      await updatePassword(user, values.password);

      // Step 2: Update the flag in Firestore using a direct, awaited call
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { requiresPasswordChange: false });

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu nueva contraseña ha sido guardada. La página se recargará.',
      });

      // Step 3: Force a reload to re-initialize the app state with the correct flag
      setTimeout(() => {
        window.location.reload();
      }, 1500);

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
      setIsSubmitting(false); // Only set to false on error
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

              <PasswordStrength password={passwordValue} />

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
