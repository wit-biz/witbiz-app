
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SidebarNav } from './shared/sidebar-nav';

const Logo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="h-8 w-8"
      aria-label="WitBiz Logo"
    >
      <style>
        {`
          .witbiz-logo-circle { fill: hsl(var(--primary)); }
          @media (prefers-color-scheme: dark) {
            .witbiz-logo-circle { fill: hsl(var(--primary)); }
          }
        `}
      </style>
      <circle cx="50" cy="50" r="50" className="witbiz-logo-circle" />
      <rect x="15" y="40" width="30" height="20" fill="black" />
      <text
        x="30"
        y="55"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fill="white"
        textAnchor="middle"
        fontWeight="bold"
      >
        WIT
      </text>
      <text
        x="52"
        y="55"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fill="black"
        fontWeight="bold"
      >
        BIZ
      </text>
    </svg>
  );

export function AppSidebar() {

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground">WitBiz</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter>
        {/* User profile dropdown has been moved to UserNav component */}
      </SidebarFooter>
    </Sidebar>
  );
}
