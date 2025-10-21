
"use client";

import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { GlobalNotificationProvider } from '@/contexts/NotificationContext';
import { DialogsProvider } from '@/contexts/DialogsContext';
import { UserNav } from '@/components/shared/user-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { useEffect, useState } from 'react';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { CRMDataProvider } from '@/contexts/CRMDataContext';
import { TasksProvider } from '@/contexts/TasksContext';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading || !isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    // This can happen briefly during redirection
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Redireccionando...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <UserNav />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>WitBiz</title>
        <meta name="description" content="Un CRM para el equipo de ventas moderno." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalNotificationProvider>
            <FirebaseClientProvider>
                <CRMDataProvider>
                  <TasksProvider>
                    <DialogsProvider>
                       <AppContent>{children}</AppContent>
                    </DialogsProvider>
                  </TasksProvider>
                </CRMDataProvider>
            </FirebaseClientProvider>
          </GlobalNotificationProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
