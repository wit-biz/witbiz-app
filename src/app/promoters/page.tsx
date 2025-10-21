
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/header';
import { Logo } from '@/components/shared/logo';

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
                    {/* Promoter-specific content will go here */}
                     <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                        <p>Contenido para promotores próximamente.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
