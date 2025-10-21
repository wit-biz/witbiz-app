
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
  type LucideIcon,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
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
  const { isMobile, setOpenMobile } = useSidebar();
  const { currentUser, isLoadingCurrentUser } = useCRMData();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const navItems: NavItem[] = navData.map(item => ({
      ...item,
      icon: icons[item.icon as string] || LayoutDashboard,
      subItems: item.subItems?.map(sub => ({
        ...sub,
        icon: icons[sub.icon as string] || LayoutDashboard
      }))
  }));

  const handleLinkClick = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const userHasPermission = (permissionKey: keyof NavItem['requiredPermission']) => {
    if (isLoadingCurrentUser || !currentUser) return false;
    return currentUser.permissions[permissionKey] === true;
  };

  const renderNavItem = (item: NavItem) => {
    if (!currentUser) return null;
    
    const Icon = item.icon as LucideIcon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isParentActive = hasSubItems && item.subItems.some(sub => pathname.startsWith(sub.href));

    if (hasSubItems) {
      const isOpen = openSubmenus[item.label] ?? isParentActive;
      return (
        <SidebarMenuItem key={item.label} className="group/item">
          <Collapsible open={isOpen} onOpenChange={() => toggleSubmenu(item.label)}>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isParentActive}
                  tooltip={item.label}
                  className="justify-between"
                  onClick={(e) => { e.preventDefault(); toggleSubmenu(item.label); }}
                >
                  <div className="flex items-center gap-2">
                    <Icon />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.subItems?.map(subItem => {
                  const isSubActive = pathname.startsWith(subItem.href) && (subItem.href !== '/' || pathname === '/');
                  return (
                    <li key={subItem.href}>
                      <SidebarMenuSubButton asChild isActive={isSubActive}>
                        <Link href={subItem.href} onClick={handleLinkClick}>
                          <div className="w-4"/> {/* Placeholder for icon space */}
                          <span>{subItem.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </li>
                  )
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      )
    }

    const isActive = item.exactMatch ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/';
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
