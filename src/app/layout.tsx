
"use client";

import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { GlobalNotificationProvider } from '@/contexts/NotificationContext';
import { DialogsProvider } from '@/contexts/DialogsContext';
import { UserNav } from '@/components/shared/user-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase';
import { CRMDataProvider } from '@/contexts/CRMDataContext';
import { TasksProvider } from '@/contexts/TasksContext';

function AppContent({ children }: { children: React.ReactNode }) {
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
