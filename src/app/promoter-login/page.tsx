
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
import { useCRMData } from '@/contexts/CRMDataContext';

export default function PromoterLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { promoters, isLoadingPromoters } = useCRMData();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // The isLoadingPromoters flag from the context ensures we don't proceed
    // until data is ready. The button is already disabled, but this is a safeguard.
    if (isLoadingPromoters || !promoters) {
        toast({
            variant: 'destructive',
            title: 'Error de carga',
            description: 'Los datos de los promotores aún se están cargando. Por favor, espere un momento y vuelva a intentarlo.',
        });
        setIsSubmitting(false);
        return;
    }

    const validPromoter = promoters.find(p => p.accessCode === accessCode && p.status === 'Activo');

    if (validPromoter) {
      toast({
        title: 'Acceso concedido',
        description: `Bienvenido, ${validPromoter.name}.`,
      });
      // Here you would typically set some session state
      // For now, we'll just redirect
      router.push('/promoters');
    } else {
      toast({
        variant: 'destructive',
        title: 'Código incorrecto',
        description: 'El código de acceso no es válido o el promotor está inactivo.',
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
          <CardTitle className="text-2xl">Acceso para Promotores</CardTitle>
          <CardDescription>
            Introduzca su código de acceso único para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="access-code">Código de Acceso (6 dígitos)</Label>
                <Input
                    id="access-code"
                    placeholder="••••••"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    disabled={isSubmitting || isLoadingPromoters}
                    type="password"
                    maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingPromoters || accessCode.length < 6}>
                {isSubmitting || isLoadingPromoters ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4" />}
                Acceder
              </Button>
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
