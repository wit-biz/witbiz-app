
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Logo } from '@/components/shared/logo';
import { Loader2, LogIn } from 'lucide-react';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduzca un email válido.' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
        await initiateEmailSignIn(auth, values.email, values.password);
        toast({
            title: 'Inicio de sesión exitoso',
            description: 'Redirigiendo a la plataforma...',
        });
    } catch (error: any) {
        let description = 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = 'El correo electrónico o la contraseña son incorrectos.';
        }
        toast({
            variant: 'destructive',
            title: 'Error al iniciar sesión',
            description,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
        <div className="animated-gradient-bg"></div>
        <Card className="w-full max-w-sm z-10">
        <CardHeader className="text-center">
          <Logo className="mx-auto h-12 w-auto mb-4" />
          <CardTitle className="text-2xl">Acceso a la Plataforma</CardTitle>
          <CardDescription>
            Introduzca sus credenciales para acceder a su cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="su@email.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Iniciar Sesión
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Crearemos una página sin contraseña para los promotores.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
