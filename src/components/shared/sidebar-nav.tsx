
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
  Trash2,
  BarChartIcon,
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
    Landmark,
    Trash2,
    BarChartIcon
};

export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { currentUser, isLoadingCurrentUser } = useCRMData();

  const navItems: NavItem[] = [
    { href: '/', label: 'Inicio', icon: 'LayoutDashboard', exactMatch: true, requiredPermission: 'dashboard_view' },
    { href: '/contacts', label: 'Base de Datos', icon: 'Database' },
    { href: '/tasks', label: 'Tareas', icon: 'ListTodo', requiredPermission: 'tasks_view' },
    { href: '/crm', label: 'CRM', icon: 'Workflow', requiredPermission: 'crm_view' },
    { href: '/services', label: 'Servicios', icon: 'Briefcase', requiredPermission: 'services_view' },
    { href: '/accounting', label: 'Contabilidad', icon: 'DollarSign', requiredPermission: 'accounting_view' },
    { href: '/intelligence', label: 'Centro de inteligencia', icon: 'BarChartIcon', requiredPermission: 'intelligence_view' },
    { href: '/team', label: 'Equipo y Permisos', icon: 'Users', requiredPermission: 'admin_view' },
    { href: '/recycling-bin', label: 'Papelera', icon: 'Trash2', requiredPermission: 'admin_view' },
  ].map(item => ({
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
        if (item.requiredPermission && !currentUser.permissions[item.requiredPermission]) {
            return null;
        }

        const Icon = item.icon as LucideIcon;
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
