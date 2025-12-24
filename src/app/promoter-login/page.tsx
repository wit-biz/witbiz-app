
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/shared/logo';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function PromoterLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (accessCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: 'El código debe tener 6 dígitos.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/promoter-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      const data = await response.json();

      if (data.success && data.promoter) {
        toast({
          title: 'Acceso concedido',
          description: `Bienvenido, ${data.promoter.name}. Redirigiendo...`,
        });
        router.push(`/promoters?promoterId=${data.promoter.id}`);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Código incorrecto',
        description: data.error || 'El código de acceso no es válido o el promotor está inactivo.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo verificar el código. Intente de nuevo.',
      });
    }

    setIsSubmitting(false);
  };

  const isDisabled = isSubmitting;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4 overflow-hidden">
      <div className="animated-gradient-bg"></div>

      <Card className="w-full max-w-sm z-10">
        <CardHeader className="text-center">
          <Logo className="mx-auto h-12 w-auto mb-4" />
          <CardTitle className="text-2xl">Acceso para Promotores</CardTitle>
          <CardDescription>
            Introduzca su código de acceso único para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={isDisabled} className="space-y-4">
              <div>
                <Label htmlFor="access-code">Código de Acceso (6 dígitos)</Label>
                <Input
                  id="access-code"
                  placeholder="••••••"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  type="password"
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isDisabled || accessCode.length < 6}
              >
                {isDisabled ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Acceder
              </Button>
            </fieldset>
          </form>

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al login principal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
