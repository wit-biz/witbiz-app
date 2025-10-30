
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Calendar,
  Settings,
  Workflow,
  ArrowRightLeft,
  FileText,
  Calculator,
  Scale,
  Shield,
  ChevronDown,
  User,
  DollarSign,
  BookText,
  Briefcase,
  Database,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React from "react";
import { useCRMData } from "@/contexts/CRMDataContext";
import { NavItem } from "@/lib/types";
import { navItems as navData } from "@/lib/data";

const icons: { [key: string]: LucideIcon } = {
    LayoutDashboard,
    Users,
    ListTodo,
    Calendar,
    Settings,
    Workflow,
    ArrowRightLeft,
    FileText,
    Calculator,
    Scale,
    Shield,
    User,
    BookText,
    DollarSign,
    Briefcase,
    Database,
    Landmark
};

export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { currentUser, isLoadingCurrentUser } = useCRMData();

  const navItems: NavItem[] = navData.map(item => ({
      ...item,
      icon: icons[item.icon as string] || LayoutDashboard
  }));

  const handleLinkClick = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  if (isLoadingCurrentUser || !currentUser) {
    return (
      <div className="p-2 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-full bg-muted/50 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        // This logic handles the visibility of the CRM link and its configuration sub-link.
        // The CRM page itself will decide if the configuration button is visible based on permissions.
        if (item.href === '/crm' && !currentUser.permissions.crm_view) {
          return null;
        }

        if (item.requiredPermission && !currentUser.permissions[item.requiredPermission]) {
            return null;
        }

        const Icon = item.icon as LucideIcon;
        // For exactMatch, we want to match only the exact href.
        // For non-exactMatch, we check if the pathname starts with the href,
        // but we also ensure href isn't just "/" to avoid matching all routes.
        const isActive = item.exactMatch
          ? pathname === item.href
          : (pathname.startsWith(item.href) && item.href !== '/') || (item.href === '/crm' && pathname.startsWith('/workflows'));
            
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
            >
              <Link href={item.href} onClick={handleLinkClick}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
