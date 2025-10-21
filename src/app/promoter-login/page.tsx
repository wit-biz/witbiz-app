
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
import { ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function PromoterLoginPage() {

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
          <form className="space-y-4">
              <div>
                <Label htmlFor="access-code">Código de Acceso</Label>
                <Input
                    id="access-code"
                    placeholder="Introduzca su código..."
                />
              </div>
              <Button type="submit" className="w-full">
                <KeyRound className="mr-2 h-4 w-4" />
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
