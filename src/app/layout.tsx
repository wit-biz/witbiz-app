
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

export const metadata: Metadata = {
  title: 'WitBiz',
  description: 'Un CRM para el equipo de ventas moderno.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
                  <AppSidebar />
                  <SidebarInset>
                    <UserNav />
                    {children}
                  </SidebarInset>
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
