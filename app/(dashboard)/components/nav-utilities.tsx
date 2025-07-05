"use client";

import { WalletIcon, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { FileTextIcon } from "lucide-react";
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
];

export function NavUtilities() {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Utilities</SidebarGroupLabel>
      <SidebarMenu>
        {navigations.map((navigation) => (
          <SidebarMenuItem key={navigation.name}>
            <SidebarMenuButton asChild isActive={pathname === navigation.url}>
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
