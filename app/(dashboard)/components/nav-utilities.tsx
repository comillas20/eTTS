"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DatabaseBackupIcon,
  FileTextIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Navigation = {
  name: string;
  url: string;
  icon: LucideIcon;
};

const navigations: Navigation[] = [
  {
    name: "Overview",
    url: "/",
    icon: FileTextIcon,
  },
  {
    name: "E-wallets",
    url: "/e-wallets",
    icon: WalletIcon,
  },
  {
    name: "Backup & Restore",
    url: "/backup-restore",
    icon: DatabaseBackupIcon,
  },
];

export function NavUtilities() {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Utilities</SidebarGroupLabel>
      <SidebarMenu>
        {navigations.map((navigation) => (
          <SidebarMenuItem key={navigation.name}>
            <SidebarMenuButton
              asChild
              isActive={pathname === navigation.url}
              tooltip={navigation.name}>
              <Link href={navigation.url}>
                <navigation.icon />
                <span>{navigation.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
