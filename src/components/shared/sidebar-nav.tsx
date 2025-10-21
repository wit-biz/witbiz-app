
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
};


export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
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

  const userHasPermission = (permissionKey: NavItem['requiredPermission']) => {
    if (isLoadingCurrentUser || !currentUser) {
      return permissionKey === 'dashboard';
    }
    return currentUser.permissions[permissionKey] === true;
  };

  const renderNavItem = (item: NavItem) => {
    if (!userHasPermission(item.requiredPermission)) {
      return null;
    }
    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href) && item.href !== '/';
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
