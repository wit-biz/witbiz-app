
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
import { SmartDocumentUploadDialog } from '@/components/shared/SmartDocumentUploadDialog';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPromoterRoute = pathname.startsWith('/promoter');

  useEffect(() => {
    setIsClient(true);
    if (!isUserLoading) {
      if (isPromoterRoute) {
        // Promoter routes are public, no redirection logic needed here
        // unless a logged-in user tries to access them, which we'll ignore for now.
        return;
      }
      
      if (!user && !isAuthPage) {
        router.push('/login');
      }
      if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [isUserLoading, user, router, pathname, isClient, isAuthPage, isPromoterRoute]);
  
  if (isPromoterRoute) {
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
    if (user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    return <>{children}</>;
  }
  
  if (!user) {
      // If user is not logged in and not on an auth page, show loader while redirecting
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
  const router = useRouter();

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
