
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { TasksProvider } from '@/contexts/TasksContext';
import { CRMDataProvider } from '@/contexts/CRMDataContext';
import { GlobalNotificationProvider } from '@/contexts/NotificationContext';
import { UserNav } from '@/components/shared/user-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { useEffect, useState } from 'react';

// No podemos exportar metadata en un client component
// export const metadata: Metadata = {
//   title: 'WitBiz',
//   description: 'Un CRM para el equipo de ventas moderno.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
            <CRMDataProvider>
              <TasksProvider>
                <SidebarProvider>
                  {isClient ? (
                    <>
                      <AppSidebar />
                      <SidebarInset>
                        <UserNav />
                        {children}
                      </SidebarInset>
                    </>
                  ) : (
                    <div className="flex h-screen w-full items-center justify-center">
                      {/* Puedes poner un spinner o un loader aquí */}
                    </div>
                  )}
                </SidebarProvider>
              </TasksProvider>
            </CRMDataProvider>
          </GlobalNotificationProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
