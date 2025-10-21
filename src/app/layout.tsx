
"use client";

import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { GlobalNotificationProvider } from '@/contexts/NotificationContext';
import { DialogsProvider } from '@/contexts/DialogsContext';
import { UserNav } from '@/components/shared/user-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { CRMDataProvider } from '@/contexts/CRMDataContext';
import { TasksProvider } from '@/contexts/TasksContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    if (isClient && !isUserLoading) {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      const isPromoterRoute = pathname.startsWith('/promoter');

      if (!user && !isAuthPage && !isPromoterRoute) {
        router.push('/login');
      }
      if (user && !user.isAnonymous && isAuthPage) {
        router.push('/');
      }
      if (user && user.isAnonymous && !isPromoterRoute) {
        // Logged in as a promoter, but trying to access a non-promoter page
        // Redirect them to their dashboard
        router.push('/promoters');
      }
    }
  }, [isUserLoading, user, router, pathname, isClient]);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPromoterPage = pathname.startsWith('/promoters') || pathname === '/promoter-login';
  
  if (isPromoterPage) {
      return <>{children}</>;
  }


  if (!isClient || (isUserLoading && !isAuthPage)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isAuthPage) {
     // If we are on an auth page and the user is logged in, show a loader while redirecting
    if (user && !user.isAnonymous) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    return <>{children}</>;
  }
  
  if (!user || user.isAnonymous) {
      // If user is not logged in (or is an anon promoter) and not on an auth page, show loader while redirecting
      return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
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
