
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
import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCRMData } from '@/contexts/CRMDataContext';

export default function PromoterLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { promoters, isLoadingPromoters } = useCRMData();
  const [isClient, setIsClient] = useState(false);

  // Asegura que el componente ya está montado en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Evita envíos múltiples
    if (isSubmitting) return;

    // Verifica que los datos del contexto ya estén cargados
    if (!promoters || isLoadingPromoters) {
      toast({
        variant: 'destructive',
        title: 'Datos no disponibles',
        description: 'Espere un momento, se están cargando los datos.',
      });
      return;
    }

    setIsSubmitting(true);

    // Normaliza valores para evitar diferencias tipo Number/String
    const normalizedCode = String(accessCode).trim();

    // Busca el promotor correcto
    const validPromoter = promoters.find(
      (p) =>
        String(p.accessCode).trim() === normalizedCode &&
        String(p.status).trim().toLowerCase() === 'activo'
    );

    if (validPromoter) {
      toast({
        title: 'Acceso concedido',
        description: `Bienvenido, ${validPromoter.name}. Redirigiendo...`,
      });

      router.push(`/promoters?promoterId=${validPromoter.id}`);
      return;
    }

    // Si llega aquí, no coincide
    toast({
      variant: 'destructive',
      title: 'Código incorrecto',
      description: 'El código de acceso no es válido o el promotor está inactivo.',
    });
    setIsSubmitting(false);
  };

  // El botón solo se deshabilita mientras se envía el formulario
  const isDisabled = !isClient || isSubmitting;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
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
                disabled={!isClient || isSubmitting || accessCode.length < 6}
              >
                {isSubmitting ? (
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
