
"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
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

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/force-password-change';
  const isPromoterRoute = pathname.startsWith('/promoter');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading) {
      if (isPromoterRoute) {
        return;
      }

      if (!user && !isAuthPage) {
        router.push('/login');
      }
      if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/');
      }
    }
  }, [isUserLoading, user, router, pathname, isAuthPage, isPromoterRoute]);

  if (isPromoterRoute || isAuthPage) {
    return <>{children}</>;
  }

  if (!isClient || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
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
    </ThemeProvider>
  );
}
