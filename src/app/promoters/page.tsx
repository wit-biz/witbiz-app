
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, Users, CircleDollarSign, Download } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PromoterPage() {
    const auth = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            router.push('/promoter-login');
        } catch (error) {
            console.error("Error signing out: ", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
             <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Logo />
                <Button onClick={handleLogout} variant="outline" size="sm" disabled={isLoggingOut}>
                   {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Cerrar Sesión
                </Button>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Promotores</h1>
                        <p className="text-muted-foreground">Bienvenido a su espacio exclusivo.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Consulte los clientes que ha referido.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
                                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Vea el estado de sus comisiones generadas.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Descargas</CardTitle>
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Acceda a material de marketing y recursos.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}
