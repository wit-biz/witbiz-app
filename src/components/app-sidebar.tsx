
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
    viewBox="0 0 160 40" // Adjusted viewBox for a wider logo
    className="h-8 w-auto" // Auto width to maintain aspect ratio
    aria-label="WitBiz Logo"
  >
    <rect className="logo-rect" x="0" y="0" width="80" height="40" fill="black" />
    
    <text
      className="logo-wit-text"
      x="40"
      y="27" // Vertically centered
      fontFamily="Montserrat, sans-serif"
      fontSize="20"
      fill="white"
      textAnchor="middle"
      fontWeight="bold"
    >
      WIT
    </text>
    
    <text
      x="120" // Positioned to the right of the box
      y="27" // Vertically centered
      fontFamily="Montserrat, sans-serif"
      fontSize="20"
      fill="black" // Black text for dark mode compatibility
      textAnchor="middle"
      fontWeight="bold"
      className="logo-biz-text"
    >
      BIZ
    </text>
    
    <style>
      {`
        .dark .logo-rect {
            fill: white;
        }
        .dark .logo-wit-text {
            fill: black;
        }
        .dark .logo-biz-text {
            fill: white;
        }
      `}
    </style>
  </svg>
);


export function AppSidebar() {

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2.5">
          <Logo />
          <h1 className="text-xl font-bold text-foreground sr-only">WitBiz</h1>
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
