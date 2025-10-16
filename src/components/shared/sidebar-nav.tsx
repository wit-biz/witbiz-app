
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  CheckSquare,
  GitFork,
  BarChart3,
  Calendar,
  type LucideIcon,
  ListTodo,
  Settings,
  LayoutDashboard,
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


const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, exactMatch: true, requiredPermission: 'dashboard' },
    { href: '/contacts', label: 'Clients', icon: Users, requiredPermission: 'clients_view' },
    { href: '/tasks', label: 'Tasks', icon: ListTodo, requiredPermission: 'tasks_view' },
    { href: '/bookings', label: 'Bookings', icon: Calendar, requiredPermission: 'reservations_view' },
    { href: '/workflows', label: 'Workflows', icon: Settings, requiredPermission: 'workflows_view' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
  const { currentUser } = useCRMData(); 

  const handleLinkClick = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const userHasPermission = (permissionKey: NavItem['requiredPermission']) => {
    if (!currentUser?.permissions?.donna) return false;
    if (permissionKey === 'dashboard') return true;
    
    // A simple guard against trying to access a key that might not exist, which would crash.
    if (permissionKey in currentUser.permissions.donna) {
        return currentUser.permissions.donna[permissionKey as keyof typeof currentUser.permissions.donna];
    }
    return false;
  };

  const renderNavItem = (item: NavItem) => {
    if (!userHasPermission(item.requiredPermission)) {
      return null;
    }
    const isActive = item.exactMatch ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/';
    const Icon = item.icon;

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
  };

  return (
    <SidebarMenu>
      {navItems.map(renderNavItem)}
    </SidebarMenu>
  );
}
