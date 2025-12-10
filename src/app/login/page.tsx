
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
  CardFooter,
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
import { Loader2, LogIn, Users } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduzca un email válido.' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es requerida.' }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
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
        await signInWithEmailAndPassword(auth, values.email, values.password);
        
        const directorEmails = ['witbiz.mx@gmail.com', 'saidsaigar@gmail.com'];
        const isDirector = directorEmails.includes(values.email);

        if (values.password === 'WitBiz!123' && !isDirector) {
            toast({
                title: 'Cambio de Contraseña Requerido',
                description: 'Por favor, actualice su contraseña.',
            });
            router.push('/force-password-change');
        } else {
            toast({
                title: 'Inicio de sesión exitoso',
                description: 'Redirigiendo a la plataforma...',
            });
            // On successful sign-in, the onAuthStateChanged listener in the layout
            // will handle the user state and redirection automatically.
            router.push('/');
        }

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
        </CardContent>
        <CardFooter className="flex-col items-center justify-center pt-4">
            <p className="text-sm text-muted-foreground mb-3">¿Eres promotor?</p>
            <Button variant="outline" asChild>
                <Link href="/promoter-login">
                    <Users className="mr-2 h-4 w-4" />
                    Acceso para Promotores
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
